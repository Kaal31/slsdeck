"""Regression tests for the Moon-only installation and runtime safety gates."""
import ast
import io
import unittest
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Dict

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "py_modules/lt/slssteam.py"
DOWNLOADS = ROOT / "py_modules/lt/downloads.py"
DIAGNOSTICS = ROOT / "py_modules/lt/injection_path_diag.py"


def extract(path, name, env):
    tree = ast.parse(path.read_text(encoding="utf-8"))
    match = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == name]
    assert len(match) == 1, f"missing {name}"
    exec(compile(ast.fix_missing_locations(ast.Module(body=match, type_ignores=[])),
                 str(path), "exec"), env)
    return env[name]


def status(disk_moon, disk_inode, mapped_inode, functional=True):
    def open_mock(path, *args, **kwargs):
        if path == "/proc/22/comm":
            return io.StringIO("steam\n")
        if path == "/proc/22/maps":
            return io.StringIO(
                f"7f7f-8f8f r-xp 00000000 00:15 {mapped_inode} "
                "/home/deck/.local/share/SLSsteam/SLSsteam.so\n"
                if mapped_inode else "")
        raise FileNotFoundError(path)

    def stat_mock(path):
        if not disk_inode:
            raise FileNotFoundError(path)
        return SimpleNamespace(st_ino=disk_inode)

    env = {"Any": Any, "Dict": Dict,
           "os": SimpleNamespace(stat=stat_mock, listdir=lambda p: ["22"]),
           "open": open_mock,
           "installed_lib_is_moon": lambda: {
               "moon": disk_moon, "lib": "/moon/SLSsteam.so"},
           "_injection_functional": lambda: functional}
    return extract(ENGINE, "moon_runtime_status", env)()


class MoonRuntimeSafetyTests(unittest.TestCase):
    def test_stock_engine_is_not_ready_even_when_injected(self):
        x = status(False, 100, 100, True)
        self.assertEqual(x["engine"], "stock")
        self.assertFalse(x["ready"])
        self.assertIn("Wrong engine loaded", x["reason"])

    def test_replaced_library_requires_restart(self):
        x = status(True, 101, 100, True)
        self.assertEqual(x["engine"], "stale")
        self.assertFalse(x["ready"])

    def test_verified_moon_requires_functional_injection(self):
        self.assertTrue(status(True, 101, 101, True)["ready"])
        self.assertFalse(status(True, 101, 101, False)["ready"])
        self.assertFalse(status(True, 101, 0, True)["ready"])

    def test_installer_refuses_stock_fallback(self):
        source = ENGINE.read_text(encoding="utf-8")
        self.assertIn("refusing stock AceSLS fallback", source)
        self.assertNotIn("url = SLS_RELEASE_URL", source)
        self.assertIn('engine_check = installed_lib_is_moon()', source)
        self.assertIn("Client repair detected a non-Moon engine", source)

    def test_download_paths_require_running_moon(self):
        source = DOWNLOADS.read_text(encoding="utf-8")
        self.assertIn("engine = slssteam.moon_runtime_status()", source)
        self.assertIn('"code": "moon_runtime_not_ready"', source)
        engine = ENGINE.read_text(encoding="utf-8")
        self.assertIn("runtime = moon_runtime_status()", engine)
        self.assertIn("blocking native install", engine)
        diag = DIAGNOSTICS.read_text(encoding="utf-8")
        self.assertIn('"wrong-engine-loaded"', diag)
        self.assertIn('"stale-engine-mapped"', diag)


if __name__ == "__main__":
    unittest.main()
