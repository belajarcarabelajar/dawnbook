import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { premiumSlugs } from "../functions/lib/premium";

const baseUrl = "https://dawnbook.belajarcarabelajar.com";

export interface LlmsManifest {
  books: string[];
  chapters: Record<string, string[]>;
}

export function buildLlmsTxt(manifestData: LlmsManifest): string {
  const premium = new Set(premiumSlugs());

  let llmsTxt = `# Dawnbook - Platform Buku Edukasi Open Source

> Dawnbook adalah platform open-source untuk kolaborasi dan publikasi buku edukasi berbasis Markdown dan mdBook. Semua konten buku dirancang untuk pembelajaran multidisiplin, sains, filsafat, teknologi, dan pengembangan diri.

## Daftar Buku & Modul Pembelajaran

`;

  for (const bookSlug of manifestData.books) {
    const title = bookSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    llmsTxt += `### [${title}](${baseUrl}/books/${bookSlug}/)\n`;

    const allChapters = manifestData.chapters[bookSlug] || [];
    // A premium book lists only its free first chapter; the rest are paid.
    const chapters = premium.has(bookSlug) ? allChapters.slice(0, 1) : allChapters;
    for (const chapterPath of chapters) {
      const chapterFileName = chapterPath.split("/").pop() || "";
      const cleanName = decodeURIComponent(chapterFileName)
        .replace(/\.html$/, "")
        .replace(/^[0-9]+[_\s-]+/, "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      llmsTxt += `- [${cleanName}](${baseUrl}${chapterPath})\n`;
    }
    llmsTxt += "\n";
  }

  return llmsTxt.trim() + "\n";
}

async function generateLlmsTxt() {
  const rootDir = process.cwd();
  const outputDir = join(rootDir, "output");
  const manifestPath = join(outputDir, "manifest.json");

  let manifestData: LlmsManifest;
  try {
    const raw = await readFile(manifestPath, "utf8");
    manifestData = JSON.parse(raw);
  } catch (err) {
    console.error("❌ Could not read manifest.json for llms.txt generation.");
    return;
  }

  await writeFile(join(outputDir, "llms.txt"), buildLlmsTxt(manifestData));
  console.log("✅ llms.txt generated successfully!");
}

if (import.meta.main) {
  generateLlmsTxt().catch(console.error);
}
