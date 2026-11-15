import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { generateSitePages } from "../../scripts/builder/template-engine";
import * as securityHeaders from "../../functions/lib/security-headers";

const ROOT = join(import.meta.dir, "../..");
const SCRATCH = join(homedir(), ".cache/tmp/dawnbook-scratch/hub-inline-scripts-test");

// The policy every page carried before hub pages lost their inline scripts;
// book pages (mdBook output) keep it unchanged.
const BOOK_POLICY = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.googletagmanager.com https://challenges.cloudflare.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://challenges.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com https://accounts.google.com https://*.googleusercontent.com https://analytics.google.com https://www.google.com https://cloudflareinsights.com; frame-src 'self' https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.youtube.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
const STRICT_SCRIPT_SRC =
  "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.googletagmanager.com https://challenges.cloudflare.com https://static.cloudflareinsights.com";

const BOOKS = [
  {
    slug: "test-book",
    title: "Test Book",
    author: "Tester",
    chapterCount: 1,
    emoji: "x",
    chapters: ["/books/test-book/ch1.html"],
    mtimeMs: 0,
    formattedDate: "1 Jan 2026",
  },
];

let outDir = "";
const pages: Record<string, string> = {};

beforeAll(async () => {
  mkdirSync(SCRATCH, { recursive: true });
  outDir = mkdtempSync(join(SCRATCH, "run-"));
  // Both env values set, so the GA bootstrap and the Turnstile widget are rendered too.
  await generateSitePages(ROOT, outDir, BOOKS as any, {
    GA_MEASUREMENT_ID: "G-TEST123",
    TURNSTILE_SITE_KEY: "0x4TESTKEY",
  });
  for (const name of readdirSync(outDir)) {
    if (name.endsWith(".html")) pages[name] = readFileSync(join(outDir, name), "utf8");
  }
  pages["public/offline.html"] = readFileSync(join(ROOT, "public/offline.html"), "utf8");
  pages["scripts/public/offline.html"] = readFileSync(join(ROOT, "scripts/public/offline.html"), "utf8");
});

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

function inlineScripts(html: string): string[] {
  const found: string[] = [];
  for (const m of html.matchAll(/<script\b([^>]*)>/gi)) {
    if (/\ssrc\s*=/i.test(m[1])) continue;
    const type = /\stype\s*=\s*"([^"]*)"/i.exec(m[1])?.[1]?.toLowerCase();
    if (type === "application/ld+json" || type === "application/json") continue;
    found.push(m[0]);
  }
  return found;
}

function scriptTags(html: string): string[] {
  return [...html.matchAll(/<script\b[^>]*>/gi)].map((m) => m[0]);
}

function handlerAttributes(html: string): string[] {
  const found: string[] = [];
  for (const m of html.matchAll(/<[a-zA-Z][^>]*>/g)) {
    if (/\son[a-z]+\s*=/i.test(m[0]) || /\shref\s*=\s*"\s*javascript:/i.test(m[0])) {
      found.push(m[0].slice(0, 160));
    }
  }
  return found;
}

function tagsWith(html: string, attr: string): string[] {
  return [...html.matchAll(/<[a-zA-Z][^>]*>/g)].map((m) => m[0]).filter((t) => t.includes(attr));
}

