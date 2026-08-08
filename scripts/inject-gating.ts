import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

function escapeHtml(unsafe: string): string {
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

function escapeJson(unsafe: string): string {
  return JSON.stringify(unsafe).replace(/</g, "\\u003c");
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
      let content = await readFile(fullPath, "utf-8");

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

      // GA is only injected when GA_MEASUREMENT_ID is provided; there is no
      // hardcoded fallback (F-106) so a misconfigured build never ships a bogus
      // or foreign measurement ID.
      const gaId = process.env.GA_MEASUREMENT_ID;
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

      let isGatedClientSide = false;
      const bookMatch = relativePath.match(
        /^\/books\/([a-zA-Z0-9_-]+)\/(.*)?$/,
      );
      if (bookMatch) {
        const slug = bookMatch[1];
        const page = decodeURIComponent(bookMatch[2] ?? "");
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

      const escapedTitle = escapeHtml(pageTitle);
      const escapedUrl = escapeHtml(url);
      const defaultImage =
        "https://dawnbook.belajarcarabelajar.com/icon-512.png";

      const jsonLdData: any = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: escapeJson(pageTitle),
        url: escapeJson(url),
        isAccessibleForFree: isGatedClientSide ? "false" : "true",
        publisher: {
          "@type": "Organization",
          name: "Dawnbook",
          url: "https://dawnbook.belajarcarabelajar.com",
        },
      };

      if (isGatedClientSide) {
        jsonLdData.hasPart = {
          "@type": "WebPageElement",
          isAccessibleForFree: "false",
          cssSelector: ".content",
        };
      }

      const seoTags = `
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script src="/register-sw.js" defer></script>
        <script src="/pake-compat.js" defer></script>
        <link rel="canonical" href="${escapedUrl}" />
        <link rel="alternate" hreflang="en" href="${escapedUrl}" />
        <link rel="alternate" hreflang="id" href="${escapedUrl}" />
        <meta name="description" content="${escapedTitle}" />
        <meta property="og:title" content="${escapedTitle}" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${escapedUrl}" />
        <meta property="og:image" content="${defaultImage}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapedTitle}" />
        <meta name="twitter:image" content="${defaultImage}" />
        <script type="application/ld+json">
        ${JSON.stringify(jsonLdData, null, 2)}
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
        // Inject head script to prevent FOUC with dynamic SEO-first gating
        const script = `
        <script>!function(){var e=window.location.pathname,t=null;try{t=sessionStorage.getItem("free_chapter_viewed")}catch(e){}if(t&&t!==e){document.documentElement.style.opacity="0";document.documentElement.style.visibility="hidden"}else{try{sessionStorage.setItem("free_chapter_viewed",e)}catch(e){}}}();</script>
        <noscript><style>html{opacity:1!important;visibility:visible!important;}</style></noscript>
        `;
        if (content.includes("</head>")) {
          content = content.replace("</head>", script + "\n</head>");
        }
      }

      await writeFile(fullPath, content, "utf-8");
    }
  }
}

processDirectory(join(process.cwd(), "output/books")).catch(console.error);
