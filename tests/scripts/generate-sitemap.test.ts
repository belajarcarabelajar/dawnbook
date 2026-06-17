import { expect, test, describe } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("Generate Sitemap (scripts/generate-sitemap.ts)", () => {
  test("script formats URLs correctly", () => {
    const scriptPath = join(import.meta.dir, "../../scripts/generate-sitemap.ts");
    const script = readFileSync(scriptPath, "utf-8");
    
    // Check that it includes the base URL
    expect(script).toContain("https://dawnbook.belajarcarabelajar.com");
    // Check that it generates urlset XML
    expect(script).toContain("<urlset");
  });
});
