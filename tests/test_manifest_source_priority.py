"""Authenticated game-manifest sources keep deterministic priority."""

import io
import sys
import types
import unittest
import zipfile
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "py_modules"))
httpx = types.ModuleType("httpx")
httpx.TimeoutException = TimeoutError
sys.modules.setdefault("httpx", httpx)
httpc = types.ModuleType("lt.httpc")
httpc.ensure_http_client = mock.MagicMock()
sys.modules.setdefault("lt.httpc", httpc)
from lt import downloads  # noqa: E402


def manifest_zip(appid: int, marker: str) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as archive:
        archive.writestr(f"{appid}.lua", f'-- {marker}\naddappid({appid}, 1, "{'a' * 64}")')
    return buf.getvalue()


class Response:
    status_code = 200

    def __init__(self, content: bytes):
        self.content = content


class ManifestSourcePriorityTests(unittest.TestCase):
    def test_hubcap_is_partitioned_ahead_of_health_sorted_sources(self):
        ryuu = {"name": "Ryuu", "url": "https://generator.ryuu.lol/<appid>"}
        hubcap = {"name": "Morrenus", "url": "https://hubcapmanifest.com/<appid>?key=<moapikey>"}
        preferred, fallback = downloads._partition_game_manifest_apis([ryuu, hubcap])
        self.assertEqual(preferred, [hubcap])
        self.assertEqual(fallback, [ryuu])

    def test_hubcap_lua_wins_over_authenticated_luatools(self):
        appid = 1364780
        client = mock.Mock()
        client.get.return_value = Response(manifest_zip(appid, "hubcap"))
        api = {
            "name": "Morrenus",
            "url": "https://hubcapmanifest.com/<appid>?api_key=<moapikey>",
            "success_code": 200,
        }
        with mock.patch.object(downloads, "load_api_manifest", return_value=[api]), \
             mock.patch.object(downloads, "substitute_keys", side_effect=lambda url: (url.replace("<moapikey>", "key"), [])), \
             mock.patch.object(downloads, "ensure_http_client", return_value=client), \
             mock.patch("lt.luatools.fetch_manifest_lua", return_value='-- lua.tools\naddappid(1, 1, "b")') as lua:
            result = downloads.fetch_lua_text(appid)

        self.assertTrue(result["success"])
        self.assertEqual(result["source"], "Morrenus")
        self.assertIn("hubcap", result["lua"])
        lua.assert_not_called()

    def test_missing_hubcap_key_falls_through_to_luatools(self):
        appid = 1364780
        api = {
            "name": "Morrenus",
            "url": "https://hubcapmanifest.com/<appid>?api_key=<moapikey>",
        }
        lua_text = f'-- lua.tools\naddappid({appid}, 1, "{'b' * 64}")'
        with mock.patch.object(downloads, "load_api_manifest", return_value=[api]), \
             mock.patch.object(downloads, "substitute_keys", return_value=(api["url"], ["<moapikey>"])), \
             mock.patch("lt.luatools.fetch_manifest_lua", return_value=lua_text):
            result = downloads.fetch_lua_text(appid)

        self.assertTrue(result["success"])
        self.assertEqual(result["source"], "lua.tools")


if __name__ == "__main__":
    unittest.main()
