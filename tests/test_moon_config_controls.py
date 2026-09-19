import unittest
from unittest.mock import patch
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "py_modules"))
from lt import slssteam  # noqa: E402


class MoonConfigControlsTests(unittest.TestCase):
    def test_auto_update_defaults_on_when_absent(self):
        with patch.object(slssteam, "_config_lines", return_value=["API: yes"]):
            result = slssteam.get_auto_update_apps()
        self.assertTrue(result["enabled"])
        self.assertFalse(result["present"])

    def test_auto_update_replaces_existing_value(self):
        lines = ["API: yes", "AutoUpdateApps: yes"]
        with patch.object(slssteam, "_config_lines", return_value=lines), \
             patch.object(slssteam, "_write_config_lines", return_value=True) as write:
            result = slssteam.set_auto_update_apps(False)
        self.assertTrue(result["success"])
        self.assertEqual(write.call_args.args[0][1], "AutoUpdateApps: no")

    def test_donation_read_and_write_preserve_map(self):
        lines = [
            "Donate:",
            "  Enabled: yes",
            '  Url: "https://manifest.luastools.xyz"',
            "  MaxMintsPerCycle: 25",
            "Achievements: yes",
        ]
        with patch.object(slssteam, "_config_lines", return_value=list(lines)):
            self.assertTrue(slssteam.get_manifest_donation()["enabled"])
        with patch.object(slssteam, "_config_lines", return_value=list(lines)), \
             patch.object(slssteam, "_write_config_lines", return_value=True) as write:
            result = slssteam.set_manifest_donation(False)
        written = write.call_args.args[0]
        self.assertTrue(result["success"])
        self.assertEqual(written[1], "  Enabled: no")
        self.assertIn(lines[2], written)
        self.assertIn(lines[3], written)

    def test_donation_adds_only_enabled_when_map_missing(self):
        with patch.object(slssteam, "_config_lines", return_value=["API: yes"]), \
             patch.object(slssteam, "_write_config_lines", return_value=True) as write:
            slssteam.set_manifest_donation(False)
        self.assertEqual(write.call_args.args[0][-2:], ["Donate:", "  Enabled: no"])


if __name__ == "__main__":
    unittest.main()
