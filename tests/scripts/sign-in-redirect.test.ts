import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { generateSitePages } from "../../scripts/builder/template-engine";

const ROOT = join(import.meta.dir, "../..");
const SCRATCH = join(homedir(), ".cache/tmp/dawnbook-scratch/sign-in-redirect-test");
const ORIGIN = "https://dawnbook.belajarcarabelajar.com";
const PAGES = ["sign-in.html", "sign-up.html"] as const;

let outDir = "";
const pages: Record<string, string> = {};

beforeAll(async () => {
  mkdirSync(SCRATCH, { recursive: true });
  outDir = mkdtempSync(join(SCRATCH, "run-"));
  await generateSitePages(ROOT, outDir, [], {});
  for (const name of PAGES) pages[name] = readFileSync(join(outDir, name), "utf8");
});

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

function authScript(page: string): string {
  for (const m of page.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    if (m[1].includes("function safeNext(")) return m[1];
  }
  throw new Error("sign-in script with safeNext not found");
}

// Pulls the helper out of the emitted page so the test runs the code a browser
// would run, not a copy of it.
function emittedSafeNext(page: string): (redirectUrl: string, origin: string) => string {
  const start = page.indexOf("function safeNext(");
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
  return new Function(`${page.slice(start, end)}; return safeNext;`)();
}

type FakeElement = {
  attrs: Record<string, string>;
  listeners: Record<string, Array<(e: unknown) => void>>;
  style: Record<string, string>;
  href: string;
  textContent: string;
  addEventListener(type: string, fn: (e: unknown) => void): void;
  setAttribute(name: string, value: string): void;
};

function fakeDocument(page: string) {
  const elements: FakeElement[] = [];
  for (const m of page.matchAll(/<([a-zA-Z][\w-]*)((?:\s+[^\s=>]+(?:="[^"]*")?)*)\s*\/?>/g)) {
    const attrs: Record<string, string> = {};
    for (const a of m[2].matchAll(/([^\s=>]+)(?:="([^"]*)")?/g)) attrs[a[1]] = a[2] ?? "";
    elements.push({
      attrs,
      listeners: {},
      style: {},
      href: attrs.href ?? "",
      textContent: "",
      addEventListener(type, fn) {
        (this.listeners[type] ??= []).push(fn);
      },
      setAttribute(name, value) {
        this.attrs[name] = value;
      },
    });
  }
  return {
    elements,
    document: {
      getElementById: (id: string) => elements.find((el) => el.attrs.id === id) ?? null,
      querySelector: (sel: string) => {
        const attr = /^\[([\w-]+)\]$/.exec(sel);
        if (attr) return elements.find((el) => attr[1] in el.attrs) ?? null;
        throw new Error(`fake document does not support selector ${sel}`);
      },
    },
  };
}

// Runs the page script with redirect_url set and /api/auth/me answering as a
// signed-in user, then returns where the page navigated.
async function signedInTarget(page: string, redirectUrl: string): Promise<string> {
  const { document } = fakeDocument(page);
  const start = `${ORIGIN}/sign-in`;
  const window = {
    location: {
      search: `?redirect_url=${encodeURIComponent(redirectUrl)}`,
      origin: ORIGIN,
      href: start,
    },
    I18N_CATALOGS: { en: {}, id: {} },
  };
  const fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ id: "u1" }) });
  new Function("window", "document", "fetch", authScript(page))(window, document, fetch);
  for (let i = 0; i < 5; i++) await Promise.resolve();
  expect(window.location.href).not.toBe(start);
  return window.location.href;
}

function googleTarget(page: string, redirectUrl: string): string {
  const { document, elements } = fakeDocument(page);
  const window = {
    location: {
      search: `?redirect_url=${encodeURIComponent(redirectUrl)}`,
      origin: ORIGIN,
      href: `${ORIGIN}/sign-in`,
    },
    I18N_CATALOGS: { en: {}, id: {} },
  };
  const fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve(null) });
  new Function("window", "document", "fetch", authScript(page))(window, document, fetch);
  const google = elements.find((el) => "data-google-auth" in el.attrs);
  google!.listeners.click[0]({ preventDefault: () => {} });
  return window.location.href;
}

const REJECTED = [
  "javascript:alert(1)",
  "JaVaScRiPt:alert(1)",
  " javascript:alert(1)",
  "data:text/html,x",
  "https://evil.example/x",
  "//evil.example/x",
  "/\\evil.example/x",
  "https:evil.example",
];
const KEPT: Array<[string, string]> = [
  [`${ORIGIN}/books/a/02_x.html?q=1#h`, "/books/a/02_x.html?q=1#h"],
  ["/books/a/", "/books/a/"],
];

for (const name of PAGES) {
  describe(`${name}: redirect_url is reduced to a same-origin path`, () => {
    test("safeNext returns / for every value that is not a same-origin path", () => {
      const safeNext = emittedSafeNext(pages[name]);
      for (const bad of REJECTED) expect([bad, safeNext(bad, ORIGIN)]).toEqual([bad, "/"]);
    });

    test("safeNext keeps path, search and hash of a same-origin value", () => {
      const safeNext = emittedSafeNext(pages[name]);
      for (const [input, want] of KEPT) expect(safeNext(input, ORIGIN)).toBe(want);
    });

    test("redirect_url passes through safeNext before any use", () => {
      expect(pages[name]).toContain(
        "var redirectUrl = safeNext(params.get('redirect_url') || '/', window.location.origin);",
      );
      expect(pages[name]).not.toContain("var redirectUrl = params.get('redirect_url')");
    });

    test("a signed-in visitor with a hostile redirect_url is sent to /", async () => {
      for (const bad of REJECTED) expect([bad, await signedInTarget(pages[name], bad)]).toEqual([bad, "/"]);
    });

    test("a signed-in visitor with a same-origin redirect_url keeps its path", async () => {
      for (const [input, want] of KEPT) expect(await signedInTarget(pages[name], input)).toBe(want);
    });

    test("the Google button passes only the safe path to the login endpoint", () => {
      expect(googleTarget(pages[name], "javascript:alert(1)")).toBe("/api/auth/login?redirect_url=%2F");
      expect(googleTarget(pages[name], `${ORIGIN}/books/a/02_x.html?q=1#h`)).toBe(
        `/api/auth/login?redirect_url=${encodeURIComponent("/books/a/02_x.html?q=1#h")}`,
      );
    });
  });
}

describe("sign-in page: email_unverified message", () => {
  test("has an English message in the error map and an Indonesian catalog entry", () => {
    const html = pages["sign-in.html"];
    expect(html).toContain(
      "email_unverified: 'Your Google email address is not verified. Verify it with Google, or sign in with your belajarcarabelajar.com account.'",
    );
    expect(html).toContain(
      "'signin.error.email_unverified': 'Email Google kamu belum terverifikasi. Verifikasi dulu di Google, atau masuk lewat akun belajarcarabelajar.com.'",
    );
  });
});
