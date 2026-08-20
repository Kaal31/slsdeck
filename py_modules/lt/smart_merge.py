"""Faithful Python port of luatools-moon's smart_merge.lua.

This reproduces, byte-for-byte on disk, what the reference LuaTools Linux backend
produces for slsteam-moon to consume:

  * merged  <steam>/config/stplug-in/<appid>.lua  with keys as addappid(id,1,"key")
  * manifests  ~/.config/SLSsteam/manifests/<depot>_<gid>.manifest  (ManifestStore)
  * preferred markers  ~/.config/SLSsteam/manifests/.preferred_<depot>
  * (depot keys are also mirrored into the moon's on-disk key cache by the caller
    so live adds decrypt without a Steam restart)

The moon then pairs the ManifestStore manifest (newest by mtime, bestArchivedGid)
with the depot key to provision appinfo, and copies the manifest into depotcache
itself (restoreToDepotcache). Getting the manifest into the STORE (not straight
into depotcache) is the piece our old ad-hoc pipeline got wrong.

Reference: luatools-moon/plugin/backend/smart_merge.lua
"""

import os
import re
import time
import random

# ── scalar helpers ──────────────────────────────────────────────────────────


# Steam app/depot ids are 32-bit unsigned. Anything larger is not a real id --
# it is a typo or a malformed/hostile lua -- and accepting it meant a 20-digit
# "appid" sailed through validation and got written into the merged lua and the
# ManifestStore filenames, where Steam simply ignores it.
MAX_STEAM_ID = 0xFFFFFFFF


def positive_integer(value):
    try:
        n = int(str(value).strip())
    except Exception:
        return None
    return n if 0 < n <= MAX_STEAM_ID else None


def normalize_decimal(value):
    text = str(value if value is not None else "")
    if not re.fullmatch(r"\d+", text):
        return None
    text = text.lstrip("0")
    return text if text else None


# ── lua parsing ─────────────────────────────────────────────────────────────


def strip_comment(line):
    """Strip a Lua ``--`` comment, honouring quoted strings (so a -- inside a
    quoted key is not treated as a comment)."""
    quote = None
    escaped = False
    i = 0
    n = len(line)
    while i < n:
        ch = line[i]
        if quote:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == quote:
                quote = None
        elif ch in ('"', "'"):
            quote = ch
        elif ch == "-" and line[i:i + 2] == "--":
            return line[:i]
        i += 1
    return line


_RE_BARE = re.compile(r"^addappid\s*\(\s*(\d+)\s*\)\s*;?\s*$")
_RE_KEY = re.compile(
    r"^addappid\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*['\"]([0-9A-Fa-f]+)['\"]\s*\)\s*;?\s*$")
_RE_MANIFEST = re.compile(r"^setManifestid\s*\(\s*(\d+)\s*,\s*['\"](\d+)['\"]\s*[,)]")


def parse_lua(text):
    """-> {"bare": set[int], "keys": {int: hexlower}, "manifests": {int: gid}}"""
    parsed = {"bare": set(), "keys": {}, "manifests": {}}
    for raw in str(text or "").splitlines():
        line = strip_comment(raw).strip()
        m = _RE_BARE.match(line)
        if m:
            idv = positive_integer(m.group(1))
            if idv:
                parsed["bare"].add(idv)
            continue
        m = _RE_KEY.match(line)
        if m and len(m.group(3)) == 64:
            key_id = positive_integer(m.group(1))
            if key_id:
                parsed["keys"][key_id] = m.group(3).lower()
            continue
        m = _RE_MANIFEST.match(line)
        if m:
            depot = positive_integer(m.group(1))
            gid = normalize_decimal(m.group(2))
            if depot and gid:
                parsed["manifests"][depot] = gid
    return parsed


def emit_lua(appid, result):
    appid = positive_integer(appid)
    if not appid:
        raise ValueError("invalid appid")
    lines = ["addappid(%d)" % appid]
    for idv in sorted(result["bare"]):
        if idv != appid:
            lines.append("addappid(%d)" % idv)
    for idv in sorted(result["keys"]):
        lines.append('addappid(%d, 1, "%s")' % (idv, result["keys"][idv]))
    return "\n".join(lines) + "\n"


# ── multi-source merge (key voting/conflict resolution) ─────────────────────


def _candidate_better(a, b):
    if b is None:
        return True
    if a["exact"] != b["exact"]:
        return a["exact"]
    if a["votes"] != b["votes"]:
        return a["votes"] > b["votes"]
    if a["priority"] != b["priority"]:
        return a["priority"] < b["priority"]
    return a["source_index"] < b["source_index"]


