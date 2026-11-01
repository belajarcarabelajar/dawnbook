import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkLinks, deniedHost, extractLinks, type FetchLike } from "../../scripts/premium/check-links";

const ROOT = path.join(os.homedir(), ".cache/tmp/dawnbook-scratch/premium-check-links-test");

type Route = { status: number; url?: string } | "hang" | "network-error";
// A list answers successive calls of that method in order; its last entry repeats.
type Routes = Record<string, Partial<Record<"HEAD" | "GET", Route | Route[]>>>;

function fakeFetch(routes: Routes) {
  const calls: { url: string; method: string }[] = [];
  const fn: FetchLike = (url, init) => {
    const nth = calls.filter((c) => c.url === url && c.method === init.method).length;
    calls.push({ url, method: init.method });
    const entry = routes[url]?.[init.method as "HEAD" | "GET"];
    const route = Array.isArray(entry) ? entry[Math.min(nth, entry.length - 1)] : entry;
    if (route === undefined) return Promise.reject(new Error(`unexpected ${init.method} ${url}`));
    if (route === "hang") return new Promise(() => {});
    if (route === "network-error") return Promise.reject(new TypeError("fetch failed"));
    return Promise.resolve({ status: route.status, url: route.url ?? url });
  };
  return { fn, calls };
}

