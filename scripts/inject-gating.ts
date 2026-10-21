import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ogImagePath } from "./og/paths";

export function escapeHtml(unsafe: string): string {
  return unsafe.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return m;
    }
  });
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
}

export interface InjectSeoOptions {
  /** Plain text; it is escaped here. processDirectory decodes the escaped `<title>` mdBook writes. */
  pageTitle: string;
  url: string;
  isGatedClientSide: boolean;
  gaId?: string;
  bookTitle?: string;
  bookUrl?: string;
  bookDescription?: string;
  isBookRoot?: boolean;
  /** Absolute URL of the page's share card (GEMINI.md section 27); the site icon when absent. */
  ogImage?: string;
  /** What the card shows, for og:image:alt; defaults to the page title. */
  ogImageAlt?: string;
}

/** Pages mdBook writes besides the SUMMARY.md chapters; they get no share card. */
const NO_CARD_PAGES = new Set(["toc.html", "404.html", "print.html"]);

/** URL of a book page's share card, or undefined when render-og-cards wrote none. */
export function shareCardUrl(outputDir: string, slug: string, page: string): string | undefined {
  const cardPage = page === "" || page === "index.html" ? "index" : page.replace(/\.html$/, "");
  const rel = ogImagePath(slug, cardPage);
  return existsSync(join(outputDir, rel)) ? `https://dawnbook.belajarcarabelajar.com${rel}` : undefined;
}

const NAMED_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/**
 * Decodes HTML entities in one pass, including the numeric ones mdBook's
 * templates write (`&#x27;` for an apostrophe), so `&amp;lt;` stays `&lt;`.
 */
export function decodeHtmlEntities(str: string): string {
  return str.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (entity, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
  });
}

