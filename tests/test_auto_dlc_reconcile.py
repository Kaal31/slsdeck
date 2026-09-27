import sys
import types
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "py_modules"))
httpc = types.ModuleType("lt.httpc")
httpc.ensure_http_client = mock.MagicMock()
sys.modules.setdefault("lt.httpc", httpc)

from lt import dlc  # noqa: E402


class AutoDlcReconcileTests(unittest.TestCase):
    def test_boot_repairs_confirmed_depots_removed_by_steam(self):
        records = {
            "1364780": {
                "dlcAppids": [1792750, 1792751],
                "depotIds": [1792750, 1792751],
            }
        }
        with mock.patch("lt.settings.get_auto_add_dlc", return_value=True), \
             mock.patch("lt.settings.get_auto_dlc_records", return_value=records), \
             mock.patch.object(dlc.slssteam, "read_dlc_data", return_value={}), \
             mock.patch.object(dlc.slssteam, "set_inject_all_advertised_dlc",
                               return_value={"success": True}) as policy, \
             mock.patch.object(dlc.slssteam, "add_dlc_block",
                               return_value={"success": True}), \
             mock.patch("lt.steam.get_installed_depots",
                        return_value={"1364781": "base"}), \
             mock.patch.object(dlc.slssteam, "_injection_functional", return_value=True), \
             mock.patch.object(dlc.slssteam, "trigger_steam_install") as install, \
             mock.patch.object(dlc.slssteam, "validate_steam_app") as validate, \
             mock.patch.object(dlc.time, "sleep"):
            result = dlc.reconcile_auto_dlc_boot()

        self.assertTrue(result["success"])
        self.assertEqual(result["repairRequested"], [1364780])
        policy.assert_called_once_with(True)
        install.assert_called_once_with(1364780)
        validate.assert_called_once_with(1364780)

    def test_boot_does_not_validate_when_expected_depots_are_mounted(self):
        records = {"1364780": {"dlcAppids": [1], "depotIds": [1792750]}}
        with mock.patch("lt.settings.get_auto_add_dlc", return_value=True), \
             mock.patch("lt.settings.get_auto_dlc_records", return_value=records), \
             mock.patch.object(dlc.slssteam, "read_dlc_data", return_value={}), \
             mock.patch.object(dlc.slssteam, "set_inject_all_advertised_dlc",
                               return_value={"success": True}), \
             mock.patch.object(dlc.slssteam, "add_dlc_block",
                               return_value={"success": True}), \
             mock.patch("lt.steam.get_installed_depots",
                        return_value={"1364781": "base", "1792750": "dlc"}), \
             mock.patch.object(dlc.slssteam, "validate_steam_app") as validate:
            result = dlc.reconcile_auto_dlc_boot()

        self.assertTrue(result["success"])
        self.assertEqual(result["repairRequested"], [])
        validate.assert_not_called()

    def test_disabled_setting_is_synchronized_without_scanning_records(self):
        with mock.patch("lt.settings.get_auto_add_dlc", return_value=False), \
             mock.patch("lt.settings.get_auto_dlc_records") as records, \
             mock.patch.object(dlc.slssteam, "set_inject_all_advertised_dlc",
                               return_value={"success": True}) as policy:
            result = dlc.reconcile_auto_dlc_boot()

        self.assertTrue(result["success"])
        self.assertFalse(result["enabled"])
        policy.assert_called_once_with(False)
        records.assert_not_called()

    def test_legacy_dlcdata_is_migrated_before_comparison(self):
        records = {"1364780": {"dlcAppids": [1], "depotIds": []}}
        with mock.patch("lt.settings.get_auto_add_dlc", return_value=True), \
             mock.patch("lt.settings.get_auto_dlc_records",
                        side_effect=[{}, records]), \
             mock.patch.object(dlc.slssteam, "set_inject_all_advertised_dlc",
                               return_value={"success": True}), \
             mock.patch.object(dlc.slssteam, "read_dlc_data",
                               return_value={1364780: [1]}), \
             mock.patch.object(dlc, "ensure_all_dlc_keys",
                               return_value={"success": True}) as migrate, \
             mock.patch.object(dlc.slssteam, "add_dlc_block",
                               return_value={"success": True}):
            result = dlc.reconcile_auto_dlc_boot()

        self.assertTrue(result["success"])
        migrate.assert_called_once_with(1364780)

    def test_policy_write_failure_is_not_reported_as_success(self):
        fake_downloads = types.ModuleType("lt.downloads")
        fake_downloads.fetch_lua_text = mock.Mock(return_value={"success": False})
        fake_downloads.fetch_manifest_bundle = mock.Mock(return_value={})
        with mock.patch.object(dlc.slssteam, "set_inject_all_advertised_dlc",
                               return_value={"success": False, "error": "write failed"}), \
             mock.patch.object(dlc, "resolve_dlc",
                               return_value={"base": 10, "dlcs": []}), \
             mock.patch.dict(sys.modules, {"lt.downloads": fake_downloads}), \
             mock.patch("lt.settings.set_auto_dlc_record"):
            result = dlc.ensure_all_dlc_keys(10)

        self.assertFalse(result["success"])
        self.assertIn("write failed", result["error"])


if __name__ == "__main__":
    unittest.main()
