import { readdir, stat, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { $ } from "bun";

async function build() {
  const rootDir = process.cwd();
  const booksDir = join(rootDir, "books");
  const outputDir = join(rootDir, "output");
  const outputBooksDir = join(outputDir, "books");

  // Ensure output directories exist
  await mkdir(outputDir, { recursive: true });
  await mkdir(outputBooksDir, { recursive: true });

  const entries = await readdir(booksDir);
  const builtBooks: string[] = [];

  for (const entry of entries) {
    const bookPath = join(booksDir, entry);
    const bookStat = await stat(bookPath);

    if (bookStat.isDirectory()) {
      // Check if book.toml exists
      try {
        await stat(join(bookPath, "book.toml"));
      } catch {
        continue; // Not a book
      }

      console.log(`Building book: ${entry}`);
      const destPath = join(outputBooksDir, entry);
      
      // Run mdbook build
      try {
        await $`mdbook build ${bookPath} -d ${destPath}`;
        builtBooks.push(entry);
        console.log(`Successfully built: ${entry}`);
      } catch (error) {
        console.error(`Failed to build book: ${entry}`, error);
        process.exit(1);
      }
    }
  }

  // Generate Hub Site
  console.log("Generating hub site...");

  const generatePage = (title: string, content: string) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Platform Hub</title>
    <style>
        body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; }
        header { border-bottom: 1px solid #ccc; margin-bottom: 2rem; padding-bottom: 1rem; }
        nav a { margin-right: 1rem; color: #0066cc; text-decoration: none; }
        nav a:hover { text-decoration: underline; }
        .book-list { list-style: none; padding: 0; }
        .book-list li { background: #f9f9f9; margin-bottom: 1rem; padding: 1rem; border-radius: 4px; }
        .book-list a { font-weight: bold; color: #0066cc; text-decoration: none; font-size: 1.2rem; }
    </style>
</head>
<body>
    <header>
        <h1>Educational Books Platform</h1>
        <nav>
            <a href="/">Home</a>
            <a href="/about.html">About</a>
            <a href="/contribute.html">Contribute</a>
        </nav>
    </header>
    <main>
        ${content}
    </main>
</body>
</html>`;

  const indexContent = `
    <h2>Available Books</h2>
    <ul class="book-list">
      ${builtBooks.map(slug => `<li><a href="/books/${slug}/">${slug}</a></li>`).join("")}
    </ul>
  `;

  const aboutContent = `
    <h2>About This Platform</h2>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.</p>
  `;

  const contributeContent = `
    <h2>How to Contribute</h2>
    <p>We welcome contributions! Please fork the repository, add your markdown to the appropriate book, and submit a pull request.</p>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla quis lorem ut libero malesuada feugiat.</p>
  `;

  await writeFile(join(outputDir, "index.html"), generatePage("Home", indexContent));
  await writeFile(join(outputDir, "about.html"), generatePage("About", aboutContent));
  await writeFile(join(outputDir, "contribute.html"), generatePage("Contribute", contributeContent));

  // Write manifest
  await writeFile(join(outputDir, "manifest.json"), JSON.stringify({ books: builtBooks }, null, 2));

  console.log("Hub site generated successfully.");
}

build().catch(console.error);