describe("hub pages run under a script-src without 'unsafe-inline'", () => {
  test("every hub page and both offline pages were rendered", () => {
    expect(Object.keys(pages).sort()).toEqual(
      [
        "about.html",
        "appreciation.html",
        "contribute.html",
        "dmca.html",
        "donate.html",
        "index.html",
        "public/offline.html",
        "scripts/public/offline.html",
        "sign-in.html",
        "sign-up.html",
        "statistics.html",
      ].sort(),
    );
  });

  test("no page has a <script> without src other than a JSON data block", () => {
    for (const [name, html] of Object.entries(pages)) {
      expect([name, inlineScripts(html)]).toEqual([name, []]);
    }
  });

  test("no page has an inline event handler attribute or a javascript: link", () => {
    for (const [name, html] of Object.entries(pages)) {
      expect([name, handlerAttributes(html)]).toEqual([name, []]);
    }
  });

  test("every same-origin script a page loads exists and is not empty", () => {
    for (const [name, html] of Object.entries(pages)) {
      for (const m of html.matchAll(/<script\b[^>]*\ssrc="(\/[^/"][^"]*)"/g)) {
        const path = m[1].split("?")[0];
        const candidates = [join(outDir, path), join(ROOT, "public", path)];
        const file = candidates.find((p) => existsSync(p));
        expect([name, path, file !== undefined && statSync(file).size > 0]).toEqual([name, path, true]);
      }
    }
  });

  test("the GA bootstrap is an external file carrying the measurement id", () => {
    const home = pages["index.html"];
    expect(home).toContain('src="https://www.googletagmanager.com/gtag/js?id=G-TEST123"');
    expect(home).toContain('<script src="/hub-scripts/gtag-init.js"></script>');
    const init = readFileSync(join(outDir, "hub-scripts/gtag-init.js"), "utf8");
    expect(init).toContain("gtag('config', \"G-TEST123\")");
  });
});

describe("former inline handlers are data attributes", () => {
  test("both theme buttons carry data-action=toggle-theme", () => {
    for (const name of ["index.html", "about.html", "sign-in.html"]) {
      const tags = tagsWith(pages[name], 'data-action="toggle-theme"');
      expect([name, tags.length, tags.every((t) => t.includes("theme-toggle"))]).toEqual([name, 2, true]);
    }
  });

  test("the mobile menu button carries data-action=toggle-menu", () => {
    const tags = tagsWith(pages["index.html"], 'data-action="toggle-menu"');
    expect(tags.length).toBe(1);
    expect(tags[0]).toContain("mobile-menu-toggle");
  });

  test("each book card pin button carries data-pin with the slug", () => {
    const tags = tagsWith(pages["index.html"], 'data-pin="test-book"');
    expect(tags.length).toBe(1);
    expect(tags[0]).toContain("pin-toggle-btn");
  });

  test("the donate copy button carries data-action=copy-account", () => {
    const tags = tagsWith(pages["donate.html"], 'data-action="copy-account"');
    expect(tags.length).toBe(1);
    expect(tags[0]).toContain('id="copy-btn"');
  });

  // A browser that is truly offline cannot fetch /hub-scripts/, so the offline
  // page must work with no script at all.
  test("both offline pages load no script", () => {
    for (const name of ["public/offline.html", "scripts/public/offline.html"]) {
      expect([name, scriptTags(pages[name])]).toEqual([name, []]);
    }
  });

  test("the offline Retry control is a plain link to the current URL", () => {
    for (const name of ["public/offline.html", "scripts/public/offline.html"]) {
      const html = pages[name];
      const links = [...html.matchAll(/<a\b([^>]*)>\s*Retry\s*<\/a>/g)].map((m) => m[1]);
      expect([name, links.length, links.every((a) => / href=""/.test(a))]).toEqual([name, 1, true]);
      expect([name, /<button\b/i.test(html), html.includes("data-action")]).toEqual([name, false, false]);
    }
  });

  test("the Google Fonts stylesheet switches media through data-swap-media", () => {
    const tags = tagsWith(pages["index.html"], "fonts.googleapis.com/css2").filter((t) => t.includes('rel="stylesheet" media="print"'));
    expect(tags.length).toBe(1);
    expect(tags[0]).toContain('data-swap-media="all"');
  });
});

