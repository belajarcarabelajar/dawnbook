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
});
