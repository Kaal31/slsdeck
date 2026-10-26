from pathlib import Path
import subprocess


def test_headcrab_launcher_override_preserves_file(tmp_path):
    launcher = tmp_path / "steam.sh"
    launcher.write_text("pristine")
    subprocess.run(["bash", "-c", '''
patchsteam(){ rm "$1"; }
patchsteam(){ echo 'plugin manages launcher'; }
main(){ patchsteam "$1"; }
main "$1"
''', "test", str(launcher)], check=True)
    assert launcher.read_text() == "pristine"


def test_installer_contains_required_guards():
    source = (Path(__file__).resolve().parents[1] / "py_modules/lt/slssteam.py").read_text()
    assert '"patchsteam(){\\n"' in source
    assert 'preflight.get("returncode") != 3' in source
    assert 'os.replace(tmp_launcher, launcher_before)' in source
    assert 'Steam launcher missing; injection not enabled' in source