def merge_sources(appid, sources, current_gids):
    appid = positive_integer(appid)
    if not appid:
        return None, "invalid appid"
    result = {
        "bare": {appid}, "keys": {}, "manifest_refs": {},
        "conflicts": [], "contributors": [],
    }
    key_candidates = {}
    contributor_seen = set()

    for source in sources or []:
        parsed = source.get("parsed") or parse_lua(source.get("lua_text"))
        contributed = False
        for idv in parsed["bare"]:
            result["bare"].add(idv)
            contributed = True
        for depot, gid in parsed["manifests"].items():
            result["manifest_refs"].setdefault(depot, {})[gid] = True
            contributed = True
        for idv, key in parsed["keys"].items():
            groups = key_candidates.setdefault(idv, {})
            group = groups.get(key)
            if group is None:
                group = {
                    "key": key, "votes": 0, "exact": False,
                    "priority": _num(source.get("priority")),
                    "source_index": _num(source.get("index")),
                    "sources": [],
                }
                groups[key] = group
            group["votes"] += 1
            group["sources"].append(source.get("name") or str(source.get("index") or "unknown"))
            ec = source.get("exact_current") or {}
            if ec.get(idv):
                group["exact"] = True
            priority = _num(source.get("priority"))
            index = _num(source.get("index"))
            if priority < group["priority"] or (
                    priority == group["priority"] and index < group["source_index"]):
                group["priority"], group["source_index"] = priority, index
            contributed = True
        if contributed:
            name = source.get("name") or str(source.get("index") or "Unknown")
            if name not in contributor_seen:
                contributor_seen.add(name)
                result["contributors"].append(name)

    for idv, groups in key_candidates.items():
        best = None
        count = 0
        for candidate in groups.values():
            count += 1
            if _candidate_better(candidate, best):
                best = candidate
        result["keys"][idv] = best["key"]
        if count > 1:
            result["conflicts"].append({"id": idv, "selected": best["key"]})
    result["contributors"].sort()
    result["conflicts"].sort(key=lambda c: c["id"])
    return result, None


def _num(v):
    try:
        return float(v)
    except Exception:
        return float("inf")


# ── VDF appinfo parsing (picsbuffer_<appid>.bin) ────────────────────────────


def _lex_vdf(text):
    tokens = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch.isspace():
            i += 1
        elif ch in "{}":
            tokens.append(ch)
            i += 1
        elif ch == '"':
            out = []
            escaped = False
            i += 1
            while i < n:
                ch = text[i]
                if escaped:
                    out.append(ch)
                    escaped = False
                elif ch == "\\":
                    escaped = True
                elif ch == '"':
                    i += 1
                    break
                else:
                    out.append(ch)
                i += 1
            tokens.append("".join(out))
        else:
            # Deliberately skip anything that isn't a brace or a quoted string.
            # This lexer is fed the moon's picsbuffer_<appid>.bin (a BINARY PICS
            # buffer decoded with errors="ignore"), so emitting unquoted runs as
            # tokens floods the stream with binary garbage and desyncs the
            # key/value pairing in parse_appinfo_gids -- which then picks the
            # wrong "current" manifest gid for every depot.
            i += 1
    return tokens


def _parse_vdf_map(tokens, pos):
    out = {}
    n = len(tokens)
    while pos < n and tokens[pos] != "}":
        key = tokens[pos]
        pos += 1
        if pos < n and tokens[pos] == "{":
            child, pos = _parse_vdf_map(tokens, pos + 1)
            if child is not None:
                out[key] = child
        elif pos < n and tokens[pos] != "}":
            out[key] = tokens[pos]
            pos += 1
        else:
            return None, pos
    return out, pos + 1


def parse_appinfo_gids(text):
    """From the moon's appinfo (picsbuffer) VDF: {depotId: gid} of the current
    public manifest gids, used to prefer the matching archived manifest."""
    tokens = _lex_vdf(str(text or ""))
    root = {}
    pos = 0
    n = len(tokens)
    while pos < n:
        key = tokens[pos]
        pos += 1
        if pos < n and tokens[pos] == "{":
            child, pos = _parse_vdf_map(tokens, pos + 1)
            if child is not None:
                root[key] = child
        else:
            pos += 1
    body = root.get("appinfo") if isinstance(root.get("appinfo"), dict) else root
    result = {}
    depots = body.get("depots") if isinstance(body, dict) else None
    if isinstance(depots, dict):
        for depot, node in depots.items():
            idv = positive_integer(depot)
            gid = None
            if isinstance(node, dict):
                manifests = node.get("manifests")
                if isinstance(manifests, dict):
                    public = manifests.get("public")
                    if isinstance(public, dict):
                        gid = normalize_decimal(public.get("gid"))
            if idv and gid:
                result[idv] = gid
    return result


