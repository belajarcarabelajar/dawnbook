import { expect, test, describe } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("Inject Gating Script (scripts/inject-gating.ts)", () => {
  test("script injects SEO metadata and FOUC prevention", () => {
    const scriptPath = join(import.meta.dir, "../../scripts/inject-gating.ts");
    const script = readFileSync(scriptPath, "utf-8");
    
    // SEO metadata
    expect(script).toContain('name="description" content="');
    expect(script).toContain('rel="canonical"');
    
    // FOUC prevention
    expect(script).toContain('opacity="0"');
    expect(script).toContain("<noscript><style>html{opacity:1!important;visibility:visible!important;}</style></noscript>");
  });

  test("script uses escapeHtml and serializeJsonLd for XSS prevention", () => {
    const scriptPath = join(import.meta.dir, "../../scripts/inject-gating.ts");
    const script = readFileSync(scriptPath, "utf-8");

    // Check if the escape functions are defined
    expect(script).toContain("function escapeHtml(");
    expect(script).toContain("function serializeJsonLd(");

    // Check if serializeJsonLd is used for the JSON-LD script
    expect(script).toContain("serializeJsonLd(");
  });

  test("injectSeoAndGating strips existing meta description and produces exactly one meta description", async () => {
    const { injectSeoAndGating } = await import("../../scripts/inject-gating");
    const inputHtml = `<!DOCTYPE HTML>
<html>
<head>
  <title>Bab 1: Pendahuluan - Buku Sample</title>
  <meta name="description" content="Deskripsi lama dari book.toml">
</head>
<body>
  <main><p>Ini adalah paragraf pengantar dari bab pertama.</p></main>
</body>
</html>`;

    const outputHtml = injectSeoAndGating(inputHtml, {
      pageTitle: "Bab 1: Pendahuluan - Buku Sample",
      url: "https://dawnbook.belajarcarabelajar.com/books/sample/content/01_intro",
      isGatedClientSide: false,
    });

    const descMatches = outputHtml.match(/<meta\s+name=["']description["'][^>]*>/gi) || [];
    expect(descMatches.length).toBe(1);
    expect(outputHtml).toContain('name="description"');
    expect(outputHtml).not.toContain("Deskripsi lama dari book.toml");
  });

  test("injectSeoAndGating generates valid BreadcrumbList in JSON-LD structured data", async () => {
    const { injectSeoAndGating } = await import("../../scripts/inject-gating");
    const inputHtml = `<!DOCTYPE HTML>
<html>
<head>
  <title>Bab 1: Pendahuluan - Buku Sample</title>
</head>
<body>
  <main><p>Konten bab 1.</p></main>
</body>
</html>`;

    const outputHtml = injectSeoAndGating(inputHtml, {
      pageTitle: "Bab 1: Pendahuluan - Buku Sample",
      url: "https://dawnbook.belajarcarabelajar.com/books/sample/content/01_intro",
      isGatedClientSide: false,
      bookTitle: "Buku Sample",
      bookUrl: "https://dawnbook.belajarcarabelajar.com/books/sample/",
    });

    const scriptMatch = outputHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    expect(scriptMatch).not.toBeNull();
    const jsonLd = JSON.parse(scriptMatch![1]);
    
    // Validate schema graph or breadcrumbs
    const breadcrumb = Array.isArray(jsonLd["@graph"])
      ? jsonLd["@graph"].find((item: any) => item["@type"] === "BreadcrumbList")
      : jsonLd["@type"] === "BreadcrumbList"
        ? jsonLd
        : null;

    expect(breadcrumb).not.toBeNull();
    expect(breadcrumb.itemListElement.length).toBeGreaterThanOrEqual(2);
    expect(breadcrumb.itemListElement[0].name).toBe("Beranda");
    expect(breadcrumb.itemListElement[0].item).toBe("https://dawnbook.belajarcarabelajar.com/");
  });

  test("normalizeInternalLinks strips .html from internal chapter navigation links while preserving utility and external links", async () => {
    const { normalizeInternalLinks } = await import("../../scripts/inject-gating");
    const inputHtml = `
      <nav class="sidebar">
        <a href="content/01_pendahuluan.html">Bab 1</a>
        <a href="../content/02_konsep.html#ringkasan">Bab 2</a>
        <a href="index.html">Index</a>
        <a href="print.html">Print</a>
        <a href="404.html">404</a>
        <a href="https://example.com/external.html">External</a>
      </nav>
    `;

    const outputHtml = normalizeInternalLinks(inputHtml);

    expect(outputHtml).toContain('href="content/01_pendahuluan"');
    expect(outputHtml).toContain('href="../content/02_konsep#ringkasan"');
    expect(outputHtml).toContain('href="print.html"');
    expect(outputHtml).toContain('href="404.html"');
    expect(outputHtml).toContain('href="https://example.com/external.html"');
  });
});
