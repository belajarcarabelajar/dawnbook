import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

import { isPublicPath } from "../functions/lib/gating.ts";

async function processDirectory(dir: string, baseSlug: string = "", manifestData: any = null) {
  if (!manifestData) {
    const manifestRaw = await readFile(join(process.cwd(), "output/manifest.json"), "utf8");
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
      
      // We can infer the URL path
      const relativePath = fullPath.split("output")[1].replace(/\\/g, "/");
      const url = `https://dawnbook.belajarcarabelajar.com${relativePath}`;
      
      const gaId = process.env.GA_MEASUREMENT_ID || "G-Q33QN4S14P";
      const seoTags = `
        <!-- Google Analytics (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        </script>
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script src="/register-sw.js" defer></script>
        <script src="/pake-compat.js" defer></script>
        <link rel="canonical" href="${url}" />
        <link rel="alternate" hreflang="en" href="${url}" />
        <link rel="alternate" hreflang="id" href="${url}" />
        <meta name="description" content="${pageTitle}" />
        <meta property="og:title" content="${pageTitle}" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${url}" />
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "${pageTitle}",
          "url": "${url}"
        }
        </script>
      `;
      if (content.includes("</head>")) {
        content = content.replace("</head>", seoTags + "\n</head>");
      }

      let isGatedClientSide = false;
      const bookMatch = relativePath.match(/^\/books\/([a-zA-Z0-9_-]+)\/(.*)?$/);
      if (bookMatch) {
        const slug = bookMatch[1];
        const page = decodeURIComponent(bookMatch[2] ?? "");
        if (page !== "" && page !== "index.html" && page !== "toc.html" && page !== "404.html" && page !== "print.html") {
          const bookChapters = manifestData.chapters[slug] || [];
          const firstChapterPath = bookChapters[0] || `/books/${slug}/index.html`;

          const decodedFirstChapter = decodeURIComponent(firstChapterPath);
          const decodedCurrent = decodeURIComponent(relativePath);
          if (decodedCurrent !== decodedFirstChapter && decodedCurrent !== `/books/${slug}/index.html`) {
            isGatedClientSide = true;
          }
        }
      }

      if (isGatedClientSide) {
        // Inject head script to prevent FOUC with dynamic SEO-first gating
        const script = `
        <script>!function(){var e=window.location.pathname,t=null;try{t=sessionStorage.getItem("free_chapter_viewed")}catch(e){}t&&t!==e?(document.documentElement.style.opacity="0",document.documentElement.style.visibility="hidden"):try{sessionStorage.setItem("free_chapter_viewed",e)}catch(e){}}();</script>
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

