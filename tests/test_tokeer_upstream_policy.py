"""Regression tests for version-independent Tokeer bundle updates and Proton policy.

These tests execute only the relevant stdlib-only functions from their AST, so
GitHub Actions doesn't need Decky's frozen Python dependencies.
"""
from __future__ import annotations

import ast
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from typing import Any, Dict

SOURCE = Path(__file__).resolve().parents[1] / "py_modules" / "lt" / "tokeer.py"
TREE = ast.parse(SOURCE.read_text(encoding="utf-8"))


def isolated(*names, **globals_):
    functions = [node for node in TREE.body
                 if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
                 and node.name in names]
    assert len(functions) == len(names), "missing Tokeer function"
    namespace = {"__builtins__": __builtins__, "Any": Any, "Dict": Dict, **globals_}
    exec(compile(ast.Module(body=functions, type_ignores=[]), str(SOURCE), "exec"),
         namespace)
    return namespace


class FakeResponse:
    def __init__(self, asset):
        self.asset = asset

    def raise_for_status(self):
        pass

    def json(self):
        return {"tag_name": "v1.0.34", "assets": [self.asset]}


class TokeerUpstreamPolicyTests(unittest.TestCase):
    def test_same_tag_asset_update_invalidates_revision(self):
        revisions = []
        for revision_id in (100, 101):
            asset = {
                "name": "tokeer-linux.zip",
                "id": revision_id, "size": 241664,
                "updated_at": "2026-11-01T09:25:34Z",
                "browser_download_url": "https://example.invalid/linux.zip",
            }
            client = type("Client", (), {"get": lambda self, *_a, **_kw: FakeResponse(asset)})()
            ns = isolated("_latest_bundle", ensure_http_client=lambda _name: client,
                          RELEASE_API="https://example.invalid/latest",
                          RUNTIME_ZIP="https://example.invalid/backup.zip")
            tag, url, revision = ns["_latest_bundle"]()
            self.assertEqual(tag, "v1.0.34")
            self.assertEqual(url, "https://example.invalid/linux.zip")
            revisions.append(revision)
        self.assertNotEqual(revisions[0], revisions[1])

    def test_old_version_marker_is_migratable(self):
        with tempfile.TemporaryDirectory() as home:
            marker = Path(home) / ".slsdeck_runtime_version"
            ns = isolated("_installed_runtime_version", os=os, json=json,
                          _tdir=lambda: home,
                          VERSION_FILE=marker.name)
            marker.write_text("v1.0.34\n", encoding="utf-8")
            self.assertEqual(ns["_installed_runtime_version"](), ("v1.0.34", ""))
            marker.write_text(json.dumps({"tag": "v1.0.34", "assetRevision": "id|updated"}))
            self.assertEqual(ns["_installed_runtime_version"](),
                             ("v1.0.34", "id|updated"))

    def test_new_config_selects_game_specific_valve_proton(self):
        with tempfile.TemporaryDirectory() as home:
            cfg = Path(home) / "tokeer_steam_config.py"
            cfg.write_text(
                "def choose_proton(appid, roots):\n"
                "    return 'proton_11' if str(appid) in ('1570010', '3321460') else 'proton_experimental'\n",
                encoding="utf-8")
            ns = isolated(
                "recommended_proton",
                os=os, importlib=__import__("importlib"),
                _tdir=lambda: home, _steam_roots=lambda _mod: [home],
                REQUIRED_PROTON="GE-Proton10-34",
            )
            for appid, expected in [(1570010, "proton_11"),
                                    (3321460, "proton_11"),
                                    (42, "proton_experimental")]:
                got = ns["recommended_proton"](appid)
                self.assertTrue(got["success"], got)
                self.assertEqual(got["name"], expected)
                self.assertFalse(got["requiresInstall"])
                self.assertEqual(got["source"], "upstream")

    def test_legacy_config_requires_ge_but_missing_config_does_not(self):
        with tempfile.TemporaryDirectory() as home:
            cfg = Path(home) / "tokeer_steam_config.py"
            ns = isolated(
                "recommended_proton", os=os,
                importlib=__import__("importlib"),
                _tdir=lambda: home, _steam_roots=lambda _mod: [home],
                REQUIRED_PROTON="GE-Proton10-34",
            )
            self.assertEqual(ns["recommended_proton"](42)["name"],
                             "proton_experimental")
            cfg.write_text("TARGET_PROTON = 'GE-Proton10-34'\n", encoding="utf-8")
            choice = ns["recommended_proton"](42)
            self.assertTrue(choice["requiresInstall"])
            self.assertEqual(choice["name"], "GE-Proton10-34")
            self.assertEqual(choice["source"], "legacy")

    def test_unavailable_community_tool_is_not_selected(self):
        with tempfile.TemporaryDirectory() as home:
            cfg = Path(home) / "tokeer_steam_config.py"
            cfg.write_text("def choose_proton(appid, roots): return 'MadeUpGE-99'\n",
                           encoding="utf-8")
            ns = isolated(
                "recommended_proton", os=os,
                importlib=__import__("importlib"),
                _tdir=lambda: home, _steam_roots=lambda _mod: [home],
                REQUIRED_PROTON="GE-Proton10-34",
            )
            result = ns["recommended_proton"](42)
            self.assertFalse(result["success"])
            self.assertIn("unavailable", result["error"])


if __name__ == "__main__":
    unittest.main()
