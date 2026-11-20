"""Functional regression tests for SteamRT3 process identification."""
import ast
import io
import unittest
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Dict

SOURCE = Path(__file__).resolve().parents[1] / "py_modules/lt/slssteam.py"
TREE = ast.parse(SOURCE.read_text(encoding="utf-8"))


def detect(processes):
    def proc_open(path, *args, **kwargs):
        pid, kind = path.split("/")[2:4]
        data = processes[pid]
        if kind == "comm":
            return io.StringIO(data.get("name", "steam") + "\n")
        if kind == "exe":
            return io.BytesIO(b"\x7fELF" + bytes([2 if data["bits"] == 64 else 1]))
        raise FileNotFoundError(path)

    def readlink(path):
        return processes[path.split("/")[2]]["exe"]

    scope = {
        "Dict": Dict, "Any": Any, "open": proc_open,
        "os": SimpleNamespace(
            listdir=lambda path: list(processes),
            readlink=readlink),
    }
    fn = next(node for node in TREE.body
              if isinstance(node, ast.FunctionDef) and
              node.name == "steam_rt3_client_status")
    exec(compile(ast.fix_missing_locations(
        ast.Module(body=[fn], type_ignores=[])), str(SOURCE), "exec"), scope)
    return scope["steam_rt3_client_status"]()


class SteamRT3DetectionTests(unittest.TestCase):
    def test_actual_rt3(self):
        result = detect({"101": {"bits": 64, "exe": "/home/deck/.local/share/Steam/steamrt64/steam"}})
        self.assertTrue(result["rt3"])
        self.assertEqual(result["state"], "unsupported-rt3")

    def test_legacy_with_64bit_helper_named_steam(self):
        result = detect({
            "101": {"bits": 32, "exe": "/home/deck/.local/share/Steam/ubuntu12_32/steam"},
            "102": {"bits": 64, "exe": "/usr/bin/steam"},
        })
        self.assertFalse(result["rt3"])
        self.assertEqual(result["state"], "legacy-32bit")

    def test_ambiguous_64bit_process_is_not_rt3(self):
        result = detect({"101": {"bits": 64, "exe": "/usr/bin/steam"}})
        self.assertFalse(result["rt3"])
        self.assertEqual(result["state"], "unknown")

    def test_no_process_is_unknown(self):
        result = detect({})
        self.assertFalse(result["rt3"])
        self.assertEqual(result["state"], "unknown")


if __name__ == "__main__":
    unittest.main()
