"""SLSsteam ``config.yaml`` validator + healer (ASSfixer-inspired).

Why this exists
---------------
SLSsteam reads ONE file, ``~/.config/SLSsteam/config.yaml``, and it is
unforgiving: a key that is missing, malformed, duplicated, or carries the wrong
scalar type makes the engine log ``Issues during config loading encountered!
Missing key(s)`` and silently fall back to its own compiled-in defaults. Those
defaults are the opposite of what this plugin needs (``DisableUpdates: yes``
hands unowned apps zero depots; ``PlayNotOwnedGames: no`` refuses to treat added
games as playable), so a subtly-broken config presents as "SLSsteam is installed
and injected but nothing works" — exactly the state the yellow repair banner
exists to catch.

Upstream ``ASSfixer`` (niwia/ASSfixer) solves this for desktop users with an
interactive script. This is the same idea as an in-plugin, non-interactive pass.

Design rules (all deliberate)
-----------------------------
* **Line-based, not a YAML round-trip.** No PyYAML in the plugin runtime, and
  even if there were, dumping a parsed tree would obliterate every comment in
  the file — including the warnings that tell a user why ``DisableUpdates``
  must stay ``no``. Every transform below rewrites only the line it owns.
* **Never destructive.** ``AdditionalApps`` is the user's entire added-games
  list. A heal that loses it is worse than the breakage it fixes, so we take a
  timestamped backup first, write through SLSsteam's atomic writer, and refuse
  to commit a result that dropped entries.
* **Analyze and heal are the same code path.** ``analyze()`` is ``heal()``
  without the write, so the banner can never advertise a fix it won't perform.
"""

from __future__ import annotations

import os
import re
import shutil
import time
from typing import Any, Dict, List, Optional, Tuple

from .logger import logger
from .paths import defaults_path
from . import slssteam

# ── key taxonomy ─────────────────────────────────────────────────────────────
#
# Keys whose value is a yes/no scalar. Anything truthy-looking normalizes to
# "yes", anything falsey-looking to "no". SLSsteam's YAML reader accepts only
# yes/no here -- `True`, `on` and `1` all read back as garbage and take the
# compiled-in default.
_BOOL_KEYS = (
    "DisableFamilyShareLock", "UseWhitelist", "AutoFilterList",
    "PlayNotOwnedGames", "SafeMode", "Notifications", "WarnHashMissmatch",
    "NotifyInit", "API", "DisableCloud", "DisableUpdates", "ExtendedLogging",
    "Achievements",
)

_TRUEISH = ("yes", "true", "on", "1", "enable", "enabled", "y")
_FALSEISH = ("no", "false", "off", "0", "disable", "disabled", "n")

# Keys that MUST be a container (list or map), never a bare scalar. A user (or a
# careless tool) writing `FakeOffline: 1274570` produces a scalar where the
# engine wants a sequence; it reads as a type error and the whole key is
# discarded. Healed by promoting the scalar to a one-item list.
_LIST_KEYS = ("AppIds", "AdditionalApps", "FakeOffline")

# Container keys that take a mapping, not a list. A bare scalar here can't be
# promoted safely (we'd have to invent a key), so it's reported and blanked --
# blanking restores a valid empty map, which is the template's own default.
_MAP_KEYS = ("DlcData", "AppTokens", "FakeAppIds", "GameTitles",
             "SubscriptionTimestamps", "DenuvoGames")

# Quoted string scalars. An unterminated quote (e.g. `Title: " ;`) makes the
# YAML parser swallow following lines until it finds a closing quote, which can
# silently eat AdditionalApps.
_QUOTED_KEYS = ("FakeEmail", "Title")

# LogLevel is an enum 0..6 (Once/Debug/Info/NotifyShort/NotifyLong/Warn/None).
_LOG_LEVEL_MIN, _LOG_LEVEL_MAX = 0, 6

# `[ \t]*`, never `\s*`: in MULTILINE mode `\s` also matches the newline, so a
# valueless key would capture the NEXT line's key as its value and a rewrite
# would then destroy that line. Same bug class already documented in
# cloudredirect._DISABLE_CLOUD_RE.
_KEY_RE = re.compile(r"^([ \t]*)([A-Za-z_][A-Za-z0-9_]*)[ \t]*:[ \t]*(.*)$")


