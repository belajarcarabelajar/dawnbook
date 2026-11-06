"""Fake urlopen for the GSC script tests: no request leaves the process."""
import io
import json
import urllib.error
import urllib.parse

TOKEN_URL = "https://oauth2.googleapis.com/token"

OAUTH_ENV = {
    "GSC_OAUTH_CLIENT_ID": "client-id-abc",
    "GSC_OAUTH_CLIENT_SECRET": "client-secret-SHOULD-NOT-LEAK",
    "GSC_OAUTH_REFRESH_TOKEN_TULIS": "tulis-refresh-SHOULD-NOT-LEAK",
    "GSC_OAUTH_REFRESH_TOKEN": "dead-refresh-SHOULD-NOT-LEAK",
}

SECRET_MARKER = "SHOULD-NOT-LEAK"


class FakeResponse:
    def __init__(self, status, body):
        self.status = status
        self._body = body

    def read(self):
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class FakeUrlopen:
    """routes maps a URL prefix to (status, json_body). Status >= 400 raises HTTPError like urllib."""

    def __init__(self, routes):
        self.routes = routes
        self.calls = []

    def __call__(self, req, timeout=None):
        url = req.full_url
        data = req.data.decode("utf-8") if req.data else ""
        self.calls.append({"url": url, "method": req.get_method(), "data": data})
        for prefix, (status, body) in self.routes.items():
            if url.startswith(prefix):
                raw = json.dumps(body).encode("utf-8") if body is not None else b""
                if status >= 400:
                    raise urllib.error.HTTPError(url, status, "error", {}, io.BytesIO(raw))
                return FakeResponse(status, raw)
        raise AssertionError(f"unexpected URL {url}")

    def refresh_tokens_sent(self):
        return [
            urllib.parse.parse_qs(c["data"]).get("refresh_token", [None])[0]
            for c in self.calls
            if c["url"] == TOKEN_URL
        ]


TOKEN_OK = (200, {"access_token": "access-SHOULD-NOT-LEAK", "expires_in": 3599})
TOKEN_INVALID_GRANT = (400, {"error": "invalid_grant", "error_description": "Bad Request"})
FORBIDDEN = (403, {"error": {"code": 403, "message": "User does not have sufficient permission", "status": "PERMISSION_DENIED"}})
