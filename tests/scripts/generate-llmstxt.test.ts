import { expect, test, describe } from "bun:test";

function generateLlmsTxtContent(manifestData: { books: string[]; chapters: Record<string, string[]> }, baseUrl: string): string {
  let llmsTxt = `# Dawnbook - Platform Buku Edukasi Open Source\n\n> Dawnbook adalah platform open-source untuk kolaborasi dan publikasi buku edukasi berbasis Markdown dan mdBook. Semua konten buku dirancang untuk pembelajaran multidisiplin, sains, filsafat, teknologi, dan pengembangan diri.\n\n## Daftar Buku & Modul Pembelajaran\n\n`;

  for (const bookSlug of manifestData.books) {
    const title = bookSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    llmsTxt += `### [${title}](${baseUrl}/books/${bookSlug}/)\n`;

    const chapters = manifestData.chapters[bookSlug] || [];
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

describe("LLMs.txt Generator Logic", () => {
  test("formats manifest data into valid markdown with correct title casing and chapter URLs", () => {
    const mockManifest = {
      books: ["sistem-modul-rust"],
      chapters: {
        "sistem-modul-rust": [
          "/books/sistem-modul-rust/index.html",
          "/books/sistem-modul-rust/01-penjelasan-modul.html",
        ],
      },
    };

    const result = generateLlmsTxtContent(mockManifest, "https://dawnbook.belajarcarabelajar.com");

    expect(result).toContain("# Dawnbook - Platform Buku Edukasi Open Source");
    expect(result).toContain("### [Sistem Modul Rust](https://dawnbook.belajarcarabelajar.com/books/sistem-modul-rust/)");
    expect(result).toContain("- [Index](https://dawnbook.belajarcarabelajar.com/books/sistem-modul-rust/index.html)");
    expect(result).toContain("- [Penjelasan Modul](https://dawnbook.belajarcarabelajar.com/books/sistem-modul-rust/01-penjelasan-modul.html)");
  });
});
