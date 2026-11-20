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
        self.assertIn('normalized.endswith("/steamrt64/steam") and bits == 64', detector)
        self.assertIn('normalized.endswith("/ubuntu12_32/steam") and bits == 32', detector)
        self.assertIn('"unknown"', detector)
        for forbidden in ("os.remove(", "os.replace(", "subprocess.run(", "subprocess.Popen("):
            self.assertNotIn(forbidden, detector)

    def test_rt64_requires_matching_engine_and_skips_headcrab(self):
        self.assertIn('expected, installed = _moon_engine_target_bits(), _installed_moon_bits()', TEXT)
        self.assertIn('installed != expected', TEXT)
        self.assertIn('SteamRT64: skipping Headcrab and client downgrade', TEXT)
        self.assertIn('MOON_X64_SHA256', TEXT)
        self.assertIn('out["steamRt3"] = steam_rt3_client_status()', TEXT)

    def test_legacy_pattern_refresh_is_not_used_on_x64(self):
        functions = {n.name: n for n in TREE.body if isinstance(n, ast.FunctionDef)}
        refresh = ast.get_source_segment(TEXT, functions["refresh_patterns_now"])
        self.assertIn('if _moon_engine_target_bits() == 64:', refresh)
        self.assertIn('Legacy 32-bit pattern-refresh cannot audit SteamRT64', refresh)

    def test_x64_release_pinned_and_verified(self):
        self.assertIn('ogb4n/slsteam-moon-x64', TEXT)
        self.assertIn('v20261116145432', TEXT)
        self.assertIn('sha256=MOON_X64_SHA256 if url == MOON_X64_URL else ""', TEXT)
        self.assertIn('return MOON_X64_URL', TEXT)

    def test_update_block_only_restored_after_verified_repair(self):
        self.assertIn('def _finalize_update_block(verified: bool)', TEXT)
        self.assertIn('_verified = bool(rc == 0 and _actual and _target and', TEXT)
        self.assertIn('_actual == _target and _moon_ok)', TEXT)
        self.assertIn('_finalize_update_block(_verified)', TEXT)
        self.assertIn('content = current_custom + (_STEAM_CFG if verified else "")', TEXT)
        self.assertIn('if not _verified:', TEXT)
        self.assertNotIn('_restore_update_block()', TEXT)

    def test_headcrab_cannot_silently_switch_client_architecture(self):
        functions = {n.name: n for n in TREE.body if isinstance(n, ast.FunctionDef)}
        repair = ast.get_source_segment(TEXT, functions["_run_headcrab_shimmed"])
        self.assertIn('"steam_client_steamrt64" in script_text', repair)
        self.assertIn('".steam-enable-steamrt64-client" in script_text', repair)
        self.assertIn('".steam-disable-steamrt64-client" in script_text', repair)
        self.assertIn('Client untouched;', repair)
        self.assertLess(repair.index('".steam-enable-steamrt64-client" in script_text'),
                        repair.index("subprocess.Popen("))

    def test_python_source_compiles(self):
        compile(TEXT, str(SOURCE), "exec")


if __name__ == "__main__":
    unittest.main()
