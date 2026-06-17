import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

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
      // Validate even the _template directory
      try {
        const tomlPath = join(bookPath, "book.toml");
        const tomlContent = await readFile(tomlPath, "utf-8");
        
        const hasMathjax = tomlContent.includes("mathjax-support = true");
        const hasKatex = tomlContent.includes("mdbook-katex"); // fallback if katex preprocessor is used
        
        if (!hasMathjax && !hasKatex) {
          console.error(`❌ [FAIL] ${entry}/book.toml is missing 'mathjax-support = true' under [output.html]`);
          hasErrors = true;
        } else {
          console.log(`✅ [PASS] ${entry} has LaTeX support enabled.`);
        }
      } catch (err) {
        // No book.toml found, not a book directory
      }
    }
  }

  // 2. Verify build script's CSP headers allow MathJax CDNs
  const buildContent = await readFile(buildScriptPath, "utf-8");
  const hasCdnjs = buildContent.includes("https://cdnjs.cloudflare.com");
  const hasJsdelivr = buildContent.includes("https://cdn.jsdelivr.net");
  
  if (!hasCdnjs && !hasJsdelivr) {
    console.error(`❌ [FAIL] scripts/build.ts CSP _headers missing MathJax CDNs (cdnjs.cloudflare.com or cdn.jsdelivr.net) in script-src`);
    hasErrors = true;
  } else {
    console.log(`✅ [PASS] CSP _headers permits MathJax CDNs.`);
  }

  if (hasErrors) {
    console.error("\n❌ LaTeX support audit failed. Please fix the above errors.");
    process.exit(1);
  } else {
    console.log("\n✅ All LaTeX support checks passed.");
  }
}

checkLatexSupport().catch(console.error);
