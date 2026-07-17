import { readdir, stat, mkdir, writeFile, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { $ } from "bun";
import { isPublicPath } from "../functions/lib/gating.ts";

try {
  const envContent = await readFile(
    join(process.cwd(), "apps/admin/.env.local"),
    "utf8",
  );
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim();
  });
} catch (e) {
  console.warn(".env.local not found, skipping");
}

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function build() {
  if (!process.env.VITE_CLERK_PUBLISHABLE_KEY) {
    console.error(
      "❌ Error: VITE_CLERK_PUBLISHABLE_KEY environment variable is not set.",
    );
    process.exit(1);
  }

  let clerkDomain = "";
  try {
    const keyBody = process.env.VITE_CLERK_PUBLISHABLE_KEY.replace(
      /^pk_(test|live)_/,
      "",
    );
    const padded = keyBody.padEnd(
      keyBody.length + ((4 - (keyBody.length % 4)) % 4),
      "=",
    );
    clerkDomain = Buffer.from(padded, "base64")
      .toString("utf8")
      .replace(/\$$/, "");
  } catch (e) {
    console.warn("Could not parse Clerk domain from publishable key", e);
  }

  const rootDir = process.cwd();
  const booksDir = join(rootDir, "books");
  const outputDir = join(rootDir, "output");
  const outputBooksDir = join(outputDir, "books");

  // Ensure output directories exist
  await mkdir(outputDir, { recursive: true });
  await mkdir(outputBooksDir, { recursive: true });

  const entries = await readdir(booksDir);
  const builtBooks: {
    slug: string;
    title: string;
    author: string;
    chapterCount: number;
    emoji: string;
    chapters: string[];
  }[] = [];

  console.log("Synchronizing book configurations from _template...");
  await $`bun run scripts/sync-template.ts`;

  console.log("Checking LaTeX support across all books...");
  await $`bun run scripts/check-latex-support.ts`;

  console.log("Checking media embed support across all books...");
  await $`bun run scripts/check-media-support.ts`;

  for (const entry of entries) {
    const bookPath = join(booksDir, entry);
    const bookStat = await stat(bookPath);

    if (bookStat.isDirectory()) {
      if (entry.startsWith("_")) continue;
      if (!/^[a-zA-Z0-9_-]+$/.test(entry)) {
        console.warn(`Skipping invalid directory name: ${entry}`);
        continue;
      }

      try {
        await stat(join(bookPath, "book.toml"));
      } catch {
        continue;
      }

      console.log(`Building book: ${entry}`);
      const destPath = join(outputBooksDir, entry);

      try {
        await $`mdbook build ${bookPath} -d ${destPath}`;
        let formattedTitle = entry
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        let author = "Iwan Kurniawan";
        try {
          const tomlText = await readFile(join(bookPath, "book.toml"), "utf8");
          const titleMatch = tomlText.match(/title\s*=\s*"([^"]+)"/);
          if (titleMatch) formattedTitle = titleMatch[1];
          const authorsMatch = tomlText.match(
            /authors\s*=\s*\[\s*"([^"]+)"\s*\]/,
          );
          if (authorsMatch) author = authorsMatch[1];
        } catch (e) {
          console.warn("Failed to parse book.toml title or author", e);
        }

        let chapterCount = 0;
        let chapters: string[] = [];
        try {
          const summaryText = await readFile(
            join(bookPath, "src", "SUMMARY.md"),
            "utf8",
          );
          const lines = summaryText
            .split("\n")
            .filter((line) => line.trim().startsWith("- ["));
          chapterCount = lines.length;
          chapters = lines
            .map((line) => {
              const match = line.match(/\]\((.*?)\.md\)/);
              if (match) {
                let filename = match[1];
                filename = decodeURIComponent(filename.replace(/^\.\//, ""));
                if (filename === "README" || filename === "index")
                  return `/books/${entry}/index.html`;
                return `/books/${entry}/${filename}.html`;
              }
              return null;
            })
            .filter(Boolean) as string[];
        } catch (e) {
          console.warn(`Could not read SUMMARY.md for ${entry}`);
        }
        let emoji = "📖";
        try {
          const iconText = await readFile(join(bookPath, "icon.txt"), "utf8");
          if (iconText.trim()) emoji = iconText.trim();
        } catch (e) {
          console.warn("Failed to read icon.txt, falling back to generic", e);
        }
        builtBooks.push({
          slug: entry,
          title: formattedTitle,
          author,
          chapterCount,
          emoji,
          chapters,
        });
        console.log(`Successfully built: ${entry}`);
      } catch (error) {
        console.error(`Failed to build book: ${entry}`, error);
        process.exit(1);
      }
    }
  }

  // Sort builtBooks alphabetically to ensure consistent initial HTML order before JS hydration
  builtBooks.sort((a, b) => a.title.localeCompare(b.title));

  console.log("Generating premium hub site...");

  const minifyJs = (js: string) =>
    js
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/\s+/g, " ")
      .trim();
  const minifyCss = (css: string) =>
    css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*([{}:;,])\s*/g, "$1")
      .trim();

  const enCatalog = await readFile(join(rootDir, "i18n/en.json"), "utf8");
  const idCatalog = await readFile(join(rootDir, "i18n/id.json"), "utf8");
  const runtimeScript = await readFile(
    join(rootDir, "apps/hub/src/scripts/i18n-runtime.js"),
    "utf8",
  );

  const i18nInjection = `
    <script>
      window.I18N_CATALOGS = {
        en: ${enCatalog},
        id: ${idCatalog}
      };
    </script>
    <script>
      ${minifyJs(runtimeScript)}
    </script>
  `;

  const generatePage = (
    title: string,
    content: string,
    isHome: boolean = false,
  ) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Dawnbook - A Scalable Educational Publishing Platform">
    <meta name="theme-color" content="#000000">
    <meta name="clerk-publishable-key" content="${process.env.VITE_CLERK_PUBLISHABLE_KEY}">
    <title>${title} | Dawnbook Platform</title>
    ${clerkDomain ? `<link rel="preconnect" href="https://${clerkDomain}" crossorigin>\n    <link rel="dns-prefetch" href="https://${clerkDomain}">` : ""}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,400..900;1,400..900&family=Syne:wght@400..800&display=swap">
    <link href="https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,400..900;1,400..900&family=Syne:wght@400..800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,400..900;1,400..900&family=Syne:wght@400..800&display=swap"></noscript>
        <script src="/pake-compat.js" defer></script>
    <link rel="icon" type="image/svg+xml" href="${isHome ? "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌅</text></svg>" : "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📓</text></svg>"}">
    <link rel="stylesheet" href="/typography.css?v=${Date.now()}">
    <link rel="stylesheet" href="/tokens.css?v=${Date.now()}">
    <link rel="stylesheet" href="/HubLayout.css?v=${Date.now()}">
    <script>
      ${minifyJs(`
      function safeStorageGet(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
      }
      function safeStorageSet(key, value) {
        try { localStorage.setItem(key, value); } catch (e) {}
      }
      function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.querySelectorAll('.theme-toggle').forEach(btn => btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false'));
      }
      (function() {
        const mdTheme = safeStorageGet('mdbook-theme');
        let saved = safeStorageGet('theme');
        if (mdTheme) {
            saved = (mdTheme === 'light' || mdTheme === 'rust' || mdTheme === 'ayu') ? 'light' : 'dark';
            safeStorageSet('theme', saved);
        }
        if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            saved = 'light';
        }
        if (saved) document.documentElement.setAttribute('data-theme', saved);
      })();
      function toggleTheme() {
        const root = document.documentElement;
        let currentTheme = root.getAttribute('data-theme');
        if (!currentTheme) currentTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        safeStorageSet('theme', newTheme);
        safeStorageSet('mdbook-theme', newTheme === 'light' ? 'light' : 'coal');
      }
      function toggleMenu() {
        document.querySelector('.nav-links').classList.toggle('is-open');
      }
      window.addEventListener('storage', function(e) {
        if (e.key === 'mdbook-theme') {
          const newTheme = (e.newValue === 'light' || e.newValue === 'rust' || e.newValue === 'ayu') ? 'light' : 'dark';
          applyTheme(newTheme);
          safeStorageSet('theme', newTheme);
        }
      });
      document.addEventListener('DOMContentLoaded', function() {
         const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
         applyTheme(currentTheme);
      });
      `)}
    </script>
    ${i18nInjection}
