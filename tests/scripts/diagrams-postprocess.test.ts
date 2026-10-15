import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { finalizeSvg, readAccText } from "../../scripts/diagrams/postprocess";

const FLOW =
  '<svg aria-roledescription="flowchart-v2" role="graphics-document document" viewBox="0 0 729.5 512" style="max-width: 729.5px; background-color: transparent;" class="flowchart" xmlns="http://www.w3.org/2000/svg" width="100%" id="dbd-abc" aria-labelledby="chart-title-dbd-abc" aria-describedby="chart-desc-dbd-abc"><title id="chart-title-dbd-abc">T</title><desc id="chart-desc-dbd-abc">D</desc><style>#dbd-abc{font-family:Epilogue}</style><g></g></svg>';

const TIMELINE =
  '<svg id="dbd-tl" width="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 1190px; background-color: transparent;" viewBox="100 -64 1190 514.7999877929688" role="graphics-document document" aria-roledescription="timeline"><style>#dbd-tl .x>g{fill:#333}</style><g><text>2020</text></g></svg>';

// Shaped like Mermaid sequence output: actor and root ids carry no diagram id, markers and the title do.
const SEQ =
  '<svg aria-roledescription="sequence" role="graphics-document document" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100%" id="dbd-abc" aria-labelledby="chart-title-dbd-abc" aria-describedby="chart-desc-dbd-abc"><title id="chart-title-dbd-abc">T</title><desc id="chart-desc-dbd-abc">D</desc><style>#dbd-abc .actor{fill:#fff;}#actor0{stroke:#fff}#actor0>rect,#actor01 .x{fill:#fff}#fff{fill:#fff}</style><g id="root-1"><rect id="actor0"/><rect id="fff"/><use href="#actor0"/><use xlink:href="#root-1"/><use href="#actor01"/><path marker-end="url(#root-1)"/><line marker-end="url(#dbd-abc-arrowhead)"/><g aria-labelledby="actor0 actor01 dbd-abc-arrowhead" aria-describedby="root-1" aria-owns="fff  actor0"></g></g><defs><marker id="dbd-abc-arrowhead"/></defs></svg>';

const ACC = { title: "Judul", descr: "Deskripsi" };

