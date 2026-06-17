import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

async function processDirectory(dir: string) {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const entryStat = await stat(fullPath);
    if (entryStat.isDirectory()) {
      await processDirectory(fullPath);
    } else if (fullPath.endsWith(".html")) {
      let content = await readFile(fullPath, "utf-8");

      const basename = entry;
      const isPublic = basename === "index.html" || basename === "toc.html" || basename === "404.html";

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
        `;
        if (content.includes("</head>")) {
          content = content.replace("</head>", script + "</head>");
          await writeFile(fullPath, content, "utf-8");
        }
      }
    }
  }
}

processDirectory(join(process.cwd(), "output/books")).catch(console.error);
