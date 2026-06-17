import { readdir, readFile, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import katex from "katex";

function checkMultiLetterVariables(math: string): string[] | null {
  // Strip out known math commands and formatting blocks:
  // - \text{...}, \mathrm{...}, \mathit{...}, \mathbf{...}, \text
  // - commands starting with \ (like \Delta, \eta, \times, etc.)
  let parsed = math;
  
  // Remove \text{...} and other common text wrappers recursively
  const textWrappers = /\\(text|mathrm|mathit|mathbf|mathsf|mathtt|textip|textsf|texttt)\{([^{}]+)\}/g;
  while (textWrappers.test(parsed)) {
    parsed = parsed.replace(textWrappers, '');
  }
  
  // Remove backslash commands
  parsed = parsed.replace(/\\[a-zA-Z]+/g, ' ');
  
  // Find any remaining contiguous letters of length 3 or more
  const matches = parsed.match(/[a-zA-Z]{3,}/g);
  if (matches) {
    // Filter out standard KaTeX environment names or keywords
    const filtered = matches.filter(m => !['aligned', 'begin', 'end', 'matrix', 'cases'].includes(m));
    if (filtered.length > 0) return filtered;
  }
  return null;
}

async function checkFile(filePath: string, bookName: string): Promise<boolean> {
  const content = await readFile(filePath, 'utf8');
  const lines = content.split('\n');
  let hasErrors = false;
  
  // 1. Check for raw $ ... $ inline math
  const rawRegex = /(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g;
  lines.forEach((line, idx) => {
    let match;
    while ((match = rawRegex.exec(line)) !== null) {
      const math = match[1];
      
      // Filter out code-like content, templates, comments, or currency false positives
      const cleanMath = math.replace(/\\\{/g, '').replace(/\\\}/g, '');
      if (
        cleanMath.includes('{') || 
        cleanMath.includes('}') || 
        cleanMath.includes('"') || 
        cleanMath.includes("'") || 
        cleanMath.includes('#') || 
        cleanMath.includes('`') ||
        cleanMath.includes('//')
      ) {
        continue;
      }

      // Check if it's likely a math expression:
      // - If length <= 2: we treat it as math (e.g. $x$, $y$, $z$, $Na$)
      // - If length > 2: must contain standard mathematical symbols or commands
      const isLikelyMath = 
        math.length <= 2 || 
        /[+\-*/=<>~_]/g.test(math) ||
        /\\(Delta|eta|times|approx|rightarrow|propto|sum|int|partial)/g.test(math);

      if (isLikelyMath && !/^[0-9]+$/.test(math)) {
        console.error(`❌ [FAIL] ${bookName}/${basename(filePath)}: Line ${idx + 1} uses raw '$' delimiters: $${math}$`);
        hasErrors = true;
      }
    }
  });

  // 2. Check for \( ... \) or \\( ... \\) inline math
  const inlineRegex = /(?:\\+)\(([\s\S]*?)(?:\\+)\)/g;
  lines.forEach((line, idx) => {
    let match;
    while ((match = inlineRegex.exec(line)) !== null) {
      const math = match[1].trim();
      try {
        katex.renderToString(math, { throwOnError: true });
      } catch (err: any) {
        console.error(`❌ [FAIL] ${bookName}/${basename(filePath)}: Line ${idx + 1} KaTeX error in inline math: \\(${math}\\) -> ${err.message}`);
        hasErrors = true;
      }
      
      const multiLetter = checkMultiLetterVariables(math);
      if (multiLetter) {
        console.warn(`⚠️ [WARN] ${bookName}/${basename(filePath)}: Line ${idx + 1} has potential unformatted multi-letter variable(s) "${multiLetter.join(', ')}" in inline math: \\(${math}\\)`);
      }
    }
  });

  // 3. Check for \[ ... \] block math
  const blockRegex = /(?:\\+)\[([\s\S]*?)(?:\\+)\]/g;
  let match;
  while ((match = blockRegex.exec(content)) !== null) {
    const math = match[1].trim();
    const offset = match.index;
    const lineNum = content.substring(0, offset).split('\n').length;
    try {
      katex.renderToString(math, { throwOnError: true, displayMode: true });
    } catch (err: any) {
      console.error(`❌ [FAIL] ${bookName}/${basename(filePath)}: Line ${lineNum} KaTeX error in block math: \\[${math}\\] -> ${err.message}`);
      hasErrors = true;
    }
    
    const multiLetter = checkMultiLetterVariables(math);
    if (multiLetter) {
      console.warn(`⚠️ [WARN] ${bookName}/${basename(filePath)}: Line ${lineNum} has potential unformatted multi-letter variable(s) "${multiLetter.join(', ')}" in block math: \\[${math}\\]`);
    }
  }

  // 4. Check for $$ ... $$ block math
  const doubleDollarRegex = /\$\$([\s\S]*?)\$\$/g;
  while ((match = doubleDollarRegex.exec(content)) !== null) {
    const math = match[1].trim();
    const offset = match.index;
    const lineNum = content.substring(0, offset).split('\n').length;
    try {
      katex.renderToString(math, { throwOnError: true, displayMode: true });
    } catch (err: any) {
      console.error(`❌ [FAIL] ${bookName}/${basename(filePath)}: Line ${lineNum} KaTeX error in block math: $$${math}$$ -> ${err.message}`);
      hasErrors = true;
    }
    
    const multiLetter = checkMultiLetterVariables(math);
    if (multiLetter) {
      console.warn(`⚠️ [WARN] ${bookName}/${basename(filePath)}: Line ${lineNum} has potential unformatted multi-letter variable(s) "${multiLetter.join(', ')}" in block math: $$${math}$$`);
    }
  }

  return hasErrors;
}

async function scanDir(dir: string, bookName: string): Promise<boolean> {
  let hasErrors = false;
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        hasErrors = (await scanDir(fullPath, bookName)) || hasErrors;
      } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'SUMMARY.md') {
        hasErrors = (await checkFile(fullPath, bookName)) || hasErrors;
      }
    }
  } catch (err) {
    // Dir might not exist or can't be read
  }
  return hasErrors;
}