export function formatSerpDescription(text: string, maxLen = 155): string {
  if (!text) return "";
  let clean = decodeHtmlEntities(text)
    .replace(/\\\(|\\\)/g, "")
    .replace(/\[\^[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();

  if (clean.length <= maxLen) {
    return clean;
  }

  // 1. Prioritize complete sentence boundary (. ! ?) within maxLen
  const firstChunk = clean.substring(0, maxLen);
  const sentenceEndMatches = [...firstChunk.matchAll(/[.!?](?:\s|$)/g)];
  if (sentenceEndMatches.length > 0) {
    const lastSentenceEnd = sentenceEndMatches[sentenceEndMatches.length - 1];
    const sentenceCut = clean.substring(0, lastSentenceEnd.index! + 1).trim();
    if (sentenceCut.length >= 70) {
      return sentenceCut;
    }
  }

  // 2. Otherwise truncate cleanly at word boundary
  let targetSub = clean.substring(0, maxLen - 3);
  const lastSpaceIdx = targetSub.lastIndexOf(" ");
  if (lastSpaceIdx > 60) {
    targetSub = targetSub.substring(0, lastSpaceIdx).trim();
  }

  // Strip trailing dangling prepositions/conjunctions before ellipsis
  targetSub = targetSub
    .replace(/\s+(di|ke|dari|pada|untuk|dengan|dan|atau|yang|ini|itu|sebagai|adalah|akan|telah|sudah|bisa|dapat|oleh)$/i, "")
    .trim();

  return targetSub + "...";
}

export function extractLeadText(html: string): string {
  const bodyMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return "";
  // Diagram labels can be rendered as <p> inside an inline SVG and must not become the lead text.
  const body = bodyMatch[1].replace(/<svg\b[\s\S]*?<\/svg>/gi, "");
  // Match only <p> itself, not <pre>, <param>, <picture>, etc.
  const pMatches = [...body.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)];
  if (pMatches.length === 0) return "";

  let combined = "";
  for (const m of pMatches) {
    const cleanP = m[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\s+([.,;:!?])/g, "$1")
      .trim();
    if (cleanP.length > 0) {
      if (combined.length === 0) {
        combined = cleanP;
      } else {
        combined += " " + cleanP;
      }
      if (combined.length >= 100) break;
    }
  }
  return decodeHtmlEntities(combined);
}

export function normalizeInternalLinks(html: string): string {
  return html.replace(
    /href="([^":?#\s]+)\.html(#[^"]*)?"/g,
    (match, path, hash) => {
      const fileName = path.split("/").pop();
      if (fileName === "print" || fileName === "404" || fileName === "toc") {
        return match;
      }
      if (path.endsWith("index")) {
        const prefix = path.slice(0, -"index".length);
        return `href="${prefix || "./"}${hash || ""}"`;
      }
      return `href="${path}${hash || ""}"`;
    },
  );
}

const MDBOOK_THEME_SCRIPTS: { name: string; matches: (body: string) => boolean }[] = [
  {
    name: "default-themes script",
    matches: (body) => body.includes("const default_light_theme =") && body.includes("const default_dark_theme ="),
  },
  {
    name: "localStorage quote workaround script",
    matches: (body) => body.includes("localStorage.getItem('mdbook-theme')") && body.includes("theme.startsWith('\"')"),
  },
  {
    name: "theme bootstrap script",
    matches: (body) => body.includes("const default_theme ="),
  },
];

export function markThemeScriptsCfAsync(html: string): string {
  const found = new Set<string>();
  // Rocket Loader defers every script without data-cfasync="false"; these must run before first paint.
  const result = html.replace(
    /<script( data-cfasync="false")?>([\s\S]*?)<\/script>/g,
    (match, marked: string | undefined, body: string) => {
      const script = MDBOOK_THEME_SCRIPTS.find((candidate) => candidate.matches(body));
      if (!script) return match;
      found.add(script.name);
      return marked ? match : `<script data-cfasync="false">` + match.slice("<script>".length);
    },
  );

  // The generator comment keeps the guard alive if an mdBook upgrade renames the toggle id.
  if (html.includes('id="mdbook-theme-toggle"') || html.includes("<!-- Book generated using mdBook -->")) {
    const missing = MDBOOK_THEME_SCRIPTS.filter((script) => !found.has(script.name)).map((script) => script.name);
    if (missing.length > 0) {
      throw new Error(`mdBook page is missing its ${missing.join(", ")}; check the mdBook markup before deploying`);
    }
  }

  return result;
}

export function injectSeoAndGating(html: string, options: InjectSeoOptions): string {
  const { pageTitle, url, isGatedClientSide, gaId, bookDescription, isBookRoot, ogImage, ogImageAlt } = options;

  let content = markThemeScriptsCfAsync(normalizeInternalLinks(html));

  // 1. Strip any pre-existing meta description to eliminate duplicates
  content = content.replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, "");

  // 2. Determine raw description based on page type
  const lead = extractLeadText(content);
  const rawDescription = (isBookRoot && bookDescription)
    ? bookDescription
    : (lead || `${pageTitle} - Buku edukasi terbuka Dawnbook. Pelajari ringkasan materi dan pembahasan lengkap bab ini.`);

  // 3. Format according to strict Google SERP guidelines (sentence & word-boundary aware, 110-160 chars)
  let finalDescription = formatSerpDescription(rawDescription, 155);
  let escapedDesc = escapeHtml(finalDescription);
  if (escapedDesc.length > 160) {
    finalDescription = formatSerpDescription(rawDescription, 145);
    escapedDesc = escapeHtml(finalDescription);
  }

  const escapedTitle = escapeHtml(pageTitle);
  const escapedUrl = escapeHtml(url);
  const defaultImage = "https://dawnbook.belajarcarabelajar.com/icon-512.png";
  const image = escapeHtml(ogImage ?? defaultImage);
  const cardSizeTags = ogImage
    ? `
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="${escapeHtml(ogImageAlt ?? pageTitle)}" />`
    : "";

  const articleData: any = {
    "@type": "Article",
    headline: pageTitle,
    url: url,
    description: finalDescription,
    isAccessibleForFree: isGatedClientSide ? "false" : "true",
    publisher: {
      "@type": "Organization",
      name: "Dawnbook",
      url: "https://dawnbook.belajarcarabelajar.com",
    },
  };

  if (isGatedClientSide) {
    articleData.hasPart = {
      "@type": "WebPageElement",
      isAccessibleForFree: "false",
      cssSelector: ".content",
    };
  }

  const breadcrumbItems: any[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Beranda",
      item: "https://dawnbook.belajarcarabelajar.com/",
    },
  ];

  const bookTitle = options.bookTitle;
  const bookUrl = options.bookUrl;

  if (bookTitle && bookUrl) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: bookTitle,
      item: bookUrl,
    });
    if (url !== bookUrl && url !== bookUrl.replace(/\/$/, "")) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 3,
        name: pageTitle,
        item: url,
      });
    }
  } else {
    const match = url.match(/^https?:\/\/[^\/]+\/books\/([^\/]+)/);
    if (match) {
      const slug = match[1];
      const inferredBookUrl = `https://dawnbook.belajarcarabelajar.com/books/${slug}/`;
      const inferredBookTitle = slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 2,
        name: inferredBookTitle,
        item: inferredBookUrl,
      });
      if (!url.endsWith(`/books/${slug}/`) && !url.endsWith(`/books/${slug}`)) {
        breadcrumbItems.push({
          "@type": "ListItem",
          position: 3,
          name: pageTitle,
          item: url,
        });
      }
    }
  }

  const breadcrumbData = {
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [articleData, breadcrumbData],
  };

  const gaTag = gaId
    ? `
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', '${gaId}');
    </script>
`
    : "";

  const seoTags = `
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script src="/pake-compat.js" defer></script>
        <link rel="canonical" href="${escapedUrl}" />
        <link rel="alternate" hreflang="en" href="${escapedUrl}" />
        <link rel="alternate" hreflang="id" href="${escapedUrl}" />
        <meta name="description" content="${escapedDesc}" />
        <meta property="og:title" content="${escapedTitle}" />
        <meta property="og:description" content="${escapedDesc}" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${escapedUrl}" />
        <meta property="og:image" content="${image}" />${cardSizeTags}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapedTitle}" />
        <meta name="twitter:description" content="${escapedDesc}" />
        <meta name="twitter:image" content="${image}" />
        <script type="application/ld+json">
        ${serializeJsonLd(schemaGraph)}
        </script>
  `;

  if (content.includes("<head>")) {
    content = content.replace("<head>", "<head>" + gaTag);
  } else if (content.match(/<head[^>]*>/i)) {
    content = content.replace(/<head[^>]*>/i, "$&" + gaTag);
  }

  if (content.includes("</head>")) {
    content = content.replace("</head>", seoTags + "\n</head>");
  }

  if (isGatedClientSide) {
    const script = `
        <script>!function(){var e=window.location.pathname,t=null;try{t=sessionStorage.getItem("free_chapter_viewed")}catch(e){}if(t&&t!==e){document.documentElement.style.opacity="0";document.documentElement.style.visibility="hidden"}else{try{sessionStorage.setItem("free_chapter_viewed",e)}catch(e){}}}();</script>
        <noscript><style>html{opacity:1!important;visibility:visible!important;}</style></noscript>
    `;
    if (content.includes("</head>")) {
      content = content.replace("</head>", script + "\n</head>");
    }
  }

  return content;
}

