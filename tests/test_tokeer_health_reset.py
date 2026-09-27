"""A removed game loses its activation record; an unplugged drive does not."""

import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "py_modules"))
with mock.patch.dict(sys.modules, {"lt.tokeer": mock.MagicMock()}):
    from lt import settings, tokeer_health  # noqa: E402


class TokeerResetTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.library = Path(self.temp.name) / "external"
        self.record = {"activationLibraryPath": str(self.library), "appliedAt": 123}

    def test_unplugged_library_keeps_activation(self):
        with mock.patch.object(tokeer_health, "_installation", return_value={}):
            self.assertEqual(tokeer_health.reset_reason(42, self.record), "")

    def test_uninstalled_game_clears_activation(self):
        (self.library / "steamapps").mkdir(parents=True)
        with mock.patch.object(tokeer_health, "_installation", return_value={}):
            self.assertEqual(tokeer_health.reset_reason(42, self.record), "game uninstalled")

    def test_zero_build_resets_but_other_build_change_remains_warning(self):
        with mock.patch.object(tokeer_health, "_installation", return_value={"libraryPath": str(self.library)}):
            with mock.patch.object(tokeer_health.steam, "get_installed_buildid", return_value="0"):
                self.assertEqual(tokeer_health.reset_reason(42, self.record), "installed build reset to 0")
            with mock.patch.object(tokeer_health.steam, "get_installed_buildid", return_value="456"):
                self.assertEqual(tokeer_health.reset_reason(42, self.record), "")

    def test_clear_does_not_remove_new_activation(self):
        with mock.patch.dict(settings._CACHE, {"tokeerAppliedGames": {"42": {"appliedAt": 456}}}, clear=True), \
             mock.patch.object(settings, "_load_locked"), mock.patch.object(settings, "_persist_locked"):
            self.assertFalse(settings.clear_tokeer_applied_game(42, 123))
            self.assertEqual(settings._CACHE["tokeerAppliedGames"]["42"]["appliedAt"], 456)
            self.assertTrue(settings.clear_tokeer_applied_game(42, 456))
            self.assertNotIn("42", settings._CACHE["tokeerAppliedGames"])


if __name__ == "__main__":
    unittest.main()
