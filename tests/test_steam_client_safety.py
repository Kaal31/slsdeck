"""Regression checks for read-only RT3 detection and client repair guard."""
import ast
import unittest
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[1] / "py_modules/lt/slssteam.py"
TREE = ast.parse(SOURCE.read_text(encoding="utf-8"))
TEXT = SOURCE.read_text(encoding="utf-8")


class ClientSafetyTests(unittest.TestCase):
    def test_readonly_rt3_detector_present(self):
        functions = {n.name: n for n in TREE.body if isinstance(n, ast.FunctionDef)}
        self.assertIn("steam_rt3_client_status", functions)
        detector = ast.get_source_segment(TEXT, functions["steam_rt3_client_status"])
        self.assertIn('name != "steam"', detector)
        self.assertIn('"/proc/{pid}/exe"', detector)
        self.assertIn('header[4] == 2', detector)
        self.assertIn('"unknown"', detector)
        for forbidden in ("os.remove(", "os.replace(", "subprocess.run(", "subprocess.Popen("):
            self.assertNotIn(forbidden, detector)

    def test_unsupported_rt3_gates_injection_and_headcrab(self):
        self.assertIn('rt3 = steam_rt3_client_status()', TEXT)
        self.assertIn('if rt3["rt3"]:', TEXT)
        self.assertIn('refusing unsupported Moon injection', TEXT)
        self.assertIn('Refusing Headcrab repair: SteamRT3', TEXT)
        self.assertIn('out["steamRt3"] = steam_rt3_client_status()', TEXT)

    def test_update_block_only_restored_after_verified_repair(self):
        self.assertIn('def _finalize_update_block(verified: bool)', TEXT)
        self.assertIn('_verified = bool(rc == 0 and _actual and _target and', TEXT)
        self.assertIn('_actual == _target and _moon_ok)', TEXT)
        self.assertIn('_finalize_update_block(_verified)', TEXT)
        self.assertIn('content = current_custom + (_STEAM_CFG if verified else "")', TEXT)
        self.assertIn('if not _verified:', TEXT)
        self.assertNotIn('_restore_update_block()', TEXT)

    def test_python_source_compiles(self):
        compile(TEXT, str(SOURCE), "exec")


if __name__ == "__main__":
    unittest.main()
