// Question: in each forced mdBook theme at 375 px and 1280 px, do the SVG colours resolve from mdBook variables and does every label fit its box?
// Usage: bun run shoot-and-measure.ts <out-dir> <tag> [themes...]
const puppeteer = (await import("/home/belajarcarabelajar/.bun/install/global/node_modules/puppeteer-core")).default;

const [outDir, tag, ...rest] = process.argv.slice(2);
const themes = rest.length ? rest : ["light", "rust", "coal", "navy", "ayu"];
const widths = [1280, 375];
const shots = "/tmp/mermaid-spike/p1/shots";
const page0 = `${outDir}/content/02_anatomi-loop-kebiasaan`;

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
let failures = 0;
for (const theme of themes) {
  for (const width of widths) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 1100, deviceScaleFactor: 1 });
    // The CDN MathJax request never matters for this question; block remote hosts so load is deterministic.
    await page.setRequestInterception(true);
    page.on("request", (r) => (r.url().startsWith("file:") || r.url().startsWith("data:") ? r.continue() : r.abort()));
    await page.goto(`file://${page0}.${theme}.html`, { waitUntil: "load", timeout: 30000 });
    // FORCE_FONT simulates a reader whose sans-serif differs from the render machine; EXTRA_CSS tries wrapper styles.
    const extra = (process.env.FORCE_FONT ? `.dawnbook-diagram svg text{font-family:${process.env.FORCE_FONT}!important}` : "") + (process.env.EXTRA_CSS ?? "");
    if (extra) await page.addStyleTag({ content: extra });
    await new Promise((r) => setTimeout(r, 800));
    const info = await page.evaluate(() => {
      const html = document.documentElement;
      const hs = getComputedStyle(html);
      const wrap = document.querySelector(".dawnbook-diagram") as HTMLElement | null;
      const svg = wrap?.querySelector("svg") as SVGSVGElement | null;
      if (!svg) return { error: "no svg" } as any;
      const vb = svg.viewBox.baseVal;
      const r = svg.getBoundingClientRect();
      const scale = r.width / vb.width;
      const misfits: string[] = [];
      const check = (label: string, box: SVGGraphicsElement | null, txt: SVGGraphicsElement | null, boxGroup: Element, txtGroup: Element) => {
        if (!box || !txt) { misfits.push(`${label}: missing box or text`); return; }
        // Compare in screen pixels so transforms on nested groups are accounted for.
        const b = box.getBoundingClientRect();
        const t = txt.getBoundingClientRect();
        if (t.width === 0) return;
        const pad = 0.5;
        if (t.left < b.left - pad || t.right > b.right + pad || t.top < b.top - pad || t.bottom > b.bottom + pad)
          misfits.push(`${label}: text ${t.width.toFixed(1)}x${t.height.toFixed(1)} box ${b.width.toFixed(1)}x${b.height.toFixed(1)}`);
      };
      svg.querySelectorAll("g.node").forEach((n) => {
        check(`node ${n.id}`, n.querySelector("rect.label-container, polygon, circle, path") as any, n.querySelector("text") as any, n, n);
      });
      svg.querySelectorAll("g.cluster").forEach((c) => {
        check(`cluster ${c.id}`, c.querySelector("rect") as any, c.querySelector(".cluster-label text") as any, c, c);
      });
      const nodeRect = svg.querySelector("g.node rect.label-container") as SVGElement;
      const nodeText = svg.querySelector("g.node text") as SVGElement;
      const link = svg.querySelector(".flowchart-link") as SVGElement;
      const marker = svg.querySelector("marker .arrowMarkerPath") as SVGElement;
      const elRect = svg.querySelector(".edgeLabel rect.background, .edgeLabel rect") as SVGElement | null;
      const cs = (e: Element | null, p: string) => (e ? getComputedStyle(e).getPropertyValue(p) : "n/a");
      return {
        htmlClass: html.className,
        opacity: hs.opacity, visibility: hs.visibility,
        vars: { bg: hs.getPropertyValue("--bg").trim(), fg: hs.getPropertyValue("--fg").trim(), quoteBg: hs.getPropertyValue("--quote-bg").trim() },
        bodyBg: getComputedStyle(document.body).backgroundColor,
        nodeFill: cs(nodeRect, "fill"), nodeStroke: cs(nodeRect, "stroke"),
        textFill: cs(nodeText, "fill"), textFont: cs(nodeText, "font-family"), textSize: cs(nodeText, "font-size"),
        linkStroke: cs(link, "stroke"), markerFill: cs(marker, "fill"), edgeLabelBg: cs(elRect, "fill"),
        svgWidthPx: Math.round(r.width), viewBoxW: Math.round(vb.width), scale: +scale.toFixed(3),
        effectiveFontPx: +(16 * scale).toFixed(1),
        contentWidth: Math.round((document.querySelector("main") as HTMLElement)?.getBoundingClientRect().width ?? 0),
        misfits,
      };
    });
    await page.evaluate(() => {
      const d = document.querySelector(".dawnbook-diagram") as HTMLElement;
      d.scrollIntoView({ block: "start" });
      window.scrollBy(0, -90);
    });
    const png = `${shots}/${tag}-${theme}-${width}.png`;
    await page.screenshot({ path: png });
    if (info.misfits?.length) failures++;
    console.log(JSON.stringify({ theme, width, png, ...info }));
    await page.close();
  }
}
await browser.close();
process.exit(failures ? 1 : 0);
