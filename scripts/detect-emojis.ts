import fs from 'node:fs';
import path from 'node:path';

// Unicode property escape for visual emoji detection
const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;

interface EmojiMatch {
  bookSlug: string;
  filePath: string;
  lineNumber: number;
  emoji: string;
  lineContent: string;
}

function scanAndCleanFile(filePath: string, bookSlug: string, shouldFix: boolean): EmojiMatch[] {
  const matches: EmojiMatch[] = [];
  if (!fs.existsSync(filePath)) return matches;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let fileModified = false;

  const newLines = lines.map((line, index) => {
    const foundEmojis = line.match(EMOJI_REGEX);
    if (foundEmojis && foundEmojis.length > 0) {
      foundEmojis.forEach((emoji) => {
        matches.push({
          bookSlug,
          filePath,
          lineNumber: index + 1,
          emoji,
          lineContent: line.trim(),
        });
      });

      if (shouldFix) {
        fileModified = true;
        // Strip emojis and clean double spaces if left behind
        let cleaned = line.replace(EMOJI_REGEX, '').replace(/  +/g, ' ');
        // Clean trailing spaces before end of line
        cleaned = cleaned.replace(/\s+$/g, '');
        return cleaned;
      }
    }
    return line;
  });

  if (shouldFix && fileModified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
  }

  return matches;
}

function scanBook(bookSlug: string, booksDir: string, shouldFix: boolean): EmojiMatch[] {
  const bookDir = path.join(booksDir, bookSlug);
  const matches: EmojiMatch[] = [];

  if (!fs.existsSync(bookDir) || !fs.statSync(bookDir).isDirectory()) {
    return matches;
  }

  // Check SUMMARY.md
  const summaryPath = path.join(bookDir, 'src', 'SUMMARY.md');
  matches.push(...scanAndCleanFile(summaryPath, bookSlug, shouldFix));

  // Check content directory
  const contentDir = path.join(bookDir, 'src', 'content');
  if (fs.existsSync(contentDir) && fs.statSync(contentDir).isDirectory()) {
    const files = fs.readdirSync(contentDir);
    files.forEach((file) => {
      if (file.endsWith('.md')) {
        matches.push(...scanAndCleanFile(path.join(contentDir, file), bookSlug, shouldFix));
      }
    });
  }

  return matches;
}

function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const filteredArgs = args.filter((a) => a !== '--fix');
  const targetSlug = filteredArgs[0];

  const rootDir = process.cwd();
  const booksDir = path.join(rootDir, 'books');

  console.log(`🔍 Starting Dawnbook Emoji Audit ${shouldFix ? '(AUTO-FIX MODE ACTIVE)' : ''}...\n`);

  let bookSlugs: string[] = [];

  if (targetSlug) {
    console.log(`📌 Target Book Specified: ${targetSlug}`);
    bookSlugs = [targetSlug];
  } else {
    // Priority order: check neurobiologi-motivasi-dopamin first, then all others
    const allEntries = fs.readdirSync(booksDir);
    const validBooks = allEntries.filter((entry) => {
      if (entry.startsWith('_') || entry.startsWith('.')) return false;
      const fullPath = path.join(booksDir, entry);
      return fs.statSync(fullPath).isDirectory();
    });

    if (validBooks.includes('neurobiologi-motivasi-dopamin')) {
      bookSlugs = [
        'neurobiologi-motivasi-dopamin',
        ...validBooks.filter((b) => b !== 'neurobiologi-motivasi-dopamin'),
      ];
    } else {
      bookSlugs = validBooks;
    }
  }

  const allMatches: EmojiMatch[] = [];

  for (const slug of bookSlugs) {
    const bookMatches = scanBook(slug, booksDir, shouldFix);
    if (bookMatches.length > 0) {
      console.log(`❌ [${shouldFix ? 'FIXED EMOJI' : 'FOUND EMOJI'}] Book: ${slug} (${bookMatches.length} emoji(s))`);
      bookMatches.forEach((m) => {
        const relativePath = path.relative(rootDir, m.filePath);
        console.log(`   - ${relativePath}:${m.lineNumber} -> ${m.emoji} | "${m.lineContent}"`);
      });
      allMatches.push(...bookMatches);
    } else {
      console.log(`✅ [CLEAN] Book: ${slug}`);
    }
  }

  console.log('\n========================================');
  console.log(`📊 Audit Summary: ${allMatches.length} total emoji(s) ${shouldFix ? 'stripped/cleaned' : 'found'} across ${bookSlugs.length} book(s).`);
  console.log('========================================\n');

  if (!shouldFix && allMatches.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