async function checkLatexSupport() {
  const rootDir = process.cwd();
  const booksDir = join(rootDir, "books");
  const buildScriptPath = join(rootDir, "scripts/build.ts");
  
  let hasErrors = false;

  // 1. Verify all books have mathjax-support enabled
  const entries = await readdir(booksDir);
  for (const entry of entries) {
    const bookPath = join(booksDir, entry);
    const bookStat = await stat(bookPath);
    
    if (bookStat.isDirectory()) {
      try {
        const tomlPath = join(bookPath, "book.toml");
        const tomlContent = await readFile(tomlPath, "utf-8");
        
        const hasMathjax = tomlContent.includes("mathjax-support = true");
        const hasKatex = tomlContent.includes("mdbook-katex");
        
        if (!hasMathjax && !hasKatex) {
          console.error(`❌ [FAIL] ${entry}/book.toml is missing 'mathjax-support = true' under [output.html]`);
          hasErrors = true;
        } else {
          console.log(`✅ [PASS] ${entry} has LaTeX support enabled in book.toml.`);
        }
      } catch (err) {
        // Not a book directory (e.g. no book.toml)
      }
    }
  }

  // 2. Verify build script's CSP headers allow MathJax CDNs
  const buildContent = await readFile(buildScriptPath, "utf-8");
  const hasCdnjs = buildContent.includes("https://cdnjs.cloudflare.com");
  const hasJsdelivr = buildContent.includes("https://cdn.jsdelivr.net");
  
  if (!hasCdnjs && !hasJsdelivr) {
    console.error(`❌ [FAIL] scripts/build.ts CSP _headers missing MathJax CDNs in script-src`);
    hasErrors = true;
  } else {
    console.log(`✅ [PASS] CSP _headers permits MathJax CDNs.`);
  }

  // 3. Scan book chapters for strict LaTeX syntax and style checks
  console.log("\n🔍 Starting KaTeX strict formula validation...");
  for (const entry of entries) {
    const bookPath = join(booksDir, entry);
    const bookStat = await stat(bookPath);
    
    if (bookStat.isDirectory() && entry !== "_template") {
      const srcDir = join(bookPath, "src");
      hasErrors = (await scanDir(srcDir, entry)) || hasErrors;
    }
  }

  if (hasErrors) {
    console.error("\n❌ LaTeX support audit failed. Please fix the above errors.");
    process.exit(1);
  } else {
    console.log("\n✅ All LaTeX support checks passed.");
  }
}

checkLatexSupport().catch(console.error);
