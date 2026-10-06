from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_python_runtime_dependencies_are_declared():
    requirements = (ROOT / "requirements.txt").read_text(encoding="utf-8")
    assert "httpx==" in requirements
    assert "py7zr==" in requirements


def test_custom_cloud_folder_uses_decky_folder_picker():
    source = (ROOT / "src/sections/CloudRedirect.tsx").read_text(encoding="utf-8")
    assert "FileSelectionType.FOLDER" in source
    assert "Browse folders" in source
