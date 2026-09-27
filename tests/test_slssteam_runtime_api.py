"""Live install commands use Moon's private runtime API contract."""

import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "py_modules"))
from lt import slssteam  # noqa: E402


class SlssteamRuntimeApiTests(unittest.TestCase):
    def test_install_uses_private_runtime_contract(self):
        user = mock.Mock(pw_uid=1000)
        with mock.patch("pwd.getpwnam", return_value=user), \
             mock.patch.object(slssteam, "_decky_user", return_value="deck"), \
             mock.patch.object(slssteam, "_home", return_value="/home/deck"), \
             mock.patch.object(
                 slssteam.os.path, "isfile",
                 side_effect=lambda p: p == "/run/user/1000/SLSsteam/api"
             ), mock.patch("builtins.open", mock.mock_open()) as opened:
            result = slssteam.trigger_steam_install(3751950, 0)

        self.assertTrue(result["success"])
        self.assertEqual(result["path"], "/run/user/1000/SLSsteam/api")
        opened.assert_called_once_with(
            "/run/user/1000/SLSsteam/api", "w", encoding="utf-8"
        )
        opened().write.assert_called_once_with("install|3751950|0\n")


if __name__ == "__main__":
    unittest.main()
