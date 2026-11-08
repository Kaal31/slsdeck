"""Read-only injection path status classification regression tests."""
import ast
import unittest
from typing import Any, Dict
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[1] / "py_modules/lt/injection_path_diag.py"
tree = ast.parse(SOURCE.read_text(encoding="utf-8"))
scope = {}
only = [node for node in tree.body if isinstance(node, ast.FunctionDef)
        and node.name == "classify"]
exec(compile(ast.fix_missing_locations(ast.Module(body=only, type_ignores=[])),
             str(SOURCE), "exec"), scope)
classify = scope["classify"]


class InjectionPathTests(unittest.TestCase):
    def test_stopped_client_is_not_misreported_as_success(self):
        self.assertEqual(classify({"steamRunning": False, "functional": True}),
                         "steam-not-running")

    def test_success_requires_functional_confirmation(self):
        self.assertEqual(classify({"steamRunning": True, "functional": True}),
                         "functional-confirmed")
        self.assertNotEqual(classify({"steamRunning": True, "functional": False,
                                      "hookConfigured": True, "serviceSelected": True,
                                      "wrapperThisBoot": True, "moonMapped": True}),
                            "functional-confirmed")

    def test_missing_hook_and_bypassed_service_are_distinguished(self):
        self.assertEqual(classify({"steamRunning": True, "hookConfigured": False}),
                         "hook-not-configured")
        self.assertEqual(classify({"steamRunning": True, "hookConfigured": True,
                                   "serviceSelected": False}),
                         "service-not-selecting-slsdeck")

    def test_moon_failures_are_distinguished(self):
        self.assertEqual(classify({"steamRunning": True, "hookConfigured": True,
                                   "moonMapped": True, "moonLogSuccess": False}),
                         "moon-initialization-failed")
        self.assertEqual(classify({"steamRunning": True, "hookConfigured": True,
                                   "wrapperThisBoot": True, "moonMapped": False}),
                         "moon-not-mapped")

    def test_only_read_only_systemd_queries(self):
        source = SOURCE.read_text(encoding="utf-8")
        self.assertIn('"show", "steam-launcher.service"', source)
        self.assertNotIn('"systemctl", "--user", "restart"', source)
        self.assertNotIn('os.replace(', source)
        self.assertIn("_LAST_LOG_TIME", source)


if __name__ == "__main__":
    unittest.main()
