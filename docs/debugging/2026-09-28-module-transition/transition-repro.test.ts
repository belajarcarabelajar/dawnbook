import { test, expect } from "bun:test";

// Reproducer RED untuk glitch transisi Modul 1 -> Modul 2 (desktop).
// Invarian yang diuji: navigasi antar-modul harus mulus dari sisi UI:
// (1) ada prefetch chapter berikut, (2) ada spinner/skeleton/transisi,
// (3) halaman tidak disembunyikan menunggu fetch jaringan,
// (4) ada prefetch hint di template/head.
// Masing-masing expect dirancang FAIL pada kondisi repo saat ini.

const root = import.meta.dir + "/../../..";

async function read(rel: string): Promise<string> {
  return await Bun.file(root + "/" + rel).text();
}

test("INV-UI-1: next-chapter prefetch hook exists in shared-script.js", async () => {
  const js = await read("books/shared-script.js");
  expect(js).toMatch(/rel\s*=\s*['"]?prefetch['"]?|prefetch\(|prerender|instant/i);
});

test("INV-UI-2: loading spinner/skeleton or page transition exists", async () => {
  const css = await read("books/shared-header.css");
  const js = await read("books/shared-script.js");
  const combined = css + "\n" + js;
  expect(combined).toMatch(
    /spinner|skeleton|shimmer|view-transition|::view-transition|page-transition|loading-indicator/i,
  );
});

test("INV-UI-3: page reveal is not gated on a blocking network fetch", async () => {
  const js = await read("books/shared-script.js");
  const hideIdx = js.indexOf("document.documentElement.style.opacity = '0'");
  const fetchIdx = js.indexOf("fetch('/api/auth/me'");
  const hidesBeforeFetch =
    hideIdx !== -1 && fetchIdx !== -1 && hideIdx < fetchIdx;
  expect(hidesBeforeFetch).toBe(false);
  // Semantic guard (F1): the hide must be conditional on internal
  // chapter-to-chapter navigation, not unconditional for all gated pages.
  expect(js).toMatch(/isInternalChapterNav\s*=/);
  expect(js).toMatch(/if\s*\(\s*!isPublic\s*&&\s*!isInternalChapterNav\s*\)/);
});

test("INV-UI-4: head template ships prefetch/preload hints for chapter assets", async () => {
  const head = await read("books/_template/theme/head.hbs");
  expect(head).toMatch(/prefetch|preload|prerender/i);
});
