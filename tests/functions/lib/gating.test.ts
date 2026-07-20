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

  test("api paths are public at the edge", () => {
    expect(isPublicPath("/api/auth/me")).toBe(true);
    expect(isPublicPath("/api/books")).toBe(true);
    expect(isPublicPath("/api/progress")).toBe(true);
  });

  test("admin SPA is gated at the edge", () => {
    expect(isPublicPath("/admin")).toBe(false);
    expect(isPublicPath("/admin/")).toBe(false);
  });

  test("static asset extensions are public", () => {
    expect(isPublicPath("/foo.css")).toBe(true);
    expect(isPublicPath("/book/piaget/fonts/OpenSans-Regular.woff2")).toBe(true);
    expect(isPublicPath("/HubLayout.css")).toBe(true);
  });
});

describe("isPublicPath — book content indexability", () => {
  test("all book chapters are public for 100% SEO indexing", () => {
    expect(isPublicPath("/books/piaget/")).toBe(true);
    expect(isPublicPath("/books/piaget/index.html")).toBe(true);
    expect(isPublicPath("/books/piaget/toc.html")).toBe(true);
    expect(isPublicPath("/books/piaget/01_latar-belakang.html")).toBe(true);
    expect(isPublicPath("/books/piaget/02_konsep.html")).toBe(true);
    expect(isPublicPath("/books/piaget/15_kesimpulan.html")).toBe(true);
    expect(isPublicPath("/books/piaget/02%20-%20Konsep.html")).toBe(true);
  });
});
