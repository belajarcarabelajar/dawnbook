import { expect, test, describe } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("Shared Script Client-Side Logic", () => {
  test("script contains progressive enhancement fallbacks", () => {
    const scriptPath = join(import.meta.dir, "../../books/shared-script-v3.js");
    const script = readFileSync(scriptPath, "utf-8");
    
    // Assert that Clerk JS is dynamically injected
    expect(script).toContain("clerk.browser.js");
    
    // Assert that it checks for the public vs private paths
    expect(script).toContain("isPublic =");
    expect(script).toContain("sessionStorage.getItem('free_chapter_viewed')");
  });
});
