import fs from "node:fs";
import path from "node:path";

// Voice guard (GEMINI.md section 29): caps per chapter on the scaffolds that make a chapter read like a
// report on its sources. A green run is necessary, not sufficient; reviewers still judge the voice.

export interface VoiceCap {
  label: string;
  pattern: RegExp;
  max: number;
}

export interface SourceWordCap {
  word: string;
  max: number;
  // Chapter 01 introduces the source, so it may name it more often.
  firstChapterMax?: number;
}

export interface VoiceOptions {
  sourceWord?: SourceWordCap;
}

export interface VoiceResult {
  chapters: number;
  problems: string[];
}

export const VOICE_CAPS: VoiceCap[] = [
  { label: "Kalau dipikir-pikir", pattern: /kalau dipikir-pikir/gi, max: 0 },
  { label: "Menurut panduan", pattern: /menurut panduan/gi, max: 0 },
  { label: "tulis panduan", pattern: /tulis panduan/gi, max: 0 },
  { label: "mirip dengan", pattern: /mirip dengan/gi, max: 1 },
  { label: "stock connector", pattern: /(?<![\p{L}\p{N}])(perhatikan(lah)?|di situlah letak(nya)?|menariknya|ada satu (detail|catatan))(?![\p{L}\p{N}])/giu, max: 0 },
  { label: "bab berikutnya", pattern: /(?<![\p{L}])bab berikutnya/giu, max: 0 },
  { label: "tokoh kita", pattern: /tokoh kita/gi, max: 2 },
];

// Only books whose sources have a name that turned into a crutch need an entry here.
export const BOOK_VOICE_CONFIG: Record<string, VoiceOptions> = {
  "pelajaran-hidup-dari-harvest-moon-back-to-nature": { sourceWord: { word: "panduan", max: 2, firstChapterMax: 4 } },
};

const SKIPPED_FILE = /^\d+_(referensi|daftar-pustaka)/i;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function capsFor(file: string, options: VoiceOptions = {}): VoiceCap[] {
  const sw = options.sourceWord;
  if (!sw) return VOICE_CAPS;
  const max = file.startsWith("01_") && sw.firstChapterMax !== undefined ? sw.firstChapterMax : sw.max;
  const pattern = new RegExp(`(?<![\\p{L}])${escapeRegExp(sw.word)}(?![\\p{L}])`, "giu");
  return [...VOICE_CAPS, { label: sw.word, pattern, max }];
}

export function voiceViolations(file: string, md: string, options?: VoiceOptions): string[] {
  return capsFor(file, options).flatMap(({ label, pattern, max }) => {
    const count = (md.match(pattern) ?? []).length;
    return count > max ? [`${label} x${count} (max ${max})`] : [];
  });
}

export function checkVoice(bookDir: string, options?: VoiceOptions): VoiceResult {
  const dir = path.join(bookDir, "src/content");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !SKIPPED_FILE.test(f))
    .sort();
  const problems = files.flatMap((f) =>
    voiceViolations(f, fs.readFileSync(path.join(dir, f), "utf-8"), options).map((v) => `${f}: ${v}`),
  );
  return { chapters: files.length, problems };
}

function isBook(booksDir: string, slug: string): boolean {
  return !slug.startsWith("_") && fs.existsSync(path.join(booksDir, slug, "src/content"));
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  let booksDir = path.resolve(import.meta.dir, "../books");
  const at = args.indexOf("--books-dir");
  if (at >= 0) {
    booksDir = path.resolve(args[at + 1] ?? "");
    args.splice(at, 2);
  }
  const slugs = args.includes("--all")
    ? fs.readdirSync(booksDir).filter((s) => isBook(booksDir, s)).sort()
    : args;
  if (slugs.length === 0) {
    console.error("usage: bun run scripts/check-voice.ts [--books-dir <dir>] <book-slug> [<book-slug> ...] | --all");
    process.exit(2);
  }
  const unknown = slugs.filter((s) => !isBook(booksDir, s));
  if (unknown.length) {
    console.error(`unknown book: ${unknown.join(", ")}`);
    process.exit(2);
  }
  let total = 0;
  for (const slug of slugs) {
    const { chapters, problems } = checkVoice(path.join(booksDir, slug), BOOK_VOICE_CONFIG[slug]);
    for (const p of problems) console.log(`${slug}/${p}`);
    if (chapters === 0) {
      console.log(`${slug}: no checkable chapters`);
      total++;
      continue;
    }
    console.log(`${slug}: ${chapters} chapters, ${problems.length} problems`);
    total += problems.length;
  }
  process.exit(total ? 1 : 0);
}
