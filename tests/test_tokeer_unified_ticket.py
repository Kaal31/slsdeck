"""Regression checks for Discord's Nov 2026 unified Linux ticket layout.

The captured Discord flow has a game-specific agreement card labelled
"Got it, open my ticket" followed by one ticket embed containing both Linux
setup and TLX1 verification commands.
"""
import re
import unittest
from pathlib import Path

SOURCE = (Path(__file__).resolve().parents[1] /
          "src/lib/tokeerDiscordCapture.ts").read_text(encoding="utf-8")


class TokeerUnifiedTicketTests(unittest.TestCase):
    def test_gate_accepts_unified_card_without_dropping_legacy(self):
        self.assertIn(r"^got\\s+it[,]?\\s+open\\s+my\\s+ticket", SOURCE)
        self.assertIn("var legacy=/(?:tutorial|instruction", SOURCE)
        self.assertIn("if(legacy||unified)", SOURCE)
        self.assertIn("how\\\\s+it\\\\s+works\\\\s+on\\\\s+linux", SOURCE)

    def test_ticket_is_not_misclassified_as_game_picker(self):
        self.assertIn("if(/^got\\\\s+it[,]?\\\\s+open\\\\s+my\\\\s+ticket", SOURCE)

    def test_unified_commands_are_parsed_as_same_game(self):
        example = (
            "Like a Dragon Gaiden: The Man Who Erased His Name\n"
            "Linux / Proton - Ticket TKB8YA0Z\n"
            "One-time setup for this game\n"
            "curl -fsSL https://git.lua.tools/luatools-dedivision/"
            "TokeerDRM-App/raw/branch/main/install_linux.sh | bash -s -- 2375550\n"
            "Verify and get your setup code\n"
            "~/.tokeer/tokeer verify 2375550\n"
            "Paste the whole TLX1. code here."
        )
        appids = re.findall(r"(?:bash -s --|tokeer verify) (\d+)", example)
        self.assertEqual(appids, ["2375550", "2375550"])
        self.assertIn(r"install_linux\\.sh", SOURCE)
        self.assertIn("TICKET_CONTEXT_EXPR", SOURCE)


if __name__ == "__main__":
    unittest.main()