</head>
<body>
    <a href="#main-content" class="skip-link" style="position: absolute; top: -40px; left: 0; background: var(--color-primary); color: var(--color-background); padding: 8px; z-index: 1000; transition: top 0.2s;" data-i18n="hub.nav.skip">Skip to content</a>
    <div class="hub-layout">
        <div class="desktop-top-controls">
            <div id="desktop-user-controls" style="display: flex; align-items: center;"></div>
            <button class="lang-toggle-btn" data-i18n="hub.lang.toggle" style="background: transparent; border: 1px solid var(--color-secondary); color: var(--color-text); border-radius: 4px; cursor: pointer; height: 36px; min-width: 44px; display: flex; align-items: center; justify-content: center; font-weight: 600; padding: 0 8px;">EN</button>
            <button onclick="toggleTheme()" class="theme-toggle-icon theme-toggle desktop-theme-btn" aria-label="Toggle Theme" aria-pressed="false">
                <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </button>
        </div>
        <aside class="side-nav">
            <div class="side-nav-header">
                <button class="mobile-menu-toggle" onclick="toggleMenu()" aria-label="Toggle Navigation">☰</button>
                <a href="/" class="logo">Dawnbook</a>
                <div class="mobile-controls">
                    <button class="lang-toggle-btn" data-i18n="hub.lang.toggle" style="background: transparent; border: 1px solid var(--color-secondary); color: var(--color-text); border-radius: 4px; cursor: pointer; height: 36px; min-width: 44px; display: flex; align-items: center; justify-content: center; font-weight: 600; padding: 0 8px;">EN</button>
                    <button onclick="toggleTheme()" class="theme-toggle-icon theme-toggle mobile-theme-btn" aria-label="Toggle Theme" aria-pressed="false">
                        <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                        <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                    </button>
                    <div id="mobile-user-controls" style="display: flex; align-items: center;"></div>
                </div>
            </div>
            <nav class="nav-links" aria-label="Main Navigation">
                <a href="/" class="${isHome ? "active" : ""}" ${isHome ? 'aria-current="page"' : ""} data-i18n="hub.home">Home</a>
                <a href="/about.html" class="${title === "About" ? "active" : ""}" ${title === "About" ? 'aria-current="page"' : ""} data-i18n="hub.about">About</a>
                <a href="/contribute.html" class="${title === "Contribute" ? "active" : ""}" ${title === "Contribute" ? 'aria-current="page"' : ""} data-i18n="hub.contribute">Contribute</a>
                <a href="/donate.html" class="${title === "Donate" ? "active" : ""}" ${title === "Donate" ? 'aria-current="page"' : ""} data-i18n="hub.donate">Donate</a>
            </nav>
        </aside>
        <main id="main-content" class="hub-main">
            ${content}
        </main>
    </div>
