import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Known misattributed, invented or uncredited quotations found by the 2026-10-25 audit
// (docs/code-plan/artifacts/2026-10-25-dawnbook-quote-audit.md). Each rule is checked per
// paragraph (plus the paragraph before it) of every chapter (Referensi chapters excluded), so a fixed error cannot return
// and a new book cannot repeat it.
// scope "chapter": a term needs its source named once anywhere in the chapter (GEMINI.md section 29),
// not next to every heading that repeats it.
type Rule = { id: string; all: RegExp[]; none?: RegExp[]; scope?: "chapter" };

const RULES: Rule[] = [
  { id: "durant-as-aristotle", all: [/kita adalah apa yang kita (kerjakan|lakukan) berulang kali/i, /aristoteles/i], none: [/durant/i] },
  { id: "stimulus-response-as-frankl", all: [/stimulus dan respons/i, /frankl/i] },
  { id: "intelligence-change-as-einstein", all: [/ukuran kecerdasan adalah kemampuan untuk berubah/i, /einstein/i] },
  { id: "world-book-as-augustine", all: [/dunia adalah sebuah buku/i, /augustin|agustinus/i] },
  { id: "fire-together-as-hebb", all: [/neurons that fire together/i, /hebb/i], none: [/shatz/i] },
  { id: "right-thing-as-roosevelt", all: [/roosevelt/i, /hal yang benar/i] },
  { id: "systems-as-archilochus", all: [/archilochus/i, /tingkat sistem/i] },
  { id: "waves-as-kabat-zinn", all: [/menghentikan ombak/i, /kabat-zinn/i], none: [/satchidananda|poster/i] },
  { id: "ews-checklist-as-unesco", all: [/unesco/i, /checklist/i] },
  { id: "invented-uu-24-2007-text", all: [/wajib mengintegrasikan sistem peringatan dini/i] },
  { id: "weiji-myth", all: [/krisis/i, /bahaya/i, /peluang/i, /mandarin|tionghoa|\bcina\b|\bchina\b/i] },
  { id: "ews-pillars-as-unesco", all: [/unesco/i, /pilar/i], none: [/isdr|ewc/i] },
  { id: "antifragile-without-taleb", all: [/antifragil/i], none: [/taleb/i], scope: "chapter" },
  { id: "uncredited-ultident-passage", all: [/kolaborasi interdisipliner telah membuka jalan/i], none: [/ultident/i] },
];

const BOOKS_DIR = path.resolve(import.meta.dir, "../../books");

function violations(): string[] {
  const out: string[] = [];
  const books = readdirSync(BOOKS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith("_"));
  for (const book of books) {
    const dir = path.join(BOOKS_DIR, book.name, "src", "content");
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".md") && !/referensi/i.test(f))) {
      const text = readFileSync(path.join(dir, file), "utf8");
      for (const rule of RULES.filter((r) => r.scope === "chapter")) {
        if (rule.all.every((r) => r.test(text)) && !(rule.none ?? []).some((r) => r.test(text))) {
          out.push(`${rule.id}: ${book.name}/${file}: (chapter)`);
        }
      }
      const paragraphs = text.split(/\n\s*\n/);
      paragraphs.forEach((para, i) => {
        // An attribution often sits in the paragraph that introduces the quote, so the window
        // is this paragraph plus the one before it.
        const window = `${paragraphs[i - 1] ?? ""}\n\n${para}`;
        for (const rule of RULES.filter((r) => r.scope !== "chapter")) {
          if (rule.all.every((r) => r.test(window)) && !(rule.none ?? []).some((r) => r.test(window))) {
            out.push(`${rule.id}: ${book.name}/${file}: ${para.trim().slice(0, 70)}`);
          }
        }
      });
    }
  }
  return [...new Set(out)].sort();
}

describe("known misattributions", () => {
  test("no chapter repeats a known misattributed, invented or uncredited quotation", () => {
    expect(violations()).toEqual([]);
  });
});