# ── Steam manifest binary parsing (depot + gid + creation_time) ─────────────

_MAGIC_TERMINAL = 0x32C415AB
_MAGIC_PAYLOAD = 0x71F617D0
_MAGIC_METADATA = 0x1F4812BE


def _u32le(data, pos):
    if pos < 0 or pos + 4 > len(data):
        return None
    return data[pos] | (data[pos + 1] << 8) | (data[pos + 2] << 16) | (data[pos + 3] << 24)


def _read_varint(data, pos, limit):
    """Protobuf base-128 varint. Returns (int_value, new_pos) or (None, pos)."""
    shift = 0
    value = 0
    for _ in range(10):
        if pos < 0 or pos > limit or pos >= len(data):
            return None, pos
        byte = data[pos]
        pos += 1
        value |= (byte & 0x7F) << shift
        if byte < 0x80:
            return value, pos
        shift += 7
    return None, pos


def _parse_metadata(data, first, last):
    """Parse the metadata protobuf section (inclusive byte range first..last)."""
    meta = {"depot": None, "gid": None, "creation_time": None}
    pos = first
    while pos <= last:
        tag, pos = _read_varint(data, pos, last)
        if tag is None:
            return None, "invalid protobuf tag"
        field, wire = tag >> 3, tag & 7
        if wire == 0:
            value, pos = _read_varint(data, pos, last)
            if value is None:
                return None, "truncated protobuf varint"
            if field == 1:
                meta["depot"] = positive_integer(value)
            elif field == 2:
                meta["gid"] = normalize_decimal(value)
            elif field == 3:
                meta["creation_time"] = value
        elif wire == 1:
            pos += 8
        elif wire == 2:
            length, pos = _read_varint(data, pos, last)
            if length is None:
                return None, "invalid protobuf length"
            pos += length
        elif wire == 5:
            pos += 4
        else:
            return None, "unsupported protobuf wire type"
        if pos > last + 1:
            return None, "truncated protobuf field"
    return meta, None


def parse_manifest(data, expected_depot=None, expected_gid=None):
    """Validate a Steam depot manifest blob and return {depot, gid, creation_time}."""
    if isinstance(data, str):
        data = data.encode("latin-1", "ignore")
    pos = 0
    saw_payload = False
    metadata = None
    n = len(data)
    while pos < n:
        magic = _u32le(data, pos)
        if magic is None:
            return None, "truncated manifest section"
        if magic == _MAGIC_TERMINAL:
            if pos + 4 != n:
                return None, "terminal marker is not final"
            pos += 4
            break
        length = _u32le(data, pos + 4)
        if length is None:
            return None, "truncated manifest section"
        first = pos + 8
        last = pos + 7 + length  # inclusive
        if last >= n or last < first - 1:
            return None, "manifest section exceeds file"
        if magic == _MAGIC_PAYLOAD:
            saw_payload = True
        elif magic == _MAGIC_METADATA:
            metadata, err = _parse_metadata(data, first, last)
            if metadata is None:
                return None, err
        pos = last + 1
    if not saw_payload:
        return None, "missing payload section"
    if not metadata or not metadata["depot"] or not metadata["gid"]:
        return None, "missing manifest metadata"
    ed = positive_integer(expected_depot)
    eg = normalize_decimal(expected_gid)
    if ed and metadata["depot"] != ed:
        return None, "depot mismatch"
    if eg and metadata["gid"] != eg:
        return None, "gid mismatch"
    return metadata, None


# ── preferred-gid selection ─────────────────────────────────────────────────


def _finite(value, default):
    """value as a comparable float, with NaN treated as unusable."""
    try:
        n = float(value)
    except Exception:
        return default
    return default if n != n else n


def _ct(item):
    """creation_time as a comparable number. Uses `is None`, NOT `or -1`: a
    manifest with creation_time == 0 is falsy and used to score WORSE than one
    with no timestamp at all."""
    v = item.get("creation_time")
    return -1.0 if v is None else _finite(v, -1.0)


def _prio(item):
    """priority as a comparable number (lower wins). Uses `is None`, NOT
    `or inf`: a .source-priority of 0 -- the natural 'most trusted source'
    value -- is falsy and used to rank LAST."""
    v = item.get("priority")
    return float("inf") if v is None else _finite(v, float("inf"))


