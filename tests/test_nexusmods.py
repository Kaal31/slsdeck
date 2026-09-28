import sys
import types
import unittest
from pathlib import Path

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


if __name__ == "__main__":
    unittest.main()
