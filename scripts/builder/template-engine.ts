import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { BuiltBook } from "./metadata";
import { isPublicPath } from "../../functions/lib/gating.ts";

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function minifyJs(js: string): string {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .trim();
}

export async function compileHubRuntime(): Promise<string> {
  const entrypoint = join(process.cwd(), "apps/hub/src/scripts/hub-runtime.ts");
  const result = await Bun.build({
    entrypoints: [entrypoint],
    minify: true,
    target: "browser",
  });
  if (!result.success || result.outputs.length === 0) {
    throw new Error(`Failed to compile hub-runtime.ts: ${result.logs.join("\n")}`);
  }
  return await result.outputs[0].text();
}

export async function generateSitePages(
  rootDir: string,
  outputDir: string,
  builtBooks: BuiltBook[]
): Promise<void> {
  const enCatalog = await readFile(join(rootDir, "i18n/en.json"), "utf8");
  const idCatalog = await readFile(join(rootDir, "i18n/id.json"), "utf8");
  const runtimeScript = await readFile(
    join(rootDir, "apps/hub/src/scripts/i18n-runtime.js"),
    "utf8"
  );
  const compiledHubRuntime = await compileHubRuntime();

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
    isHome: boolean = false
  ) => `<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASUREMENT_ID || "G-V619M5H4YW"}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', '${process.env.GA_MEASUREMENT_ID || "G-V619M5H4YW"}');
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Dawnbook - A Scalable Educational Publishing Platform">
    <meta name="theme-color" content="#000000">
    <title>${title} | Dawnbook Platform</title>
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
      ${compiledHubRuntime}
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
        <a href="/books/${escapeHtml(b.slug)}/" class="book-card" data-slug="${escapeHtml(b.slug)}" data-created-at="${b.mtimeMs}" style="display: flex; flex-direction: column; padding: 20px; position: relative; transition: all 0.3s ease; height: 100%;">
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
      `
        )
        .join("")}
    </div>
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
                    <a href="mailto:iwan@dawnbook.belajarcarabelajar.com" class="contributor-email">✉️ iwan@dawnbook.belajarcarabelajar.com</a>
                </div>
            </div>
            <div class="contributor-card">
                <img src="https://d2oi1rqwb0pj00.cloudfront.net/user/nio_1740330104156_100.webp" alt="Kania Salsabila" class="contributor-avatar">
                <div class="contributor-info">
                    <h3 class="contributor-name"><a href="https://github.com/kaniasalsabila639-ops" target="_blank" rel="noopener noreferrer" data-i18n="contribute.contributor2.name">Kania Salsabila</a></h3>
                    <p class="contributor-role" data-i18n="contribute.contributor2.role">Best Scientific Paper, Outstanding Student (Mawapres), Faculty of Languages and Arts 2026, Universitas Negeri Jakarta</p>
                    <a href="mailto:kania@dawnbook.belajarcarabelajar.com" class="contributor-email">✉️ kania@dawnbook.belajarcarabelajar.com</a>
                </div>
            </div>
        </div>
    </div>
  `;

  const donateContent = `
    <div class="content-panel" style="max-width: 720px;">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-sm)" data-i18n="donate.title">Support Dawnbook</h2>
        <p style="font-size: 1.05rem; line-height: 1.6; color: var(--color-text); margin-bottom: var(--spacing-lg)" data-i18n="donate.subtitle">
            Dawnbook is a non-profit educational initiative. Every book, guide, and resource on this platform is completely free for everyone, forever. Your donation directly covers server infrastructure, Cloudflare D1 storage, domain maintenance, and the creation of new open-access educational titles.
        </p>

        <div style="background: var(--color-surface); border: 1px solid var(--color-secondary); border-radius: 8px; padding: var(--spacing-lg); margin-bottom: var(--spacing-lg);">
            <h3 style="margin: 0 0 var(--spacing-md) 0; color: var(--color-primary); font-size: 1.15rem;" data-i18n="donate.qris.title">🇮🇩 Domestic Donation (QRIS & Bank Transfer)</h3>
            <p style="font-size: 0.9rem; color: var(--color-text); margin-bottom: var(--spacing-md);" data-i18n="donate.qris.desc">Support via Maybank Indonesia or any QRIS-compatible e-wallet / banking app (GoPay, OVO, Dana, ShopeePay, BCA, Mandiri, BRI, BNI, etc.).</p>

            <div style="display: flex; gap: var(--spacing-lg); align-items: center; flex-wrap: wrap;">
                <div style="background: #fff; padding: 12px; border-radius: 8px; text-align: center;">
                    <img src="https://snipset.belajarcarabelajar.com/images/qris-dawnbook.webp" alt="QRIS Dawnbook" style="width: 180px; height: 180px; display: block; object-fit: contain;">
                    <span style="font-size: 11px; color: #333; font-weight: 600; margin-top: 4px; display: block;">NMID: ID1024362141527</span>
                </div>
                <div style="flex: 1; min-width: 220px;">
                    <div style="margin-bottom: 12px;">
                        <span style="font-size: 0.8rem; color: var(--color-secondary); display: block;" data-i18n="donate.bank.name">Bank Name</span>
                        <strong style="font-size: 1rem; color: var(--color-text);">Maybank Indonesia</strong>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <span style="font-size: 0.8rem; color: var(--color-secondary); display: block;" data-i18n="donate.bank.account">Account Number</span>
                        <strong style="font-size: 1.1rem; color: var(--color-primary); font-family: monospace;">2735002167</strong>
                    </div>
                    <div>
                        <span style="font-size: 0.8rem; color: var(--color-secondary); display: block;" data-i18n="donate.bank.holder">Account Holder</span>
                        <strong style="font-size: 1rem; color: var(--color-text);">Iwan Kurniawan</strong>
                    </div>
                </div>
            </div>
        </div>

        <div style="background: var(--color-surface); border: 1px solid var(--color-secondary); border-radius: 8px; padding: var(--spacing-lg); margin-bottom: var(--spacing-lg);">
            <h3 style="margin: 0 0 var(--spacing-md) 0; color: var(--color-primary); font-size: 1.15rem;" data-i18n="donate.intl.title">🌐 International Donation (PayPal)</h3>
            <p style="font-size: 0.9rem; color: var(--color-text); margin-bottom: var(--spacing-md);" data-i18n="donate.intl.desc">Support from anywhere in the world securely via PayPal.</p>

            <a href="https://paypal.me/belajarcarabelajar" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #0070ba; color: #ffffff; font-weight: 600; font-size: 0.95rem; border-radius: 6px; text-decoration: none; transition: background 0.15s;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .761-.643h7.246c2.41 0 4.28.6 5.253 1.782.915 1.114 1.153 2.673.708 4.632-.705 3.097-2.613 4.887-5.518 5.176l-.41.041H9.98a.77.77 0 0 0-.76.643l-1.07 6.804a.64.64 0 0 1-.633.541z"/></svg>
                <span data-i18n="donate.paypal.btn">Donate via PayPal</span>
            </a>
        </div>

        <div style="text-align: center; padding: var(--spacing-md); color: var(--color-secondary); font-size: 0.9rem;">
            <p style="margin-bottom: var(--spacing-sm);" data-i18n="donate.transparency.1">
                Transparency matters. All donors can opt to have their name or contribution acknowledged on our platform.
            </p>
            <p data-i18n="donate.transparency.2">
                Questions about donations? Contact us directly at <a href="mailto:iwan@dawnbook.belajarcarabelajar.com" style="color: var(--color-primary);">iwan@dawnbook.belajarcarabelajar.com</a>
            </p>
        </div>
    </div>
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
        var safeTierName = escapeClientHtml(tierName);
        var safeMessage = escapeClientHtml(message);
        return '<div style="animation: fadeSlideUp 0.6s ease forwards;">' +
          '<svg width="160" height="160" viewBox="0 0 160 160" style="margin-bottom: 24px;">' +
            '<circle cx="80" cy="80" r="72" fill="' + c.bg + '" stroke="' + c.border + '" stroke-width="4"/>' +
            '<circle cx="80" cy="80" r="60" fill="' + c.fill + '" opacity="0.3"/>' +
            '<text x="80" y="70" text-anchor="middle" font-size="40" fill="' + c.text + '">&#9733;</text>' +
            '<text x="80" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="' + c.text + '">' + safeTierName.toUpperCase() + '</text>' +
            '<text x="80" y="118" text-anchor="middle" font-size="10" fill="' + c.text + '" opacity="0.8">PATRON</text>' +
          '</svg>' +
          '<h3 style="color: var(--color-primary); margin: 0 0 8px 0; font-size: 1.4rem;">' + safeUserName + '</h3>' +
          '<p data-i18n="badge.' + safeTierName.toLowerCase() + '" style="color: var(--color-primary); font-weight: 700; font-size: 1.1rem; margin-bottom: 16px;">' + safeTierName + ' Patron</p>' +
          '<p data-i18n="appreciation.' + safeTierName.toLowerCase() + '.msg" style="color: var(--color-text-muted); line-height: 1.7; max-width: 450px; margin: 0 auto;">' + safeMessage + '</p>' +
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

        function doRender(user) {
          if (!user || !user.id) {
            container.innerHTML = renderSignInPrompt();
          } else if (user.donation_badge && badgeColors[user.donation_badge]) {
            var tier = user.donation_badge;
            var message;
            if (tier === 'Gold') {
              message = 'Your extraordinary generosity fuels Dawnbook\\\'s mission to make education accessible to everyone.';
            } else if (tier === 'Silver') {
              message = 'Your meaningful contribution helps keep Dawnbook running for learners everywhere.';
            } else {
              message = 'Your kind support keeps the lights on and the chapters flowing.';
            }
            container.innerHTML = renderBadge(tier, user.name || user.email || 'Supporter', message);
          } else {
            container.innerHTML = renderNoBadge();
          }
          if (window.applyLocale) window.applyLocale();
        }

        function boot() {
          fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
            .then(function(r) { return r.ok ? r.json() : null; })
            .then(function(user) { doRender(user); })
            .catch(function() { doRender(null); });
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', boot);
        } else {
          boot();
        }
      })();
      `)}
    </script>
  `;

  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY || '0x4AAAAAAEBDHm_F3WkNRSpN';

  const signInContent = `
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <div class="content-panel" style="text-align: center; margin: 0 auto; max-width: 450px; padding: var(--spacing-xl);">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md)" data-i18n="signin.title">Sign In to Continue Reading</h2>
        <p style="margin-bottom: var(--spacing-lg)" data-i18n="signin.body">Create a free account or sign in to access the full book content.</p>
        <div class="cf-turnstile" data-sitekey="${turnstileSiteKey}" data-action="turnstile-spin-v2" data-theme="auto" style="margin: 0 auto var(--spacing-lg) auto; display: flex; justify-content: center;"></div>
        <a id="google-signin-btn" href="#" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #fff; color: #1f1f1f; border: 1px solid #dadce0; border-radius: 4px; text-decoration: none; font-weight: 500; font-family: inherit; cursor: pointer;">
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.32A9 9 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.98 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.3-1.72V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.02-2.32z" fill="#FBBC05"/>
                <path d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.02 2.32C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            <span data-i18n="signin.cta">Sign in with Google</span>
        </a>
        <p id="signin-error" style="margin-top: var(--spacing-md); color: #c0392b; display: none;"></p>
        <p style="font-size: 0.875rem; opacity: 0.7; margin-top: var(--spacing-md);">No account? Signing in with Google will create one automatically.</p>
    </div>
    <script>
      ${minifyJs(`
      (function() {
        var params = new URLSearchParams(window.location.search);
        var redirectUrl = params.get('redirect_url') || '/';
        var err = params.get('error');
        var btn = document.getElementById('google-signin-btn');
        var errEl = document.getElementById('signin-error');

        if (err) {
          var messages = {
            missing_params: 'Sign-in was started incorrectly. Please try again.',
            state_mismatch: 'Your sign-in session expired. Please try again.',
            config: 'Sign-in is not configured. Please contact support.',
            google_exchange: 'Google rejected the sign-in. Please try again.',
            server: 'Something went wrong on our end. Please try again shortly.',
            bot_detected: 'Security verification failed or expired. Please complete the captcha and try again.'
          };
          errEl.textContent = messages[err] || ('Sign-in failed (' + err + ').');
          errEl.style.display = 'block';
        }

        fetch('/api/auth/me', { credentials: 'same-origin' })
          .then(function(r) { return r.ok ? r.json() : null; })
          .then(function(user) {
            if (user && user.id) {
              window.location.href = redirectUrl;
            }
          })
          .catch(function() {});

        btn.addEventListener('click', function(e) {
          e.preventDefault();
          var turnstileToken = '';
          if (window.turnstile && typeof window.turnstile.getResponse === 'function') {
            turnstileToken = window.turnstile.getResponse() || '';
          }
          
          var url = '/api/auth/login?redirect_url=' + encodeURIComponent(redirectUrl);
          if (turnstileToken) {
            url += '&cf-turnstile-response=' + encodeURIComponent(turnstileToken);
          }
          window.location.href = url;
        });
      })();
      `)}
    </script>
  `;

  const signUpContent = signInContent
    .replace(
      'data-i18n="signin.title">Sign In to Continue Reading',
      ">Sign Up to Continue Reading"
    )
    .replace('id="google-signin-btn"', 'id="google-signup-btn"');

  await writeFile(
    join(outputDir, "index.html"),
    generatePage("Home", indexContent, true)
  );
  await writeFile(
    join(outputDir, "about.html"),
    generatePage("About", aboutContent)
  );
  await writeFile(
    join(outputDir, "contribute.html"),
    generatePage("Contribute", contributeContent)
  );
  await writeFile(
    join(outputDir, "donate.html"),
    generatePage("Donate", donateContent)
  );
  await writeFile(
    join(outputDir, "appreciation.html"),
    generatePage("Appreciation", appreciationContent)
  );
  await writeFile(
    join(outputDir, "sign-in.html"),
    generatePage("Sign In", signInContent)
  );
  await writeFile(
    join(outputDir, "sign-up.html"),
    generatePage("Sign Up", signUpContent)
  );

  const manifestData = {
    books: builtBooks.map((b) => b.slug),
    chapters: builtBooks.reduce(
      (acc, b) => {
        acc[b.slug] = b.chapters;
        return acc;
      },
      {} as Record<string, string[]>
    ),
  };
  await writeFile(
    join(outputDir, "manifest.json"),
    JSON.stringify(manifestData, null, 2)
  );
}

export async function copyAssets(rootDir: string, outputDir: string): Promise<void> {
  for (const cssFile of ["typography.css", "tokens.css"]) {
    const cssContent = await readFile(
      join(rootDir, `apps/hub/src/styles/${cssFile}`),
      "utf8"
    );
    await writeFile(join(outputDir, cssFile), minifyCss(cssContent));
  }
  const layoutCss = await readFile(
    join(rootDir, "apps/hub/src/components/HubLayout.css"),
    "utf8"
  );
  await writeFile(join(outputDir, "HubLayout.css"), minifyCss(layoutCss));

  try {
    await $`cp -r public/* ${outputDir}/`;
  } catch {
    console.warn(
      "No public/ directory found or empty, skipping PWA files copy."
    );
  }
}

export async function buildHeaders(outputDir: string): Promise<void> {
  try {
    const headersContent = `
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https://accounts.google.com https://*.googleusercontent.com; frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com; worker-src 'self' blob:;
`;

    await writeFile(join(outputDir, "_headers"), headersContent.trim());
    console.log("Security headers generated successfully.");
  } catch (error) {
    console.error("Failed to generate security headers", error);
    process.exit(1);
  }
}
