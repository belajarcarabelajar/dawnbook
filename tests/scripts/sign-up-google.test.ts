import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { generateSitePages } from "../../scripts/builder/template-engine";

const ROOT = join(import.meta.dir, "../..");
const SCRATCH = join(homedir(), ".cache/tmp/dawnbook-scratch/sign-up-test");
const ORIGIN = "https://dawnbook.belajarcarabelajar.com";

let outDir = "";
const pages: Record<string, string> = {};

beforeAll(async () => {
  mkdirSync(SCRATCH, { recursive: true });
  outDir = mkdtempSync(join(SCRATCH, "run-"));
  await generateSitePages(ROOT, outDir, [], {});
  for (const name of ["sign-in.html", "sign-up.html"]) {
    pages[name] = readFileSync(join(outDir, name), "utf8");
  }
});

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

type FakeElement = {
  tag: string;
  attrs: Record<string, string>;
  listeners: Record<string, Array<(e: unknown) => void>>;
  style: Record<string, string>;
  href: string;
  textContent: string;
  addEventListener(type: string, fn: (e: unknown) => void): void;
  setAttribute(name: string, value: string): void;
};

// Builds one fake element per opening tag of the page, enough for the sign-in
// script to look up its elements the way a browser would.
function fakeDocument(page: string) {
  const elements: FakeElement[] = [];
  for (const m of page.matchAll(/<([a-zA-Z][\w-]*)((?:\s+[^\s=>]+(?:="[^"]*")?)*)\s*\/?>/g)) {
    const attrs: Record<string, string> = {};
    for (const a of m[2].matchAll(/([^\s=>]+)(?:="([^"]*)")?/g)) attrs[a[1]] = a[2] ?? "";
    const el: FakeElement = {
      tag: m[1].toLowerCase(),
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
    };
    elements.push(el);
  }
  const document = {
    getElementById: (id: string) => elements.find((el) => el.attrs.id === id) ?? null,
    querySelector: (sel: string) => {
      const attr = /^\[([\w-]+)\]$/.exec(sel);
      if (attr) return elements.find((el) => attr[1] in el.attrs) ?? null;
      const id = /^#([\w-]+)$/.exec(sel);
      if (id) return elements.find((el) => el.attrs.id === id[1]) ?? null;
      throw new Error(`fake document does not support selector ${sel}`);
    },
  };
  return { document, elements };
}

function signInScript(page: string): string {
  for (const m of page.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    if (m[1].includes("function bcbSignInHref(")) return m[1];
  }
  throw new Error("sign-in script not found");
}

function runPage(page: string) {
  const { document, elements } = fakeDocument(page);
  const window = {
    location: { search: "?redirect_url=%2Fbooks%2Fx%2F", origin: ORIGIN, href: `${ORIGIN}/sign-in` },
    I18N_CATALOGS: { en: {}, id: {} },
  };
  const fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve(null) });
  new Function("window", "document", "fetch", signInScript(page))(window, document, fetch);
  return { elements, window };
}

describe("Google button wiring on the generated auth pages", () => {
  for (const [name, id] of [
    ["sign-in.html", "google-signin-btn"],
    ["sign-up.html", "google-signup-btn"],
  ] as const) {
    test(`${name}: the script runs without throwing and the Google button starts Google sign-in`, () => {
      let run: ReturnType<typeof runPage> | undefined;
      expect(() => {
        run = runPage(pages[name]);
      }).not.toThrow();
      const google = run!.elements.find((el) => el.attrs.id === id);
      expect(google).toBeDefined();
      expect(google!.listeners.click?.length).toBe(1);

      let prevented = false;
      google!.listeners.click[0]({ preventDefault: () => (prevented = true) });
      expect(prevented).toBe(true);
      expect(run!.window.location.href).toBe("/api/auth/login?redirect_url=%2Fbooks%2Fx%2F");
    });
  }
});