function rootTag(svg: string): string {
  const match = svg.match(/^<svg[^>]*>/);
  if (!match) throw new Error("no root tag in fixture output");
  return match[0];
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe("readAccText", () => {
  test("reads the one-line accTitle and accDescr forms, indented", () => {
    const source = "flowchart TD\n    accTitle: Alur belajar\n    accDescr: Pembaca membaca bab lalu berlatih.\n    A --> B\n";
    expect(readAccText(source)).toEqual({
      title: "Alur belajar",
      descr: "Pembaca membaca bab lalu berlatih.",
    });
  });

  test("reads the accDescr block form and joins its lines with single spaces", () => {
    const source = [
      "timeline",
      "  accTitle: Sejarah singkat",
      "  accDescr {",
      "    Baris pertama",
      "    baris kedua.",
      "  }",
      "  2020 : Mulai",
    ].join("\n");
    expect(readAccText(source)).toEqual({
      title: "Sejarah singkat",
      descr: "Baris pertama baris kedua.",
    });
  });

  test("returns null when accDescr is missing", () => {
    expect(readAccText("flowchart TD\n  accTitle: Hanya judul\n  A --> B")).toBeNull();
  });

  test("returns null when accTitle is missing", () => {
    expect(readAccText("flowchart TD\n  accDescr: Hanya deskripsi\n  A --> B")).toBeNull();
  });
});

describe("finalizeSvg", () => {
  test("turns a multi-line SVG into one line", () => {
    const multi = FLOW.replace("<g></g>", "<g>\n<text>a</text>\r\n<text>b</text>\n</g>");
    const out = finalizeSvg(multi, { id: "dbd-abc", acc: ACC });
    expect(out).not.toContain("\n");
    expect(out).toContain("<g> <text>a</text> <text>b</text> </g>");
  });

  test("inserts title, desc and aria attributes into a timeline that has none", () => {
    const out = finalizeSvg(TIMELINE, { id: "dbd-tl", acc: ACC });
    const root = rootTag(out);
    expect(out.slice(root.length)).toStartWith(
      '<title id="dbd-tl-title">Judul</title><desc id="dbd-tl-desc">Deskripsi</desc><style>',
    );
    expect(root).toContain('aria-labelledby="dbd-tl-title"');
    expect(root).toContain('aria-describedby="dbd-tl-desc"');
  });

  test("keeps the title and desc that Mermaid already produced", () => {
    const out = finalizeSvg(FLOW, { id: "dbd-abc", acc: ACC });
    expect(out).toContain('<title id="chart-title-dbd-abc">T</title><desc id="chart-desc-dbd-abc">D</desc>');
    expect(count(out, "<title")).toBe(1);
    expect(count(out, "<desc")).toBe(1);
    expect(out).not.toContain("dbd-abc-title");
    const root = rootTag(out);
    expect(count(root, "aria-labelledby=")).toBe(1);
    expect(root).toContain('aria-labelledby="chart-title-dbd-abc"');
    expect(root).toContain('aria-describedby="chart-desc-dbd-abc"');
  });

  test("escapes ampersand and angle brackets in inserted text", () => {
    const out = finalizeSvg(TIMELINE, {
      id: "dbd-tl",
      acc: { title: "A & B <c>", descr: "x > y & z" },
    });
    expect(out).toContain('<title id="dbd-tl-title">A &amp; B &lt;c&gt;</title>');
    expect(out).toContain('<desc id="dbd-tl-desc">x &gt; y &amp; z</desc>');
  });

  test("replaces the root style with the width rule from the viewBox width", () => {
    const root = rootTag(finalizeSvg(FLOW, { id: "dbd-abc", acc: ACC }));
    expect(count(root, "style=")).toBe(1);
    expect(root).toContain(
      'style="width:100%;max-width:730px;min-width:547px;height:auto;background-color:transparent"',
    );
  });

  test("adds the width rule style when the root has no style attribute", () => {
    const noStyle = TIMELINE.replace(' style="max-width: 1190px; background-color: transparent;"', "");
    const root = rootTag(finalizeSvg(noStyle, { id: "dbd-tl", acc: ACC }));
    expect(root).toContain(
      'style="width:100%;max-width:1190px;min-width:893px;height:auto;background-color:transparent"',
    );
  });

  test("accepts a lowercase viewbox attribute", () => {
    const lower = FLOW.replace('viewBox="0 0 729.5 512"', 'viewbox="0 0 400 300"');
    const root = rootTag(finalizeSvg(lower, { id: "dbd-abc", acc: ACC }));
    expect(root).toContain("max-width:400px;min-width:300px;");
  });

  test("throws a viewBox error when the root has no viewBox", () => {
    const missing = FLOW.replace(' viewBox="0 0 729.5 512"', "");
    expect(() => finalizeSvg(missing, { id: "dbd-abc", acc: ACC })).toThrow(/viewBox/);
  });

  test("throws on a Mermaid error diagram", () => {
    const error = TIMELINE.replace('aria-roledescription="timeline"', 'aria-roledescription="error"');
    expect(() => finalizeSvg(error, { id: "dbd-tl", acc: ACC })).toThrow();
  });

  test("throws when the SVG contains a double opening brace", () => {
    const braces = TIMELINE.replace("<text>2020</text>", "<text>{{x}}</text>");
    expect(() => finalizeSvg(braces, { id: "dbd-tl", acc: ACC })).toThrow(/\{\{/);
  });

  test("leaves nested svg elements and nested titles alone", () => {
    const nested = TIMELINE.replace(
      "<g><text>2020</text></g>",
      '<g><title>inner</title><svg viewBox="0 0 10 10" style="color:red"><rect/></svg></g>',
    );
    const out = finalizeSvg(nested, { id: "dbd-tl", acc: ACC });
    expect(out).toContain('<svg viewBox="0 0 10 10" style="color:red"><rect/></svg>');
    expect(out).toContain("<g><title>inner</title>");
    expect(out).toContain('<title id="dbd-tl-title">Judul</title>');
    expect(rootTag(out)).toContain("max-width:1190px;");
  });

  test("gives an existing title and desc without ids the ids the aria attributes point at", () => {
    const noIds = FLOW.replace('<title id="chart-title-dbd-abc">', "<title>").replace(
      '<desc id="chart-desc-dbd-abc">',
      "<desc>",
    );
    const out = finalizeSvg(noIds, { id: "dbd-abc", acc: ACC });
    expect(out).toContain('<title id="dbd-abc-title">T</title><desc id="dbd-abc-desc">D</desc>');
    expect(rootTag(out)).toContain('aria-labelledby="dbd-abc-title"');
    expect(rootTag(out)).toContain('aria-describedby="dbd-abc-desc"');
  });

  test("is idempotent for both chart shapes", () => {
    for (const [svg, id] of [
      [FLOW, "dbd-abc"],
      [TIMELINE, "dbd-tl"],
    ] as const) {
      const once = finalizeSvg(svg, { id, acc: ACC });
      expect(finalizeSvg(once, { id, acc: ACC })).toBe(once);
    }
  });
});

describe("finalizeSvg id scoping", () => {
  const out = finalizeSvg(SEQ, { id: "dbd-abc", acc: ACC });

  test("prefixes element ids that lack the diagram id", () => {
    expect(out).toContain('<g id="dbd-abc-root-1">');
    expect(out).toContain('<rect id="dbd-abc-actor0"/>');
    expect(out).toContain('<rect id="dbd-abc-fff"/>');
    expect(out).not.toContain('id="actor0"');
    expect(out).not.toContain('id="root-1"');
  });

  test("rewrites href, xlink:href and url() references to renamed ids", () => {
    expect(out).toContain('<use href="#dbd-abc-actor0"/>');
    expect(out).toContain('<use xlink:href="#dbd-abc-root-1"/>');
    expect(out).toContain('<path marker-end="url(#dbd-abc-root-1)"/>');
  });

  test("leaves references to ids that are not defined in the SVG alone", () => {
    expect(out).toContain('<use href="#actor01"/>');
  });

  test("keeps ids that already contain the diagram id and their references", () => {
    expect(out).toContain('<marker id="dbd-abc-arrowhead"/>');
    expect(out).toContain('<line marker-end="url(#dbd-abc-arrowhead)"/>');
    expect(out).toContain('<title id="chart-title-dbd-abc">T</title>');
    expect(rootTag(out)).toContain('id="dbd-abc"');
    expect(rootTag(out)).toContain('aria-labelledby="chart-title-dbd-abc"');
    expect(out).not.toContain("dbd-abc-dbd-abc");
    expect(out).not.toContain("dbd-abc-chart-");
  });

  test("rewrites aria id lists token by token", () => {
    expect(out).toContain('aria-labelledby="dbd-abc-actor0 actor01 dbd-abc-arrowhead"');
    expect(out).toContain('aria-describedby="dbd-abc-root-1"');
    expect(out).toContain('aria-owns="dbd-abc-fff  dbd-abc-actor0"');
  });

  test("rewrites exact id selectors in style but not colors or longer names", () => {
    const style = out.match(/<style>(.*?)<\/style>/)?.[1];
    expect(style).toBe(
      "#dbd-abc .actor{fill:#fff;}#dbd-abc-actor0{stroke:#fff}#dbd-abc-actor0>rect,#actor01 .x{fill:#fff}#dbd-abc-fff{fill:#fff}",
    );
  });

  test("is idempotent", () => {
    expect(finalizeSvg(out, { id: "dbd-abc", acc: ACC })).toBe(out);
  });

  test("scopes every id in a real cached sequence diagram", () => {
    const path = join(import.meta.dir, "../../books/iklan-digital-dan-penargetan-algoritma/diagrams/cc81a1d233cb.svg");
    const cached = readFileSync(path, "utf8");
    expect(cached).toContain('id="actor0"');
    const scoped = finalizeSvg(cached, { id: "dbd-cc81a1d233cb", acc: ACC });
    const ids = [...scoped.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(20);
    expect(ids.filter((id) => !id.includes("dbd-cc81a1d233cb"))).toEqual([]);
    expect(finalizeSvg(scoped, { id: "dbd-cc81a1d233cb", acc: ACC })).toBe(scoped);
  });
});