</body>
</html>`;

  const indexContent = `
    <div class="hero-section">
        <h1 data-i18n="hub.hero.title">Dawn Has Arrived</h1>
        <p data-i18n="hub.hero.subtitle">Learning is everyone's right. Here, you can learn anything, anytime, and absolutely free. Free your mind!</p>
    </div>

    <h2 style="margin-bottom: var(--spacing-lg); color: var(--color-primary);" data-i18n="hub.books.title">Available Books</h2>
    
    <div class="book-filters" style="display: flex; gap: 12px; margin-bottom: var(--spacing-lg); flex-wrap: wrap;">
        <input type="text" id="search-input" placeholder="Search by title..." style="padding: 8px 12px; border-radius: 4px; border: 1px solid var(--color-secondary); background: var(--color-background); color: var(--color-text); flex: 1; min-width: 200px;">
        <select id="subject-filter" style="padding: 8px 32px 8px 12px; border-radius: 4px; border: 1px solid var(--color-secondary); background: var(--color-background); color: var(--color-text); min-width: 200px; -webkit-appearance: none; appearance: none; background-image: url('data:image/svg+xml;utf8,<svg fill=\"none\" stroke=\"%23999\" stroke-width=\"2\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M19 9l-7 7-7-7\"></path></svg>'); background-repeat: no-repeat; background-position: right 8px center; background-size: 16px;">
            <option value="">All Subjects</option>
        </select>
        <select id="sort-select" style="padding: 8px 32px 8px 12px; border-radius: 4px; border: 1px solid var(--color-secondary); background: var(--color-background); color: var(--color-text); -webkit-appearance: none; appearance: none; background-image: url('data:image/svg+xml;utf8,<svg fill=\"none\" stroke=\"%23999\" stroke-width=\"2\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M19 9l-7 7-7-7\"></path></svg>'); background-repeat: no-repeat; background-position: right 8px center; background-size: 16px;">
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="oldest">Oldest First</option>
        </select>
    </div>

    <div class="book-masonry" style="opacity: 0; transition: opacity 0.5s ease-in-out;">
      ${builtBooks
        .map(
          (b) => `
        <a href="/books/${escapeHtml(b.slug)}/" class="book-card" data-slug="${escapeHtml(b.slug)}" style="display: flex; flex-direction: column; padding: 20px; position: relative; transition: all 0.3s ease; height: 100%;">
            <div style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                    <span style="font-size: 48px; line-height: 1; display: inline-block; min-height: 48px; min-width: 48px;">${b.emoji}</span>
                    <div class="top-right-cluster">
                        <span class="subject-label-wrapper" style="display: none;"><span class="subject-label-chip"></span></span>
                        <span class="view-count-badge" style="display: none;">👁 0</span>
                        <button class="pin-toggle-btn" onclick="event.preventDefault(); togglePin(event, '${escapeHtml(b.slug)}')" title="Pin Book">📌</button>
                    </div>
                </div>
                <h3 style="margin: 0 0 8px 0; font-size: 1.15rem; line-height: 1.4; color: var(--color-text); font-weight: 500;">${escapeHtml(b.title)}</h3>
            </div>
            <div style="margin-top: auto; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 0.85rem; color: var(--color-secondary);">
                <span>${escapeHtml(b.author)} • ${b.chapterCount} chapter</span>
                <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 2px 6px; border: 1px solid var(--color-secondary); border-radius: 4px; opacity: 0.8;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                    FREE
                </div>
            </div>
        </a>
      `,
        )
        .join("")}
    </div>
    <script>
      ${minifyJs(`
      function getPinned() {
          return JSON.parse(safeStorageGet('pinned_books') || '[]');
      }
      function setPinned(arr) {
          safeStorageSet('pinned_books', JSON.stringify(arr));
      }
      function togglePin(e, slug) {
          e.preventDefault();
          e.stopPropagation();
          let pinned = getPinned();
          if (pinned.includes(slug)) {
              pinned = pinned.filter(p => p !== slug);
          } else {
              pinned.push(slug);
          }
          setPinned(pinned);
          reorderBooks();
      }
      let serverBooksData = [];

      function reorderBooks() {
          const container = document.querySelector('.book-masonry');
          const cards = Array.from(container.querySelectorAll('.book-card'));
          const pinned = getPinned();
          const pinnedSet = new Set(pinned);
          const bookDataMap = new Map();
          serverBooksData.forEach(b => bookDataMap.set(b.slug, b));

          const sortVal = document.getElementById('sort-select') ? document.getElementById('sort-select').value : 'newest';
          const filterVal = document.getElementById('subject-filter') ? document.getElementById('subject-filter').value : '';
          const searchVal = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase() : '';

          cards.forEach(card => {
              const slug = card.getAttribute('data-slug');
              const bData = bookDataMap.get(slug);
              const cardSubject = bData && bData.subject_label ? bData.subject_label : '';
              const titleText = card.querySelector('h3').innerText.toLowerCase();
              
              let visible = true;
              if (filterVal && cardSubject !== filterVal) visible = false;
              if (searchVal && !titleText.includes(searchVal)) visible = false;

              if (!visible) {
                  card.style.display = 'none';
              } else {
                  card.style.display = 'flex';
              }
          });

          cards.sort((a, b) => {
              const slugA = a.getAttribute('data-slug');
              const slugB = b.getAttribute('data-slug');
              const aPinned = pinnedSet.has(slugA);
              const bPinned = pinnedSet.has(slugB);
              
              if (aPinned && !bPinned) return -1;
              if (!aPinned && bPinned) return 1;

              const dataA = bookDataMap.get(slugA);
              const dataB = bookDataMap.get(slugB);
              
              if (sortVal === 'popular' && dataA && dataB) {
                  if (dataB.view_count !== dataA.view_count) {
                      return dataB.view_count - dataA.view_count;
                  }
              } else if (sortVal === 'oldest' && dataA && dataB) {
                  return new Date(dataA.created_at) - new Date(dataB.created_at);
              }
              // newest default
              if (dataA && dataB) {
                  return new Date(dataB.created_at) - new Date(dataA.created_at);
              }
              return 0;
          });

          cards.forEach(card => {
              const slug = card.getAttribute('data-slug');
              const btn = card.querySelector('.pin-toggle-btn');
              if (pinnedSet.has(slug)) {
                  card.style.borderColor = 'var(--color-primary)';
                  card.style.background = 'var(--color-surface-hover, rgba(255,255,255,0.02))';
                  if(btn) {
                      btn.style.filter = 'grayscale(0)';
                      btn.style.opacity = '1';
                      btn.style.transform = 'scale(1.2)';
                  }
              } else {
                  card.style.borderColor = '';
                  card.style.background = '';
                  if(btn) {
                      btn.style.filter = 'grayscale(1)';
                      btn.style.opacity = '0.3';
                      btn.style.transform = 'scale(1)';
                  }
              }
              container.appendChild(card);
          });
      }

      function loadBookMetadata() {
          fetch('/api/books?content=false')
            .then(res => res.json())
            .then(data => {
                if (data.books) {
                    serverBooksData = data.books;
                    const subjects = new Set();
                    data.books.forEach(b => {
                        if (b.subject_label) subjects.add(b.subject_label);
                        const card = document.querySelector('.book-card[data-slug="' + b.slug + '"]');
                        if (card) {
                            const viewBadge = card.querySelector('.view-count-badge');
                            const subjectWrapper = card.querySelector('.subject-label-wrapper');
                            const subjectChip = card.querySelector('.subject-label-chip');
                            if (viewBadge) {
                                viewBadge.innerText = '👁 ' + (b.view_count || 0);
                                viewBadge.style.display = 'inline-block';
                            }
                            if (subjectWrapper && subjectChip && b.subject_label) {
                                subjectChip.innerText = b.subject_label;
                                subjectWrapper.style.display = 'inline-block';
                                subjectWrapper.style.cursor = 'pointer';
                                subjectWrapper.onclick = (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const filter = document.getElementById('subject-filter');
                                    if (filter) {
                                        filter.value = b.subject_label;
                                        reorderBooks();
                                    }
                                };
                            }
                        }
                    });
                    const subjectFilter = document.getElementById('subject-filter');
                    if (subjectFilter) {
                        Array.from(subjects).sort().forEach(sub => {
                            const opt = document.createElement('option');
                            opt.value = sub;
                            opt.innerText = sub;
                            subjectFilter.appendChild(opt);
                        });
                        subjectFilter.addEventListener('change', reorderBooks);
                    }
                    const sortSelect = document.getElementById('sort-select');
                    if (sortSelect) {
                        sortSelect.addEventListener('change', reorderBooks);
                    }
                    const searchInput = document.getElementById('search-input');
                    if (searchInput) {
                        searchInput.addEventListener('input', reorderBooks);
                    }
                    reorderBooks();
                }
            })
            .catch(err => {
                console.error(err);
                reorderBooks();
            })
            .finally(() => {
                const container = document.querySelector('.book-masonry');
                if (container) container.style.opacity = '1';
            });
      }

      document.addEventListener('DOMContentLoaded', () => {
          reorderBooks();
          loadBookMetadata();
          initClerk();
      });

      function initClerk() {
        var clerkPk = '${process.env.VITE_CLERK_PUBLISHABLE_KEY}';
        var keyBody = clerkPk.replace(/^pk_(test|live)_/, '');
        while (keyBody.length % 4 !== 0) { keyBody += '='; }
        var domain = atob(keyBody).replace(/\\$$/, '');
        var script = document.createElement('script');
        script.src = 'https://' + domain + '/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
        script.setAttribute('data-clerk-publishable-key', clerkPk);
        script.async = true;
        script.onload = function() {
            if (window.Clerk) {
                window.Clerk.load().then(function() {
                    mountUserControls();
                }).catch(console.error);
            }
        };
        document.head.appendChild(script);
      }

      function mountUserControls() {
        var desktopEl = document.getElementById('desktop-user-controls');
        var mobileEl = document.getElementById('mobile-user-controls');
        if (!window.Clerk) return;

        if (window.Clerk.user) {
          // Authenticated: mount Clerk UserButton with custom menu item
          if (desktopEl) {
            window.Clerk.mountUserButton(desktopEl, {
              appearance: { elements: { userButtonAvatarBox: { width: '32px', height: '32px' } } },
              userProfileMode: 'navigation',
              userProfileUrl: '/appreciation.html',
              afterSignOutUrl: '/'
            });
          }
          if (mobileEl) {
            window.Clerk.mountUserButton(mobileEl, {
              appearance: { elements: { userButtonAvatarBox: { width: '28px', height: '28px' } } },
              userProfileMode: 'navigation',
              userProfileUrl: '/appreciation.html',
              afterSignOutUrl: '/'
            });
          }
        } else {
          // Not authenticated: show Sign In button
          function createSignInBtn() {
            var btn = document.createElement('a');
            btn.href = '/sign-in';
            btn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0 12px;border-radius:4px;border:1px solid var(--color-secondary);color:var(--color-text);text-decoration:none;font-size:0.85rem;font-weight:600;transition:background 0.15s;white-space:nowrap;';
            btn.setAttribute('data-i18n', 'hub.signin');
            btn.textContent = 'Sign In';
            btn.onmouseenter = function() { btn.style.background = 'var(--color-surface)'; };
            btn.onmouseleave = function() { btn.style.background = 'transparent'; };
            return btn;
          }
          if (desktopEl) desktopEl.appendChild(createSignInBtn());
          if (mobileEl) mobileEl.appendChild(createSignInBtn());
          // Re-apply locale so data-i18n on new elements gets translated
          if (window.applyLocale) window.applyLocale();
        }
      }
      `)}
    </script>
  `;

  const aboutContent = `
    <div class="content-panel">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md)" data-i18n="about.philosophy.title">Our Philosophy</h2>
        <p data-i18n="about.philosophy.body">Knowledge is a shared commons and a fundamental right, not a commodity to be hoarded or paywalled. We exist to make high-quality, autodidactic learning a reality for everyone.</p>

        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md); margin-top: var(--spacing-lg)" data-i18n="about.why.title">Why Dawnbook Exists</h2>
        <p data-i18n="about.why.body">Dawnbook was built to actively reduce the education gap and reject exploitative paywalled models. By dismantling financial barriers, we ensure that free and open access is the baseline, not a premium feature.</p>

        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md); margin-top: var(--spacing-lg)" data-i18n="about.core.title">Core Principles</h2>
        <ul>
            <li style="margin-bottom: var(--spacing-sm)"><strong data-i18n="about.core.1.strong">Free for All:</strong> <span data-i18n="about.core.1">Absolutely free with no hidden cost.</span></li>
            <li style="margin-bottom: var(--spacing-sm)"><strong data-i18n="about.core.2.strong">Open & Collaborative:</strong> <span data-i18n="about.core.2">Driven by open collaboration and contribution from a worldwide community.</span></li>
            <li style="margin-bottom: var(--spacing-sm)"><strong data-i18n="about.core.3.strong">Equality of Access:</strong> <span data-i18n="about.core.3">Accessible to anyone, anywhere, anytime.</span></li>
            <li style="margin-bottom: var(--spacing-sm)"><strong data-i18n="about.core.4.strong">Self-Directed Learning:</strong> <span data-i18n="about.core.4">Fostering lifelong learning and the critical thinking necessary to pursue truth independently.</span></li>
        </ul>

        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md); margin-top: var(--spacing-lg)" data-i18n="about.motif.title">The Dawn Motif</h2>
        <p data-i18n="about.motif.body">The dawn signifies the end of the night and the arrival of a new era of freedom. It represents our profound belief that the light of education should reach every corner of the world, illuminating minds and liberating individuals.</p>
    </div>
  `;

  const contributeContent = `
    <div class="content-panel">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md)" data-i18n="contribute.join.title">Join the Authors</h2>
        <p data-i18n="contribute.join.body1">We believe knowledge should be free and openly collaborative. You can contribute by writing a new chapter, fixing typos, or even starting a brand new book.</p>
        <p data-i18n="contribute.join.body2">All contributions are managed via GitHub Pull Requests, ensuring a high standard of quality through peer review.</p>
        <a href="https://github.com/belajarcarabelajar/dawnbook" class="btn-primary" style="margin-bottom: var(--spacing-lg)" target="_blank" data-i18n="contribute.btn.github">View on GitHub</a>

        <hr style="border: 0; border-top: 1px solid var(--color-secondary); margin: var(--spacing-lg) 0;">

        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md)" data-i18n="contribute.contributors.title">Main Contributors</h2>
        <div class="contributors-grid">
            <div class="contributor-card">
                <img src="https://snipset.belajarcarabelajar.com/images/creator.webp" alt="Iwan Kurniawan" class="contributor-avatar">
                <div class="contributor-info">
                    <h3 class="contributor-name"><a href="https://github.com/belajarcarabelajar" target="_blank" rel="noopener noreferrer" data-i18n="contribute.contributor1.name">Iwan Kurniawan</a></h3>
                    <p class="contributor-role" data-i18n="contribute.contributor1.role">Content Creator, Developer, and Founder @belajarcarabelajar</p>
                </div>
            </div>
            <div class="contributor-card">
                <img src="https://d2oi1rqwb0pj00.cloudfront.net/user/nio_1740330104156_100.webp" alt="Kania Salsabila" class="contributor-avatar">
                <div class="contributor-info">
                    <h3 class="contributor-name"><a href="https://github.com/kaniasalsabila639-ops" target="_blank" rel="noopener noreferrer" data-i18n="contribute.contributor2.name">Kania Salsabila</a></h3>
                    <p class="contributor-role" data-i18n="contribute.contributor2.role">Best Scientific Paper, Outstanding Student (Mawapres), Faculty of Languages and Arts 2026, Universitas Negeri Jakarta</p>
                </div>
            </div>
        </div>
    </div>
  `;

  const donateContent = `
    <div class="content-panel" style="max-width: 720px;">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-sm)" data-i18n="donate.title">Support Dawnbook</h2>
        <p style="color: var(--color-text-muted); margin-bottom: var(--spacing-lg); line-height: 1.7;" data-i18n="donate.subtitle">Your generosity helps us deliver free books to school libraries and community reading spaces in underserved regions (3T areas).</p>

        <div style="display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg);">
            <!-- Bank Transfer Card -->
            <div style="background: var(--color-surface); border: 1px solid var(--color-secondary); border-radius: var(--spacing-md); padding: var(--spacing-lg);">
                <h3 style="color: var(--color-primary); margin: 0 0 var(--spacing-md) 0; font-size: 1.1rem;" data-i18n="donate.bank.title">Bank Transfer</h3>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem;">
                        <span style="color: var(--color-text-muted);" data-i18n="donate.bank.name">BCA</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; background: var(--color-background); border: 1px solid var(--color-secondary); border-radius: 6px; padding: 12px 16px;">
                        <span id="bank-account-number" style="font-size: 1.3rem; font-weight: 700; font-family: var(--font-family-display); letter-spacing: 2px; color: var(--color-primary);">3761558747</span>
                        <button id="copy-btn" onclick="copyAccountNumber()" style="background: var(--color-primary); color: var(--color-background); border: none; border-radius: 4px; padding: 6px 14px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s;" data-i18n="donate.bank.copy">Copy</button>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--color-text-muted);">a.n. <strong style="color: var(--color-text);" data-i18n="donate.bank.holder">Iwan Kurniawan</strong></div>
                </div>
            </div>

            <!-- QRIS Card -->
            <div style="background: var(--color-surface); border: 1px solid var(--color-secondary); border-radius: var(--spacing-md); padding: var(--spacing-lg); text-align: center;">
                <h3 style="color: var(--color-primary); margin: 0 0 var(--spacing-sm) 0; font-size: 1.1rem;" data-i18n="donate.qris.title">Scan QRIS</h3>
                <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: var(--spacing-md);" data-i18n="donate.qris.desc">Scan the QR code below using any e-wallet or mobile banking app.</p>
                <div style="background: #ffffff; border-radius: 12px; padding: 16px; display: inline-block; max-width: 280px; width: 100%;">
                    <img src="https://img.berduflare.com/img/800/bsob0d3ebsoe6947mv_2/LmqNNYTpPwFLHsiLmJQR01lnZ5YUVTySJrzPuA11wXg.webp" alt="QRIS Code" width="280" height="280" style="width: 100%; height: auto; aspect-ratio: 1/1; border-radius: 8px; display: block;">
                </div>
            </div>
        </div>

        <!-- WhatsApp Confirmation -->
        <div style="margin-top: var(--spacing-lg); text-align: center;">
            <h3 style="color: var(--color-primary); margin-bottom: var(--spacing-sm);" data-i18n="donate.wa.title">Confirm Your Donation</h3>
            <a href="https://wa.me/6282129267114?text=Halo%20Kak%20Iwan%2C%20saya%20baru%20saja%20melakukan%20donasi%20untuk%20Dawnbook.%20Berikut%20adalah%20bukti%20transfernya." target="_blank" rel="noopener noreferrer" class="btn-primary" style="display: inline-flex; align-items: center; gap: 8px; animation: none; opacity: 1; transform: none;" data-i18n="donate.wa.btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Confirm via WhatsApp
            </a>
        </div>
    </div>
    <script>
      ${minifyJs(`
      function copyAccountNumber() {
        var text = document.getElementById('bank-account-number').textContent;
        navigator.clipboard.writeText(text).then(function() {
          var btn = document.getElementById('copy-btn');
          var originalText = btn.textContent;
          btn.textContent = '✓';
          btn.style.background = '#22c55e';
          setTimeout(function() {
            btn.textContent = originalText;
            btn.style.background = 'var(--color-primary)';
          }, 2000);
        }).catch(function() {
          // Fallback for older browsers
          var ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        });
      }
      `)}
    </script>
  `;

  const appreciationContent = `
    <div class="content-panel" style="max-width: 600px; text-align: center;">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-sm);" data-i18n="appreciation.title">Your Appreciation Badge</h2>
        <p style="color: var(--color-text-muted); margin-bottom: var(--spacing-lg);" data-i18n="appreciation.subtitle">Thank you for supporting free education.</p>
        <div id="appreciation-content" style="min-height: 200px; display: flex; align-items: center; justify-content: center;">
            <p style="color: var(--color-text-muted);">Loading...</p>
        </div>
    </div>
    <script>
      ${minifyJs(`
      var badgeColors = {
        Gold: { bg: '#fbbf24', border: '#f59e0b', text: '#78350f', fill: '#fcd34d' },
        Silver: { bg: '#d1d5db', border: '#9ca3af', text: '#1f2937', fill: '#e5e7eb' },
        Bronze: { bg: '#d97706', border: '#b45309', text: '#451a03', fill: '#fbbf24' }
      };

      function escapeClientHtml(unsafe) {
        if (!unsafe) return "";
        return unsafe.toString()
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function renderBadge(tierName, userName, message) {
        var c = badgeColors[tierName] || badgeColors.Bronze;
        var safeUserName = escapeClientHtml(userName);
        return '<div style="animation: fadeSlideUp 0.6s ease forwards;">' +
          '<svg width="160" height="160" viewBox="0 0 160 160" style="margin-bottom: 24px;">' +
            '<circle cx="80" cy="80" r="72" fill="' + c.bg + '" stroke="' + c.border + '" stroke-width="4"/>' +
            '<circle cx="80" cy="80" r="60" fill="' + c.fill + '" opacity="0.3"/>' +
            '<text x="80" y="70" text-anchor="middle" font-size="40" fill="' + c.text + '">&#9733;</text>' +
            '<text x="80" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="' + c.text + '">' + tierName.toUpperCase() + '</text>' +
            '<text x="80" y="118" text-anchor="middle" font-size="10" fill="' + c.text + '" opacity="0.8">PATRON</text>' +
          '</svg>' +
          '<h3 style="color: var(--color-primary); margin: 0 0 8px 0; font-size: 1.4rem;">' + safeUserName + '</h3>' +
          '<p data-i18n="badge.' + tierName.toLowerCase() + '" style="color: var(--color-primary); font-weight: 700; font-size: 1.1rem; margin-bottom: 16px;">' + tierName + ' Patron</p>' +
          '<p data-i18n="appreciation.' + tierName.toLowerCase() + '.msg" style="color: var(--color-text-muted); line-height: 1.7; max-width: 450px; margin: 0 auto;">' + message + '</p>' +
        '</div>';
      }

      function renderNoBadge() {
        return '<div style="animation: fadeSlideUp 0.6s ease forwards;">' +
          '<svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom: 24px; opacity: 0.3;">' +
            '<circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-secondary)" stroke-width="3" stroke-dasharray="8 4"/>' +
            '<text x="60" y="68" text-anchor="middle" font-size="36" fill="var(--color-text-muted)">?</text>' +
          '</svg>' +
          '<h3 data-i18n="appreciation.nobadge.title" style="color: var(--color-primary); margin: 0 0 8px 0;">No Badge Yet</h3>' +
          '<p data-i18n="appreciation.nobadge.desc" style="color: var(--color-text-muted); margin-bottom: 24px; line-height: 1.7;">You haven\\\'t made a donation yet. Support Dawnbook and earn your badge!</p>' +
          '<a href="/donate.html" class="btn-primary" style="animation: none; opacity: 1; transform: none;" data-i18n="appreciation.nobadge.cta">Donate Now</a>' +
        '</div>';
      }

      function renderSignInPrompt() {
        return '<div style="animation: fadeSlideUp 0.6s ease forwards;">' +
          '<p style="color: var(--color-text-muted); margin-bottom: 16px;" data-i18n="signin.body">Create a free account or sign in to access the full book content.</p>' +
          '<a href="/sign-in?redirect_url=/appreciation.html" class="btn-primary" style="animation: none; opacity: 1; transform: none;" data-i18n="hub.signin">Sign In</a>' +
        '</div>';
      }

      (function() {
        var container = document.getElementById('appreciation-content');

        function doRender() {
          if (!window.Clerk.user) {
            container.innerHTML = renderSignInPrompt();
          } else {
            var meta = window.Clerk.user.publicMetadata || {};
            var badge = meta.donation_badge;
            var name = window.Clerk.user.fullName || window.Clerk.user.firstName || 'Supporter';
            if (badge && badgeColors[badge]) {
              var messages = { Gold: 'You are a Gold Patron.', Silver: 'You are a Silver Patron.', Bronze: 'You are a Bronze Patron.' };
              container.innerHTML = renderBadge(badge, name, messages[badge] || '');
            } else {
              container.innerHTML = renderNoBadge();
            }
          }
          if (window.applyLocale) window.applyLocale();
        }

        function bootClerk() {
          var metaTag = document.querySelector('meta[name="clerk-publishable-key"]');
          if (!metaTag) {
            container.innerHTML = renderSignInPrompt();
            return;
          }
          var pk = metaTag.getAttribute('content');
          var keyBody = pk.replace(/^pk_(test|live)_/, '');
          while (keyBody.length % 4 !== 0) { keyBody += '='; }
          try {
            var domain = atob(keyBody).replace(/\\$$/, '');
            var script = document.createElement('script');
            script.src = 'https://' + domain + '/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
            script.setAttribute('data-clerk-publishable-key', pk);
            script.async = true;
            script.onload = function() {
              if (window.Clerk) {
                window.Clerk.load().then(doRender).catch(function() { doRender(); });
              } else {
                container.innerHTML = renderSignInPrompt();
              }
            };
            script.onerror = function() { container.innerHTML = renderSignInPrompt(); };
            document.head.appendChild(script);
          } catch(e) {
            container.innerHTML = renderSignInPrompt();
          }
        }

        // If Clerk was already loaded by another script on the page, use it directly.
        // Otherwise self-bootstrap from the meta publishable-key tag.
        if (window.Clerk && window.Clerk.loaded) {
          doRender();
        } else if (window.Clerk) {
          window.Clerk.load().then(doRender).catch(function() { doRender(); });
        } else {
          document.addEventListener('DOMContentLoaded', bootClerk);
        }
      })();
      `)}
    </script>
  `;

  // Generate the sign-in page that redirects to Clerk Hosted Sign-In
  // The redirect_url query param is forwarded so the user returns to the gated page.
  const signInContent = `
    <div class="content-panel" style="text-align: center; margin: 0 auto; max-width: 450px; padding: var(--spacing-xl);">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md)" data-i18n="signin.title">Sign In to Continue Reading</h2>
        <p style="margin-bottom: var(--spacing-lg)" data-i18n="signin.body">Create a free account or sign in to access the full book content.</p>
        <div id="clerk-sign-in" style="display: flex; justify-content: center; margin-bottom: var(--spacing-lg); width: 100%;"></div>
        <p style="font-size: 0.875rem; opacity: 0.7;"><span data-i18n="signin.powered">Powered by</span> <a href="https://clerk.dev" target="_blank" style="color: var(--color-primary)">Clerk</a></p>
    </div>
    <script>
      ${minifyJs(`
      (function() {
        var params = new URLSearchParams(window.location.search);
        var redirectUrl = params.get('redirect_url') || '/';
        var container = document.getElementById('clerk-sign-in');

        var clerkOptions = {
          afterSignInUrl: redirectUrl,
          afterSignUpUrl: redirectUrl,
          fallbackRedirectUrl: redirectUrl,
          forceRedirectUrl: redirectUrl,
          signUpUrl: '/sign-up'
        };

        if (window.Clerk) {
          if (window.Clerk.user) {
            window.location.href = redirectUrl;
            return;
          }
          window.Clerk.mountSignIn(container, clerkOptions);
        } else {
          var meta = document.querySelector('meta[name="clerk-publishable-key"]');
          if (!meta) {
            container.innerHTML = '<p data-i18n="signin.loading">Authentication is being configured. Please try again shortly.</p>';
            return;
          }
          var pk = meta.getAttribute('content');
          var keyBody = pk.replace(/^pk_(test|live)_/, '');
          while (keyBody.length % 4 !== 0) {
            keyBody += '=';
          }
          try {
            var domain = atob(keyBody).replace(/\\$$/, '');
            var script = document.createElement('script');
            script.src = 'https://' + domain + '/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
            script.setAttribute('data-clerk-publishable-key', pk);
            script.async = true;
            script.onload = function() {
              if (window.Clerk) {
                window.Clerk.load().then(function() {
                  if (window.Clerk.user) {
                    window.location.href = redirectUrl;
                  } else {
                    window.Clerk.mountSignIn(container, clerkOptions);
                  }
                }).catch(function(err) {
                  container.innerHTML = '<p>Error loading Clerk: ' + err.message + '</p>';
                });
              }
            };
            document.head.appendChild(script);
          } catch(e) {
            container.innerHTML = '<p>Unable to load sign-in. Please contact support. ' + e.message + '</p>';
          }
        }
      })();
      `)}
    </script>
  `;

  // Generate the sign-up page that redirects to Clerk Hosted Sign-Up
  const signUpContent = `
    <div class="content-panel" style="text-align: center; margin: 0 auto; max-width: 450px; padding: var(--spacing-xl);">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md)">Sign Up to Continue Reading</h2>
        <p style="margin-bottom: var(--spacing-lg)" data-i18n="signin.body">Create a free account or sign in to access the full book content.</p>
        <div id="clerk-sign-up" style="display: flex; justify-content: center; margin-bottom: var(--spacing-lg); width: 100%;"></div>
        <p style="font-size: 0.875rem; opacity: 0.7;"><span data-i18n="signin.powered">Powered by</span> <a href="https://clerk.dev" target="_blank" style="color: var(--color-primary)">Clerk</a></p>
    </div>
    <script>
      ${minifyJs(`
      (function() {
        var params = new URLSearchParams(window.location.search);
        var redirectUrl = params.get('redirect_url') || '/';
        var container = document.getElementById('clerk-sign-up');

        var clerkOptions = {
          afterSignInUrl: redirectUrl,
          afterSignUpUrl: redirectUrl,
          fallbackRedirectUrl: redirectUrl,
          forceRedirectUrl: redirectUrl,
          signInUrl: '/sign-in'
        };

        if (window.Clerk) {
          if (window.Clerk.user) {
            window.location.href = redirectUrl;
            return;
          }
          window.Clerk.mountSignUp(container, clerkOptions);
        } else {
          var meta = document.querySelector('meta[name="clerk-publishable-key"]');
          if (!meta) {
            container.innerHTML = '<p data-i18n="signin.loading">Authentication is being configured. Please try again shortly.</p>';
            return;
          }
          var pk = meta.getAttribute('content');
          var keyBody = pk.replace(/^pk_(test|live)_/, '');
          while (keyBody.length % 4 !== 0) {
            keyBody += '=';
          }
          try {
            var domain = atob(keyBody).replace(/\\$$/, '');
            var script = document.createElement('script');
            script.src = 'https://' + domain + '/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
            script.setAttribute('data-clerk-publishable-key', pk);
            script.async = true;
            script.onload = function() {
              if (window.Clerk) {
                window.Clerk.load().then(function() {
                  if (window.Clerk.user) {
                    window.location.href = redirectUrl;
                  } else {
                    window.Clerk.mountSignUp(container, clerkOptions);
                  }
                }).catch(function(err) {
                  container.innerHTML = '<p>Error loading Clerk: ' + err.message + '</p>';
                });
              }
            };
            document.head.appendChild(script);
          } catch(e) {
            container.innerHTML = '<p>Unable to load sign-up. Please contact support. ' + e.message + '</p>';
          }
        }
      })();
      `)}
    </script>
  `;

  await writeFile(
    join(outputDir, "index.html"),
    generatePage("Home", indexContent, true),
  );
  await writeFile(
    join(outputDir, "about.html"),
    generatePage("About", aboutContent),
  );
  await writeFile(
    join(outputDir, "contribute.html"),
    generatePage("Contribute", contributeContent),
  );
  await writeFile(
    join(outputDir, "donate.html"),
    generatePage("Donate", donateContent),
  );
  await writeFile(
    join(outputDir, "appreciation.html"),
    generatePage("Appreciation", appreciationContent),
  );
  await writeFile(
    join(outputDir, "sign-in.html"),
    generatePage("Sign In", signInContent),
  );
  await writeFile(
    join(outputDir, "sign-up.html"),
    generatePage("Sign Up", signUpContent),
  );
  const manifestData = {
    books: builtBooks.map((b) => b.slug),
    chapters: builtBooks.reduce(
      (acc, b) => {
        acc[b.slug] = b.chapters;
        return acc;
      },
      {} as Record<string, string[]>,
    ),
  };
  await writeFile(
    join(outputDir, "manifest.json"),
    JSON.stringify(manifestData, null, 2),
  );

  // Copy & minify CSS files
  for (const cssFile of ["typography.css", "tokens.css"]) {
    const cssContent = await readFile(
      join(rootDir, `apps/hub/src/styles/${cssFile}`),
      "utf8",
    );
    await writeFile(join(outputDir, cssFile), minifyCss(cssContent));
  }
  const layoutCss = await readFile(
    join(rootDir, "apps/hub/src/components/HubLayout.css"),
    "utf8",
  );
  await writeFile(join(outputDir, "HubLayout.css"), minifyCss(layoutCss));

  // Copy PWA public files
  try {
    await $`cp -r public/* ${outputDir}/`;
  } catch (e) {
    console.warn(
      "No public/ directory found or empty, skipping PWA files copy.",
    );
  }

  console.log("Applying anti-FOUC script to gated books...");
  await $`bun run scripts/inject-gating.ts`;

  console.log("Building admin dashboard...");
  try {
    await $`cd apps/admin && bun run build`;
    await $`rm -rf ${join(outputDir, "admin")}`;
    await $`cp -r apps/admin/dist ${join(outputDir, "admin")}`;
    const redirectsContent = `
/admin /admin/ 301
`;
    await writeFile(join(outputDir, "_redirects"), redirectsContent.trim());

    let headersContent = `
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://clerk.dev https://*.clerk.accounts.dev https://*.clerk.dev https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://*.clerk.accounts.dev; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https://api.clerk.dev https://*.clerk.accounts.dev https://*.clerk.dev; frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://www.youtube-nocookie.com https://www.youtube.com; worker-src 'self' blob:;
  Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
  Pragma: no-cache
  Expires: 0
`;

    // Map gated paths into _headers appending X-Robots-Tag: noindex
    async function appendGatedHeaders(dir: string) {
      const entries = await readdir(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const entryStat = await stat(fullPath);
        if (entryStat.isDirectory()) {
          await appendGatedHeaders(fullPath);
        } else if (fullPath.endsWith(".html")) {
          const relativePath = fullPath.split("output")[1].replace(/\\/g, "/");
          if (!isPublicPath(relativePath)) {
            headersContent += `\n${relativePath}\n  X-Robots-Tag: noindex`;
          }
        }
      }
    }
    await appendGatedHeaders(join(outputDir, "books"));

    await writeFile(join(outputDir, "_headers"), headersContent.trim());

    console.log("Admin dashboard built and copied successfully.");
  } catch (error) {
    console.error("Failed to build or copy admin dashboard", error);
    process.exit(1);
  }

  console.log("Generating sitemap...");
  await $`bun run scripts/generate-sitemap.ts`;

  console.log("Running SEO validation...");
  await $`bun run scripts/check-seo.ts`;

  console.log("Premium Hub site generated successfully.");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
