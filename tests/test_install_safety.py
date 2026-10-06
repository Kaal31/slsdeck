import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from py_modules.lt import install_safety


class InstallSafetyTests(unittest.TestCase):
    def test_manifest_lists_privileged_components(self):
        value = install_safety.manifest()
        ids = {item["id"] for item in value["dependencies"]}
        self.assertTrue({"slssteam", "client-fix", "zapret", "hypervisor"} <= ids)
        self.assertIn("pacman", value["never"])

    def test_receipts_are_append_only(self):
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "receipts.jsonl"
            with patch.object(install_safety, "_receipt_path", return_value=str(target)):
                self.assertTrue(install_safety.record("zapret", "install", {"success": True, "version": "1"})["success"])
                self.assertTrue(install_safety.record("zapret", "disable", {"success": True})["success"])
                lines = target.read_text(encoding="utf-8").splitlines()
                self.assertEqual(len(lines), 2)
                self.assertEqual(json.loads(lines[0])["action"], "install")
                self.assertEqual(install_safety.receipts()["receipts"][0]["action"], "disable")


if __name__ == "__main__":
    unittest.main()
