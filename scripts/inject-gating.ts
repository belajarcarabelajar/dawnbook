import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

import { isPublicPath } from "../functions/lib/gating.ts";

async function processDirectory(dir: string, baseSlug: string = "") {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const entryStat = await stat(fullPath);
    if (entryStat.isDirectory()) {
      const slug = baseSlug || entry;
      await processDirectory(fullPath, slug);
    } else if (fullPath.endsWith(".html")) {
      let content = await readFile(fullPath, "utf-8");

      // Extract title from HTML
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      const pageTitle = titleMatch ? titleMatch[1] : "Dawnbook";
      
      // We can infer the URL path
      const relativePath = fullPath.split("output")[1].replace(/\\/g, "/");
      const url = `https://dawnbook.belajarcarabelajar.com${relativePath}`;
      
      // Inject SEO metadata
      const seoTags = `
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

      const isPublic = isPublicPath(relativePath);

      if (!isPublic) {
        // Inject head script to prevent FOUC with dynamic SEO-first gating
        const script = `
        <script>
          (function() {
            var currentPath = window.location.pathname;
            var freeChapter = null;
            try { freeChapter = sessionStorage.getItem('free_chapter_viewed'); } catch(e) {}
            if (freeChapter && freeChapter !== currentPath) {
              document.documentElement.style.opacity = '0';
              document.documentElement.style.visibility = 'hidden';
            } else {
              try { sessionStorage.setItem('free_chapter_viewed', currentPath); } catch(e) {}
            }
          })();
        </script>
        <noscript><style>html { opacity: 1 !important; visibility: visible !important; }</style></noscript>
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