def _scalar(raw: str) -> str:
    """The value of a `key: value` line, comment stripped and unquoted. '#'
    only opens a comment at line start or after whitespace, so a value that
    merely contains '#' survives."""
    text = str(raw or "")
    cut = len(text)
    for i, ch in enumerate(text):
        if ch == "#" and (i == 0 or text[i - 1] in " \t"):
            cut = i
            break
    return text[:cut].strip().strip('"').strip("'").strip()


def _comment_of(raw: str) -> str:
    """The trailing comment of a value, including its leading spaces ('' if none)."""
    text = str(raw or "")
    for i, ch in enumerate(text):
        if ch == "#" and (i == 0 or text[i - 1] in " \t"):
            return text[i:]
    return ""


def _is_top_level(indent: str) -> bool:
    return indent == ""


# ── individual passes ────────────────────────────────────────────────────────
def _pass_booleans(lines: List[str], issues: List[str]) -> List[str]:
    """Normalize truthy/falsey spellings on known bool keys to yes/no."""
    out = []
    for line in lines:
        m = _KEY_RE.match(line)
        if not m or not _is_top_level(m.group(1)) or m.group(2) not in _BOOL_KEYS:
            out.append(line)
            continue
        key, raw = m.group(2), m.group(3)
        val = _scalar(raw)
        low = val.lower()
        if not val or low in ("yes", "no"):
            out.append(line)
            continue
        if low in _TRUEISH:
            want = "yes"
        elif low in _FALSEISH:
            want = "no"
        else:
            issues.append(f"{key}: unrecognised boolean {val!r} — left alone")
            out.append(line)
            continue
        issues.append(f"{key}: normalised {val!r} -> {want}")
        out.append(f"{key}: {want}{_comment_of(raw)}")
    return out


def _pass_log_level(lines: List[str], issues: List[str]) -> List[str]:
    out = []
    for line in lines:
        m = _KEY_RE.match(line)
        if not m or not _is_top_level(m.group(1)) or m.group(2) != "LogLevel":
            out.append(line)
            continue
        raw = m.group(3)
        val = _scalar(raw)
        if not val:
            out.append(line)
            continue
        try:
            n = int(val)
        except ValueError:
            issues.append(f"LogLevel: {val!r} is not a number -> 2 (Info)")
            out.append(f"LogLevel: 2{_comment_of(raw)}")
            continue
        if n < _LOG_LEVEL_MIN or n > _LOG_LEVEL_MAX:
            clamped = max(_LOG_LEVEL_MIN, min(_LOG_LEVEL_MAX, n))
            issues.append(f"LogLevel: {n} out of range 0..6 -> {clamped}")
            out.append(f"LogLevel: {clamped}{_comment_of(raw)}")
            continue
        out.append(line)
    return out


def _pass_quotes(lines: List[str], issues: List[str]) -> List[str]:
    """Repair an unterminated quoted string (`Title: " ;` -> `Title: ""`)."""
    out = []
    for line in lines:
        m = _KEY_RE.match(line)
        if not m or m.group(2) not in _QUOTED_KEYS:
            out.append(line)
            continue
        indent, key, raw = m.group(1), m.group(2), m.group(3)
        body = raw.strip()
        if not body:
            out.append(line)
            continue
        for q in ('"', "'"):
            # Opens with a quote but doesn't close with the same one.
            if body.startswith(q) and not re.match(rf'^{q}[^{q}]*{q}\s*(#.*)?$', body):
                issues.append(f"{key}: unterminated quote {body!r} -> \"\"")
                out.append(f'{indent}{key}: ""')
                break
        else:
            out.append(line)
    return out


def _block_of(lines: List[str], start: int) -> int:
    """Index just past the indented block belonging to the key at `start`."""
    i = start + 1
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        # A top-level comment documents the NEXT top-level option in the
        # shipped template. It is not part of the previous key's value block.
        if line.startswith("#"):
            break
        if line[:1] in (" ", "\t") or line.lstrip().startswith("-"):
            i += 1
            continue
        break
    return i


