import { describe, expect, test } from "bun:test";
import { extractLeadText } from "../../scripts/inject-gating";

const diagram = `<div class="dawnbook-diagram">
<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" role="img">
  <g class="node"><path d="M0 0 L10 10"/>
    <foreignObject width="80" height="20"><div xmlns="http://www.w3.org/1999/xhtml"><p>Label satu</p></div></foreignObject>
  </g>
  <p>Label dua</p>
</svg>
</div>`;

describe("extractLeadText with inline SVG diagrams", () => {
  test("skips paragraphs inside an SVG placed after the lead paragraph", () => {
    const html = `<html><body><main>
<p>Kamu belajar lebih cepat saat istirahat cukup.</p>
${diagram}
<p>Tidur membantu memori jangka panjang.</p>
</main></body></html>`;
    const lead = extractLeadText(html);
    expect(lead).toContain("Kamu belajar lebih cepat saat istirahat cukup.");
    expect(lead).toContain("Tidur membantu memori jangka panjang.");
    expect(lead).not.toContain("Label satu");
    expect(lead).not.toContain("Label dua");
  });

  test("skips paragraphs inside an SVG placed before the first paragraph", () => {
    const html = `<html><body><main>
${diagram}
<p>Kamu belajar lebih cepat saat istirahat cukup.</p>
<p>Tidur membantu memori jangka panjang.</p>
</main></body></html>`;
    const lead = extractLeadText(html);
    expect(lead.startsWith("Kamu belajar lebih cepat saat istirahat cukup.")).toBe(true);
    expect(lead).toContain("Tidur membantu memori jangka panjang.");
    expect(lead).not.toContain("Label satu");
    expect(lead).not.toContain("Label dua");
  });

  test("leaves the output unchanged when the page has no SVG", () => {
    const html = `<html><body><main><h1>Bab Satu</h1>
<p>Kamu belajar <em>lebih cepat</em> saat istirahat cukup .</p>
<pre><code>kode contoh</code></pre>
<p class="note">Tidur &amp; jeda pendek membantu memori , terutama setelah sesi panjang yang menguras fokus kamu.</p>
<p>Paragraf ketiga tidak ikut.</p>
</main></body></html>`;
    expect(extractLeadText(html)).toBe(
      "Kamu belajar lebih cepat saat istirahat cukup. Tidur & jeda pendek membantu memori, terutama setelah sesi panjang yang menguras fokus kamu.",
    );
  });
});
