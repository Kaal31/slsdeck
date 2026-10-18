from pathlib import Path

from py_modules.lt import settings, updates


ROOT = Path(__file__).resolve().parents[1]


def test_engine_update_compares_branch_commit(monkeypatch):
    monkeypatch.setattr(settings, "get_dep_version", lambda name: "git:old")
    monkeypatch.setattr(
        updates.ghrel,
        "latest_commit",
        lambda repo, ref="HEAD", force=False: {"success": True, "sha": "new"},
    )
    entry = next(item for item in updates._OPTIONAL if item["dep_key"] == "engine")
    status = updates._entry_status(entry)
    assert status["current"] == "git:old"
    assert status["latest"] == "git:new"
    assert status["updateAvailable"] is True


def test_release_workflow_bundles_moon_and_python_requirements():
    workflow = (ROOT / ".github/workflows/release-decky-update.yml").read_text(encoding="utf-8")
    assert "repository: swwayps/slsteam-moon" in workflow
    assert "ref: slsteam-moon" in workflow
    assert "slsteam-moon-head.zip" in workflow
    assert "requirements.txt py_modules" in workflow
    assert "Validate release archive" in workflow
