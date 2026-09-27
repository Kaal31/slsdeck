import sys
import types
import unittest
from pathlib import Path
from unittest import mock


class _TransportError(Exception):
    pass


class _Response:
    def __init__(self, status_code=200, content_type="application/json"):
        self.status_code = status_code
        self.headers = {"content-type": content_type}


class _Client:
    responses = []
    calls = []

    def __init__(self, *args, **kwargs):
        pass

    def request(self, method, url, **kwargs):
        self.__class__.calls.append((method, str(url), kwargs))
        result = self.__class__.responses.pop(0)
        if isinstance(result, Exception):
            raise result
        return result

    def get(self, url, **kwargs):
        return self.request("GET", url, **kwargs)


fake_httpx = types.ModuleType("httpx")
fake_httpx.Client = _Client
fake_httpx.TransportError = _TransportError
fake_httpx.ConnectError = _TransportError
fake_httpx.USE_CLIENT_DEFAULT = object()
fake_httpx.Timeout = lambda *args, **kwargs: object()
fake_httpx.Limits = lambda *args, **kwargs: object()
sys.modules["httpx"] = fake_httpx
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "py_modules"))

from lt import httpc  # noqa: E402


class HubcapBypassTests(unittest.TestCase):
    def setUp(self):
        _Client.responses = []
        _Client.calls = []

    def test_non_hubcap_transport_error_is_not_intercepted(self):
        _Client.responses = [_TransportError("offline")]
        with self.assertRaises(_TransportError):
            httpc._SLSDeckClient().get("https://example.com/file")

    def test_hubcap_transport_error_retries_doh_ip_with_sni_and_auth(self):
        _Client.responses = [_TransportError("dns blocked"), _Response()]
        with mock.patch.object(httpc._SLSDeckClient, "_resolve_hubcap_doh",
                               return_value=["203.0.113.10"]), \
             mock.patch.object(httpc._SLSDeckClient, "_local_tor_proxy", return_value=""):
            result = httpc._SLSDeckClient().get(
                "https://hubcapmanifest.com/api/v1/manifest/10?api_key=secret"
            )

        self.assertEqual(result.status_code, 200)
        self.assertEqual(len(_Client.calls), 2)
        _, retry_url, kwargs = _Client.calls[1]
        self.assertEqual(retry_url, "https://203.0.113.10/api/v1/manifest/10")
        self.assertEqual(kwargs["headers"]["Host"], "hubcapmanifest.com")
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer secret")
        self.assertEqual(kwargs["extensions"]["sni_hostname"], b"hubcapmanifest.com")

    def test_html_block_page_uses_fallback(self):
        _Client.responses = [_Response(content_type="text/html"), _Response()]
        with mock.patch.object(httpc._SLSDeckClient, "_resolve_hubcap_doh",
                               return_value=["203.0.113.11"]), \
             mock.patch.object(httpc._SLSDeckClient, "_local_tor_proxy", return_value=""):
            result = httpc._SLSDeckClient().get("https://hubcapmanifest.com/api/v1/health")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(len(_Client.calls), 2)


if __name__ == "__main__":
    unittest.main()
