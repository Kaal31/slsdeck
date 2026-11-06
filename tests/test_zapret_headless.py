"""Regression tests for headless Zapret strategies without root/network access."""
import ast
import os
import re
import tempfile
import types
import unittest
from pathlib import Path
from typing import Any, Dict

SOURCE = Path(__file__).resolve().parents[1] / "py_modules/lt/zapret.py"
TREE = ast.parse(SOURCE.read_text(encoding="utf-8"))
NAMES = {"_profile", "_nft_setup", "_command", "save_user_hostlist", "set_profile"}
SELECTED = [node for node in TREE.body if isinstance(node, ast.FunctionDef) and node.name in NAMES]
PROFILES = {
    "steam-tcp": {"tcp": "80,443", "udp": "", "method": "multisplit"},
    "steam-fake": {"tcp": "80,443", "udp": "", "method": "fake"},
    "steam-quic": {"tcp": "80,443", "udp": "443", "method": "fake"},
}


def load_functions(env):
    scope = {"Dict": Dict, "Any": Any, "os": os, "re": re, "PROFILES": PROFILES,
             "NFT_TABLE": "slsdeck_zapret", "NFT_QUEUE": "220", **env}
    module = ast.Module(body=SELECTED, type_ignores=[])
    exec(compile(ast.fix_missing_locations(module), str(SOURCE), "exec"), scope)
    return scope


class HeadlessZapretTests(unittest.TestCase):
    def test_nft_only_manages_its_own_table(self):
        commands = []
        def nft(args):
            commands.append(args)
            return types.SimpleNamespace(returncode=0, stderr="")
        scope = load_functions({"_nft": nft, "_nft_clear": lambda: commands.append(["clear", "slsdeck_zapret"])})
        scope["_nft_setup"](PROFILES["steam-quic"])
        self.assertEqual(commands[0], ["clear", "slsdeck_zapret"])
        self.assertEqual(commands[1][:4], ["add", "table", "inet", "slsdeck_zapret"])
        self.assertEqual(sum("queue" in command for command in commands), 2)
        self.assertTrue(all("220" in command for command in commands if "queue" in command))
        self.assertTrue(all("zapretunix" not in command for command in commands))

    def test_nft_failure_rolls_back(self):
        commands = []
        def nft(args):
            commands.append(args)
            return types.SimpleNamespace(returncode=1, stderr="denied")
        scope = load_functions({"_nft": nft, "_nft_clear": lambda: commands.append(["clear"])})
        with self.assertRaisesRegex(RuntimeError, "denied"):
            scope["_nft_setup"](PROFILES["steam-tcp"])
        self.assertEqual(commands[-1], ["clear"])

    def test_profiles_are_bounded(self):
        state = {"profile": "steam-tcp"}
        def write(change):
            state.update(change)
        scope = load_functions({"_read_state": lambda: state, "_write_state": write,
                               "_pid": lambda: 0, "status": lambda: {"success": True},
                               "disable": lambda persist: None, "enable": lambda: {"success": True}})
        self.assertFalse(scope["set_profile"]("--bad-option")["success"])
        self.assertEqual(state["profile"], "steam-tcp")
        self.assertTrue(scope["set_profile"]("steam-quic")["success"])
        self.assertEqual(state["profile"], "steam-quic")

    def test_hostlist_validates_and_deduplicates(self):
        with tempfile.TemporaryDirectory() as tmp:
            hostlist = Path(tmp) / "custom.txt"
            scope = load_functions({"_user_hostlist": lambda: str(hostlist),
                                    "_overlay": lambda: tmp,
                                    "_pid": lambda: 0, "disable": lambda persist: None,
                                    "enable": lambda: {"success": True},
                                    "get_user_hostlist": lambda: {"content": hostlist.read_text() if hostlist.exists() else ""}})
            self.assertFalse(scope["save_user_hostlist"]("--dpi-desync=fake")["success"])
            self.assertTrue(scope["save_user_hostlist"]("steamcommunity.com\nsteamcommunity.com")["success"])
            self.assertEqual(hostlist.read_text(), "steamcommunity.com\n")


if __name__ == "__main__":
    unittest.main()
