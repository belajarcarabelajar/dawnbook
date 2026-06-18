import { readdir, stat, mkdir, writeFile, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { $ } from "bun";
import { isPublicPath } from "../functions/lib/gating.ts";

function escapeHtml(unsafe: string) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

async function build() {
  const rootDir = process.cwd();
  const booksDir = join(rootDir, "books");
  const outputDir = join(rootDir, "output");
  const outputBooksDir = join(outputDir, "books");

  // Ensure output directories exist
  await mkdir(outputDir, { recursive: true });
  await mkdir(outputBooksDir, { recursive: true });

  const entries = await readdir(booksDir);
  const builtBooks: { slug: string; title: string; chapterCount: number; emoji: string; chapters: string[] }[] = [];

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
      if (entry.startsWith('_')) continue;
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
        let formattedTitle = entry.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        try {
            const tomlText = await readFile(join(bookPath, "book.toml"), "utf8");
            const titleMatch = tomlText.match(/title\s*=\s*"([^"]+)"/);
            if (titleMatch) formattedTitle = titleMatch[1];
        } catch (e) {}
        
        let chapterCount = 0;
        let chapters: string[] = [];
        try {
            const summaryText = await readFile(join(bookPath, "src", "SUMMARY.md"), "utf8");
            const lines = summaryText.split('\n').filter(line => line.trim().startsWith('- ['));
            chapterCount = lines.length;
            chapters = lines.map(line => {
                const match = line.match(/\((.*?)\.md\)/);
                if (match) {
                    let filename = match[1];
                    filename = decodeURIComponent(filename.replace(/^\.\//, ''));
                    if (filename === 'README' || filename === 'index') return `/books/${entry}/index.html`;
                    return `/books/${entry}/${filename}.html`;
                }
                return null;
            }).filter(Boolean) as string[];
        } catch (e) {
            console.warn(`Could not read SUMMARY.md for ${entry}`);
        }
        let emoji = '📖';
        try {
            const iconText = await readFile(join(bookPath, "icon.txt"), "utf8");
            if (iconText.trim()) emoji = iconText.trim();
        } catch (e) {
            // fallback to generic
        }
        builtBooks.push({ slug: entry, title: formattedTitle, chapterCount, emoji, chapters });
        console.log(`Successfully built: ${entry}`);
      } catch (error) {
        console.error(`Failed to build book: ${entry}`, error);
        process.exit(1);
      }
    }
  }

  console.log("Generating premium hub site...");

  const enCatalog = await readFile(join(rootDir, "i18n/en.json"), "utf8");
  const idCatalog = await readFile(join(rootDir, "i18n/id.json"), "utf8");
  const runtimeScript = await readFile(join(rootDir, "apps/hub/src/scripts/i18n-runtime.js"), "utf8");

  const i18nInjection = `
    <script>
      window.I18N_CATALOGS = {
        en: ${enCatalog},
        id: ${idCatalog}
      };
    </script>
    <script>
      ${runtimeScript}
    </script>
  `;

  const generatePage = (title: string, content: string, isHome: boolean = false) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Dawnbook - A Scalable Educational Publishing Platform">
    <meta name="clerk-publishable-key" content="${process.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_cmlnaHQtZ2FubmV0LTk5LmNsZXJrLmFjY291bnRzLmRldiQ"}">
    <title>${title} | Dawnbook Platform</title>
    <link rel="icon" type="image/svg+xml" href="${isHome ? 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌅</text></svg>' : 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📓</text></svg>'}">
    <link rel="stylesheet" href="/typography.css?v=${Date.now()}">
    <link rel="stylesheet" href="/tokens.css?v=${Date.now()}">
    <link rel="stylesheet" href="/HubLayout.css?v=${Date.now()}">
    <script>
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
    </script>
    ${i18nInjection}
