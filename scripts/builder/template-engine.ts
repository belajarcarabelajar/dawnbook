import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { BuiltBook } from "./metadata";
import {
  BOOK_CONTENT_SECURITY_POLICY,
  CONTENT_SECURITY_POLICY,
} from "../../functions/lib/security-headers.ts";
import { premiumSlugs } from "../../functions/lib/premium.ts";

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function minifyJs(js: string): string {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function minifyCss(css: string): string {
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
    throw new Error(
      `Failed to compile hub-runtime.ts: ${result.logs.join("\n")}`,
    );
  }
  return await result.outputs[0].text();
}

const HUB_ORIGIN = "https://dawnbook.belajarcarabelajar.com";

interface HubPageMeta {
  path: string;
  description: string;
  noindex?: boolean;
}

export async function generateSitePages(
  rootDir: string,
  outputDir: string,
  builtBooks: BuiltBook[],
  // Injectable for tests so the generator never reads mutated globals; the
  // build pipeline (scripts/build.ts) omits this and uses real process.env.
  buildEnv: Record<string, string | undefined> = process.env,
): Promise<void> {
  const enCatalog = await readFile(join(rootDir, "i18n/en.json"), "utf8");
  const idCatalog = await readFile(join(rootDir, "i18n/id.json"), "utf8");
  const runtimeScript = await readFile(
    join(rootDir, "apps/hub/src/scripts/i18n-runtime.js"),
    "utf8",
  );
  const compiledHubRuntime = await compileHubRuntime();

  // Hub pages run under a script-src without 'unsafe-inline', so every script
  // they run is a same-origin file here, loaded at the spot the inline script
  // used to be (classic, no defer) to keep the execution order.
  const hubScriptsDir = join(outputDir, "hub-scripts");
  await mkdir(hubScriptsDir, { recursive: true });
  const hubScriptSources = join(rootDir, "scripts/builder/hub-scripts");
  const hubScripts: Record<string, string> = {
    "hub-runtime.js": compiledHubRuntime,
    "i18n.js": `window.I18N_CATALOGS = {\n  en: ${enCatalog},\n  id: ${idCatalog}\n};\n${minifyJs(runtimeScript)}\n`,
    "hub-actions.js": await readFile(join(hubScriptSources, "hub-actions.js"), "utf8"),
  };
  for (const name of ["donate", "appreciation", "sign-in", "statistics"]) {
    const source = await readFile(join(hubScriptSources, `${name}.js`), "utf8");
    hubScripts[`${name}.js`] = `${minifyJs(source)}\n`;
  }
  for (const [name, content] of Object.entries(hubScripts)) {
    await writeFile(join(hubScriptsDir, name), content);
  }


  // GA is only injected when GA_MEASUREMENT_ID is provided; there is no
  // hardcoded fallback (F-106) so a misconfigured build never ships a bogus
  // or foreign measurement ID.
  const gaMeasurementId = buildEnv.GA_MEASUREMENT_ID;
  if (gaMeasurementId) {
    await writeFile(
      join(hubScriptsDir, "gtag-init.js"),
      `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', ${JSON.stringify(gaMeasurementId)});
`,
    );
  }
  const gaTag = gaMeasurementId
    ? `    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}"></script>
    <script src="/hub-scripts/gtag-init.js"></script>
`
    : "";

  const generatePage = (
    title: string,
    content: string,
    page: HubPageMeta,
    isHome: boolean = false,
  ) => `<!DOCTYPE html>
<html lang="id">
<head>
${gaTag}    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(page.description)}">
${
  page.noindex
    ? `    <meta name="robots" content="noindex">`
    : `    <link rel="canonical" href="${HUB_ORIGIN}${page.path}">`
}
    <meta name="theme-color" content="#000000">
    <title>${title} | Dawnbook Platform</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,400..900;1,400..900&family=Syne:wght@400..800&display=swap">
    <link href="https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,400..900;1,400..900&family=Syne:wght@400..800&display=swap" rel="stylesheet" media="print" data-swap-media="all">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,400..900;1,400..900&family=Syne:wght@400..800&display=swap"></noscript>
        <script src="/pake-compat.js" defer></script>
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="manifest" href="/manifest.webmanifest">
    <link rel="stylesheet" href="/typography.css?v=${Date.now()}">
    <link rel="stylesheet" href="/tokens.css?v=${Date.now()}">
    <link rel="stylesheet" href="/HubLayout.css?v=${Date.now()}">
    <script src="/hub-scripts/hub-runtime.js"></script>
    <script src="/hub-scripts/i18n.js"></script>
    <script src="/hub-scripts/hub-actions.js"></script>
</head>
<body>
    <a href="#main-content" class="skip-link" style="position: absolute; top: -40px; left: 0; background: var(--color-primary); color: var(--color-background); padding: 8px; z-index: 1000; transition: top 0.2s;" data-i18n="hub.nav.skip">Skip to content</a>
    <div class="hub-layout">
        <div class="desktop-top-controls">
            <div id="desktop-user-controls" style="display: flex; align-items: center;"></div>
            <button class="lang-toggle-btn" data-i18n="hub.lang.toggle" style="background: transparent; border: 1px solid var(--color-secondary); color: var(--color-text); border-radius: 4px; cursor: pointer; height: 36px; min-width: 44px; display: flex; align-items: center; justify-content: center; font-weight: 600; padding: 0 8px;">EN</button>
            <button data-action="toggle-theme" class="theme-toggle-icon theme-toggle desktop-theme-btn" aria-label="Toggle Theme" aria-pressed="false">
                <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </button>
        </div>
        <aside class="side-nav">
            <div class="side-nav-header">
                <button class="mobile-menu-toggle" data-action="toggle-menu" aria-label="Toggle Navigation">☰</button>
                <a href="/" class="logo">Dawnbook</a>
                <div class="mobile-controls">
                    <button class="lang-toggle-btn" data-i18n="hub.lang.toggle" style="background: transparent; border: 1px solid var(--color-secondary); color: var(--color-text); border-radius: 4px; cursor: pointer; height: 36px; min-width: 44px; display: flex; align-items: center; justify-content: center; font-weight: 600; padding: 0 8px;">EN</button>
                    <button data-action="toggle-theme" class="theme-toggle-icon theme-toggle mobile-theme-btn" aria-label="Toggle Theme" aria-pressed="false">
                        <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                        <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                    </button>
                    <div id="mobile-user-controls" style="display: flex; align-items: center;"></div>
                </div>
            </div>
            <nav class="nav-links" aria-label="Main Navigation">
                <a href="/" class="${isHome ? "active" : ""}" ${isHome ? 'aria-current="page"' : ""} data-i18n="hub.home">Home</a>
                <a href="/about" class="${title === "About" ? "active" : ""}" ${title === "About" ? 'aria-current="page"' : ""} data-i18n="hub.about">About</a>
                <a href="/statistics" class="${title === "Statistics" ? "active" : ""}" ${title === "Statistics" ? 'aria-current="page"' : ""} data-i18n="hub.statistics">Statistics</a>
                <a href="/contribute" class="${title === "Contribute" ? "active" : ""}" ${title === "Contribute" ? 'aria-current="page"' : ""} data-i18n="hub.contribute">Contribute</a>
                <a href="/donate" class="${title === "Donate" ? "active" : ""}" ${title === "Donate" ? 'aria-current="page"' : ""} data-i18n="hub.donate">Donate</a>
                <a href="/dmca" class="${title === "DMCA Notice" ? "active" : ""}" ${title === "DMCA Notice" ? 'aria-current="page"' : ""} data-i18n="hub.dmca">DMCA</a>
            </nav>
        </aside>
        <main id="main-content" class="hub-main">
            ${content}
        </main>
    </div>
</body>
</html>`;

  const premium = new Set(premiumSlugs());

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
        <a href="/books/${escapeHtml(b.slug)}/" class="book-card" data-slug="${escapeHtml(b.slug)}"${premium.has(b.slug) ? ' data-premium="true"' : ""} data-created-at="${b.mtimeMs}" style="display: flex; flex-direction: column; padding: 20px; position: relative; transition: all 0.3s ease; height: 100%;">
            <div style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                    <span style="font-size: 48px; line-height: 1; display: inline-block; min-height: 48px; min-width: 48px;">${escapeHtml(b.emoji)}</span>
                    <div class="top-right-cluster">
                        <span class="subject-label-wrapper" style="display: none;"><span class="subject-label-chip"></span></span>
                        <span class="view-count-badge" style="display: none;">👁 0</span>
                        <button class="pin-toggle-btn" data-pin="${escapeHtml(b.slug)}" title="Pin Book">📌</button>
                    </div>
                </div>
                <h3 style="margin: 0 0 8px 0; font-size: 1.15rem; line-height: 1.4; color: var(--color-text); font-weight: 500;">${escapeHtml(b.title)}</h3>
            </div>
            <div style="margin-top: auto; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; color: var(--color-secondary);">
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <span style="font-size: 1rem; font-weight: 500; color: var(--color-text); text-decoration: underline; text-underline-offset: 4px; text-decoration-color: rgba(150, 150, 150, 0.4);">${escapeHtml(b.author)}</span>
                    <span style="font-size: 0.75rem; opacity: 0.85; color: var(--color-secondary); margin-top: 2px;">${b.formattedDate ? `${escapeHtml(b.formattedDate)} • ` : ""}${b.chapterCount} chapter</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 2px 6px; border: 1px solid var(--color-secondary); border-radius: 4px; opacity: 0.8; flex-shrink: 0;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                    ${premium.has(b.slug) ? "Premium" : "FREE"}
                </div>
            </div>
        </a>
      `,
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
        <p style="font-size: 0.85rem; color: var(--color-secondary);"><span data-i18n="about.motif.credit">Sunrise icon from Twemoji, licensed under CC-BY 4.0.</span> (<a href="https://github.com/jdecked/twemoji" target="_blank" rel="noopener noreferrer">github.com/jdecked/twemoji</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">creativecommons.org/licenses/by/4.0</a>)</p>
        <p style="font-size: 0.85rem; color: var(--color-secondary);" data-i18n="about.ai.notice">The books on Dawnbook are written with AI assistance and edited by their authors.</p>
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
                <img src="https://media.dawnbook.belajarcarabelajar.com/site/images/creator.webp" alt="Iwan Kurniawan" class="contributor-avatar">
                <div class="contributor-info">
                    <h3 class="contributor-name"><a href="https://github.com/belajarcarabelajar" target="_blank" rel="noopener noreferrer" data-i18n="contribute.contributor1.name">Iwan Kurniawan</a></h3>
                    <p class="contributor-role" data-i18n="contribute.contributor1.role">Content Creator, Developer, and Founder @belajarcarabelajar</p>
                    <a href="mailto:iwan@dawnbook.belajarcarabelajar.com" class="contributor-email">✉️ iwan@dawnbook.belajarcarabelajar.com</a>
                </div>
            </div>
            <div class="contributor-card">
                <img src="https://media.dawnbook.belajarcarabelajar.com/site/images/kania-salsabila.webp" alt="Kania Salsabila" class="contributor-avatar">
                <div class="contributor-info">
                    <h3 class="contributor-name"><a href="https://github.com/kaniasalsabila639-ops" target="_blank" rel="noopener noreferrer" data-i18n="contribute.contributor2.name">Kania Salsabila</a></h3>
                    <p class="contributor-role" data-i18n="contribute.contributor2.role">Best Scientific Paper, Outstanding Student (Mawapres), Faculty of Languages and Arts 2026, Universitas Negeri Jakarta</p>
                    <a href="mailto:kania@dawnbook.belajarcarabelajar.com" class="contributor-email">✉️ kania@dawnbook.belajarcarabelajar.com</a>
                </div>
            </div>
        </div>
    </div>
  `;

  const dmcaContent = `
    <div class="content-panel">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md)" data-i18n="dmca.title">DMCA Notice & Copyright Policy</h2>
        <p data-i18n="dmca.intro">Dawnbook respects the intellectual property rights of others and expects its users and contributors to do the same. This policy outlines our compliance with the Digital Millennium Copyright Act (17 U.S.C. § 512) and our notice-and-takedown procedures.</p>

        <h3 style="color: var(--color-primary); margin-top: var(--spacing-lg); margin-bottom: var(--spacing-sm)" data-i18n="dmca.fairuse.title">1. Educational Mission & Fair Use</h3>
        <p data-i18n="dmca.fairuse.body">Dawnbook is a non-profit, open-access educational platform. Content published on this platform may include brief quotations, scholarly citations, diagrams, and formulas utilized strictly for educational analysis, commentary, criticism, and scholarship under the Fair Use doctrine (17 U.S.C. § 107) and applicable copyright exceptions.</p>

        <h3 style="color: var(--color-primary); margin-top: var(--spacing-lg); margin-bottom: var(--spacing-sm)" data-i18n="dmca.notice.title">2. Submitting a DMCA Takedown Notice</h3>
        <p data-i18n="dmca.notice.body">If you are a copyright owner or an authorized agent thereof and believe that any content hosted on Dawnbook infringes upon your copyright, you may submit a formal notification in writing containing the following requirements:</p>
        <ul style="padding-left: var(--spacing-lg); line-height: 1.7;">
            <li style="margin-bottom: var(--spacing-xs)"><strong data-i18n="dmca.notice.item1.strong">Authorized Signature:</strong> <span data-i18n="dmca.notice.item1.text">A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</span></li>
            <li style="margin-bottom: var(--spacing-xs)"><strong data-i18n="dmca.notice.item2.strong">Identification of Work:</strong> <span data-i18n="dmca.notice.item2.text">Identification of the copyrighted work claimed to have been infringed, or a representative list of such works.</span></li>
            <li style="margin-bottom: var(--spacing-xs)"><strong data-i18n="dmca.notice.item3.strong">Location (URL):</strong> <span data-i18n="dmca.notice.item3.text">Identification of the material that is claimed to be infringing, including specific URLs on Dawnbook.</span></li>
            <li style="margin-bottom: var(--spacing-xs)"><strong data-i18n="dmca.notice.item4.strong">Contact Information:</strong> <span data-i18n="dmca.notice.item4.text">Your full legal name, physical mailing address, telephone number, and active email address.</span></li>
            <li style="margin-bottom: var(--spacing-xs)"><strong data-i18n="dmca.notice.item5.strong">Good Faith Statement:</strong> <span data-i18n="dmca.notice.item5.text">A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</span></li>
            <li style="margin-bottom: var(--spacing-xs)"><strong data-i18n="dmca.notice.item6.strong">Perjury & Accuracy Statement:</strong> <span data-i18n="dmca.notice.item6.text">A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner.</span></li>
        </ul>

        <h3 style="color: var(--color-primary); margin-top: var(--spacing-lg); margin-bottom: var(--spacing-sm)" data-i18n="dmca.agent.title">3. Designated Copyright Agent</h3>
        <p data-i18n="dmca.agent.body">Please deliver all DMCA notifications to our designated copyright agent:</p>
        <div style="background: var(--color-surface); border: 1px solid var(--color-secondary); padding: var(--spacing-md); border-radius: 8px; margin: var(--spacing-md) 0;">
            <p style="margin: 0 0 var(--spacing-xs) 0;"><strong>Dawnbook Copyright Agent</strong></p>
            <p style="margin: 0 0 var(--spacing-xs) 0;">BelajarCaraBelajar Open Knowledge Initiative</p>
            <p style="margin: 0 0 var(--spacing-xs) 0;">Email: <a href="mailto:dmca@dawnbook.belajarcarabelajar.com" style="color: var(--color-primary); font-weight: 600;">dmca@dawnbook.belajarcarabelajar.com</a></p>
            <p style="margin: 0;">Alternative Contact: <a href="mailto:iwan@dawnbook.belajarcarabelajar.com" style="color: var(--color-primary);">iwan@dawnbook.belajarcarabelajar.com</a></p>
        </div>

        <h3 style="color: var(--color-primary); margin-top: var(--spacing-lg); margin-bottom: var(--spacing-sm)" data-i18n="dmca.counter.title">4. Counter-Notification Procedure</h3>
        <p data-i18n="dmca.counter.body">If your content was removed or disabled as a result of a DMCA notice and you believe this was due to mistake or misidentification, you may send a written counter-notification pursuant to 17 U.S.C. § 512(g)(3) containing your contact details, identification of the removed material, consent to jurisdiction, and statement under penalty of perjury.</p>

        <h3 style="color: var(--color-primary); margin-top: var(--spacing-lg); margin-bottom: var(--spacing-sm)" data-i18n="dmca.repeat.title">5. Repeat Infringer Policy</h3>
        <p data-i18n="dmca.repeat.body">In accordance with the DMCA and other applicable laws, Dawnbook maintains a policy of terminating, in appropriate circumstances, contributor privileges or account access for users who are deemed to be repeat infringers.</p>
    </div>
  `;

  const donateContent = `
    <div class="content-panel" style="max-width: 720px;">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-sm)" data-i18n="donate.title">Support Dawnbook</h2>
        <p style="color: var(--color-text-muted); margin-bottom: var(--spacing-lg); line-height: 1.7;" data-i18n="donate.subtitle">Your generosity helps us deliver free books to school libraries and community reading spaces in underserved regions (3T areas).</p>

        <div class="donate-grid">
            <!-- Bank Transfer Card -->
            <div style="background: var(--color-surface); border: 1px solid var(--color-secondary); border-radius: var(--spacing-md); padding: var(--spacing-lg);">
                <h3 style="color: var(--color-primary); margin: 0 0 var(--spacing-md) 0; font-size: 1.1rem;" data-i18n="donate.bank.title">Bank Transfer</h3>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem;">
                        <span style="color: var(--color-text-muted);" data-i18n="donate.bank.name">BCA</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; background: var(--color-background); border: 1px solid var(--color-secondary); border-radius: 6px; padding: 12px 16px;">
                        <span id="bank-account-number" style="font-size: 1.3rem; font-weight: 700; font-family: var(--font-family-display); letter-spacing: 2px; color: var(--color-primary);">3761558747</span>
                        <button id="copy-btn" data-action="copy-account" style="background: var(--color-primary); color: var(--color-background); border: none; border-radius: 4px; padding: 6px 14px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s;" data-i18n="donate.bank.copy">Copy</button>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--color-text-muted);">a.n. <strong style="color: var(--color-text);" data-i18n="donate.bank.holder">Iwan Kurniawan</strong></div>
                </div>
            </div>

            <!-- QRIS Card -->
            <div style="background: var(--color-surface); border: 1px solid var(--color-secondary); border-radius: var(--spacing-md); padding: var(--spacing-lg); text-align: center; box-sizing: border-box;">
                <h3 style="color: var(--color-primary); margin: 0 0 var(--spacing-sm) 0; font-size: 1.1rem;" data-i18n="donate.qris.title">Scan QRIS</h3>
                <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: var(--spacing-md);" data-i18n="donate.qris.desc">Scan the QR code below using any e-wallet or mobile banking app.</p>
                <div class="donate-qris-frame">
                    <img class="donate-qris-img" src="https://img.berduflare.com/img/800/bsob0d3ebsoe6947mv_2/LmqNNYTpPwFLHsiLmJQR01lnZ5YUVTySJrzPuA11wXg.webp" alt="QRIS Code">
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
    <script src="/hub-scripts/donate.js"></script>
  `;

  const appreciationContent = `
    <div class="content-panel" style="max-width: 600px; text-align: center;">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-sm);" data-i18n="appreciation.title">Your Appreciation Badge</h2>
        <p style="color: var(--color-text-muted); margin-bottom: var(--spacing-lg);" data-i18n="appreciation.subtitle">Thank you for supporting free education.</p>
        <div id="appreciation-content" style="min-height: 200px; display: flex; align-items: center; justify-content: center;">
            <p style="color: var(--color-text-muted);">Loading...</p>
        </div>
    </div>
    <script src="/hub-scripts/appreciation.js"></script>
  `;

  // Turnstile is only rendered when TURNSTILE_SITE_KEY is provided; there is no
  // hardcoded fallback (F-106). The widget and its API script are both omitted
  // otherwise, matching the fail-open behavior when TURNSTILE_SECRET is unset.
  const turnstileSiteKey = buildEnv.TURNSTILE_SITE_KEY;
  const turnstileScript = turnstileSiteKey
    ? `    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
`
    : "";
  const turnstileWidget = turnstileSiteKey
    ? `        <div class="cf-turnstile" data-sitekey="${turnstileSiteKey}" data-action="turnstile-spin-v2" data-theme="auto" style="margin: 0 auto var(--spacing-lg) auto; display: flex; justify-content: center;"></div>
`
    : "";

  const signInContent = `
${turnstileScript}    <div class="content-panel" style="text-align: center; margin: 0 auto; max-width: 450px; padding: var(--spacing-xl);">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-md)" data-i18n="signin.title">Sign In to Continue Reading</h2>
        <p style="margin-bottom: var(--spacing-lg)" data-i18n="signin.body">Create a free account or sign in to access the full book content.</p>
${turnstileWidget}        <a id="google-signin-btn" data-google-auth href="#" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #fff; color: #1f1f1f; border: 1px solid #dadce0; border-radius: 4px; text-decoration: none; font-weight: 500; font-family: inherit; cursor: pointer;">
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.32A9 9 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.98 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.3-1.72V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.02-2.32z" fill="#FBBC05"/>
                <path d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.02 2.32C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            <span data-i18n="signin.cta">Sign in with Google</span>
        </a>
        <div style="margin-top: var(--spacing-md);">
            <a id="bcb-signin-btn" href="/api/auth/bcb/start?next=%2F" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #fff; color: #1f1f1f; border: 1px solid #dadce0; border-radius: 4px; text-decoration: none; font-weight: 500; font-family: inherit; cursor: pointer;">
                <span data-i18n="signin.bcb.cta">Sign in with your belajarcarabelajar.com account</span>
            </a>
            <p style="font-size: 0.875rem; opacity: 0.7; margin-top: var(--spacing-sm);" data-i18n="signin.bcb.hint">Use this if your purchase email is not a Google account.</p>
        </div>
        <p id="signin-error" style="margin-top: var(--spacing-md); color: #c0392b; display: none;"></p>
        <p style="font-size: 0.875rem; opacity: 0.7; margin-top: var(--spacing-md);">No account? Signing in with Google will create one automatically.</p>
    </div>
    <script src="/hub-scripts/sign-in.js"></script>
  `;

  const signUpContent = signInContent
    .replace(
      'data-i18n="signin.title">Sign In to Continue Reading',
      ">Sign Up to Continue Reading",
    )
    .replace('id="google-signin-btn"', 'id="google-signup-btn"');

  const statisticsContent = `
    <div class="content-panel stats-panel">
        <h2 style="color: var(--color-primary); margin-bottom: var(--spacing-sm)" data-i18n="statistics.title">Platform Statistics</h2>
        <p style="color: var(--color-text-muted); margin-bottom: var(--spacing-lg); line-height: 1.7;" data-i18n="statistics.subtitle">Live metrics on DawnBook's content, community, and impact.</p>

        <div id="stats-loading" data-i18n="statistics.loading">Loading statistics...</div>
        <div id="stats-error" class="stats-error" style="display: none;" data-i18n="statistics.error">Unable to load statistics. Please try again later.</div>

        <div id="stats-content" style="display: none;">
            <!-- Content -->
            <section class="stats-section" data-section="content">
                <h3 class="stats-section-title" data-i18n="statistics.content.title">Content</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value" id="stat-total-books">—</div>
                        <div class="stat-label" data-i18n="statistics.content.total_books">Total books</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="stat-total-chapters">—</div>
                        <div class="stat-label" data-i18n="statistics.content.total_chapters">Total chapters</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="stat-avg-chapters">—</div>
                        <div class="stat-label" data-i18n="statistics.content.avg_chapters">Avg chapters per book</div>
                    </div>
                </div>
                <div class="stats-block">
                    <div class="stats-block-label" data-i18n="statistics.content.by_subject">Books by subject</div>
                    <div class="stats-bars" id="stat-by-subject"></div>
                </div>
            </section>

            <!-- Engagement -->
            <section class="stats-section" data-section="engagement">
                <h3 class="stats-section-title" data-i18n="statistics.engagement.title">Engagement</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value" id="stat-total-views">—</div>
                        <div class="stat-label" data-i18n="statistics.engagement.total_views">Total views</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="stat-this-month">—</div>
                        <div class="stat-label" data-i18n="statistics.engagement.this_month">Books added this month</div>
                    </div>
                </div>
                <div class="stats-block">
                    <div class="stats-block-label" data-i18n="statistics.engagement.range">Publication date range</div>
                    <div class="stats-range" id="stat-release-range">—</div>
                </div>
                <div class="stats-block">
                    <div class="stats-block-label" data-i18n="statistics.engagement.timeline">Publication timeline (last 12 months)</div>
                    <div class="stats-timeline" id="stat-timeline"></div>
                </div>
            </section>

            <!-- Donations -->
            <section class="stats-section" data-section="donations">
                <h3 class="stats-section-title" data-i18n="statistics.donations.title">Donations</h3>
                <div class="stats-tiers">
                    <div class="stat-tier stat-tier-gold">
                        <div class="stat-tier-value" id="stat-donations-gold">—</div>
                        <div class="stat-tier-label" data-i18n="statistics.donations.tier.gold">Gold supporters</div>
                    </div>
                    <div class="stat-tier stat-tier-silver">
                        <div class="stat-tier-value" id="stat-donations-silver">—</div>
                        <div class="stat-tier-label" data-i18n="statistics.donations.tier.silver">Silver supporters</div>
                    </div>
                    <div class="stat-tier stat-tier-bronze">
                        <div class="stat-tier-value" id="stat-donations-bronze">—</div>
                        <div class="stat-tier-label" data-i18n="statistics.donations.tier.bronze">Bronze supporters</div>
                    </div>
                </div>
                <div class="stats-total-row">
                    <span data-i18n="statistics.donations.total">Total supporters</span>
                    <span class="stat-total-value" id="stat-donations-total">—</span>
                </div>
                <p class="stats-note" data-i18n="statistics.donations.note">Donor names are kept private. We honor all supporters.</p>
            </section>

            <!-- Contributors -->
            <section class="stats-section" data-section="contributors">
                <h3 class="stats-section-title" data-i18n="statistics.contributors.title">Contributors</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value" id="stat-contributors-total">—</div>
                        <div class="stat-label" data-i18n="statistics.contributors.total">Total contributors</div>
                    </div>
                </div>
                <div class="stats-block">
                    <div class="stats-block-label" data-i18n="statistics.contributors.top">Top contributors</div>
                    <ol class="stats-top-list" id="stat-contributors-top"></ol>
                </div>
            </section>
        </div>
    </div>
    <script src="/hub-scripts/statistics.js"></script>
  `;

  await writeFile(
    join(outputDir, "index.html"),
    generatePage(
      "Home",
      indexContent,
      {
        path: "/",
        description: "Dawnbook - A Scalable Educational Publishing Platform",
      },
      true,
    ),
  );
  await writeFile(
    join(outputDir, "about.html"),
    generatePage("About", aboutContent, {
      path: "/about",
      description:
        "Why Dawnbook exists, its philosophy of free and open learning, its core principles, and the meaning behind the dawn motif.",
    }),
  );
  await writeFile(
    join(outputDir, "contribute.html"),
    generatePage("Contribute", contributeContent, {
      path: "/contribute",
      description:
        "How to contribute chapters, typo fixes, or new books to Dawnbook through GitHub pull requests, and who the main contributors are.",
    }),
  );
  await writeFile(
    join(outputDir, "donate.html"),
    generatePage("Donate", donateContent, {
      path: "/donate",
      description:
        "Support Dawnbook by bank transfer or QRIS to help deliver free books to school libraries and community reading spaces in 3T areas.",
    }),
  );
  await writeFile(
    join(outputDir, "appreciation.html"),
    generatePage("Appreciation", appreciationContent, {
      path: "/appreciation",
      description:
        "See your Dawnbook appreciation badge, the Gold, Silver, or Bronze patron badge earned by donating to support free education.",
    }),
  );
  await writeFile(
    join(outputDir, "statistics.html"),
    generatePage("Statistics", statisticsContent, {
      path: "/statistics",
      description:
        "Live Dawnbook statistics on books, chapters, subjects, views, the publication timeline, donations, and contributors.",
    }),
  );
  await writeFile(
    join(outputDir, "sign-in.html"),
    generatePage("Sign In", signInContent, {
      path: "/sign-in",
      description:
        "Sign in to Dawnbook with Google or a belajarcarabelajar.com account to read the full book content.",
      noindex: true,
    }),
  );
  await writeFile(
    join(outputDir, "sign-up.html"),
    generatePage("Sign Up", signUpContent, {
      path: "/sign-up",
      description:
        "Create a free Dawnbook account by signing in with Google to read the full book content.",
      noindex: true,
    }),
  );
  await writeFile(
    join(outputDir, "dmca.html"),
    generatePage("DMCA Notice", dmcaContent, {
      path: "/dmca",
      description:
        "Dawnbook DMCA notice and copyright policy, covering fair use, takedown notices, the copyright agent contact, counter-notices, and repeat infringers.",
    }),
  );

  const manifestData = {
    books: builtBooks.map((b) => b.slug),
    premium: builtBooks.filter((b) => premium.has(b.slug)).map((b) => b.slug),
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
}

export async function copyAssets(
  rootDir: string,
  outputDir: string,
): Promise<void> {
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

  try {
    await $`cp -r public/* ${outputDir}/`;
  } catch (error) {
    console.warn(
      "No public/ directory found or empty, skipping PWA files copy.",
      "No public/ directory found or empty, skipping PWA files copy.",
      error
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
  Content-Security-Policy: ${CONTENT_SECURITY_POLICY}

/books/*
  ! Content-Security-Policy
  Content-Security-Policy: ${BOOK_CONTENT_SECURITY_POLICY}
`;

    await writeFile(join(outputDir, "_headers"), headersContent.trim());
    console.log("Security headers generated successfully.");
  } catch (error) {
    console.error("Failed to generate security headers", error);
    process.exit(1);
  }
}
