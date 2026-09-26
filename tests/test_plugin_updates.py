import json
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "py_modules"))

from lt import plugin_updates  # noqa: E402


class _Response:
    status_code = 200

    def __init__(self, value):
        self._value = value

    def json(self):
        return self._value


class _Client:
    def __init__(self, value):
        self.value = value

    def get(self, *_args, **_kwargs):
        return _Response(self.value)


class PluginUpdateTests(unittest.TestCase):
    def test_replacement_marker_is_external_short_lived_and_url_scoped(self):
        with tempfile.TemporaryDirectory() as root, \
             mock.patch.object(plugin_updates, "get_settings_dir", return_value=root):
            rejected = plugin_updates.prepare_replacement(
                "0.9.64-update-system.1", "https://example.com/plugin.zip"
            )
            self.assertFalse(rejected["success"])

            accepted = plugin_updates.prepare_replacement(
                "0.9.64-update-system.1",
                "https://github.com/Kaal31/slsdeck/releases/download/update-system-build-1/SLSDeckUniversal-update-system-1.zip",
            )
            self.assertTrue(accepted["success"])
            self.assertTrue(plugin_updates.replacement_pending())

            rolling = plugin_updates.prepare_replacement(
                "main (rolling latest)",
                "https://github.com/Kaal31/slsdeck/releases/download/main-latest/SLSDeckUniversal-main.zip",
            )
            self.assertTrue(rolling["success"])

            marker = Path(root, "decky-replacement.json")
            value = json.loads(marker.read_text(encoding="utf-8"))
            value["createdAt"] = time.time() - plugin_updates.MARKER_TTL_SECONDS - 1
            marker.write_text(json.dumps(value), encoding="utf-8")
            self.assertFalse(plugin_updates.replacement_pending())
            self.assertFalse(marker.exists())

    def test_release_list_accepts_safe_channels_and_immutable_builds(self):
        raw = [
            {
                "tag_name": "update-system-build-12",
                "name": "SLSDeck 0.9.64-update-system.12",
                "html_url": "https://github.com/Kaal31/slsdeck/releases/tag/update-system-build-12",
                "published_at": "2026-09-21T00:00:00Z",
                "assets": [
                    {"name": "ubisoft-packages.zip", "browser_download_url": "bad", "size": 20},
                    {"name": "SLSDeckUniversal-update-system-12.zip", "browser_download_url": "good12", "size": 10},
                ],
            },
            {
                "tag_name": "update-system-build-9",
                "name": "SLSDeck 0.9.64-update-system.9",
                "html_url": "release9",
                "published_at": "2026-09-20T00:00:00Z",
                "assets": [{"name": "SLSDeckUniversal-update-system-9.zip", "browser_download_url": "good9", "size": 9}],
            },
            {
                "tag_name": "main-latest",
                "name": "SLSDeck main latest",
                "html_url": "main-release",
                "published_at": "2026-09-22T00:00:00Z",
                "assets": [{"name": "SLSDeckUniversal-main.zip", "browser_download_url": "main-good", "size": 30}],
            },
            {"tag_name": "unsafe", "assets": [{"name": "SLSDeckUniversal-unsafe.zip", "browser_download_url": "wrong"}]},
        ]
        with mock.patch.object(plugin_updates, "ensure_http_client", return_value=_Client(raw)):
            result = plugin_updates.list_releases()

        self.assertTrue(result["success"])
        self.assertEqual(result["channels"], ["update-system", "main"])
        immutable = [item for item in result["releases"] if item["immutable"]]
        self.assertEqual([item["runNumber"] for item in immutable], [12, 9])
        self.assertEqual(immutable[0]["assetUrl"], "good12")
        self.assertEqual(immutable[0]["version"], "0.9.64-update-system.12")
        rolling = [item for item in result["releases"] if item["rolling"]]
        self.assertEqual(rolling[0]["channel"], "main")


if __name__ == "__main__":
    unittest.main()
