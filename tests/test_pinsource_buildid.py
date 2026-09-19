"""lua.tools BuildID comments are retained with exact depot pins."""

import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "py_modules"))
httpc = types.ModuleType("lt.httpc")
httpc.ensure_http_client = mock.MagicMock()
sys.modules.setdefault("lt.httpc", httpc)
from lt import pinsource  # noqa: E402


LUA = """-- Version-locked to Build 24424450 — released 2026-08-04 UTC
setManifestid(3751951, "4397710407098141927")
setManifestid(3751953, "3022415893432196011")
"""


class PinsourceBuildIdTests(unittest.TestCase):
    def test_parses_luatools_build_comment(self):
        self.assertEqual(pinsource.parse_buildid(LUA), "24424450")

    def test_fix_pin_passes_buildid_with_depot_gids(self):
        with mock.patch.object(pinsource.luatools, "download_fix_manifest", return_value=LUA), \
             mock.patch.object(pinsource.slssteam, "pin_app_gids", return_value={"success": True}) as pin:
            result = pinsource.auto_pin_from_luatools_fix(3751950, "fix-id")

        pin.assert_called_once_with(
            3751950,
            {3751951: "4397710407098141927", 3751953: "3022415893432196011"},
            buildid="24424450", source="lua.tools-fix",
        )
        self.assertTrue(result["pinned"])
        self.assertEqual(result["buildid"], "24424450")

    def test_missing_comment_remains_supported(self):
        self.assertEqual(pinsource.parse_buildid('setManifestid(1, "2")'), "")

    def test_catalog_build_is_fallback_when_download_omits_comment(self):
        lua_without_header = 'setManifestid(3751951, "4397710407098141927")'
        with mock.patch.object(
            pinsource.luatools, "download_fix_manifest", return_value=lua_without_header
        ), mock.patch.object(
            pinsource.slssteam, "pin_app_gids", return_value={"success": True}
        ) as pin:
            result = pinsource.auto_pin_from_luatools_fix(
                3751950, "fix-id", "24424450"
            )

        pin.assert_called_once_with(
            3751950, {3751951: "4397710407098141927"},
            buildid="24424450", source="lua.tools-fix"
        )
        self.assertEqual(result["buildid"], "24424450")

    def test_pin_persists_buildid_with_snapshot(self):
        with tempfile.TemporaryDirectory() as tmp:
            config = Path(tmp) / "config.yaml"
            config.write_text("ManifestPins:\n", encoding="utf-8")
            with mock.patch.object(pinsource.slssteam, "config_path", return_value=str(config)), \
                 mock.patch.object(pinsource.slssteam, "_pin_key_supported", return_value=True), \
                 mock.patch("lt.steam.get_installed_depots", return_value={}), \
                 mock.patch("lt.settings.set_pinned_manifest_snapshot") as snapshot, \
                 mock.patch("lt.settings.set_pinned_build") as saved_build, \
                 mock.patch("lt.buildhistory.snapshot") as history:
                result = pinsource.slssteam.pin_app_gids(
                    3751950, {3751951: "4397710407098141927"},
                    buildid="24424450", source="lua.tools-fix"
                )

        self.assertTrue(result["success"])
        # The package-level survival backup may refresh the same snapshot after
        # the pin. The build-aware write itself must always be present.
        self.assertIn(
            mock.call(3751950, {3751951: "4397710407098141927"},
                      "24424450", "lua.tools-fix"),
            snapshot.call_args_list,
        )
        saved_build.assert_called_once_with(3751950, "24424450")
        history.assert_called_once_with(
            3751950, {3751951: "4397710407098141927"},
            buildid="24424450", source="lua.tools-fix"
        )


if __name__ == "__main__":
    unittest.main()
