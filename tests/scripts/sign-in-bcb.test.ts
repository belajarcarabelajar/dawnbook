import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { generateSitePages } from "../../scripts/builder/template-engine";

const ROOT = join(import.meta.dir, "../..");
const SCRATCH = join(homedir(), ".cache/tmp/dawnbook-scratch/sign-in-test");
// Same-origin start endpoint; it forwards to the store, so the page itself
// never links off-site.
const SSO_BASE = "/api/auth/bcb/start?next=";
const ORIGIN = "https://dawnbook.belajarcarabelajar.com";

let outDir = "";
let html = "";
// The sign-in script, loaded from /hub-scripts/ (strict script-src, no inline scripts).
let js = "";

beforeAll(async () => {
  mkdirSync(SCRATCH, { recursive: true });
  outDir = mkdtempSync(join(SCRATCH, "run-"));
  await generateSitePages(ROOT, outDir, [], {});
  html = readFileSync(join(outDir, "sign-in.html"), "utf8");
  js = readFileSync(join(outDir, "hub-scripts/sign-in.js"), "utf8");
});

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

// Pulls the helper out of the emitted page so the test runs the exact code a
// browser would run, not a copy of it.
function emittedHrefHelper(page: string): (redirectUrl: string, origin: string) => string {
  const start = page.indexOf("function bcbSignInHref(");
  expect(start).toBeGreaterThan(-1);
  let depth = 0;
  let end = -1;
  for (let i = page.indexOf("{", start); i < page.length; i++) {
    if (page[i] === "{") depth++;
    if (page[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  expect(end).toBeGreaterThan(start);
  return new Function(`${page.slice(start, end)}; return bcbSignInHref;`)();
}

describe("sign-in page: belajarcarabelajar.com account button", () => {
  test("renders the button below the Google button with a static fallback href", () => {
    const google = html.indexOf('id="google-signin-btn"');
    const bcb = html.indexOf('id="bcb-signin-btn"');
    expect(google).toBeGreaterThan(-1);
    expect(bcb).toBeGreaterThan(google);
    expect(html).toContain(`id="bcb-signin-btn" href="${SSO_BASE}%2F"`);
    expect(html).toContain('data-i18n="signin.bcb.cta"');
    expect(html).toContain('data-i18n="signin.bcb.hint"');
  });

  test("carries the Indonesian and English labels and helper line", () => {
    expect(html).toContain('<script src="/hub-scripts/sign-in.js"></script>');
    expect(js).toContain("Masuk lewat akun belajarcarabelajar.com");
    expect(html).toContain("Sign in with your belajarcarabelajar.com account");
    expect(js).toContain("Pakai ini kalau email pembelianmu bukan akun Google.");
    expect(html).toContain("Use this if your purchase email is not a Google account.");
  });

  test("the page links only to the same-origin start endpoint, never to the store directly", () => {
    expect(html).not.toContain("masuk-dawnbook");
    expect(js).not.toContain("masuk-dawnbook");
    const hrefs = [...html.matchAll(/id="bcb-signin-btn" href="([^"]*)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(["/api/auth/bcb/start?next=%2F"]);
  });

  test("the page computes the href from redirect_url through the helper", () => {
    expect(js).toContain("bcbSignInHref(redirectUrl, window.location.origin)");
  });

  test("the helper keeps a same-origin path and search", () => {
    const href = emittedHrefHelper(js);
    expect(href("/books/x/content/01.html?a=1", ORIGIN)).toBe(
      SSO_BASE + encodeURIComponent("/books/x/content/01.html?a=1"),
    );
    expect(href(`${ORIGIN}/books/y/?q=2#frag`, ORIGIN)).toBe(
      SSO_BASE + encodeURIComponent("/books/y/?q=2"),
    );
  });

  test("the helper falls back to / for anything that is not a same-origin path", () => {
    const href = emittedHrefHelper(js);
    for (const bad of [
      "https://evil.example/steal",
      "//evil.example/steal",
      "/\\evil.example/steal",
      "javascript:alert(1)",
      `${ORIGIN}//evil.example/x`,
    ]) {
      expect(href(bad, ORIGIN)).toBe(`${SSO_BASE}%2F`);
    }
  });
});

describe("sign-in page: SSO error messages", () => {
  const cases: Array<[string, string, string]> = [
    [
      "sso_invalid",
      "The sign-in link expired or is invalid. Please try again.",
      "Tautan masuk sudah kedaluwarsa atau tidak sah. Coba lagi.",
    ],
    [
      "sso_unavailable",
      "Signing in with belajarcarabelajar.com is unavailable right now. Please try again later.",
      "Masuk lewat belajarcarabelajar.com sedang tidak tersedia. Coba lagi nanti.",
    ],
    [
      "account_conflict",
      "This email is already linked to another Google account. Sign in with that Google account.",
      "Email ini sudah terhubung ke akun Google lain. Masuk dengan akun Google tersebut.",
    ],
  ];

  for (const [code, en, id] of cases) {
    test(`${code} has an English message in the error map and an Indonesian catalog entry`, () => {
      expect(js).toContain(`${code}: '${en}'`);
      expect(js).toContain(`'signin.error.${code}': '${id}'`);
    });
  }
});