</head>
<body>
    <a href="#main-content" class="skip-link" style="position: absolute; top: -40px; left: 0; background: var(--color-primary); color: var(--color-background); padding: 8px; z-index: 1000; transition: top 0.2s;" data-i18n="hub.nav.skip">Skip to content</a>
    <div class="hub-layout">
        <div class="desktop-top-controls">
            <button class="lang-toggle-btn" data-i18n="hub.lang.toggle" style="background: transparent; border: 1px solid var(--color-secondary); color: var(--color-text); border-radius: 4px; cursor: pointer; height: 36px; min-width: 44px; display: flex; align-items: center; justify-content: center; font-weight: 600; padding: 0 8px;">EN</button>
            <button onclick="toggleTheme()" class="theme-toggle-icon theme-toggle desktop-theme-btn" aria-label="Toggle Theme" aria-pressed="false">
                <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </button>
        </div>
        <aside class="side-nav">
            <div class="side-nav-header">
                <a href="/" class="logo">Dawnbook</a>
                <div class="mobile-controls">
                    <button class="lang-toggle-btn" data-i18n="hub.lang.toggle" style="background: transparent; border: 1px solid var(--color-secondary); color: var(--color-text); border-radius: 4px; cursor: pointer; height: 36px; min-width: 44px; display: flex; align-items: center; justify-content: center; font-weight: 600; padding: 0 8px;">EN</button>
                    <button onclick="toggleTheme()" class="theme-toggle-icon theme-toggle mobile-theme-btn" aria-label="Toggle Theme" aria-pressed="false">
                        <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                        <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                    </button>
                    <button class="mobile-menu-toggle" onclick="toggleMenu()" aria-label="Toggle Navigation">☰</button>
                </div>
            </div>
            <nav class="nav-links" aria-label="Main Navigation">
                <a href="/" class="${isHome ? 'active' : ''}" ${isHome ? 'aria-current="page"' : ''} data-i18n="hub.home">Home</a>
                <a href="/about.html" class="${title === 'About' ? 'active' : ''}" ${title === 'About' ? 'aria-current="page"' : ''} data-i18n="hub.about">About</a>
                <a href="/contribute.html" class="${title === 'Contribute' ? 'active' : ''}" ${title === 'Contribute' ? 'aria-current="page"' : ''} data-i18n="hub.contribute">Contribute</a>
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
        <h1 data-i18n="hub.hero.title">Dawn is Coming. Free Your Mind.</h1>
        <p data-i18n="hub.hero.subtitle">Embrace the sunrise of open knowledge. A new era of freedom where learning is self-directed, open to all, and absolutely free. We believe education empowers you to think critically and explore boundlessly.</p>
        <p style="font-weight: bold; margin-top: var(--spacing-md); color: var(--color-accent); font-size: 1.1rem;" data-i18n="hub.hero.accent">Knowledge belongs to everyone. The dawn of free learning is here.</p>
    </div>

    <h2 style="margin-bottom: var(--spacing-lg); color: var(--color-primary);" data-i18n="hub.books.title">Available Books</h2>
    
    <div class="book-filters" style="display: flex; gap: 12px; margin-bottom: var(--spacing-lg); flex-wrap: wrap;">
        <input type="text" id="search-input" placeholder="Search by title..." style="padding: 8px; border-radius: 4px; border: 1px solid var(--color-secondary); background: var(--color-background); color: var(--color-text); flex: 1; min-width: 200px;">
        <select id="subject-filter" style="padding: 8px; border-radius: 4px; border: 1px solid var(--color-secondary); background: var(--color-background); color: var(--color-text); min-width: 200px;">
            <option value="">All Subjects</option>
        </select>
        <select id="sort-select" style="padding: 8px; border-radius: 4px; border: 1px solid var(--color-secondary); background: var(--color-background); color: var(--color-text);">
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="oldest">Oldest First</option>
        </select>
    </div>

    <div class="book-masonry">
      ${builtBooks.map(b => `
        <a href="/books/${escapeHtml(b.slug)}/" class="book-card" data-slug="${escapeHtml(b.slug)}" style="display: flex; flex-direction: column; padding: 20px; position: relative; transition: all 0.3s ease; height: 100%;">
            <div style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                    <span style="font-size: 48px; line-height: 1;">${b.emoji}</span>
                    <div class="top-right-cluster" style="display: flex; align-items: center; gap: 8px; position: relative; z-index: 10;">
                        <span class="view-count-badge" style="display: none; font-size: 0.75rem; background: var(--color-surface); padding: 2px 6px; border-radius: 4px; color: var(--color-text-muted);">👁 0</span>
                        <span class="subject-label-chip" style="display: none; font-size: 0.75rem; background: var(--color-primary); color: var(--color-background); padding: 2px 6px; border-radius: 4px; font-weight: bold;"></span>
                        <button class="pin-toggle-btn" onclick="event.preventDefault(); togglePin(event, '${escapeHtml(b.slug)}')" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 0; filter: grayscale(1); opacity: 0.3; transition: all 0.2s;" title="Pin Book">📌</button>
                    </div>
                </div>
                <h3 style="margin: 0 0 8px 0; font-size: 1.15rem; line-height: 1.4; color: var(--color-text); font-weight: 500;">${escapeHtml(b.title)}</h3>
                <div class="book-progress-wrapper" style="margin-top: auto; padding-bottom: 12px; display: flex; align-items: center; gap: 12px;">
                    <div class="book-progress" style="flex: 1; border-radius: 4px; height: 6px; position: relative; overflow: hidden;">
                        <div style="position: absolute; inset: 0; background-color: var(--color-text-muted); opacity: 0.4;"></div>
                        <div class="book-progress-bar" style="position: absolute; left: 0; top: 0; height: 100%; background: var(--color-primary); width: 0%; transition: width 0.5s ease; border-radius: 4px; z-index: 2;"></div>
                    </div>
                    <div class="book-progress-text" style="font-size: 0.8rem; color: var(--color-primary); font-weight: 700; min-width: 45px; text-align: right;">0%</div>
                </div>
            </div>
            <div style="margin-top: auto; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 0.85rem; color: var(--color-secondary);">
                <span><span class="desktop-only">Penyusun: </span>Iwan Kurniawan • ${b.chapterCount} chapter</span>
                <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 2px 6px; border: 1px solid var(--color-secondary); border-radius: 4px; opacity: 0.8;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                    FREE
                </div>
            </div>
        </a>
      `).join("")}
    </div>
    <script>
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
          const sortVal = document.getElementById('sort-select') ? document.getElementById('sort-select').value : 'newest';
          const filterVal = document.getElementById('subject-filter') ? document.getElementById('subject-filter').value : '';
          const searchVal = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase() : '';

          cards.forEach(card => {
              const slug = card.getAttribute('data-slug');
              const bData = serverBooksData.find(b => b.slug === slug);
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
              const aPinned = pinned.includes(slugA);
              const bPinned = pinned.includes(slugB);
              
              if (aPinned && !bPinned) return -1;
              if (!aPinned && bPinned) return 1;

              const dataA = serverBooksData.find(b => b.slug === slugA);
              const dataB = serverBooksData.find(b => b.slug === slugB);
              
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
              if (pinned.includes(slug)) {
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
                            const subjectChip = card.querySelector('.subject-label-chip');
                            if (viewBadge) {
                                viewBadge.innerText = '👁 ' + (b.view_count || 0);
                                viewBadge.style.display = 'inline-block';
                            }
                            if (subjectChip && b.subject_label) {
                                subjectChip.innerText = b.subject_label;
                                subjectChip.style.display = 'inline-block';
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
            .catch(console.error);
      }

      document.addEventListener('DOMContentLoaded', () => {
          reorderBooks();
          loadBookMetadata();
          initClerk();
      });

      function loadHubProgress() {
        Promise.all([
          fetch('/manifest.json?v=' + Date.now()).then(r => r.json()),
          fetch('/api/progress?v=' + Date.now(), { credentials: 'same-origin' }).then(r => r.json())
        ]).then(([manifest, data]) => {
          if (!manifest.chapters || !data.progress) return;
          data.progress.forEach(p => {
            const chapters = manifest.chapters[p.book_slug];
            if (!chapters || chapters.length === 0) return;
            
            const total = chapters.length;
            let percent = 0;
            
            if (p.completed_paths && p.completed_paths.length > 0) {
              let completedCount = 0;
              p.completed_paths.forEach(cp => {
                let norm = decodeURIComponent(cp).split('#')[0].split('?')[0];
                if (norm.endsWith('/')) norm += 'index.html';
                else if (!norm.endsWith('.html')) norm += '.html';
                if (chapters.includes(norm)) completedCount++;
              });
              percent = Math.round((completedCount / total) * 100);
            } else if (p.last_read_path) {
              // Legacy fallback
              let readPath = decodeURIComponent(p.last_read_path).split('#')[0].split('?')[0];
              if (readPath.endsWith('/')) readPath += 'index.html';
              else if (!readPath.endsWith('.html')) readPath += '.html';
              const idx = chapters.findIndex(c => c === readPath);
              if (idx !== -1 && total > 1) {
                percent = Math.round((idx / (total - 1)) * 100);
              }
            }
            
            percent = Math.min(Math.max(percent, 0), 100);
            
            const card = document.querySelector('.book-card[data-slug="' + p.book_slug + '"]');
            if (card) {
              setTimeout(() => {
                card.querySelector('.book-progress-bar').style.width = percent + '%';
                card.querySelector('.book-progress-text').innerText = percent + '%';
              }, 50);
            }
          });
        }).catch(console.error);
      }

      function initClerk() {
        var clerkPk = '${process.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_cmlnaHQtZ2FubmV0LTk5LmNsZXJrLmFjY291bnRzLmRldiQ"}';
        var keyBody = clerkPk.replace(/^pk_(test|live)_/, '');
        while (keyBody.length % 4 !== 0) { keyBody += '='; }
        var domain = atob(keyBody).replace(/\\$$/, '');
        var script = document.createElement('script');
        script.src = 'https://' + domain + '/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
        script.setAttribute('data-clerk-publishable-key', clerkPk);
        script.async = true;
        script.onload = function() {
            // Load progress immediately, bypassing Clerk CSP crash issues
            loadHubProgress();
            if (window.Clerk) {
                window.Clerk.load().catch(console.error);
            }
        };
        document.head.appendChild(script);
      }
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

        <div style="margin-top: var(--spacing-xl); text-align: center; border-top: 1px solid var(--color-secondary); padding-top: var(--spacing-lg);">
          <p style="font-weight: bold; color: var(--color-accent); font-size: 1.25rem;" data-i18n="hub.hero.accent">Knowledge belongs to everyone. The dawn of free learning is here.</p>
        </div>
    </div>
  `;

  const contributeContent = `
    <div class="content-panel">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md)" data-i18n="contribute.join.title">Join the Authors</h2>
        <p data-i18n="contribute.join.body1">We believe knowledge should be free and openly collaborative. You can contribute by writing a new chapter, fixing typos, or even starting a brand new book.</p>
        <p data-i18n="contribute.join.body2">All contributions are managed via GitHub Pull Requests, ensuring a high standard of quality through peer review.</p>
        <a href="https://github.com/belajarcarabelajar/dawnbook" class="btn-primary" target="_blank" data-i18n="contribute.btn.github">View on GitHub</a>
    </div>
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
      (function() {
        var params = new URLSearchParams(window.location.search);
        var redirectUrl = params.get('redirect_url') || '/';
        var container = document.getElementById('clerk-sign-in');

        var clerkOptions = {
          afterSignInUrl: redirectUrl,
          afterSignUpUrl: redirectUrl,
          fallbackRedirectUrl: redirectUrl,
          forceRedirectUrl: redirectUrl,
          signUpUrl: '/sign-in'
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
    </script>
  `;

  await writeFile(join(outputDir, "index.html"), generatePage("Home", indexContent, true));
  await writeFile(join(outputDir, "about.html"), generatePage("About", aboutContent));
  await writeFile(join(outputDir, "contribute.html"), generatePage("Contribute", contributeContent));
  await writeFile(join(outputDir, "sign-in.html"), generatePage("Sign In", signInContent));
  const manifestData = { 
    books: builtBooks.map(b => b.slug), 
    chapters: builtBooks.reduce((acc, b) => { acc[b.slug] = b.chapters; return acc; }, {} as Record<string, string[]>)
  };
  await writeFile(join(outputDir, "manifest.json"), JSON.stringify(manifestData, null, 2));

  // Copy CSS files
  await $`cp apps/hub/src/styles/typography.css ${join(outputDir, "typography.css")}`;
  await $`cp apps/hub/src/styles/tokens.css ${join(outputDir, "tokens.css")}`;
  await $`cp apps/hub/src/components/HubLayout.css ${join(outputDir, "HubLayout.css")}`;

  console.log("Applying anti-FOUC script to gated books...");
  await $`bun run scripts/inject-gating.ts`;

  console.log("Building admin dashboard...");
  try {
    await $`cd apps/admin && bun run build`;
    await $`rm -rf ${join(outputDir, "admin")}`;
    await $`cp -r apps/admin/dist ${join(outputDir, "admin")}`;
    const redirectsContent = `
/admin /admin/ 301
/admin/* /admin/index.html 200
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
            headersContent += `\\n${relativePath}\\n  X-Robots-Tag: noindex`;
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

build().catch(console.error);
