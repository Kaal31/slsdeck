import os
import sys
import tempfile
import time
import types
import unittest
from pathlib import Path
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "py_modules"))

# The migration unit tests are filesystem-only. Decky's packaged runtime ships
# httpx, while the lightweight repository test interpreter may not.
try:
    import httpx  # noqa: F401
except ImportError:
    httpx_stub = types.ModuleType("httpx")
    httpx_stub.Client = type("Client", (), {})
    httpx_stub.Timeout = lambda *args, **kwargs: None
    httpx_stub.Limits = lambda *args, **kwargs: None
    httpx_stub.USE_CLIENT_DEFAULT = object()
    sys.modules["httpx"] = httpx_stub

from lt import cloudredirect  # noqa: E402


class CloudRedirectMigrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.config = self.root / "config"
        self.config.mkdir()
        self.history = []
        self.patches = [
            mock.patch.object(cloudredirect, "_native_config_dir", return_value=str(self.config)),
            mock.patch.object(cloudredirect, "chown_to_user", return_value=None),
            mock.patch.object(cloudredirect, "_migration_history_append", side_effect=self.history.append),
        ]
        for patcher in self.patches:
            patcher.start()

    def tearDown(self):
        for patcher in reversed(self.patches):
            patcher.stop()
        self.temp.cleanup()

    def write(self, root: Path, relative: str, value: bytes, age_seconds: int = 0) -> Path:
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(value)
        timestamp = time.time() - age_seconds
        os.utime(path, (timestamp, timestamp))
        return path

    def test_copies_and_verifies_new_file(self):
        source, destination = self.root / "source", self.root / "destination"
        self.write(source, "123/456/save.dat", b"save")
        result = cloudredirect._sync_provider_tree(str(source), str(destination), "a", "b")
        self.assertTrue(result["success"])
        self.assertEqual(result["copied"], 1)
        self.assertEqual((destination / "123/456/save.dat").read_bytes(), b"save")

    def test_newer_destination_is_preserved(self):
        source, destination = self.root / "source", self.root / "destination"
        self.write(source, "save.dat", b"old", age_seconds=20)
        self.write(destination, "save.dat", b"new", age_seconds=0)
        result = cloudredirect._sync_provider_tree(str(source), str(destination), "a", "b")
        self.assertTrue(result["success"])
        self.assertEqual((destination / "save.dat").read_bytes(), b"new")

    def test_ambiguous_versions_are_both_preserved(self):
        source, destination = self.root / "source", self.root / "destination"
        self.write(source, "save.dat", b"source")
        self.write(destination, "save.dat", b"destination")
        result = cloudredirect._sync_provider_tree(str(source), str(destination), "a", "b")
        self.assertTrue(result["success"])
        self.assertEqual(result["conflicts"], 1)
        self.assertEqual((destination / "save.dat").read_bytes(), b"destination")
        conflicts = list(destination.glob(".slsdeck-conflicts/*/save.dat"))
        self.assertEqual(len(conflicts), 1)
        self.assertEqual(conflicts[0].read_bytes(), b"source")

    def test_folder_bridge_targets_selected_directory(self):
        folder = self.root / "provider"
        folder.mkdir()
        result = cloudredirect._install_folder_bridge(str(folder))
        bridge = self.config / "tokens_folder.json"
        self.assertTrue(result["success"])
        self.assertTrue(bridge.is_symlink())
        self.assertEqual(bridge.resolve(), folder.resolve())

    def test_bridge_replacement_retains_regular_file(self):
        folder = self.root / "provider"
        folder.mkdir()
        bridge = self.config / "tokens_folder.json"
        bridge.write_text("legacy token", encoding="utf-8")
        result = cloudredirect._install_folder_bridge(str(folder))
        self.assertTrue(result["success"])
        self.assertTrue(bridge.is_symlink())
        backups = list(self.config.glob("tokens_folder.json.legacy-*"))
        self.assertEqual(len(backups), 1)
        self.assertEqual(backups[0].read_text(encoding="utf-8"), "legacy token")

    def test_failed_copy_does_not_replace_destination(self):
        source, destination = self.root / "source", self.root / "destination"
        self.write(source, "save.dat", b"new", age_seconds=0)
        self.write(destination, "save.dat", b"old", age_seconds=20)
        real_copy = cloudredirect.shutil.copy2

        def corrupt_copy(src, dst):
            real_copy(src, dst)
            Path(dst).write_bytes(b"corrupt")

        with mock.patch.object(cloudredirect.shutil, "copy2", side_effect=corrupt_copy):
            result = cloudredirect._sync_provider_tree(str(source), str(destination), "a", "b")
        self.assertFalse(result["success"])
        self.assertEqual((destination / "save.dat").read_bytes(), b"old")

    def test_conflict_archive_is_not_reimported(self):
        source, destination = self.root / "source", self.root / "destination"
        self.write(source, ".slsdeck-conflicts/hash/save.dat", b"archived")
        result = cloudredirect._sync_provider_tree(str(source), str(destination), "a", "b")
        self.assertTrue(result["success"])
        self.assertEqual(result["inspected"], 0)

    def test_folder_transition_merges_both_directions_before_activation(self):
        cache, folder = self.config / "storage", self.root / "provider"
        self.write(cache, "1/10/local.dat", b"local")
        self.write(folder, "1/10/remote.dat", b"remote")
        written = []
        with mock.patch.object(cloudredirect, "_running_sls_apps", return_value=[]), \
             mock.patch.object(cloudredirect, "_folder_writable", return_value=True), \
             mock.patch.object(cloudredirect, "_read_provider_config", return_value={"provider": "local"}), \
             mock.patch.object(cloudredirect, "_write_json_atomic", side_effect=lambda path, value, mode=0o600: written.append(value)), \
             mock.patch.object(cloudredirect, "_install_folder_bridge", return_value={"success": True}), \
             mock.patch.object(cloudredirect, "provider_status", return_value={"success": True}):
            result = cloudredirect._transition_provider("folder", str(folder))
        self.assertTrue(result["success"])
        self.assertEqual((cache / "1/10/remote.dat").read_bytes(), b"remote")
        self.assertEqual((folder / "1/10/local.dat").read_bytes(), b"local")
        self.assertEqual(written[-1]["provider"], "folder")

    def test_failed_folder_import_does_not_activate_provider(self):
        folder = self.root / "provider"
        folder.mkdir()
        with mock.patch.object(cloudredirect, "_running_sls_apps", return_value=[]), \
             mock.patch.object(cloudredirect, "_folder_writable", return_value=True), \
             mock.patch.object(cloudredirect, "_read_provider_config", return_value={"provider": "local"}), \
             mock.patch.object(cloudredirect, "_sync_provider_tree", return_value={"success": False, "failed": 1}), \
             mock.patch.object(cloudredirect, "_write_json_atomic") as write_config:
            result = cloudredirect._transition_provider("folder", str(folder))
        self.assertFalse(result["success"])
        write_config.assert_not_called()


if __name__ == "__main__":
    unittest.main()
