import { test, expect } from "bun:test";

// T3 MathJax dedupe + guards + register-sw hygiene (Rule 10).
// RED: semua 4 tes dirancang FAIL pada kondisi pra-fix.

const root = import.meta.dir + "/../../..";

async function read(rel: string): Promise<string> {
  return await Bun.file(root + "/" + rel).text();
}

test("MJ-1: single MathJax version, no 2.7.1 dupe (built-in disabled)", async () => {
  const head = await read("books/_template/theme/head.hbs");
  const js = await read("books/shared-script.js");
  const toml = await read("books/_template/book.toml");
  expect(head).not.toMatch(/2\.7\.1/);
  expect(js).not.toMatch(/2\.7\.1/);
  // mdBook mathjax-support=true menyuntik MathJax 2.7.1 async bawaan
  // (duplikat terhadap 2.7.9 defer di head.hbs); harus false.
  const m = toml.match(/mathjax-support\s*=\s*(true|false)/);
  expect(m && m[1]).toBe("false");
});

test("MJ-2: MathJax defer-only, no async (Rule 10)", async () => {
  const head = await read("books/_template/theme/head.hbs");
  const toml = await read("books/_template/book.toml");
  expect(head).not.toMatch(/<script[^>]*\basync\b[^>]*MathJax/i);
  expect(head).toMatch(/<script[^>]*\bdefer\b[^>]*MathJax/i);
  // mathjax-support=true = injeksi async bawaan mdBook masih aktif.
  const m = toml.match(/mathjax-support\s*=\s*(true|false)/);
  expect(m && m[1]).toBe("false");
});

test("MJ-3: pageshow persisted guard + debounce anti-double", async () => {
  const js = await read("books/shared-script.js");
  expect(js).toMatch(/pageshow/);
  // Rule 10: pageshow hanya retypeset bila e.persisted (bfcache restore).
  expect(js).toMatch(/(e|event)\.persisted/);
  // Anti-ganda: debounce/throttle guard di sekitar retypeset.
  expect(js).toMatch(/debounc|throttle|clearTimeout/);
  expect(js).toMatch(/setTimeout/);
});

test("SW-1: no orphan register-sw.js injection", async () => {
  const ts = await read("scripts/inject-gating.ts");
  // /register-sw.js tidak pernah ada di output; injeksinya yatim.
  expect(ts).not.toMatch(/register-sw\.js/);
});
