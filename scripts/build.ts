import { readdir, stat, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { $ } from "bun";

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
  const builtBooks: { slug: string; title: string; desc: string }[] = [];

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
        // Simple heuristic to format title from slug
        const formattedTitle = entry.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        builtBooks.push({ slug: entry, title: formattedTitle, desc: `Explore the comprehensive guide on ${formattedTitle}.` });
        console.log(`Successfully built: ${entry}`);
      } catch (error) {
        console.error(`Failed to build book: ${entry}`, error);
        process.exit(1);
      }
    }
  }

  console.log("Generating premium hub site...");

  const generatePage = (title: string, content: string, isHome: boolean = false) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Dawnbook - A Scalable Educational Publishing Platform">
    <meta name="clerk-publishable-key" content="${process.env.VITE_CLERK_PUBLISHABLE_KEY || ''}">
    <title>${title} | Dawnbook Platform</title>
    <link rel="stylesheet" href="/tokens.css">
    <link rel="stylesheet" href="/HubLayout.css">
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
</head>
<body>
    <a href="#main-content" class="skip-link" style="position: absolute; top: -40px; left: 0; background: var(--color-primary); color: var(--color-background); padding: 8px; z-index: 1000; transition: top 0.2s;">Skip to content</a>
    <div class="hub-layout">
        <button onclick="toggleTheme()" class="theme-toggle-icon theme-toggle desktop-theme-btn" aria-label="Toggle Theme" aria-pressed="false">
            <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </button>
        <aside class="side-nav">
            <div class="side-nav-header">
                <a href="/" class="logo">Dawnbook</a>
                <div class="mobile-controls">
                    <button onclick="toggleTheme()" class="theme-toggle-icon theme-toggle mobile-theme-btn" aria-label="Toggle Theme" aria-pressed="false">
                        <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                        <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                    </button>
                    <button class="mobile-menu-toggle" onclick="toggleMenu()" aria-label="Toggle Navigation">☰</button>
                </div>
            </div>
            <nav class="nav-links" aria-label="Main Navigation">
                <a href="/" class="${isHome ? 'active' : ''}" ${isHome ? 'aria-current="page"' : ''}>Home</a>
                <a href="/about.html" class="${title === 'About' ? 'active' : ''}" ${title === 'About' ? 'aria-current="page"' : ''}>About</a>
                <a href="/contribute.html" class="${title === 'Contribute' ? 'active' : ''}" ${title === 'Contribute' ? 'aria-current="page"' : ''}>Contribute</a>
                <a href="/admin">Admin Portal</a>
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
        <h1>Discover Open Knowledge</h1>
        <p>A beautifully curated, open-source platform for educational books. Dive into topics written by experts and community contributors.</p>
    </div>
    
    <h2 style="margin-bottom: var(--spacing-lg); color: var(--color-primary);">Available Books</h2>
    <div class="book-masonry">
      ${builtBooks.map(b => `
        <a href="/books/${escapeHtml(b.slug)}/" class="book-card">
            <h3>${escapeHtml(b.title)}</h3>
            <p>${escapeHtml(b.desc)}</p>
        </a>
      `).join("")}
    </div>
  `;

  const aboutContent = `
    <div class="content-panel">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md)">About Dawnbook</h2>
        <p>Dawnbook is a modern, highly scalable platform designed to democratize educational publishing.</p>
        <p>Our goal is to create a seamless authoring and reading environment. Whether you're exploring the intricacies of Piaget's Cognitive Development or exploring entirely new subjects, Dawnbook ensures content is beautifully presented and instantly accessible.</p>
    </div>
  `;

  const contributeContent = `
    <div class="content-panel">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md)">Join the Authors</h2>
        <p>We believe knowledge should be free and openly collaborative. You can contribute by writing a new chapter, fixing typos, or even starting a brand new book.</p>
        <p>All contributions are managed via GitHub Pull Requests, ensuring a high standard of quality through peer review.</p>
        <a href="https://github.com/belajarcarabelajar/dawnbook" class="btn-primary" target="_blank">View on GitHub</a>
    </div>
  `;

  // Generate the sign-in page that redirects to Clerk Hosted Sign-In
  // The redirect_url query param is forwarded so the user returns to the gated page.
  const signInContent = `
    <div class="content-panel" style="text-align: center;">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md)">Sign In to Continue Reading</h2>
        <p style="margin-bottom: var(--spacing-lg)">Create a free account or sign in to access the full book content. The first chapter of every book is always free to preview.</p>
        <div id="clerk-sign-in" style="display: flex; justify-content: center; margin-bottom: var(--spacing-lg)"></div>
        <p style="font-size: 0.875rem; opacity: 0.7;">Powered by <a href="https://clerk.dev" target="_blank" style="color: var(--color-primary)">Clerk</a></p>
    </div>
    <script>
      // Clerk Hosted Pages: redirect to Clerk's managed sign-in UI
      (function() {
        var params = new URLSearchParams(window.location.search);
        var redirectUrl = params.get('redirect_url') || '/';
        // If Clerk is loaded (via ClerkJS), mount the sign-in component
        // Otherwise, provide a simple link-based fallback
        var container = document.getElementById('clerk-sign-in');
        if (window.Clerk) {
          window.Clerk.mountSignIn(container, {
            afterSignInUrl: redirectUrl,
            afterSignUpUrl: redirectUrl,
            signUpUrl: '/sign-in'
          });
        } else {
          // Load ClerkJS from the publishable key domain
          var meta = document.querySelector('meta[name="clerk-publishable-key"]');
          if (!meta) {
            container.innerHTML = '<p>Authentication is being configured. Please try again shortly.</p>';
            return;
          }
          var pk = meta.getAttribute('content');
          var keyBody = pk.replace(/^pk_(test|live)_/, '').replace(/\\$$/, '');
          try {
            var domain = atob(keyBody);
            var script = document.createElement('script');
            script.src = 'https://' + domain + '/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
            script.setAttribute('data-clerk-publishable-key', pk);
            script.async = true;
            script.onload = function() {
              if (window.Clerk) {
                window.Clerk.load().then(function() {
                  window.Clerk.mountSignIn(container, {
                    afterSignInUrl: redirectUrl,
                    afterSignUpUrl: redirectUrl,
                    signUpUrl: '/sign-in'
                  });
                });
              }
            };
            document.head.appendChild(script);
          } catch(e) {
            container.innerHTML = '<p>Unable to load sign-in. Please contact support.</p>';
          }
        }
      })();
    </script>
  `;

  await writeFile(join(outputDir, "index.html"), generatePage("Home", indexContent, true));
  await writeFile(join(outputDir, "about.html"), generatePage("About", aboutContent));
  await writeFile(join(outputDir, "contribute.html"), generatePage("Contribute", contributeContent));
  await writeFile(join(outputDir, "sign-in.html"), generatePage("Sign In", signInContent));
  await writeFile(join(outputDir, "manifest.json"), JSON.stringify({ books: builtBooks.map(b => b.slug) }, null, 2));

  // Copy CSS files
  await $`cp apps/hub/src/styles/typography.css ${join(outputDir, "typography.css")}`;
  await $`cp apps/hub/src/styles/tokens.css ${join(outputDir, "tokens.css")}`;
  await $`cp apps/hub/src/components/HubLayout.css ${join(outputDir, "HubLayout.css")}`;

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
    
    const headersContent = `
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://clerk.dev https://*.clerk.accounts.dev https://*.clerk.dev; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://*.clerk.accounts.dev; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https://img.clerk.com; connect-src 'self' https://api.clerk.dev https://*.clerk.accounts.dev https://*.clerk.dev; frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev;

/*.css
  Cache-Control: no-cache

/*.js
  Cache-Control: no-cache

/*.html
  Cache-Control: no-cache
`;
    await writeFile(join(outputDir, "_headers"), headersContent.trim());
    
    console.log("Admin dashboard built and copied successfully.");
  } catch (error) {
    console.error("Failed to build or copy admin dashboard", error);
    process.exit(1);
  }

  console.log("Premium Hub site generated successfully.");
}

build().catch(console.error);
