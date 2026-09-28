import sys
import types
import unittest
import tempfile
import os
from pathlib import Path
from unittest import mock

fake_httpx = types.ModuleType("httpx")
fake_httpx.Client = object
fake_httpx.Timeout = lambda *args, **kwargs: object()
fake_httpx.Limits = lambda *args, **kwargs: object()
fake_httpx.TransportError = OSError
fake_httpx.ConnectError = OSError
fake_httpx.USE_CLIENT_DEFAULT = object()
sys.modules.setdefault("httpx", fake_httpx)
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "py_modules"))

from lt import nexusmods


class NexusModsTests(unittest.TestCase):
    def test_collection_url(self):
        self.assertEqual(
            nexusmods._collection_ref(
                "https://www.nexusmods.com/skyrimspecialedition/collections/abc_123?tab=mods"
            ),
            ("skyrimspecialedition", "abc_123"),
        )

    def test_collection_slug_requires_domain(self):
        with self.assertRaises(ValueError):
            nexusmods._collection_ref("abc123")

    def test_safe_filename_blocks_path_escape(self):
        name = nexusmods._safe_name("../../evil/archive.zip", "fallback")
        self.assertNotIn("/", name)
        self.assertNotIn("..", name)

    def test_domain_validation(self):
        self.assertEqual(nexusmods._domain("SkyrimSpecialEdition"), "skyrimspecialedition")
        with self.assertRaises(ValueError):
            nexusmods._domain("../../etc")

    def test_archive_guard_requires_same_real_file_and_expected_size(self):
        item = {"domain": "skyrim", "modId": 10, "fileId": 20, "size": 4}
        with tempfile.TemporaryDirectory() as root:
            archive = os.path.join(root, "mod.zip")
            index = os.path.join(root, "archive-index.json")
            with mock.patch.object(nexusmods, "_cache_index_path", return_value=index):
                with open(archive, "wb") as handle:
                    handle.write(b"data")
                nexusmods._remember_archive(item, archive)
                self.assertEqual(nexusmods._cached_archive(item), archive)
                with open(archive, "ab") as handle:
                    handle.write(b"changed")
                self.assertEqual(nexusmods._cached_archive(item), "")


if __name__ == "__main__":
    unittest.main()