def _src(item):
    """source_index as a comparable number (lower = earlier source dir)."""
    v = item.get("source_index")
    return float("inf") if v is None else _finite(v, float("inf"))


def gid_sort_key(gid):
    """Numeric ordering for a manifest gid. Gids are decimal strings of 64-bit
    values, so a plain string sort puts "9" after "10" -- two runs over the same
    pack could then disagree about which manifest is newest."""
    try:
        return (0, int(str(gid).strip()))
    except Exception:
        return (1, str(gid or ""))


def manifest_rank(item, current=None):
    """Total ordering key for preferred-manifest selection; lowest wins.

    The gid is the final tiebreak so that when exactness, timestamp, priority
    and source index all tie, the SAME manifest is chosen on every run rather
    than whichever one os.walk happened to yield first. That nondeterminism is
    not cosmetic: it silently installed a different version of the game from
    the same pack on two different runs."""
    return (
        0 if (current and item.get("gid") == current) else 1,  # keep what's installed
        -_ct(item),                                            # newest manifest first
        _prio(item),                                           # most trusted source
        _src(item),                                            # earliest source dir
        gid_sort_key(item.get("gid")),                         # deterministic tiebreak
    )


def select_preferred(manifests, current_gids):
    """Pick one gid per depot. This decides which VERSION of the game gets
    installed -- the .preferred_<depot> marker it feeds is what
    restore_manifests_to_depotcache() copies into Steam's depotcache -- so the
    choice has to be a total order with no ties left to chance."""
    grouped = {}
    for item in manifests or []:
        grouped.setdefault(item["depot"], []).append(item)
    selected = {}
    for depot, items in grouped.items():
        current = current_gids.get(depot) if current_gids else None
        best = min(items, key=lambda it: manifest_rank(it, current), default=None)
        if best:
            selected[depot] = best["gid"]
    return selected


# ── install (publish to ManifestStore + stplug-in, atomic) ──────────────────


def _parent(path):
    d = os.path.dirname(path)
    return d if d else "."


def _list_source_dirs(collection_dir):
    """Yield (source_dir, index) for each source_<N> subdir, or treat the
    collection dir itself as source 0 when it has no source_<N> layout."""
    found = []
    try:
        for name in sorted(os.listdir(collection_dir)):
            full = os.path.join(collection_dir, name)
            m = re.fullmatch(r"source_(\d+)", name)
            if m and os.path.isdir(full):
                found.append((full, int(m.group(1))))
    except Exception:
        pass
    if not found:
        found = [(collection_dir, 0)]
    return found


