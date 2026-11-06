import contextlib
import io
import os
import sys
import tempfile
import unittest

here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(here)), "scripts"))

import gsc_seo_insights as script  # noqa: E402
from gsc_fake_http import (  # noqa: E402
    FORBIDDEN, OAUTH_ENV, SECRET_MARKER, TOKEN_INVALID_GRANT, TOKEN_OK, TOKEN_URL, FakeUrlopen,
)

ANALYTICS = "https://www.googleapis.com/webmasters/v3/sites/"
NO_SA = "/nonexistent/service-account.json"


class SeoInsightsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.report = os.path.join(self.tmp.name, "report.md")

    def tearDown(self):
        self.tmp.cleanup()

    def run_main(self, env, urlopen):
        out = io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
            code = script.main(env=env, urlopen=urlopen, sa_path=NO_SA, report_path=self.report)
        return code, out.getvalue()

    def test_prefers_tulis_refresh_token(self):
        fake = FakeUrlopen({TOKEN_URL: TOKEN_OK, ANALYTICS: (200, {"rows": []})})
        code, _ = self.run_main(dict(OAUTH_ENV), fake)
        self.assertEqual(code, 0)
        self.assertEqual(fake.refresh_tokens_sent(), ["tulis-refresh-SHOULD-NOT-LEAK"])
        self.assertTrue(os.path.exists(self.report))

    def test_falls_back_to_legacy_refresh_token(self):
        env = dict(OAUTH_ENV)
        del env["GSC_OAUTH_REFRESH_TOKEN_TULIS"]
        fake = FakeUrlopen({TOKEN_URL: TOKEN_OK, ANALYTICS: (200, {"rows": []})})
        self.run_main(env, fake)
        self.assertEqual(fake.refresh_tokens_sent(), ["dead-refresh-SHOULD-NOT-LEAK"])

    def test_analytics_403_exits_non_zero_without_report(self):
        fake = FakeUrlopen({TOKEN_URL: TOKEN_OK, ANALYTICS: FORBIDDEN})
        code, out = self.run_main(dict(OAUTH_ENV), fake)
        self.assertNotEqual(code, 0)
        self.assertIn("403", out)
        self.assertNotIn(SECRET_MARKER, out)
        self.assertFalse(os.path.exists(self.report))

    def test_invalid_grant_exits_non_zero_naming_variable(self):
        fake = FakeUrlopen({TOKEN_URL: TOKEN_INVALID_GRANT})
        code, out = self.run_main(dict(OAUTH_ENV), fake)
        self.assertNotEqual(code, 0)
        self.assertIn("GSC_OAUTH_REFRESH_TOKEN_TULIS", out)
        self.assertNotIn(SECRET_MARKER, out)

    def test_no_credentials_exits_non_zero(self):
        code, out = self.run_main({}, FakeUrlopen({}))
        self.assertNotEqual(code, 0)
        self.assertIn("GSC_OAUTH_REFRESH_TOKEN_TULIS", out)


if __name__ == "__main__":
    unittest.main()
