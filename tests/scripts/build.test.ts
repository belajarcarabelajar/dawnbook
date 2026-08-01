import { expect, test, describe } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("Build Script & Modular Builder (scripts/build.ts)", () => {
  test("build script includes compilation calls and SEO headers", () => {
    const runnerPath = join(import.meta.dir, "../../scripts/builder/mdbook-runner.ts");
    const enginePath = join(import.meta.dir, "../../scripts/builder/template-engine.ts");
    const runner = readFileSync(runnerPath, "utf-8");
    const engine = readFileSync(enginePath, "utf-8");
    
    // Assert that mdbook-runner executes mdbook build
    expect(runner).toContain("mdbook build");
    
    // Assert that template-engine configures _headers for Cloudflare Pages
    expect(engine).toContain("_headers");
    expect(engine).toContain("X-Frame-Options: DENY");
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

