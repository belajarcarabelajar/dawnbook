import { expect, test, describe } from "bun:test";
import { isPublicPath } from "../../../functions/lib/gating";

describe("isPublicPath — public path matching", () => {
  test("root path is public", () => {
    expect(isPublicPath("/")).toBe(true);
  });

  test("hub pages are public", () => {
    expect(isPublicPath("/about.html")).toBe(true);
    expect(isPublicPath("/contribute.html")).toBe(true);
    expect(isPublicPath("/donate.html")).toBe(true);
    expect(isPublicPath("/appreciation.html")).toBe(true);
  });

  test("sign-in / sign-up pages are public", () => {
    expect(isPublicPath("/sign-in")).toBe(true);
    expect(isPublicPath("/sign-in/")).toBe(true);
    expect(isPublicPath("/sign-up")).toBe(true);
  });

  test("api paths are public at the edge (handlers enforce their own auth)", () => {
    expect(isPublicPath("/api/auth/me")).toBe(true);
    expect(isPublicPath("/api/books")).toBe(true);
    expect(isPublicPath("/api/progress")).toBe(true);
  });

  test("admin SPA is public at the edge (client-side gates via /api/auth/me)", () => {
    expect(isPublicPath("/admin")).toBe(true);
    expect(isPublicPath("/admin/")).toBe(true);
  });

  test("static asset extensions are public regardless of path", () => {
    expect(isPublicPath("/foo.css")).toBe(true);
    expect(isPublicPath("/book/piaget/fonts/OpenSans-Regular.woff2")).toBe(true);
    expect(isPublicPath("/HubLayout.css")).toBe(true);
  });
});

describe("isPublicPath — book chapter gating", () => {
  test("book root (index.html) is public", () => {
    expect(isPublicPath("/books/piaget/")).toBe(true);
    expect(isPublicPath("/books/piaget/index.html")).toBe(true);
  });

  test("toc / 404 / print are public", () => {
    expect(isPublicPath("/books/piaget/toc.html")).toBe(true);
    expect(isPublicPath("/books/piaget/404.html")).toBe(true);
    expect(isPublicPath("/books/piaget/print.html")).toBe(true);
  });

  test("first chapter (01 prefix) is public preview", () => {
    expect(isPublicPath("/books/piaget/01_latar-belakang.html")).toBe(true);
    expect(isPublicPath("/books/piaget/01 - Konsep Dasar.html")).toBe(true);
  });

  test("first chapter without leading zero is also public", () => {
    expect(isPublicPath("/books/piaget/1_intro.html")).toBe(true);
  });

  test("chapter 2 and beyond are gated", () => {
    expect(isPublicPath("/books/piaget/02_konsep.html")).toBe(false);
    expect(isPublicPath("/books/piaget/15_kesimpulan.html")).toBe(false);
  });

  test("URL-encoded chapter names match the decoded form", () => {
    // %20 = space, %2D = dash
    expect(isPublicPath("/books/piaget/01%20-%20Konsep.html")).toBe(true);
    expect(isPublicPath("/books/piaget/02%20-%20Konsep.html")).toBe(false);
  });

  test("non-chapter files in a book directory are gated", () => {
    // A file with no numeric prefix should be treated as gated content.
    expect(isPublicPath("/books/piaget/glossary.html")).toBe(false);
  });

  test("unknown HTML file outside /books is public (no chapter gating applies)", () => {
    expect(isPublicPath("/some-random-page.html")).toBe(true);
  });
});
