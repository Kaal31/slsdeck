from pathlib import Path
import subprocess


def test_headcrab_cloud_override_is_injected_before_main():
    source = (Path(__file__).resolve().parents[1] / "py_modules/lt/slssteam.py").read_text()
    assert '"crinstall(){\\n"' in source
    assert 'script_text[:pos] + preserve + script_text[pos:]' in source


def test_shell_override_blocks_original_installer():
    result = subprocess.run(["bash", "-c", '''
crinstall(){ echo WRONG; }
crinstall(){ echo preserved; }
main(){ crinstall; }
main
'''], capture_output=True, text=True, check=True)
    assert result.stdout.strip() == "preserved"
