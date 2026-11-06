"""SteamStub eligibility regression: scan all safe game EXEs, not only the largest."""
import ast
import os
import stat
import struct
import tempfile
import types
import unittest
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[1] / "py_modules/lt/steamstub.py"
tree = ast.parse(SOURCE.read_text(encoding="utf-8"))
selected = [node for node in tree.body if isinstance(node, ast.FunctionDef)
            and node.name in {"has_steamstub", "_steamstub_candidates", "_select_executable"}]


def make_pe(path: Path, with_bind=False):
    data = bytearray(0x200)
    data[:2] = b"MZ"
    struct.pack_into("<I", data, 0x3c, 0x80)
    data[0x80:0x84] = b"PE\x00\x00"
    struct.pack_into("<H", data, 0x86, 1)
    struct.pack_into("<H", data, 0x94, 0)
    data[0x98:0xa0] = b".bind\x00\x00\x00" if with_bind else b".text\x00\x00\x00"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


class SteamStubDiscoveryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        safe = lambda base, rel: os.path.commonpath([os.path.realpath(base), os.path.realpath(os.path.join(base, rel))]) == os.path.realpath(base)
        env = {"os": os, "struct": struct, "logger": types.SimpleNamespace(warn=lambda *_: None),
               "_fixes": types.SimpleNamespace(_SKIP_EXE_DIRS={"_commonredist", "engine", "redist"},
                                                _is_safe_path=safe)}
        exec(compile(ast.fix_missing_locations(ast.Module(body=selected, type_ignores=[])),
                     str(SOURCE), "exec"), env)
        self.find = env["_select_executable"]

    def test_finds_wrapped_launcher_not_shipping_executable(self):
        make_pe(self.root / "DisneyDreamlightValley.exe", True)
        make_pe(self.root / "Game" / "Binaries" / "Win64" / "Game-Shipping.exe")
        result = self.find(str(self.root))
        self.assertTrue(result["success"])
        self.assertEqual(result["relativeExe"], "DisneyDreamlightValley.exe")

    def test_does_not_offer_unwrapped_game(self):
        make_pe(self.root / "DreamlightValley.exe")
        self.assertEqual(self.find(str(self.root))["candidates"], [])

    def test_requires_selection_when_ambiguous(self):
        make_pe(self.root / "Launcher.exe", True)
        make_pe(self.root / "Game.exe", True)
        result = self.find(str(self.root))
        self.assertFalse(result["success"])
        self.assertEqual(len(result["candidates"]), 2)
        self.assertEqual(self.find(str(self.root), "Game.exe")["relativeExe"], "Game.exe")
        self.assertFalse(self.find(str(self.root), "../other.exe")["success"])

    def test_skips_redist_executable(self):
        make_pe(self.root / "Redist" / "Installer.exe", True)
        self.assertEqual(self.find(str(self.root))["candidates"], [])


if __name__ == "__main__":
    unittest.main()
