"""Architecture gate tests for the isolated Moon SteamRT64 integration."""
import ast
import tempfile
import unittest
from pathlib import Path
from typing import Any, Dict

SOURCE = Path(__file__).resolve().parents[1] / "py_modules/lt/slssteam.py"
TEXT = SOURCE.read_text(encoding="utf-8")
TREE = ast.parse(TEXT)


def extract(name, scope):
    node = next(n for n in TREE.body if isinstance(n, ast.FunctionDef) and n.name == name)
    exec(compile(ast.fix_missing_locations(ast.Module(body=[node], type_ignores=[])),
                 str(SOURCE), "exec"), scope)
    return scope[name]


class MoonX64SelectionTests(unittest.TestCase):
    def test_elf_header_detection(self):
        check = extract("_elf_bits", {})
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "engine.so"
            for cls, expected in ((1, 32), (2, 64), (0, 0)):
                p.write_bytes(b"\x7fELF" + bytes([cls]))
                self.assertEqual(check(str(p)), expected)
            self.assertEqual(check(str(p) + "-missing"), 0)

    def test_engine_selection_never_guesses_from_helper_architecture(self):
        scope = {"Dict": Dict, "Any": Any}
        detect = extract("_moon_engine_target_bits", scope)
        for state, expected in (({"rt3": True, "state": "unsupported-rt3"}, 64),
                                ({"rt3": False, "state": "legacy-32bit"}, 32),
                                ({"rt3": False, "state": "unknown"}, 0)):
            scope["steam_rt3_client_status"] = lambda state=state: state
            self.assertEqual(detect(), expected)

    def test_release_identity_and_legacy_guard(self):
        self.assertIn("MOON_X64_REPO = \"ogb4n/slsteam-moon-x64\"", TEXT)
        self.assertIn("MOON_X64_SHA256 =", TEXT)
        self.assertIn("if _moon_engine_target_bits() == 64:", TEXT)
        self.assertIn("Refusing Headcrab: this is not a verified 32-bit", TEXT)
        self.assertIn("if required not in (32, 64) or actual != required:", TEXT)

    def test_install_keeps_steamos_startup_unmodified_until_opt_in(self):
        # Inspect the original function body without running it: a real install
        # may stop Steam and must never be invoked by an offline unit test.
        body = ast.get_source_segment(
            TEXT, next(n for n in TREE.body
                       if isinstance(n, ast.FunctionDef) and n.name == "_run_install"))
        self.assertIn('if _moon_engine_target_bits() == 64:', body)
        self.assertIn('automatic Steam/Decky', body)
        self.assertIn('launcher injection DISABLED', body)
        self.assertIn('Architecture-matched Moon engine unavailable', TEXT)
        self.assertNotIn('falling back to AceSLS SLSsteam', body)

    def test_python_compiles(self):
        compile(TEXT, str(SOURCE), "exec")


if __name__ == "__main__":
    unittest.main()
