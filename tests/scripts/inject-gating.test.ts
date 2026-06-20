import { expect, test, describe } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("Inject Gating Script (scripts/inject-gating.ts)", () => {
  test("script injects SEO metadata and FOUC prevention", () => {
    const scriptPath = join(import.meta.dir, "../../scripts/inject-gating.ts");
    const script = readFileSync(scriptPath, "utf-8");
    
    // SEO metadata
    expect(script).toContain('name="description" content="');
    expect(script).toContain('rel="canonical"');
    
    // FOUC prevention
    expect(script).toContain('opacity="0"');
    expect(script).toContain("<noscript><style>html{opacity:1!important;visibility:visible!important;}</style></noscript>");
  });
});
