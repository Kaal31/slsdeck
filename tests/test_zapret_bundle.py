import hashlib
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HOSTLIST = ROOT / "assets" / "zapret" / "list-general.txt"


class ZapretBundleTests(unittest.TestCase):
    def test_steamidra_general_list_is_exact(self):
        data = HOSTLIST.read_bytes()
        self.assertEqual(
            hashlib.sha256(data).hexdigest(),
            "d203c6ee9e392dac967de97da49abae5aff55dc489bd7241ac93cc238bd9ebe7",
        )
        entries = HOSTLIST.read_text(encoding="utf-8").splitlines()
        self.assertEqual(len(entries), 67)
        self.assertEqual(len(entries), len(set(entries)))
        self.assertIn("hubcapmanifest.com", entries)
        self.assertIn("api.steampowered.com", entries)


if __name__ == "__main__":
    unittest.main()
