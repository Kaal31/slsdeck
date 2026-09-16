"""The browser callback must run in Decky's frozen Python without http.server."""

import builtins
import socket
import sys
import time
import types
import unittest
from pathlib import Path
from unittest import mock


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "py_modules"))
try:
    import httpx  # noqa: F401
except ImportError:
    httpx_stub = types.ModuleType("httpx")
    httpx_stub.Client = type("Client", (), {})
    httpx_stub.Timeout = lambda *args, **kwargs: None
    httpx_stub.Limits = lambda *args, **kwargs: None
    httpx_stub.USE_CLIENT_DEFAULT = object()
    sys.modules["httpx"] = httpx_stub

from lt import luatools  # noqa: E402


class LuaToolsOAuthListenerTests(unittest.TestCase):
    def setUp(self):
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            self.port = sock.getsockname()[1]
        self.port_patch = mock.patch.object(luatools, "OAUTH_PORT", self.port)
        self.port_patch.start()
        self.redirect_patch = mock.patch.object(
            luatools, "OAUTH_REDIRECT", f"http://127.0.0.1:{self.port}/")
        self.redirect_patch.start()
        self.exchange_patch = mock.patch.object(
            luatools, "_exchange_pkce", side_effect=lambda code: code == "good-code")
        self.exchange_patch.start()
        self.auth_patch = mock.patch.object(luatools, "is_authed", return_value=False)
        self.auth_patch.start()

    def tearDown(self):
        luatools.oauth_cancel()
        self.auth_patch.stop()
        self.exchange_patch.stop()
        self.redirect_patch.stop()
        self.port_patch.stop()

    def request(self, path):
        with socket.create_connection(("127.0.0.1", self.port), timeout=2) as sock:
            sock.sendall(f"GET {path} HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n".encode())
            response = bytearray()
            while block := sock.recv(8192):
                response.extend(block)
            return bytes(response)

    def wait_for_result(self):
        deadline = time.monotonic() + 2
        while not luatools._oauth_result["done"] and time.monotonic() < deadline:
            time.sleep(0.01)
        self.assertTrue(luatools._oauth_result["done"])
        return luatools._oauth_result

    def test_success_error_and_restart_without_http_server(self):
        real_import = builtins.__import__

        def without_http_server(name, *args, **kwargs):
            if name == "http.server":
                raise ModuleNotFoundError("No module named 'http.server'")
            return real_import(name, *args, **kwargs)

        with mock.patch("builtins.__import__", side_effect=without_http_server):
            started = luatools.oauth_start()
            self.assertTrue(started["success"], started)
            self.assertIn("code_challenge=", started["url"])
            self.assertIn(b"200 OK", self.request("/?code=good-code"))
            self.assertTrue(self.wait_for_result()["success"])

            started = luatools.oauth_start()
            self.assertTrue(started["success"], started)
            self.assertIn(b"200 OK", self.request("/?error=access_denied"))
            self.assertEqual(self.wait_for_result()["error"], "access_denied")

    def test_bad_path_does_not_complete_sign_in(self):
        self.assertTrue(luatools.oauth_start()["success"])
        self.assertIn(b"400 Bad Request", self.request("/unrelated"))
        self.assertFalse(luatools._oauth_result["done"])
        self.assertIn(b"200 OK", self.request("/?code=good-code"))
        self.assertTrue(self.wait_for_result()["success"])

    def test_cancel_releases_callback_port(self):
        self.assertTrue(luatools.oauth_start()["success"])
        luatools.oauth_cancel()
        self.assertEqual(luatools._oauth_result["error"], "cancelled")
        self.assertTrue(luatools.oauth_start()["success"])


if __name__ == "__main__":
    unittest.main()
