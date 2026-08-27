import { expect, test, describe } from "bun:test";
import { escapeHtml, minifyJs, minifyCss } from "../../scripts/builder/template-engine";

describe("scripts/builder/template-engine.ts", () => {
  describe("escapeHtml", () => {
    test("escapes ampersands", () => {
      expect(escapeHtml("a & b")).toBe("a &amp; b");
    });
    test("escapes less than", () => {
      expect(escapeHtml("a < b")).toBe("a &lt; b");
    });
    test("escapes greater than", () => {
      expect(escapeHtml("a > b")).toBe("a &gt; b");
    });
    test("escapes double quotes", () => {
      expect(escapeHtml('a " b')).toBe("a &quot; b");
    });
    test("escapes single quotes", () => {
      expect(escapeHtml("a ' b")).toBe("a &#039; b");
    });
    test("escapes all HTML special characters simultaneously", () => {
      expect(escapeHtml("<script>alert('xss' & \"hack\");</script>")).toBe("&lt;script&gt;alert(&#039;xss&#039; &amp; &quot;hack&quot;);&lt;/script&gt;");
    });
    test("returns the same string if no special characters exist", () => {
      expect(escapeHtml("hello world")).toBe("hello world");
    });
    test("returns empty string when input is empty", () => {
      expect(escapeHtml("")).toBe("");
    });
  });

  describe("minifyJs", () => {
    test("removes multi-line comments", () => {
      expect(minifyJs("/* this is a comment */ const a = 1;")).toBe("const a = 1;");
      expect(minifyJs("const a = 1; /* inline */ const b = 2;")).toBe("const a = 1; const b = 2;");
    });
    test("removes single-line comments", () => {
      expect(minifyJs("// this is a comment\nconst a = 1;")).toBe("const a = 1;");
      expect(minifyJs("const a = 1;\n// another comment\nconst b = 2;")).toBe("const a = 1; const b = 2;");
    });
    test("collapses multiple spaces and newlines into a single space", () => {
      expect(minifyJs("const   a  =  \n 1;")).toBe("const a = 1;");
    });
    test("trims leading and trailing whitespace", () => {
      expect(minifyJs("  const a = 1;  ")).toBe("const a = 1;");
    });
    test("returns empty string for only comments and whitespace", () => {
      expect(minifyJs(" /* comment */ \n // another \n ")).toBe("");
    });
  });

  describe("minifyCss", () => {
    test("removes multi-line comments", () => {
      expect(minifyCss("/* this is a comment */ .cls { color: red; }")).toBe(".cls{color:red;}");
    });
    test("collapses multiple spaces and newlines into a single space", () => {
      expect(minifyCss(".cls   {  color:  \n red;  }")).toBe(".cls{color:red;}");
    });
    test("removes spaces around brackets, colons, semicolons, and commas", () => {
      expect(minifyCss(".cls { color : red ; padding : 10px , 20px ; }")).toBe(".cls{color:red;padding:10px,20px;}");
    });
    test("trims leading and trailing whitespace", () => {
      expect(minifyCss("  .cls { color: red; }  ")).toBe(".cls{color:red;}");
    });
    test("returns empty string for only comments and whitespace", () => {
      expect(minifyCss(" /* comment */ \n  \n ")).toBe("");
    });
  });

  describe("generateSitePages - DMCA Notice", () => {
    test("generates dmca.html with navigation link and i18n tags", async () => {
      const { generateSitePages } = await import("../../scripts/builder/template-engine");
      const { mkdtempSync, rmSync, readFileSync } = await import("fs");
      const { tmpdir } = await import("os");
      const { join } = await import("path");

      const rootDir = join(import.meta.dir, "../..");
      const tmpDir = mkdtempSync(join(tmpdir(), "dawnbook-dmca-test-"));

      try {
        await generateSitePages(rootDir, tmpDir, [], {});
        const dmcaHtml = readFileSync(join(tmpDir, "dmca.html"), "utf-8");
        const indexHtml = readFileSync(join(tmpDir, "index.html"), "utf-8");

        expect(dmcaHtml).toContain("data-i18n=\"dmca.title\"");
        expect(dmcaHtml).toContain("dmca@dawnbook.belajarcarabelajar.com");
        expect(dmcaHtml).toContain("href=\"/dmca.html\"");
        expect(indexHtml).toContain("href=\"/dmca.html\"");
      } finally {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("generateSitePages - Favicon & PWA Tags", () => {
    test("generates crawlable static favicon and apple-touch-icon links without data URIs", async () => {
      const { generateSitePages } = await import("../../scripts/builder/template-engine");
      const { mkdtempSync, rmSync, readFileSync } = await import("fs");
      const { tmpdir } = await import("os");
      const { join } = await import("path");

      const rootDir = join(import.meta.dir, "../..");
      const tmpDir = mkdtempSync(join(tmpdir(), "dawnbook-favicon-test-"));

      try {
        await generateSitePages(rootDir, tmpDir, [], {});
        const indexHtml = readFileSync(join(tmpDir, "index.html"), "utf-8");

        expect(indexHtml).toContain('rel="icon" href="/favicon.ico"');
        expect(indexHtml).toContain('rel="icon" type="image/svg+xml" href="/favicon.svg"');
        expect(indexHtml).toContain('rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png"');
        expect(indexHtml).toContain('rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png"');
        expect(indexHtml).toContain('rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"');
        expect(indexHtml).toContain('rel="manifest" href="/manifest.webmanifest"');
        expect(indexHtml).not.toContain('href="data:image/svg+xml');
      } finally {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
