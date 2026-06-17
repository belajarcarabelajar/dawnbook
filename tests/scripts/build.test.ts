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
});
