import contextlib
import io
import os
import sys
import unittest

here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(here)), "scripts"))

import gsc_trigger_reindex as script  # noqa: E402
from gsc_fake_http import (  # noqa: E402
    FORBIDDEN, OAUTH_ENV, SECRET_MARKER, TOKEN_INVALID_GRANT, TOKEN_OK, TOKEN_URL, FakeUrlopen,
)

SITEMAPS = "https://www.googleapis.com/webmasters/v3/sites/"
NO_SA = "/nonexistent/service-account.json"


def run_main(env, urlopen):
    out = io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
        code = script.main(env=env, urlopen=urlopen, sa_path=NO_SA)
    return code, out.getvalue()


class TriggerReindexTest(unittest.TestCase):
    def test_prefers_tulis_refresh_token(self):
        fake = FakeUrlopen({TOKEN_URL: TOKEN_OK, SITEMAPS: (204, None)})
        code, _ = run_main(dict(OAUTH_ENV), fake)
        self.assertEqual(code, 0)
        self.assertEqual(fake.refresh_tokens_sent(), ["tulis-refresh-SHOULD-NOT-LEAK"])
        put = [c for c in fake.calls if c["method"] == "PUT"]
        self.assertEqual(len(put), 1)

    def test_falls_back_to_legacy_refresh_token(self):
        env = dict(OAUTH_ENV)
        del env["GSC_OAUTH_REFRESH_TOKEN_TULIS"]
        fake = FakeUrlopen({TOKEN_URL: TOKEN_OK, SITEMAPS: (204, None)})
        run_main(env, fake)
        self.assertEqual(fake.refresh_tokens_sent(), ["dead-refresh-SHOULD-NOT-LEAK"])

    def test_sitemap_403_exits_non_zero_without_leaking(self):
        fake = FakeUrlopen({TOKEN_URL: TOKEN_OK, SITEMAPS: FORBIDDEN})
        code, out = run_main(dict(OAUTH_ENV), fake)
        self.assertNotEqual(code, 0)
        self.assertIn("403", out)
        self.assertNotIn(SECRET_MARKER, out)

    def test_invalid_grant_exits_non_zero_naming_variable(self):
        fake = FakeUrlopen({TOKEN_URL: TOKEN_INVALID_GRANT})
        code, out = run_main(dict(OAUTH_ENV), fake)
        self.assertNotEqual(code, 0)
        self.assertIn("GSC_OAUTH_REFRESH_TOKEN_TULIS", out)
        self.assertIn("invalid_grant", out)
        self.assertNotIn(SECRET_MARKER, out)

    def test_no_credentials_exits_non_zero(self):
        code, out = run_main({}, FakeUrlopen({}))
        self.assertNotEqual(code, 0)
        self.assertIn("GSC_OAUTH_REFRESH_TOKEN_TULIS", out)


if __name__ == "__main__":
    unittest.main()
