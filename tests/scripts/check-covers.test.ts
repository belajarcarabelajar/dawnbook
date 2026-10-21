import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { checkCovers, coverRules, MAX_COVER_BYTES } from "../../scripts/check-covers";

const open = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 630 630" width="630" height="630">';
const valid =
  open +
  '<defs><linearGradient id="g"><stop offset="0" stop-color="#123"/><stop offset="1" stop-color="#456"/></linearGradient></defs>' +
  '<rect width="630" height="630" fill="url(#g)"/><use href="#g"/></svg>';

const rules = (svg: string) => coverRules(svg).map(([rule]) => rule);

describe("coverRules", () => {
  test("accepts a self-contained 630x630 drawing with internal references", () => {
    expect(coverRules(valid)).toEqual([]);
  });

  test("requires the 630x630 viewBox", () => {
    expect(rules(valid.replace('viewBox="0 0 630 630"', 'viewBox="0 0 1200 630"'))).toContain("bad-viewbox");
    expect(rules(valid.replace(' viewBox="0 0 630 630"', ""))).toContain("bad-viewbox");
  });

  test("refuses text, scripts, styles, and embedded images", () => {
    for (const el of ['<text x="1">A</text>', "<script>alert(1)</script>", "<style>rect{}</style>", '<image href="#g"/>', "<foreignObject/>"]) {
      expect(rules(valid.replace("</svg>", `${el}</svg>`))).toContain("forbidden-element");
    }
  });

  test("does not mistake <textPath>-free shapes or <animate>-like names for forbidden elements", () => {
    expect(rules(valid.replace("</svg>", '<path d="M0 0L10 10"/><polygon points="0,0 5,5 0,5"/></svg>'))).toEqual([]);
  });

  test("refuses external references and event attributes", () => {
    expect(rules(valid.replace('href="#g"', 'href="https://example.com/x.svg"'))).toContain("external-ref");
    expect(rules(valid.replace('fill="url(#g)"', 'fill="url(https://example.com/p)"'))).toContain("external-ref");
    expect(rules(valid.replace("<rect ", '<rect onload="x()" '))).toContain("event-attr");
  });

  test("refuses emoji, oversized files, and files resvg cannot render", () => {
    expect(rules(valid.replace("</svg>", "<!-- 🌅 --></svg>"))).toContain("emoji");
    expect(rules(valid.replace("</svg>", `<!-- ${"x".repeat(MAX_COVER_BYTES)} --></svg>`))).toContain("too-large");
    expect(rules(open + "<rect width=")).toContain("render-error");
  });
});

describe("checkCovers", () => {
  test("reports a book without a cover and a card text the fonts cannot draw", async () => {
    const root = await mkdtemp(join(tmpdir(), "check-covers-"));
    try {
      for (const [slug, author] of [["ada-cover", "Iwan Kurniawan"], ["tanpa-cover", "Penulis β"]]) {
        const dir = join(root, "books", slug);
        await mkdir(join(dir, "src"), { recursive: true });
        await writeFile(join(dir, "book.toml"), `[book]\ntitle = "Judul ${slug}"\nauthors = ["${author}"]\n`);
        await writeFile(join(dir, "src", "SUMMARY.md"), "- [Bab Satu](content/01_satu.md)\n");
      }
      await writeFile(join(root, "books", "ada-cover", "cover.svg"), valid);
      expect(checkCovers(root).map((v) => `${v.book} ${v.rule}`)).toEqual([
        "tanpa-cover missing-glyph",
        "tanpa-cover missing-cover",
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