def install(appid, collection_dir, opts):
    """Port of smart_merge.install. opts: {home, steam_root, appinfo_text}.
    Returns (result_dict, None) or (None, error). result includes 'keys' so the
    caller can mirror them into the moon key cache."""
    appid = positive_integer(appid)
    if not appid:
        return None, "invalid appid"
    home = opts.get("home") or os.path.expanduser("~")
    steam_root = opts.get("steam_root") or ""
    if not home or not steam_root:
        return None, "install paths unavailable"
    current_gids = parse_appinfo_gids(opts.get("appinfo_text") or "")

    manifest_by_name = {}
    sources = []
    for source_dir, index in _list_source_dirs(collection_dir):
        name = os.path.basename(source_dir)
        priority = float("inf")
        # optional metadata files
        pth = os.path.join(source_dir, ".source-name")
        if os.path.isfile(pth):
            try:
                name = open(pth, "r", encoding="utf-8", errors="ignore").read().strip() or name
            except Exception:
                pass
        pth = os.path.join(source_dir, ".source-priority")
        if os.path.isfile(pth):
            try:
                priority = float(open(pth, "r", encoding="utf-8", errors="ignore").read().strip())
            except Exception:
                pass
        source = {"root": source_dir, "index": index, "priority": priority,
                  "name": name, "exact_current": {}, "manifests": []}
        lua_text = None
        for entry in _walk_files(source_dir):
            base = os.path.basename(entry)
            if base == "%d.lua" % appid:
                lua_text = _read(entry)
            else:
                m = re.fullmatch(r"(\d+)_(\d+)\.manifest", base)
                if not m:
                    continue
                depot = positive_integer(m.group(1))
                gid = normalize_decimal(m.group(2))
                if not (depot and gid):
                    continue
                content = _read_bytes(entry)
                meta, _err = parse_manifest(content, depot, gid) if content else (None, None)
                if meta:
                    item = {"depot": depot, "gid": gid,
                            "creation_time": meta.get("creation_time"),
                            "priority": priority, "source_index": index,
                            "source_name": name, "content": content}
                    source["manifests"].append(item)
                    if current_gids.get(depot) == gid:
                        source["exact_current"][depot] = True
                    key = "%d_%s" % (depot, gid)
                    prev = manifest_by_name.get(key)
                    if (prev is None or item["priority"] < prev["priority"]
                            or (item["priority"] == prev["priority"] and item["source_index"] < prev["source_index"])):
                        manifest_by_name[key] = item
        if lua_text is not None:
            parsed = parse_lua(lua_text)
            if parsed["bare"] or parsed["keys"] or parsed["manifests"]:
                source["parsed"] = parsed
                source["lua_text"] = lua_text
                sources.append(source)

    if not sources:
        return None, "No usable game Lua was collected"
    has_app = any((s["parsed"]["bare"] and appid in s["parsed"]["bare"])
                  or (appid in s["parsed"]["keys"]) for s in sources)
    if not has_app:
        return None, "Collected Lua does not declare the requested app"
    keyed = sum(len(s["parsed"]["keys"]) for s in sources)
    if keyed == 0:
        return None, "Collected Lua contains no depot keys"

    sources.sort(key=lambda s: s["index"])
    # Sort BEFORE anything consumes this list. manifest_by_name is filled from an
    # os.walk with no ordering guarantee, and select_preferred() used to run over
    # the unsorted list (the sort happened afterwards, purely for publication
    # order) -- so readdir order could decide which game version got installed.
    manifests = sorted(manifest_by_name.values(),
                       key=lambda a: (a["depot"], gid_sort_key(a["gid"])))
    result, err = merge_sources(appid, sources, current_gids)
    if not result:
        return None, err

    lua_text = emit_lua(appid, result)
    preferred = select_preferred(manifests, current_gids)

    store_dir = os.path.join(home, ".config", "SLSsteam", "manifests")
    target = os.path.join(steam_root, "config", "stplug-in", "%d.lua" % appid)
    _mkdir(store_dir)
    _mkdir(_parent(target))

    publications = []
    for item in manifests:
        publications.append((os.path.join(store_dir, "%d_%s.manifest" % (item["depot"], item["gid"])),
                             item["content"]))
    for depot in sorted(preferred):
        publications.append((os.path.join(store_dir, ".preferred_%d" % depot),
                             (preferred[depot] + "\n").encode("utf-8")))
    publications.append((target, lua_text.encode("utf-8")))

    nonce = "%d.%d" % (int(time.time()), random.randint(100000, 999999))
    staged = []
    snapshots = []
    for i, (path, content) in enumerate(publications):
        temp = "%s.tmp.luatools.%s.%d" % (path, nonce, i)
        _remove(temp)
        if not _write_bytes(temp, content) or _read_bytes(temp) != _as_bytes(content):
            for p in staged:
                _remove(p)
            return None, "failed to stage %s" % path
        staged.append(temp)
        snapshots.append((os.path.exists(path), _read_bytes(path) if os.path.exists(path) else None))

    for i, (path, content) in enumerate(publications):
        try:
            os.replace(staged[i], path)
            try:
                from .utils import chown_to_user
                chown_to_user(path, recursive=False)
            except Exception:
                pass
        except Exception:
            for p in staged:
                _remove(p)
            for j, (existed, prior) in enumerate(snapshots):
                p = publications[j][0]
                if existed and prior is not None:
                    _write_bytes(p, prior)
                else:
                    _remove(p)
            return None, "failed to publish %s" % path

    result["installed_path"] = target
    result["preferred"] = preferred
    result["manifest_count"] = len(manifests)
    result["store_dir"] = store_dir
    return result, None


# ── tiny fs helpers ─────────────────────────────────────────────────────────


def _walk_files(root):
    for dirpath, _dirs, files in os.walk(root):
        for f in files:
            yield os.path.join(dirpath, f)


def _read(path):
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            return fh.read()
    except Exception:
        return None


def _read_bytes(path):
    try:
        with open(path, "rb") as fh:
            return fh.read()
    except Exception:
        return None


def _as_bytes(content):
    return content if isinstance(content, (bytes, bytearray)) else str(content).encode("utf-8")


def _write_bytes(path, content):
    try:
        with open(path, "wb") as fh:
            fh.write(_as_bytes(content))
        return True
    except Exception:
        return False


def _mkdir(path):
    try:
        os.makedirs(path, exist_ok=True)
        return True
    except Exception:
        return False


def _remove(path):
    try:
        os.remove(path)
    except Exception:
        pass
