import os
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "py_modules"))
from lt import slssteam, steam  # noqa: E402


class PinCompletionTests(unittest.TestCase):
    def test_reads_manifests_actually_mounted_by_completed_update(self):
        with tempfile.TemporaryDirectory() as tmp:
            logs = Path(tmp) / "logs"
            logs.mkdir()
            now = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
            (logs / "content_log.txt").write_text(
                f"[{now}] AppID 3751950 finished update, 2 mounted depots "
                "(BuildID 24833802) : 3751951 (4397710407098141927),"
                "1716751 (6659642105086821873),\n",
                encoding="utf-8",
            )
            with mock.patch.object(steam, "detect_steam_install_path", return_value=tmp):
                result = steam.get_completed_update_depots(3751950, time.time() - 10)

        self.assertEqual(result["depots"]["3751951"], "4397710407098141927")
        self.assertEqual(result["buildid"], "24833802")

    def test_ignores_completion_older_than_current_pin(self):
        with tempfile.TemporaryDirectory() as tmp:
            logs = Path(tmp) / "logs"
            logs.mkdir()
            (logs / "content_log.txt").write_text(
                "[2026-01-01 00:00:00] AppID 3751950 finished update, 1 mounted depots "
                "(BuildID 1) : 3751951 (2),\n",
                encoding="utf-8",
            )
            with mock.patch.object(steam, "detect_steam_install_path", return_value=tmp):
                result = steam.get_completed_update_depots(3751950, time.time())
        self.assertEqual(result, {})


class RepairEvidenceTests(unittest.TestCase):
    def test_missing_success_sentence_is_unknown_not_repair(self):
        with tempfile.TemporaryDirectory() as tmp:
            log = Path(tmp) / ".SLSsteam.log"
            log.write_text("[Info] Moon runtime active\n", encoding="utf-8")
            with mock.patch.object(slssteam, "_home", return_value=tmp):
                result = slssteam.client_fix_needed()
        self.assertFalse(result["needed"])
        self.assertTrue(result["unknown"])

    def test_explicit_abort_still_requests_repair(self):
        with tempfile.TemporaryDirectory() as tmp:
            log = Path(tmp) / ".SLSsteam.log"
            log.write_text("SLSsteam loading in steam\nAborting! hash mismatch\n", encoding="utf-8")
            with mock.patch.object(slssteam, "_home", return_value=tmp), \
                 mock.patch.object(slssteam, "steam_client_version", return_value="new"), \
                 mock.patch.object(slssteam, "headcrab_compatible_client", return_value="old"):
                result = slssteam.client_fix_needed()
        self.assertTrue(result["needed"])


if __name__ == "__main__":
    unittest.main()
