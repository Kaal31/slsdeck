import subprocess
import sys
from pathlib import Path


def test_private_parser_ignores_preloaded_incomplete_html():
    root = Path(__file__).resolve().parents[1]
    subprocess.run([sys.executable, "-S", "-c", '''
import sys, types
sys.path.insert(0, 'py_modules')
html = types.ModuleType('html')
html.__path__ = []
sys.modules['html'] = html
from lt.luatools_collections import parse_collections_html
assert parse_collections_html('<a href="/c/test-one">Test &amp; One</a>')[0]['name'] == 'Test & One'
assert sys.modules['html'] is html
'''], cwd=root, check=True)
