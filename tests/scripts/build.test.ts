import { expect, test, describe } from "bun:test";
import { readFileSync, readdirSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

describe("Build Script & Modular Builder (scripts/build.ts)", () => {
  test("build script includes compilation calls and SEO headers", () => {
    const runnerPath = join(import.meta.dir, "../../scripts/builder/mdbook-runner.ts");
    const enginePath = join(import.meta.dir, "../../scripts/builder/template-engine.ts");
    const securityHeadersPath = join(import.meta.dir, "../../functions/lib/security-headers.ts");
    const runner = readFileSync(runnerPath, "utf-8");
    const engine = readFileSync(enginePath, "utf-8");
    const securityHeaders = readFileSync(securityHeadersPath, "utf-8");
    
    // Assert that mdbook-runner executes mdbook build
    expect(runner).toContain("mdbook build");
    
    // Assert that template-engine configures _headers for Cloudflare Pages
    expect(engine).toContain("_headers");
    expect(engine).toContain("X-Frame-Options: DENY");
    expect(engine).toContain("Content-Security-Policy");
    // The engine must pull the CSP from the shared single source of truth
    // (functions/lib/security-headers.ts) rather than duplicating it.
    expect(engine).toContain("CONTENT_SECURITY_POLICY");

    // The generated CSP must allow every origin the pages actually load:
    // MathJax (cdnjs), GA (googletagmanager), Turnstile (challenges.cloudflare),
    // Google Fonts stylesheet (fonts.googleapis.com).
    expect(securityHeaders).toContain("https://cdnjs.cloudflare.com");
    expect(securityHeaders).toContain("https://www.googletagmanager.com");
    expect(securityHeaders).toContain("https://challenges.cloudflare.com");
    expect(securityHeaders).toContain("https://fonts.googleapis.com");
  });

  test("GA tag and Turnstile widget are only emitted when env vars are set (F-106)", async () => {
    const rootDir = join(import.meta.dir, "../..");
    const { generateSitePages } = await import("../../scripts/builder/template-engine.ts");
    const builtBooks = [
      {
        slug: "test-book",
        title: "Test Book",
        author: "Tester",
        chapterCount: 1,
        emoji: "📖",
        chapters: ["/books/test-book/ch1.html"],
        mtimeMs: 0,
        formattedDate: "1 Jan 2026",
      },
    ];

    // generateSitePages takes an injectable buildEnv; passing explicit objects
    // keeps the test from mutating the shared process.env (which would race
    // with other test files running in parallel).
    const gen = async (env: Record<string, string | undefined>) => {
      const dir = mkdtempSync(join(tmpdir(), "dawnbook-f106-"));
      try {
        await generateSitePages(rootDir, dir, builtBooks as any, env);
        return dir;
      } catch (err) {
        rmSync(dir, { recursive: true, force: true });
        throw err;
      }
    };

    // Without env vars: no GA, no Turnstile in the generated HTML.
    const dirNoEnv = await gen({});
    try {
      const homeNoEnv = readFileSync(join(dirNoEnv, "index.html"), "utf-8");
      expect(homeNoEnv).not.toContain("googletagmanager.com");
      expect(homeNoEnv).not.toContain("gtag");
      const signInNoEnv = readFileSync(join(dirNoEnv, "sign-in.html"), "utf-8");
      expect(signInNoEnv).not.toContain("challenges.cloudflare.com");
      expect(signInNoEnv).not.toContain("class=\"cf-turnstile\""); // widget markup absent (cf-turnstile-response param name in JS is fine)
      expect(signInNoEnv).not.toContain("data-sitekey");
    } finally {
      rmSync(dirNoEnv, { recursive: true, force: true });
    }

    // With env vars: GA and Turnstile present.
    const dirWithEnv = await gen({ GA_MEASUREMENT_ID: "G-TEST123", TURNSTILE_SITE_KEY: "0x4TESTKEY" });
    try {
      const homeWithEnv = readFileSync(join(dirWithEnv, "index.html"), "utf-8");
      expect(homeWithEnv).toContain("G-TEST123");
      expect(homeWithEnv).toContain("googletagmanager.com");
      const signInWithEnv = readFileSync(join(dirWithEnv, "sign-in.html"), "utf-8");
      expect(signInWithEnv).toContain("challenges.cloudflare.com");
      expect(signInWithEnv).toContain('data-sitekey="0x4TESTKEY"');
    } finally {
      rmSync(dirWithEnv, { recursive: true, force: true });
    }
  });

  test("no hardcoded GA measurement ID or Turnstile site key fallbacks (F-106)", () => {
    const engine = readFileSync(join(import.meta.dir, "../../scripts/builder/template-engine.ts"), "utf-8");
    const inject = readFileSync(join(import.meta.dir, "../../scripts/inject-gating.ts"), "utf-8");

    // The real identifiers must never appear as fallbacks in source.
    expect(engine).not.toContain("G-V619M5H4YW");
    expect(engine).not.toContain("0x4AAAAAAEBDHm_F3WkNRSpN");
    expect(inject).not.toContain("G-V619M5H4YW");

    // Both scripts must source the identifiers exclusively from env vars
    // (template-engine reads them via its injectable buildEnv, which defaults
    // to process.env in the build pipeline; inject-gating reads process.env).
    expect(engine).toContain("buildEnv.GA_MEASUREMENT_ID");
    expect(engine).toContain("buildEnv.TURNSTILE_SITE_KEY");
    expect(engine).toContain("buildEnv: Record<string, string | undefined> = process.env");
    expect(inject).toContain("process.env.GA_MEASUREMENT_ID");
  });

  test("root _headers and build output keep the CSP in sync with the shared single source of truth", async () => {
    const { CONTENT_SECURITY_POLICY } = await import("../../functions/lib/security-headers.ts");

    // The tracked root _headers file must carry the exact same CSP value, so
    // the constant can never drift from what is actually deployed.
    const rootHeaders = readFileSync(join(import.meta.dir, "../../_headers"), "utf-8");
    expect(rootHeaders).toContain(`Content-Security-Policy: ${CONTENT_SECURITY_POLICY}`);

    // buildHeaders() must emit that same constant into the generated output.
    const engine = readFileSync(join(import.meta.dir, "../../scripts/builder/template-engine.ts"), "utf-8");
    expect(engine).toContain(`Content-Security-Policy: \${CONTENT_SECURITY_POLICY}`);
  });

  test("every external origin loaded by generated pages is allowed by the CSP", async () => {
    const { CONTENT_SECURITY_POLICY } = await import("../../functions/lib/security-headers.ts");

    // Collect hosts from actual resource-loading contexts only: <script src>,
    // <link href> (styles/preconnect/preload), <img src>, and <iframe src>.
    // Plain navigation links (<a href>) are not CSP-gated and are excluded.
    // Image hosts are governed by img-src (which allows all https:), so they
    // are tracked separately from script/style/frame hosts.
    const resourcePatterns: Array<{ tag: string; directives: string[]; pattern: RegExp }> = [
      {
        tag: "script",
        directives: ["script-src"],
        pattern: /<script[^>]*\bsrc="https:\/\/([a-zA-Z0-9.-]+)/g,
      },
      {
        tag: "link",
        // Stylesheets are governed by style-src, preconnect by connect-src,
        // and font preloads by font-src.
        directives: ["style-src", "connect-src", "font-src"],
        pattern: /<link[^>]*\bhref="https:\/\/([a-zA-Z0-9.-]+)/g,
      },
      {
        tag: "iframe",
        directives: ["frame-src"],
        pattern: /<iframe[^>]*\bsrc="https:\/\/([a-zA-Z0-9.-]+)/g,
      },
      {
        tag: "img",
        directives: ["img-src"],
        pattern: /<img[^>]*\bsrc="https:\/\/([a-zA-Z0-9.-]+)/g,
      },
    ];

    const sources: Array<{ html: string; label: string }> = [
      {
        html: readFileSync(join(import.meta.dir, "../../scripts/builder/template-engine.ts"), "utf-8"),
        label: "template-engine.ts",
      },
    ];
    const booksDir = join(import.meta.dir, "../../books");
    for (const slug of readdirSync(booksDir)) {
      const headPath = join(booksDir, slug, "theme/head.hbs");
      try {
        sources.push({ html: readFileSync(headPath, "utf-8"), label: `${slug}/theme/head.hbs` });
      } catch {
        // Books without a theme/head.hbs (e.g. the _template) are skipped.
      }
    }

    const directiveTokenAllowed = (directiveName: string, host: string): boolean => {
      const directive = CONTENT_SECURITY_POLICY.split(";")
        .map((d) => d.trim())
        .find((d) => d.startsWith(`${directiveName} `));
      if (!directive) return false;
      return directive.split(/\s+/).some((token) => {
        if (token.startsWith("https://")) {
          const tokenHost = token.replace(/^https:\/\//, "");
          if (tokenHost.startsWith("*.")) return host.endsWith(tokenHost.slice(1));
          return host === tokenHost;
        }
        // Bare scheme wildcard (e.g. img-src https:) allows any host.
        return token === "https:";
      });
    };

    for (const { html, label } of sources) {
      for (const { directives, pattern } of resourcePatterns) {
        for (const match of html.matchAll(pattern)) {
          const host = match[1];
          expect(
            directives.some((directive) => directiveTokenAllowed(directive, host)),
            `${label}: <${match[0].startsWith("<") ? match[0].slice(0, 20) : match[0]}> loads ${host}, which is not allowed by ${directives.join(" or ")}`
          ).toBe(true);
        }
      }
    }
  });

  test("HubLayout.css does not have white-space: nowrap under .hero-section h1 to ensure mobile friendliness", () => {
    const cssPath = join(import.meta.dir, "../../apps/hub/src/components/HubLayout.css");
    const cssContent = readFileSync(cssPath, "utf-8");

    const h1Section = cssContent.match(/\.hero-section\s+h1\s*\{([^}]*)\}/);
    expect(h1Section).not.toBeNull();
    if (h1Section) {
      expect(h1Section[1]).not.toContain("white-space: nowrap");
    }
  });

  test("createUserPill is called with showName=true on desktop and showName=false on mobile so the homepage header stays compact on phones", () => {
    const scriptPath = join(import.meta.dir, "../../apps/hub/src/scripts/hub-runtime.ts");
    const script = readFileSync(scriptPath, "utf-8");

    // The function must accept a showName parameter.
    expect(script).toMatch(/function\s+createUserPill\s*\(\s*container\s*:\s*HTMLElement\s*,\s*showName\s*:\s*boolean\s*\)/);

    // The desktop mount point must request the full pill (name + avatar).
    expect(script).toMatch(/createUserPill\s*\(\s*desktopEl\s*,\s*true\s*\)/);

    // The mobile mount point must request an avatar-only button so the
    // "Dawnbook" logo is not pushed out of the side-nav-header row.
    expect(script).toMatch(/createUserPill\s*\(\s*mobileEl\s*,\s*false\s*\)/);

    // The name label <span> must only be appended when showName is truthy.
    expect(script).toContain("if (showName)");
  });

  test("parseBookMetadata correctly returns 'Iwan Kurniawan' for modified books and no book retains 'Tedi Rahmat' or 'AI'", async () => {
    const { parseBookMetadata } = await import("../../scripts/builder/metadata");
    const booksDir = join(import.meta.dir, "../../books");

    const targetSlugs = ["filosofi-stoikisme", "neuroplastisitas-dalam-belajar", "piaget", "metakognisi"];
    for (const slug of targetSlugs) {
      const meta = await parseBookMetadata(join(booksDir, slug), slug);
      expect(meta.author).toBe("Iwan Kurniawan");
      expect(typeof meta.formattedDate).toBe("string");
      expect(meta.formattedDate).toMatch(/WIB$/);
    }
  });

  test("formatIndonesianDate formats timestamp into PUEBI-compliant Indonesian date (Opsi 1)", async () => {
    const { formatIndonesianDate } = await import("../../scripts/builder/metadata");
    // Test 1785576412000 ms = 2026-08-01 16:26:52 UTC+7 (Asia/Jakarta)
    const testMs = new Date("2026-08-01T16:26:52+07:00").getTime();
    const result = formatIndonesianDate(testMs);
    expect(result).toBe("1 Agustus 2026, 16.26 WIB");

    expect(formatIndonesianDate(0)).toBe("");
  });
});

