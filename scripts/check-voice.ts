import fs from "node:fs";
import path from "node:path";

// Voice guard (GEMINI.md section 29): caps per chapter on the scaffolds that make a chapter read like a
// report on its sources. A green run is necessary, not sufficient; reviewers still judge the voice.

export interface VoiceCap {
  label: string;
  pattern: RegExp;
  max: number;
  // Matches removed before counting (idioms and technical terms that only look like the pattern).
  except?: RegExp[];
  // Count outside fenced code blocks only.
  proseOnly?: boolean;
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
  {
    label: "crutch words",
    pattern: /(?<![\p{L}\p{N}])(tetap|pun|bahkan|justru)(?![\p{L}\p{N}])/giu,
    max: 4,
    // Link targets, "apa pun" and kin (indefinite pronouns), and "biaya tetap" and kin (fixed-quantity terms) are not crutch words.
    except: [
      /https?:\/\/[^\s)>\]]+/gu,
      /(?<![\p{L}\p{N}])(apa|siapa|mana|berapa|seberapa|kapan|bagaimana) pun(?![\p{L}\p{N}])/giu,
      /(?<![\p{L}\p{N}])(biaya|aset|pegawai|karyawan|harga|bunga|titik|pengeluaran|pendapatan|penghasilan|gaji|tarif|kurs|sudut|kecepatan|laju|modal|kontrak|pikir) tetap(?![\p{L}\p{N}])/giu,
    ],
    proseOnly: true,
  },
  { label: "diperhatikan opener", pattern: /(?<![\p{L}\p{N}])(kalau|jika) diperhatikan(?![\p{L}\p{N}])/giu, max: 0 },
  { label: "bridge heading", pattern: /^#{1,6} +Menuju /gmu, max: 0 },
  {
    label: "chapter announcement",
    pattern: /(?<![\p{L}\p{N}])(pada bab ini|dalam bab ini|bab ini akan)(?![\p{L}\p{N}])/giu,
    max: 2,
  },
];

const FENCE = /^```[^\n]*\n[\s\S]*?^```[ \t]*$/gm;

function capText(text: string, cap: VoiceCap): string {
  let t = cap.proseOnly ? text.replace(FENCE, "") : text;
  for (const e of cap.except ?? []) t = t.replace(e, " ");
  return t;
}

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

// A line that quotes a source verbatim (a classroom transcript, a cited title) may keep a flagged
// phrase when it ends with `<!-- voice-ok: <reason> -->`; the reason is mandatory, like the
// heading-colon-ok marker of GEMINI.md section 24.
const VOICE_OK = /<!--\s*voice-ok:\s*\S[^>]*-->\s*$/;

function countedText(md: string): string {
  return md
    .split("\n")
    .filter((line) => !VOICE_OK.test(line))
    .join("\n");
}

export function voiceViolations(file: string, md: string, options?: VoiceOptions): string[] {
  const text = countedText(md);
  return capsFor(file, options).flatMap((cap) => {
    const { label, pattern, max } = cap;
    const count = (capText(text, cap).match(pattern) ?? []).length;
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

export interface VoiceGateResult {
  ok: boolean;
  problems: string[];
}

// Build step (GEMINI.md section 29): every book in the library must pass, and a book with no
// checkable chapters fails instead of passing vacuously.
export function runVoiceGate(booksDir: string): VoiceGateResult {
  const slugs = fs.readdirSync(booksDir).filter((s) => isBook(booksDir, s)).sort();
  const problems = slugs.flatMap((slug) => {
    const { chapters, problems: found } = checkVoice(path.join(booksDir, slug), BOOK_VOICE_CONFIG[slug]);
    if (chapters === 0) return [`${slug}: no checkable chapters`];
    return found.map((p) => `${slug}/${p}`);
  });
  return { ok: problems.length === 0, problems };
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