def _pass_structure(lines: List[str], issues: List[str]) -> List[str]:
    """Promote a bare scalar on a container key into a valid container."""
    out: List[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        m = _KEY_RE.match(line)
        if not m or not _is_top_level(m.group(1)):
            out.append(line)
            i += 1
            continue
        key, raw = m.group(2), m.group(3)
        val = _scalar(raw)
        if key in _LIST_KEYS and val:
            issues.append(f"{key}: scalar {val!r} promoted to a list item")
            out.append(f"{key}:{_comment_of(raw)}")
            out.append(f"  - {val}")
            i += 1
            continue
        if key in _MAP_KEYS and val:
            issues.append(f"{key}: scalar {val!r} is not a mapping — reset to empty")
            out.append(f"{key}:{_comment_of(raw)}")
            i += 1
            continue
        out.append(line)
        i += 1
    return out


def _pass_dedup_keys(lines: List[str], issues: List[str]) -> List[str]:
    """Drop earlier duplicates of a top-level key (last definition wins, which
    is what a YAML reader would do anyway — we just make it explicit and stop
    the engine complaining)."""
    # Index every top-level key occurrence as (key, start, end-of-its-block).
    spans: List[Tuple[str, int, int]] = []
    i = 0
    while i < len(lines):
        m = _KEY_RE.match(lines[i])
        if m and _is_top_level(m.group(1)):
            end = _block_of(lines, i)
            spans.append((m.group(2), i, end))
            i = end
            continue
        i += 1

    counts: Dict[str, int] = {}
    for key, _s, _e in spans:
        counts[key] = counts.get(key, 0) + 1
    if not any(n > 1 for n in counts.values()):
        return lines

    # Keep the LAST definition of each key (what a YAML reader resolves to);
    # mark every earlier one's line range for removal.
    last_start: Dict[str, int] = {}
    for key, start, _e in spans:
        last_start[key] = start
    drop: set = set()
    dropped: Dict[str, int] = {}
    for key, start, end in spans:
        if counts[key] > 1 and start != last_start[key]:
            drop.update(range(start, end))
            dropped[key] = dropped.get(key, 0) + 1

    for key, n in sorted(dropped.items()):
        issues.append(f"{key}: removed {n} duplicate definition(s) (last one wins)")
    return [ln for idx, ln in enumerate(lines) if idx not in drop]


def _pass_dedup_list_items(lines: List[str], issues: List[str]) -> List[str]:
    """Remove repeated `- <value>` entries within one list block."""
    out: List[str] = []
    seen_in_block: set = set()
    removed = 0
    in_list = False
    for line in lines:
        stripped = line.strip()
        m = _KEY_RE.match(line)
        if m and _is_top_level(m.group(1)):
            in_list = m.group(2) in _LIST_KEYS
            seen_in_block = set()
            out.append(line)
            continue
        if in_list and stripped.startswith("-"):
            item = _scalar(stripped[1:])
            if item and item in seen_in_block:
                removed += 1
                continue
            seen_in_block.add(item)
        out.append(line)
    if removed:
        issues.append(f"removed {removed} duplicate list entr{'y' if removed == 1 else 'ies'}")
    return out


def _template_blocks() -> List[Tuple[str, List[str]]]:
    """(key, lines-including-its-leading-comments) for each top-level key in the
    bundled default template."""
    try:
        with open(defaults_path(os.path.join("slssteam", "config.default.yaml")),
                  "r", encoding="utf-8", errors="ignore") as fh:
            tlines = fh.read().splitlines()
    except Exception:
        return []
    blocks: List[Tuple[str, List[str]]] = []
    pending: List[str] = []
    i = 0
    while i < len(tlines):
        line = tlines[i]
        m = _KEY_RE.match(line)
        if m and _is_top_level(m.group(1)):
            end = _block_of(tlines, i)
            blocks.append((m.group(2), pending + tlines[i:end]))
            pending = []
            i = end
            continue
        # Comments/blank lines accumulate and attach to the next key so the
        # explanation travels with the option it documents.
        if line.strip().startswith("#"):
            pending.append(line)
        else:
            pending = []
        i += 1
    return blocks


def _pass_missing_keys(lines: List[str], issues: List[str]) -> List[str]:
    """Append any template key the config lacks, carrying its comments. This is
    what stops the engine's recurring 'Missing key(s)' popup after an upstream
    version adds an option."""
    present = {m.group(2) for m in (_KEY_RE.match(l) for l in lines)
               if m and _is_top_level(m.group(1))}
    additions: List[str] = []
    added: List[str] = []
    for key, block in _template_blocks():
        if key in present:
            continue
        added.append(key)
        additions.extend(block)
    if not additions:
        return lines
    issues.append(f"added {len(added)} missing key(s) from the default template: "
                  + ", ".join(added))
    return lines + [""] + additions


def _pass_required(lines: List[str], issues: List[str]) -> List[str]:
    """Force the keys SLSDeck cannot function without (reuses slssteam's own
    table so there is exactly one source of truth)."""
    text = "\n".join(lines)
    for key, want in slssteam._REQUIRED_BOOL_KEYS.items():
        new = slssteam._ensure_bool_key(text, key, want)
        if new != text:
            issues.append(f"{key}: forced to {want} (required by SLSDeck)")
            text = new
    return text.splitlines()


# ── list-preservation guard ──────────────────────────────────────────────────
def _added_apps(text: str) -> List[str]:
    """AppIds under AdditionalApps, used to prove a heal didn't lose games."""
    out: List[str] = []
    in_block = False
    for line in text.splitlines():
        m = _KEY_RE.match(line)
        if m and _is_top_level(m.group(1)):
            in_block = m.group(2) == "AdditionalApps"
            continue
        if in_block:
            s = line.strip()
            if s.startswith("-"):
                v = _scalar(s[1:])
                if v:
                    out.append(v)
    return out


def _backup(path: str) -> str:
    """Timestamped copy next to the config; returns its path ('' on failure)."""
    try:
        dst = f"{path}.slsdeck-bak-{time.strftime('%Y%m%d-%H%M%S')}"
        shutil.copy2(path, dst)
        return dst
    except Exception as exc:
        logger.warn(f"confighealer: backup failed: {exc}")
        return ""


def _transform(content: str) -> Tuple[str, List[str]]:
    """Run every pass. Returns (healed_text, issues)."""
    issues: List[str] = []
    lines = content.splitlines()
    lines = _pass_dedup_keys(lines, issues)
    lines = _pass_structure(lines, issues)
    lines = _pass_booleans(lines, issues)
    lines = _pass_log_level(lines, issues)
    lines = _pass_quotes(lines, issues)
    lines = _pass_dedup_list_items(lines, issues)
    lines = _pass_missing_keys(lines, issues)
    lines = _pass_required(lines, issues)
    healed = "\n".join(lines)
    if not healed.endswith("\n"):
        healed += "\n"
    return healed, issues


# ── public API ───────────────────────────────────────────────────────────────
def analyze() -> Dict[str, Any]:
    """Report what a heal would change, writing nothing."""
    path = slssteam.config_path()
    if not os.path.isfile(path):
        return {"success": True, "present": False, "issues": [],
                "count": 0, "reason": "no config.yaml yet"}
    content = slssteam._read()
    if content is None:
        return {"success": False, "present": True, "issues": [], "count": 0,
                "error": "could not read config.yaml"}
    healed, issues = _transform(content)
    changed = healed != content
    return {"success": True, "present": True, "issues": issues,
            "count": len(issues), "changed": changed, "path": path}


def heal() -> Dict[str, Any]:
    """Validate and repair config.yaml in place. Idempotent: a healthy config
    is left byte-identical and reports zero issues."""
    path = slssteam.config_path()
    if not os.path.isfile(path):
        # Nothing to heal, but the seed path is the right answer here.
        try:
            slssteam.ensure_config()
            return {"success": True, "issues": ["seeded a fresh config.yaml from the default template"],
                    "count": 1, "changed": True, "backup": ""}
        except Exception as exc:
            return {"success": False, "error": f"could not seed config: {exc}",
                    "issues": [], "count": 0}
    content = slssteam._read()
    if content is None:
        return {"success": False, "error": "could not read config.yaml",
                "issues": [], "count": 0}
    healed, issues = _transform(content)
    if healed == content:
        logger.log("confighealer: config.yaml already healthy")
        return {"success": True, "issues": [], "count": 0, "changed": False, "backup": ""}

    # Refuse a heal that would lose added games -- that would be a worse bug
    # than anything this module fixes.
    before, after = _added_apps(content), _added_apps(healed)
    lost = [a for a in before if a not in after]
    if lost:
        logger.error(f"confighealer: ABORTED — heal would drop AdditionalApps {lost}")
        return {"success": False, "issues": issues, "count": len(issues),
                "error": f"aborted: the repair would have removed {len(lost)} added game(s)"}

    backup = _backup(path)
    if not slssteam._atomic_write(healed):
        return {"success": False, "issues": issues, "count": len(issues),
                "error": "could not write config.yaml", "backup": backup}
    logger.log(f"confighealer: repaired config.yaml ({len(issues)} issue(s)); backup -> {backup or 'none'}")
    return {"success": True, "issues": issues, "count": len(issues),
            "changed": True, "backup": backup}
