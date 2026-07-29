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
  
  // 1. Check for $ ... $ inline math
  const rawRegex = /(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g;
  lines.forEach((line, idx) => {
    let match;
    while ((match = rawRegex.exec(line)) !== null) {
      const math = match[1].trim();
      
      const cleanMath = math.replace(/\\\{/g, '').replace(/\\\}/g, '');
      if (
        cleanMath.includes('"') || 
        cleanMath.includes("'") || 
        cleanMath.includes('#') || 
        cleanMath.includes('`') ||
        cleanMath.includes('//')
      ) {
        continue;
      }

      if (/^[0-9]+$/.test(math)) continue;

      try {
        katex.renderToString(math, { throwOnError: true });
      } catch (err: any) {
        console.error(`❌ [FAIL] ${bookName}/${basename(filePath)}: Line ${idx + 1} KaTeX error in inline math: $${math}$ -> ${err.message}`);
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
      // Check for unescaped percentage symbols outside \text{}
      if (/(?<!\\text\{[^}]*)%/g.test(math) && !math.includes('\\text{\\%}')) {
        console.error(`❌ [FAIL] ${bookName}/${basename(filePath)}: Line ${idx + 1} has unescaped percentage symbol in inline math. Must use '\\text{\\%}': \\(${math}\\)`);
        hasErrors = true;
      }
      
      try {
        katex.renderToString(math, { throwOnError: true });
      } catch (err: any) {
        console.error(`❌ [FAIL] ${bookName}/${basename(filePath)}: Line ${idx + 1} KaTeX error in inline math: \\(${math}\\) -> ${err.message}`);
        hasErrors = true;
      }
      
      const multiLetter = checkMultiLetterVariables(math);
      if (multiLetter) {
        console.warn(`⚠️ [WARN] ${bookName}/${basename(filePath)}: Line ${idx + 1} has potential unformatted multi-letter variable(s) "${multiLetter.join(', ')}" in inline math: \\(${math}\\)`);
        hasErrors = true;
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
    
    // Check for unescaped percentage symbols outside \text{}
    if (/(?<!\\text\{[^}]*)%/g.test(math) && !math.includes('\\text{\\%}')) {
      console.error(`❌ [FAIL] ${bookName}/${basename(filePath)}: Line ${lineNum} has unescaped percentage symbol in block math. Must use '\\text{\\%}': \\[${math}\\]`);
      hasErrors = true;
    }

    try {
      katex.renderToString(math, { throwOnError: true, displayMode: true });
    } catch (err: any) {
      console.error(`❌ [FAIL] ${bookName}/${basename(filePath)}: Line ${lineNum} KaTeX error in block math: \\[${math}\\] -> ${err.message}`);
      hasErrors = true;
    }
    
    const multiLetter = checkMultiLetterVariables(math);
    if (multiLetter) {
      console.warn(`⚠️ [WARN] ${bookName}/${basename(filePath)}: Line ${lineNum} has potential unformatted multi-letter variable(s) "${multiLetter.join(', ')}" in block math: \\[${math}\\]`);
      hasErrors = true;
    }
  }

  // 4. Check for $$ ... $$ block math
  const doubleDollarRegex = /\$\$([\s\S]*?)\$\$/g;
  while ((match = doubleDollarRegex.exec(content)) !== null) {
    const math = match[1].trim();
    const offset = match.index;
    const lineNum = content.substring(0, offset).split('\n').length;

    if (/(?<!\\text\{[^}]*)%/g.test(math) && !math.includes('\\text{\\%}')) {
      console.error(`❌ [FAIL] ${bookName}/${basename(filePath)}: Line ${lineNum} has unescaped percentage symbol in block math. Must use '\\text{\\%}': $$${math}$$`);
      hasErrors = true;
    }

    try {
      katex.renderToString(math, { throwOnError: true, displayMode: true });
    } catch (err: any) {
      console.error(`❌ [FAIL] ${bookName}/${basename(filePath)}: Line ${lineNum} KaTeX error in block math: $$${math}$$ -> ${err.message}`);
      hasErrors = true;
    }
    
    const multiLetter = checkMultiLetterVariables(math);
    if (multiLetter) {
      console.warn(`⚠️ [WARN] ${bookName}/${basename(filePath)}: Line ${lineNum} has potential unformatted multi-letter variable(s) "${multiLetter.join(', ')}" in block math: $$${math}$$`);
      hasErrors = true;
    }
  }

  // 5. Check for unwrapped mathematical variables in text
  let inCodeBlock = false;
  let inDisplayMath = false;
  lines.forEach((line, idx) => {
    const strip = line.trim();
    if (strip.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) return;

    const dollarCount = (line.match(/\$\$/g) || []).length;
    if (dollarCount % 2 !== 0) {
      inDisplayMath = !inDisplayMath;
      return;
    }
    if (inDisplayMath || dollarCount >= 2) return;

    // Strip out valid inline and display math
    let noMath = line.replace(/\\+\([\s\S]*?\\+\)/g, '');
    noMath = noMath.replace(/\\+\[[\s\S]*?\\+\]/g, '');
    noMath = noMath.replace(/\$\$[\s\S]*?\$\$/g, '');
    noMath = noMath.replace(/\$[^\$]+\$/g, '');

    // Filter out inline code, links, and markdown headers
    if (noMath.includes('`') || noMath.includes('http') || strip.startsWith('#')) return;

    // Check for unwrapped math variables (e.g. R_{1,t}, W_1, VMP_1, E^2, H_{t+1}, C_{\text{total}})
    const mathVarRegex = /\b[A-Za-z]+_\{[^\}]+\}|\b[A-Z]_[0-9t]\b|\b[A-Za-z]+\^\{[^\}]+\}|\b[A-Z]\^[0-9]\b/;
    const subMatch = noMath.match(mathVarRegex);
    if (subMatch) {
      console.error(`❌ [FAIL] ${bookName}/${basename(filePath)}: Line ${idx + 1} has unwrapped math variable '${subMatch[0]}': ${strip}`);
      hasErrors = true;
    }
  });

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
  const entries = await readdir(booksDir, { withFileTypes: true });
  for (const entry of entries) {
    const bookPath = join(booksDir, entry.name);
    
    if (entry.isDirectory()) {
      try {
        const tomlPath = join(bookPath, "book.toml");
        const tomlContent = await readFile(tomlPath, "utf-8");
        
        const hasMathjax = tomlContent.includes("mathjax-support = true");
        const hasKatex = tomlContent.includes("mdbook-katex");
        
        if (!hasMathjax && !hasKatex) {
          console.error(`❌ [FAIL] ${entry.name}/book.toml is missing 'mathjax-support = true' under [output.html]`);
          hasErrors = true;
        } else {
          console.log(`✅ [PASS] ${entry.name} has LaTeX support enabled in book.toml.`);
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
    const bookPath = join(booksDir, entry.name);
    
    if (entry.isDirectory() && entry.name !== "_template") {
      const srcDir = join(bookPath, "src");
      hasErrors = (await scanDir(srcDir, entry.name)) || hasErrors;
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