function write(rel: string, text: string): void {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

beforeAll(() => fs.rmSync(ROOT, { recursive: true, force: true }));
afterAll(() => fs.rmSync(ROOT, { recursive: true, force: true }));

describe("extractLinks", () => {
  test("finds markdown and bare links, strips trailing punctuation, skips mailto and relative links", () => {
    const text = [
      "Baca [panduan](https://a.example/guide) dulu.",
      "Lihat https://b.example/page. Atau (https://c.example/x), lalu https://d.example/y,",
      "[Wiki](https://en.wikipedia.org/wiki/Spacing_(psychology)) dan [surat](mailto:x@y.example) dan [bab](02_bab.md)",
    ].join("\n");
    expect(extractLinks(text)).toEqual([
      { line: 1, url: "https://a.example/guide" },
      { line: 2, url: "https://b.example/page" },
      { line: 2, url: "https://c.example/x" },
      { line: 2, url: "https://d.example/y" },
      { line: 3, url: "https://en.wikipedia.org/wiki/Spacing_(psychology)" },
    ]);
  });

  test("a URL used as the link text of the same URL is reported once, without the closing bracket", () => {
    const text = "Penulis. (2024). *Judul*. [https://doi.org/10.1/abc](https://doi.org/10.1/abc)";
    expect(extractLinks(text)).toEqual([{ line: 1, url: "https://doi.org/10.1/abc" }]);
  });

  test("a URL as link text of a different target yields both URLs, clean", () => {
    const text = "[https://a.example/x](https://b.example/y)";
    expect(extractLinks(text)).toEqual([
      { line: 1, url: "https://a.example/x" },
      { line: 1, url: "https://b.example/y" },
    ]);
  });
});

describe("deniedHost", () => {
  test("a parking domain matches itself and its subdomains only, not a host that merely ends with it", () => {
    expect(deniedHost("dan.com")).toBe(true);
    expect(deniedHost("x.dan.com")).toBe(true);
    expect(deniedHost("jordan.com")).toBe(false);
    expect(deniedHost("dan.com.example")).toBe(false);
  });
});

describe("checkLinks", () => {
  test("classifies dead and live links and reports every file:line occurrence", async () => {
    const dir = path.join(ROOT, "books-mixed");
    write("books-mixed/buku/src/content/01_a.md", [
      "Judul",
      "[mati](https://dead.example/x)",
      "[judi](https://old-journal.example/article)",
      "[pindah](https://old.example/paper)",
      "[head](https://nohead.example/p)",
      "[lambat](https://slow.example/p)",
      "[surat](mailto:penulis@example.com)",
    ].join("\n"));
    write("books-mixed/buku/src/content/02_b.md", "Teks\n\nSekali lagi [mati](https://dead.example/x).\n");
    write("books-mixed/buku/notes.txt", "https://ignored.example/not-markdown\n");

    const { fn, calls } = fakeFetch({
      "https://dead.example/x": { HEAD: { status: 404 }, GET: { status: 404 } },
      "https://old-journal.example/article": { HEAD: { status: 200, url: "https://slot-gacor88.example/" } },
      "https://old.example/paper": { HEAD: { status: 200, url: "https://new-publisher.example/paper" } },
      "https://nohead.example/p": { HEAD: { status: 405 }, GET: { status: 200 } },
      "https://slow.example/p": { HEAD: "hang", GET: "hang" },
    });

    const dead = await checkLinks(dir, fn, { timeoutMs: 30 });
    const rows = dead.map((d) => ({ ...d, file: path.relative(dir, d.file) }));

    expect(rows.map((r) => [r.file, r.line, r.url])).toEqual([
      ["buku/src/content/01_a.md", 2, "https://dead.example/x"],
      ["buku/src/content/01_a.md", 3, "https://old-journal.example/article"],
      ["buku/src/content/01_a.md", 6, "https://slow.example/p"],
      ["buku/src/content/02_b.md", 3, "https://dead.example/x"],
    ]);
    expect(rows[0].reason).toContain("404");
    expect(rows[1].reason).toContain("slot-gacor88.example");
    expect(rows[2].reason).toContain("timeout");
    expect(rows.map((r) => r.kind)).toEqual(["dead", "dead", "unverified", "dead"]);

    // A URL used twice is requested once; the mailto and the .txt file are never requested.
    expect(calls.filter((c) => c.url === "https://dead.example/x" && c.method === "HEAD")).toHaveLength(1);
    expect(calls.some((c) => c.url.startsWith("mailto:") || c.url.includes("ignored.example"))).toBe(false);
    // The 405 to HEAD is retried with GET; a GET timeout gets one more GET and then counts as unverified.
    expect(calls.filter((c) => c.url === "https://nohead.example/p").map((c) => c.method)).toEqual(["HEAD", "GET"]);
    expect(calls.filter((c) => c.url === "https://slow.example/p").map((c) => c.method)).toEqual(["HEAD", "GET", "GET"]);
  });

  test("a GET that times out is asked once more with GET, and a live retry keeps the link alive", async () => {
    const dir = path.join(ROOT, "books-retry-timeout");
    write("books-retry-timeout/b.md", "https://sleepy.example/a\n");
    const { fn, calls } = fakeFetch({
      "https://sleepy.example/a": { HEAD: "hang", GET: ["hang", { status: 200 }] },
    });
    expect(await checkLinks(dir, fn, { timeoutMs: 30 })).toEqual([]);
    expect(calls.map((c) => c.method)).toEqual(["HEAD", "GET", "GET"]);
  });

  test("a GET with a network error is asked once more with GET, and a live retry keeps the link alive", async () => {
    const dir = path.join(ROOT, "books-retry-neterr");
    write("books-retry-neterr/b.md", "https://reset.example/a\n");
    const { fn, calls } = fakeFetch({
      "https://reset.example/a": { HEAD: { status: 403 }, GET: ["network-error", { status: 200 }] },
    });
    expect(await checkLinks(dir, fn, { timeoutMs: 30 })).toEqual([]);
    expect(calls.map((c) => c.method)).toEqual(["HEAD", "GET", "GET"]);
  });

  test("a GET that fails again on the retry is unverified, with its reason kept", async () => {
    const dir = path.join(ROOT, "books-retry-fail");
    write("books-retry-fail/b.md", "https://refused.example/a\nhttps://stuck.example/b\n");
    const { fn, calls } = fakeFetch({
      "https://refused.example/a": { HEAD: "network-error", GET: "network-error" },
      "https://stuck.example/b": { HEAD: "hang", GET: "hang" },
    });
    const rows = (await checkLinks(dir, fn, { timeoutMs: 30 })).map((d) => [d.url, d.kind, d.reason]);
    expect(rows).toEqual([
      ["https://refused.example/a", "unverified", "network error: fetch failed (after retry)"],
      ["https://stuck.example/b", "unverified", "timeout after 30 ms (after retry)"],
    ]);
    expect(calls.filter((c) => c.url === "https://refused.example/a").map((c) => c.method)).toEqual(["HEAD", "GET", "GET"]);
    expect(calls.filter((c) => c.url === "https://stuck.example/b").map((c) => c.method)).toEqual(["HEAD", "GET", "GET"]);
  });

  test("an HTTP 404, 410 or 5xx answer to GET is not retried and stays dead", async () => {
    const dir = path.join(ROOT, "books-http-dead");
    write("books-http-dead/b.md", ["https://g404.example/", "https://g410.example/", "https://g503.example/"].join("\n"));
    const routes: Routes = {};
    for (const s of [404, 410, 503]) routes[`https://g${s}.example/`] = { HEAD: "network-error", GET: { status: s } };
    const { fn, calls } = fakeFetch(routes);
    const rows = (await checkLinks(dir, fn, { timeoutMs: 30 })).map((d) => [d.url, d.kind, d.reason]);
    expect(rows).toEqual([
      ["https://g404.example/", "dead", "HTTP 404"],
      ["https://g410.example/", "dead", "HTTP 410"],
      ["https://g503.example/", "dead", "HTTP 503"],
    ]);
    expect(calls.filter((c) => c.method === "GET")).toHaveLength(3);
  });

  test("a retry that redirects to a denylisted host is dead", async () => {
    const dir = path.join(ROOT, "books-retry-deny");
    write("books-retry-deny/b.md", "https://expired.example/a\n");
    const { fn } = fakeFetch({
      "https://expired.example/a": { HEAD: "hang", GET: ["hang", { status: 200, url: "https://www.hugedomains.com/x" }] },
    });
    const rows = (await checkLinks(dir, fn, { timeoutMs: 30 })).map((d) => [d.url, d.kind, d.reason]);
    expect(rows).toEqual([["https://expired.example/a", "dead", "redirected to denylisted host www.hugedomains.com"]]);
  });

  test("a network error to HEAD is retried with GET and a live GET keeps the link alive", async () => {
    const dir = path.join(ROOT, "books-neterr");
    write("books-neterr/b.md", "https://flaky.example/a\n");
    const { fn, calls } = fakeFetch({
      "https://flaky.example/a": { HEAD: "network-error", GET: { status: 200 } },
    });
    expect(await checkLinks(dir, fn, { timeoutMs: 30 })).toEqual([]);
    expect(calls.map((c) => c.method)).toEqual(["HEAD", "GET"]);
  });

  test("any HEAD status of 400 or more is asked again with GET, and a live GET keeps the link alive", async () => {
    const dir = path.join(ROOT, "books-head404");
    write("books-head404/b.md", "https://headless.example/a\nhttps://picky.example/b\n");
    const { fn, calls } = fakeFetch({
      "https://headless.example/a": { HEAD: { status: 404 }, GET: { status: 200 } },
      "https://picky.example/b": { HEAD: { status: 406 }, GET: { status: 200 } },
    });
    expect(await checkLinks(dir, fn, { timeoutMs: 30 })).toEqual([]);
    expect(calls.map((c) => `${c.method} ${c.url}`).sort()).toEqual([
      "GET https://headless.example/a",
      "GET https://picky.example/b",
      "HEAD https://headless.example/a",
      "HEAD https://picky.example/b",
    ]);
  });

  test("401, 403 and 429 after GET are unverified, not dead; 404 and 410 stay dead", async () => {
    const dir = path.join(ROOT, "books-blocked");
    write("books-blocked/b.md", ["https://s401.example/", "https://s403.example/", "https://s429.example/", "https://s404.example/", "https://s410.example/"].join("\n"));
    const routes: Routes = {};
    for (const s of [401, 403, 429, 404, 410]) routes[`https://s${s}.example/`] = { HEAD: { status: s }, GET: { status: s } };
    const { fn } = fakeFetch(routes);
    const rows = (await checkLinks(dir, fn, { timeoutMs: 30 })).map((d) => [d.url, d.kind]);
    expect(rows).toEqual([
      ["https://s401.example/", "unverified"],
      ["https://s403.example/", "unverified"],
      ["https://s429.example/", "unverified"],
      ["https://s404.example/", "dead"],
      ["https://s410.example/", "dead"],
    ]);
  });

  test("keeps at most 8 requests in flight", async () => {
    const dir = path.join(ROOT, "books-many");
    write("books-many/many.md", Array.from({ length: 30 }, (_, i) => `https://h${i}.example/`).join("\n"));
    let inFlight = 0;
    let peak = 0;
    const fn: FetchLike = async (url) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      return { status: 200, url };
    };
    expect(await checkLinks(dir, fn)).toEqual([]);
    expect(peak).toBe(8);
  });
});
