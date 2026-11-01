import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkLinks, extractLinks, type FetchLike } from "../../scripts/premium/check-links";

const ROOT = path.join(os.homedir(), ".cache/tmp/dawnbook-scratch/premium-check-links-test");

type Route = { status: number; url?: string } | "hang" | "network-error";
type Routes = Record<string, Partial<Record<"HEAD" | "GET", Route>>>;

function fakeFetch(routes: Routes) {
  const calls: { url: string; method: string }[] = [];
  const fn: FetchLike = (url, init) => {
    calls.push({ url, method: init.method });
    const route = routes[url]?.[init.method as "HEAD" | "GET"];
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

    // A URL used twice is requested once; the mailto and the .txt file are never requested.
    expect(calls.filter((c) => c.url === "https://dead.example/x" && c.method === "HEAD")).toHaveLength(1);
    expect(calls.some((c) => c.url.startsWith("mailto:") || c.url.includes("ignored.example"))).toBe(false);
    // The 405 to HEAD is retried with GET; the timeout is retried once and then counted dead.
    expect(calls.filter((c) => c.url === "https://nohead.example/p").map((c) => c.method)).toEqual(["HEAD", "GET"]);
    expect(calls.filter((c) => c.url === "https://slow.example/p").map((c) => c.method)).toEqual(["HEAD", "GET"]);
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
