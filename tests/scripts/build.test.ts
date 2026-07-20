import { expect, test, describe } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("Build Script (scripts/build.ts)", () => {
  test("build script includes compilation calls and SEO headers", () => {
    const scriptPath = join(import.meta.dir, "../../scripts/build.ts");
    const script = readFileSync(scriptPath, "utf-8");
    
    // Assert that it executes mdbook build
    expect(script).toContain("mdbook build");
    
    // Assert that it configures _headers for Cloudflare Pages
    expect(script).toContain("_headers");
    expect(script).toContain("X-Robots-Tag: noindex");
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
    const scriptPath = join(import.meta.dir, "../../scripts/build.ts");
    const script = readFileSync(scriptPath, "utf-8");

    // The function must accept a showName parameter.
    expect(script).toMatch(/function\s+createUserPill\s*\(\s*container\s*,\s*showName\s*\)/);

    // The desktop mount point must request the full pill (name + avatar).
    expect(script).toMatch(/createUserPill\s*\(\s*desktopEl\s*,\s*true\s*\)/);

    // The mobile mount point must request an avatar-only button so the
    // "Dawnbook" logo is not pushed out of the side-nav-header row.
    expect(script).toMatch(/createUserPill\s*\(\s*mobileEl\s*,\s*false\s*\)/);

    // The name label <span> must only be appended when showName is truthy.
    const lblRegion = script.match(/if\s*\(\s*showName\s*\)\s*\{[\s\S]{0,200}?lbl\.textContent\s*=\s*nameText[\s\S]{0,200}?btn\.appendChild\(lbl\)/);
    expect(lblRegion).not.toBeNull();
  });
});
