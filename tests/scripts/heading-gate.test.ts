import { describe, expect, it, afterEach } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runHeadingGate } from "../../scripts/heading-gate";

const roots: string[] = [];

function makeRoot(chapter: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "heading-gate-"));
  roots.push(root);
  const book = path.join(root, "books", "buku-uji");
  fs.mkdirSync(path.join(book, "src", "content"), { recursive: true });
  fs.writeFileSync(path.join(book, "book.toml"), '[book]\ntitle = "Buku Uji"\nlanguage = "id"\n');
  fs.writeFileSync(path.join(book, "src", "SUMMARY.md"), "# Summary\n\n- [Bab Satu](content/01_a.md)\n");
  fs.writeFileSync(path.join(book, "src", "content", "01_a.md"), chapter);
  return root;
}

afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

describe("runHeadingGate", () => {
  it("passes a clean fixture", () => {
    const res = runHeadingGate(makeRoot("# Bab Satu\n\nIsi.\n"));
    expect(res.ok).toBe(true);
  });

  it("fails when the root holds no books at all", () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "heading-gate-empty-"));
    roots.push(empty);
    const res = runHeadingGate(empty);
    expect(res.ok).toBe(false);
    expect(res.output).toContain("no books");
  });

  it("fails when one heading repeats in three chapters of a book", () => {
    const root = makeRoot("# Bab Satu\n\n## Kesimpulan\n\nIsi.\n");
    const content = path.join(root, "books", "buku-uji", "src", "content");
    fs.writeFileSync(path.join(content, "02_b.md"), "# Bab Dua\n\n## Kesimpulan\n\nIsi.\n");
    fs.writeFileSync(path.join(content, "03_c.md"), "# Bab Tiga\n\n## Kesimpulan\n\nIsi.\n");
    const res = runHeadingGate(root);
    expect(res.ok).toBe(false);
    expect(res.output).toContain("kesimpulan");
  });

  it("fails a fixture with a colon heading and names the file", () => {
    const res = runHeadingGate(makeRoot("# Bab Satu\n\n## Harga yang Dibayar: Stres\n\nIsi.\n"));
    expect(res.ok).toBe(false);
    expect(res.output).toContain("01_a.md");
  });
});