async function processDirectory(
  dir: string,
  baseSlug: string = "",
  manifestData: any = null,
  missingCards: string[] = [],
) {
  if (!manifestData) {
    const manifestRaw = await readFile(
      join(process.cwd(), "output/manifest.json"),
      "utf8",
    );
    manifestData = JSON.parse(manifestRaw);
  }

  const entries = await readdir(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const entryStat = await stat(fullPath);
    if (entryStat.isDirectory()) {
      const slug = baseSlug || entry;
      await processDirectory(fullPath, slug, manifestData, missingCards);
    } else if (fullPath.endsWith(".html")) {
      const content = await readFile(fullPath, "utf-8");

      // Extract title from HTML
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      // mdBook's <title> is HTML-escaped; decode it once so every tag escapes it exactly once.
      const pageTitle = titleMatch ? decodeHtmlEntities(titleMatch[1]) : "Dawnbook";

      // We can infer the URL path (strip .html / index.html to match canonical 200 OK Cloudflare format)
      const relativePath = fullPath.split("output")[1].replace(/\\/g, "/");
      let cleanRelativePath = relativePath;
      if (cleanRelativePath.endsWith("/index.html")) {
        cleanRelativePath = cleanRelativePath.replace(/\/index\.html$/, "/");
      } else if (cleanRelativePath.endsWith(".html")) {
        cleanRelativePath = cleanRelativePath.replace(/\.html$/, "");
      }
      const url = `https://dawnbook.belajarcarabelajar.com${cleanRelativePath}`;

      const gaId = process.env.GA_MEASUREMENT_ID;

      let isGatedClientSide = false;
      let bookDescription = "";
      let isBookRoot = false;
      let ogImage: string | undefined;
      let ogImageAlt: string | undefined;
      const bookMatch = relativePath.match(
        /^\/books\/([a-zA-Z0-9_-]+)\/(.*)?$/,
      );
      if (bookMatch) {
        const slug = bookMatch[1];
        const page = decodeURIComponent(bookMatch[2] ?? "");

        try {
          const tomlContent = await readFile(
            join(process.cwd(), `books/${slug}/book.toml`),
            "utf-8",
          );
          const descMatch = tomlContent.match(/description\s*=\s*"(.*?)"/s);
          if (descMatch) {
            bookDescription = descMatch[1].replace(/\\"/g, '"');
          }
          // The root page repeats the first chapter, but its card is the book card.
          const titleMatch = tomlContent.match(/^\s*title\s*=\s*"((?:[^"\\]|\\.)*)"/m);
          if (titleMatch && (page === "" || page === "index.html")) {
            ogImageAlt = titleMatch[1].replace(/\\"/g, '"');
          }
        } catch {}

        if (page === "" || page === "index.html") {
          isBookRoot = true;
        }

        // render-og-cards writes og/<slug>/<page>.png. A chapter page without one means the two
        // disagree on its name, which would silently ship the site icon, so the build fails.
        ogImage = shareCardUrl(join(process.cwd(), "output"), slug, page);
        if (!ogImage && !NO_CARD_PAGES.has(page)) missingCards.push(relativePath);

        if (
          page !== "" &&
          page !== "index.html" &&
          page !== "toc.html" &&
          page !== "404.html" &&
          page !== "print.html"
        ) {
          const bookChapters = manifestData.chapters[slug] || [];
          const firstChapterPath =
            bookChapters[0] || `/books/${slug}/index.html`;

          const decodedFirstChapter = decodeURIComponent(firstChapterPath);
          const decodedCurrent = decodeURIComponent(relativePath);
          if (
            decodedCurrent !== decodedFirstChapter &&
            decodedCurrent !== `/books/${slug}/index.html`
          ) {
            isGatedClientSide = true;
          }
        }
      }

      const updatedContent = injectSeoAndGating(content, {
        pageTitle,
        url,
        isGatedClientSide,
        gaId,
        bookDescription,
        isBookRoot,
        ogImage,
        ogImageAlt,
      });

      await writeFile(fullPath, updatedContent, "utf-8");
    }
  }
}

if (import.meta.main) {
  const missingCards: string[] = [];
  processDirectory(join(process.cwd(), "output/books"), "", null, missingCards).then(() => {
    if (missingCards.length > 0) {
      console.error(`No share card for ${missingCards.length} book page(s); render-og-cards and inject-gating disagree on their names:`);
      for (const page of missingCards) console.error(`  ${page}`);
      process.exit(1);
    }
  }).catch((error) => {
    // A zero exit would let `bun run build` ship pages without SEO and paywall markup.
    console.error(error);
    process.exit(1);
  });
}
