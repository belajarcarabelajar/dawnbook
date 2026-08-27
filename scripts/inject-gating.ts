import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

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
  pageTitle: string;
  url: string;
  isGatedClientSide: boolean;
  gaId?: string;
  bookTitle?: string;
  bookUrl?: string;
  bookDescription?: string;
  isBookRoot?: boolean;
}

export function formatSerpDescription(text: string, maxLen = 160): string {
  if (!text) return "";
  let clean = text
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
  const targetSub = clean.substring(0, maxLen - 3);
  const lastSpaceIdx = targetSub.lastIndexOf(" ");
  if (lastSpaceIdx > 60) {
    return targetSub.substring(0, lastSpaceIdx).trim() + "...";
  }

  return targetSub.trim() + "...";
}

export function extractLeadText(html: string): string {
  const bodyMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return "";
  const body = bodyMatch[1];
  const pMatch = body.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!pMatch) return "";
  const clean = pMatch[1]
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
  return clean;
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

export function injectSeoAndGating(html: string, options: InjectSeoOptions): string {
  const { pageTitle, url, isGatedClientSide, gaId, bookDescription, isBookRoot } = options;

  let content = normalizeInternalLinks(html);

  // 1. Strip any pre-existing meta description to eliminate duplicates
  content = content.replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, "");

  // 2. Determine raw description based on page type
  const lead = extractLeadText(content);
  const rawDescription = (isBookRoot && bookDescription)
    ? bookDescription
    : (lead || `${pageTitle} - Buku edukasi terbuka Dawnbook. Pelajari ringkasan materi dan pembahasan lengkap bab ini.`);

  // 3. Format according to strict Google SERP guidelines (sentence & word-boundary aware, 110-160 chars)
  const finalDescription = formatSerpDescription(rawDescription, 160);

  const escapedTitle = escapeHtml(pageTitle);
  const escapedDesc = escapeHtml(finalDescription);
  const escapedUrl = escapeHtml(url);
  const defaultImage = "https://dawnbook.belajarcarabelajar.com/icon-512.png";

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
        <script src="/register-sw.js" defer></script>
        <script src="/pake-compat.js" defer></script>
        <link rel="canonical" href="${escapedUrl}" />
        <link rel="alternate" hreflang="en" href="${escapedUrl}" />
        <link rel="alternate" hreflang="id" href="${escapedUrl}" />
        <meta name="description" content="${escapedDesc}" />
        <meta property="og:title" content="${escapedTitle}" />
        <meta property="og:description" content="${escapedDesc}" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${escapedUrl}" />
        <meta property="og:image" content="${defaultImage}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapedTitle}" />
        <meta name="twitter:description" content="${escapedDesc}" />
        <meta name="twitter:image" content="${defaultImage}" />
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
      await processDirectory(fullPath, slug, manifestData);
    } else if (fullPath.endsWith(".html")) {
      const content = await readFile(fullPath, "utf-8");

      // Extract title from HTML
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      const pageTitle = titleMatch ? titleMatch[1] : "Dawnbook";

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
        } catch {}

        if (page === "" || page === "index.html") {
          isBookRoot = true;
        }

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
      });

      await writeFile(fullPath, updatedContent, "utf-8");
    }
  }
}

if (import.meta.main) {
  processDirectory(join(process.cwd(), "output/books")).catch(console.error);
}
