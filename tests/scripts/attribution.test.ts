import { describe, expect, test } from "bun:test";
import { createHash } from "crypto";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { generateSitePages } from "../../scripts/builder/template-engine";

const ROOT = join(import.meta.dir, "../..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const TWEMOJI_REPO = "https://github.com/jdecked/twemoji";
const CC_BY_URL = "https://creativecommons.org/licenses/by/4.0/";
const CREDIT_KEY = "about.motif.credit";

// sha256 of the licence text from the line "Creative Commons
// Attribution-ShareAlike 4.0 International" to the end, taken from
// `git show origin/main:LICENSE-CONTENT` on 2026-10-24 (the whole file then).
const CC_BY_SA_TEXT_SHA256 =
  "cde7883b9050a1104f4ac19a1572aafd6e5d7323b68351aaf51fbf4beba54966";

describe("third-party attribution", () => {
  test("THIRD-PARTY-NOTICES.md credits Twemoji under CC-BY 4.0 with the licence URL", () => {
    const notices = read("THIRD-PARTY-NOTICES.md");
    expect(notices).toContain("Twemoji");
    expect(notices).toMatch(/CC[- ]BY 4\.0/);
    expect(notices).toContain(CC_BY_URL);
  });

  test("package.json declares the MIT licence", () => {
    expect(JSON.parse(read("package.json")).license).toBe("MIT");
  });

  test("README has a licence and credits section that links THIRD-PARTY-NOTICES.md", () => {
    const readme = read("README.md");
    const start = readme.search(/^## (License and Credits|Lisensi dan Kredit)\s*$/m);
    expect(start).toBeGreaterThanOrEqual(0);
    const rest = readme.slice(start + 3);
    const next = rest.search(/^## /m);
    const section = next === -1 ? rest : rest.slice(0, next);
    expect(section).toMatch(/\]\(\.?\/?THIRD-PARTY-NOTICES\.md\)/);
  });

  test("LICENSE-CONTENT has a scope header above the unmodified CC BY-SA 4.0 text", () => {
    const text = read("LICENSE-CONTENT");
    const marker = "Creative Commons Attribution-ShareAlike 4.0 International";
    const at = text.indexOf(marker);
    expect(at).toBeGreaterThan(0);
    const header = text.slice(0, at);
    expect(header).toContain("THIRD-PARTY-NOTICES.md");
    const headerLines = header.trimEnd().split("\n").filter((l) => l.trim() !== "");
    expect(headerLines.length).toBeGreaterThanOrEqual(3);
    expect(headerLines.length).toBeLessThanOrEqual(6);
    const licence = text.slice(at);
    expect(createHash("sha256").update(licence).digest("hex")).toBe(CC_BY_SA_TEXT_SHA256);
  });

  test("both i18n catalogs carry the About credit naming Twemoji and CC-BY 4.0", () => {
    for (const file of ["i18n/en.json", "i18n/id.json"]) {
      const value: unknown = JSON.parse(read(file))[CREDIT_KEY];
      expect(typeof value).toBe("string");
      expect(value as string).toContain("Twemoji");
      expect(value as string).toContain("CC-BY 4.0");
    }
  });

  test("generated About page shows the credit and links Twemoji and the licence", async () => {
    const out = mkdtempSync(join(tmpdir(), "dawnbook-attribution-test-"));
    try {
      await generateSitePages(ROOT, out, [], {});
      const html = readFileSync(join(out, "about.html"), "utf8");
      expect(html).toContain(`data-i18n="${CREDIT_KEY}"`);
      expect(html).toContain(`href="${TWEMOJI_REPO}"`);
      expect(html).toContain(`href="${CC_BY_URL}"`);
      // The i18n runtime replaces textContent of [data-i18n] elements, so the
      // links must sit outside the translated element or a locale switch drops them.
      const translated = html.match(
        new RegExp(`<([a-z]+)[^>]*data-i18n="${CREDIT_KEY}"[^>]*>([\\s\\S]*?)</\\1>`),
      );
      expect(translated).not.toBeNull();
      expect(translated![2]).not.toContain("<a ");
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });
});