describe("hub-actions.js wires the data attributes", () => {
  type Listener = (e: unknown) => void;

  function load() {
    const file = join(outDir, "hub-scripts/hub-actions.js");
    expect(existsSync(file)).toBe(true);
    const code = readFileSync(file, "utf8");
    const listeners: Array<{ type: string; fn: Listener; capture: unknown }> = [];
    const loaded = { media: "print", sheet: {} as unknown, listeners: {} as Record<string, Listener[]> };
    const pending = { media: "print", sheet: null as unknown, listeners: {} as Record<string, Listener[]> };
    const links = [loaded, pending].map((l) => ({
      ...l,
      getAttribute: (name: string) => (name === "data-swap-media" ? "all" : null),
      addEventListener(type: string, fn: Listener) {
        (this.listeners[type] ??= []).push(fn);
      },
    }));
    const document = {
      addEventListener: (type: string, fn: Listener, capture: unknown) => listeners.push({ type, fn, capture }),
      querySelectorAll: (sel: string) => (sel.includes("data-swap-media") ? links : []),
    };
    const window = {
      toggleTheme: mock(() => {}),
      toggleMenu: mock(() => {}),
      togglePin: mock((_e: unknown, _slug: string) => {}),
      copyAccountNumber: mock(() => {}),
      location: { reload: mock(() => {}) },
    };
    new Function("window", "document", code)(window, document);
    return { listeners, links, window };
  }

  function click(listeners: Array<{ type: string; fn: Listener }>, attrs: Record<string, string>) {
    const el = { getAttribute: (n: string) => attrs[n] ?? null };
    const target = {
      closest: (sel: string) => (sel.split(",").some((s) => attrs[s.trim().slice(1, -1)] !== undefined) ? el : null),
    };
    const event = { target, preventDefault: mock(() => {}), stopPropagation: mock(() => {}) };
    for (const l of listeners.filter((x) => x.type === "click")) l.fn(event);
    return event;
  }

  test("one click listener on the document, in the capture phase", () => {
    const { listeners } = load();
    const clicks = listeners.filter((l) => l.type === "click");
    expect(clicks.length).toBe(1);
    expect(clicks[0].capture).toBe(true);
  });

  test("each data-action calls the function the inline handler called", () => {
    const { listeners, window } = load();
    click(listeners, { "data-action": "toggle-theme" });
    click(listeners, { "data-action": "toggle-menu" });
    click(listeners, { "data-action": "copy-account" });
    expect(window.toggleTheme).toHaveBeenCalledTimes(1);
    expect(window.toggleMenu).toHaveBeenCalledTimes(1);
    expect(window.copyAccountNumber).toHaveBeenCalledTimes(1);
  });

  test("data-pin calls togglePin with the event and the slug", () => {
    const { listeners, window } = load();
    const event = click(listeners, { "data-pin": "test-book" });
    expect(window.togglePin).toHaveBeenCalledTimes(1);
    expect(window.togglePin.mock.calls[0]).toEqual([event, "test-book"]);
  });

  test("an unknown data-action (the Turnstile widget's) does nothing", () => {
    const { listeners, window } = load();
    expect(() => click(listeners, { "data-action": "turnstile-spin-v2" })).not.toThrow();
    // No page uses "reload" since the offline Retry became a link.
    expect(() => click(listeners, { "data-action": "reload" })).not.toThrow();
    expect(window.toggleTheme).toHaveBeenCalledTimes(0);
    expect(window.toggleMenu).toHaveBeenCalledTimes(0);
    expect(window.togglePin).toHaveBeenCalledTimes(0);
    expect(window.copyAccountNumber).toHaveBeenCalledTimes(0);
    expect(window.location.reload).toHaveBeenCalledTimes(0);
  });

  test("a loaded stylesheet switches at once, a pending one on its load event", () => {
    const { links } = load();
    expect(links[0].media).toBe("all");
    expect(links[1].media).toBe("print");
    for (const fn of links[1].listeners.load ?? []) fn({});
    expect(links[1].media).toBe("all");
  });
});

describe("functions/lib/security-headers.ts: one policy for hub pages, one for books", () => {
  const directives = (policy: string) => policy.split("; ");

  test("the book policy is the previous policy, byte for byte", () => {
    expect((securityHeaders as Record<string, unknown>).BOOK_CONTENT_SECURITY_POLICY).toBe(BOOK_POLICY);
  });

  test("the default policy drops 'unsafe-inline' from script-src only", () => {
    const strict = directives(securityHeaders.CONTENT_SECURITY_POLICY);
    const book = directives(BOOK_POLICY);
    expect(strict.find((d) => d.startsWith("script-src "))).toBe(STRICT_SCRIPT_SRC);
    expect(STRICT_SCRIPT_SRC).not.toContain("'unsafe-inline'");
    expect(strict.filter((d) => !d.startsWith("script-src "))).toEqual(book.filter((d) => !d.startsWith("script-src ")));
    expect(strict.find((d) => d.startsWith("style-src "))).toContain("'unsafe-inline'");
  });
});
