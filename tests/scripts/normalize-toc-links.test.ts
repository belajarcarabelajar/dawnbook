import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { normalizeTocLinks } from "../../scripts/builder/normalize-toc-links";

// Shape copied from a real mdBook 0.5 build (output/books/<slug>/toc-<hash>.js).
const TOC_JS = `class MDBookSidebarScrollbox extends HTMLElement {
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="content/01_a.html"><strong aria-hidden="true">1.</strong> Satu</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="content/02_caf%C3%A9-%26-teh.html"><strong aria-hidden="true">2.</strong> Dua</a></span></li><li><a href="print.html">Cetak</a></li><li><a href="toc.html">Daftar</a></li><li><a href="https://example.com/luar.html">Luar</a></li></ol>';
        for (const link of this.querySelectorAll("a")) {
            if (link.href.replace(/\\.html$/, '') === current_page.replace(/\\.html$/, '')) link.classList.add("active");
        }
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
`;

const OTHER_JS = `const x = '<a href="content/01_a.html">x</a>';\n`;

describe("normalizeTocLinks", () => {
  let dir: string;
  let tocPath: string;
  let otherPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "toc-links-"));
    mkdirSync(join(dir, "demo"), { recursive: true });
    tocPath = join(dir, "demo", "toc-abc123.js");
    otherPath = join(dir, "demo", "book-abc123.js");
    writeFileSync(tocPath, TOC_JS);
    writeFileSync(otherPath, OTHER_JS);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test("drops .html from chapter links and keeps print, toc and external links", async () => {
    const result = await normalizeTocLinks(dir);
    const out = readFileSync(tocPath, "utf8");

    expect(result).toEqual({ files: 1, changed: 1 });
    expect(out).toContain('<a href="content/01_a">');
    expect(out).toContain('<a href="content/02_caf%C3%A9-%26-teh">');
    expect(out).not.toContain('href="content/01_a.html"');
    expect(out).toContain('href="print.html"');
    expect(out).toContain('href="toc.html"');
    expect(out).toContain('href="https://example.com/luar.html"');
    expect(out).toContain("link.href.replace(/\\.html$/, '')");
  });

  test("a second run changes nothing", async () => {
    await normalizeTocLinks(dir);
    const first = readFileSync(tocPath, "utf8");
    const again = await normalizeTocLinks(dir);
    expect(again).toEqual({ files: 1, changed: 0 });
    expect(readFileSync(tocPath, "utf8")).toBe(first);
  });

  test("leaves non-toc .js files untouched", async () => {
    await normalizeTocLinks(dir);
    expect(readFileSync(otherPath, "utf8")).toBe(OTHER_JS);
  });
});
