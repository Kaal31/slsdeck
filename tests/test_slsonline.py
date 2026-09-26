"""The per-game SLSonline toggle must never change another game's settings."""

import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "py_modules"))
from lt import slssteam  # noqa: E402


class SlsOnlineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "config.yaml"
        self.path.write_text(
            "AdditionalApps:\n  - 123\nFakeAppIds:\n  111: 999 # custom\n"
            "  222: 480\n# A separate setting\nManifestPins:\n  111:\n"
            "    locked: true\n", encoding="utf-8")
        patcher = mock.patch.object(slssteam, "config_path", return_value=str(self.path))
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_enable_disable_changes_only_selected_mapping(self):
        original = self.path.read_text(encoding="utf-8")
        result = slssteam.set_slsonline(123, True)
        self.assertTrue(result["success"])
        self.assertEqual(slssteam.slsonline_status(123)["fakeAppId"], 480)
        self.assertIn("  111: 999 # custom\n  222: 480\n", self.path.read_text(encoding="utf-8"))
        self.assertFalse(slssteam.set_slsonline(123, True)["changed"])
        self.assertTrue(slssteam.set_slsonline(123, False)["success"])
        self.assertEqual(self.path.read_text(encoding="utf-8"), original)

    def test_existing_custom_mapping_is_preserved_until_disabled(self):
        self.assertEqual(slssteam.slsonline_status(111)["fakeAppId"], 999)
        self.assertFalse(slssteam.set_slsonline(111, True)["changed"])
        self.assertIn("  111: 999 # custom", self.path.read_text(encoding="utf-8"))
        self.assertTrue(slssteam.set_slsonline(111, False)["changed"])
        self.assertIn("  222: 480", self.path.read_text(encoding="utf-8"))

    def test_bad_map_is_not_rewritten(self):
        self.path.write_text("FakeAppIds: {111: 999}\nAdditionalApps:\n  - 123\n", encoding="utf-8")
        original = self.path.read_text(encoding="utf-8")
        self.assertFalse(slssteam.set_slsonline(123, True)["success"])
        self.assertEqual(self.path.read_text(encoding="utf-8"), original)


if __name__ == "__main__":
    unittest.main()
