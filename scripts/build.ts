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
  const builtBooks: { slug: string; title: string; desc: string }[] = [];

  for (const entry of entries) {
    const bookPath = join(booksDir, entry);
    const bookStat = await stat(bookPath);

    if (bookStat.isDirectory()) {
      if (entry.startsWith('_')) continue;

      try {
        await stat(join(bookPath, "book.toml"));
      } catch {
        continue;
      }

      console.log(`Building book: ${entry}`);
      const destPath = join(outputBooksDir, entry);
      
      try {
        await $`mdbook build ${bookPath} -d ${destPath}`;
        // Simple heuristic to format title from slug
        const formattedTitle = entry.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        builtBooks.push({ slug: entry, title: formattedTitle, desc: `Explore the comprehensive guide on ${formattedTitle}.` });
        console.log(`Successfully built: ${entry}`);
      } catch (error) {
        console.error(`Failed to build book: ${entry}`, error);
        process.exit(1);
      }
    }
  }

  console.log("Generating premium hub site...");

  const generatePage = (title: string, content: string, isHome: boolean = false) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Dawnbook - A Scalable Educational Publishing Platform">
    <title>${title} | Dawnbook Platform</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Outfit:wght@500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0f19;
            --text-main: #f1f5f9;
            --text-muted: #94a3b8;
            --accent-primary: #3b82f6;
            --accent-glow: rgba(59, 130, 246, 0.5);
            --glass-bg: rgba(15, 23, 42, 0.6);
            --glass-border: rgba(255, 255, 255, 0.08);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Inter', sans-serif; 
            background-color: var(--bg-color); 
            color: var(--text-main); 
            line-height: 1.6;
            min-height: 100vh;
            overflow-x: hidden;
            position: relative;
        }

        /* Ambient animated background orb */
        .ambient-orb {
            position: fixed;
            top: -20%; left: -10%;
            width: 70vw; height: 70vw;
            background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%);
            border-radius: 50%;
            z-index: -1;
            filter: blur(60px);
            animation: float 20s ease-in-out infinite alternate;
        }
        .ambient-orb-2 {
            top: auto; bottom: -20%; left: auto; right: -10%;
            background: radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0) 70%);
            animation-delay: -10s;
        }

        @keyframes float {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(5%, 10%) scale(1.1); }
        }

        header { 
            position: sticky; top: 0; z-index: 100;
            background: var(--glass-bg);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--glass-border);
            padding: 1.2rem 2rem;
            display: flex; justify-content: space-between; align-items: center;
            flex-wrap: wrap; gap: 1rem;
        }

        .logo { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; text-decoration: none; letter-spacing: -0.5px; padding: 10px 0; }
        .logo span { color: var(--accent-primary); }

        nav a { 
            margin-left: 1rem; padding: 12px; color: var(--text-muted); text-decoration: none; 
            font-weight: 500; transition: color 0.3s ease; font-size: 1rem; display: inline-block;
        }
        nav a:hover, nav a.active { color: #fff; }

        main { max-width: 1100px; margin: 0 auto; padding: 4rem 2rem; }

        h1, h2, h3 { font-family: 'Outfit', sans-serif; }

        .hero { text-align: center; margin-bottom: 5rem; animation: slideUp 1s ease forwards; opacity: 0; transform: translateY(20px); }
        .hero h1 { 
            font-size: 4rem; line-height: 1.1; margin-bottom: 1.5rem; 
            background: linear-gradient(to right, #fff, #94a3b8);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .hero p { font-size: 1.25rem; color: var(--text-muted); max-width: 600px; margin: 0 auto 2rem; }

        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }

        .book-grid { 
            display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 2rem; 
        }

        .book-card {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 16px; padding: 2rem;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            text-decoration: none; color: inherit; display: block;
            position: relative; overflow: hidden;
        }
        .book-card::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
            background: linear-gradient(90deg, var(--accent-primary), transparent);
            opacity: 0; transition: opacity 0.3s;
        }

        .book-card:hover {
            transform: translateY(-8px) scale(1.02);
            border-color: rgba(59, 130, 246, 0.4);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 20px var(--accent-glow);
        }
        .book-card:hover::before { opacity: 1; }

        .book-card h3 { font-size: 1.5rem; margin-bottom: 0.75rem; color: #fff; }
        .book-card p { color: var(--text-muted); font-size: 1rem; margin-bottom: 1.5rem; }
        .book-card .read-btn {
            display: inline-flex; align-items: center; font-size: 1rem; font-weight: 600;
            color: var(--accent-primary); padding: 10px 0;
        }
        .book-card .read-btn svg { width: 16px; height: 16px; margin-left: 0.5rem; transition: transform 0.3s; }
        .book-card:hover .read-btn svg { transform: translateX(4px); }

        .content-section {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 16px; padding: 3rem;
            margin-bottom: 3rem;
            max-width: 100%;
        }
        .content-section h2 { font-size: 2.5rem; margin-bottom: 1.5rem; color: #fff; }
        .content-section p { margin-bottom: 1.5rem; font-size: 1.1rem; color: var(--text-muted); }
        .content-section a.button {
            display: inline-block; padding: 12px 32px;
            background: var(--accent-primary); color: #fff; text-decoration: none;
            border-radius: 8px; font-weight: 600; font-family: 'Outfit', sans-serif;
            transition: background 0.3s, transform 0.3s;
            margin-top: 1rem; min-height: 44px;
        }
        .content-section a.button:hover {
            background: #2563eb; transform: translateY(-2px);
        }

        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            header { flex-direction: column; gap: 0.5rem; padding: 1rem; }
            nav { display: flex; flex-wrap: wrap; justify-content: center; }
            main { padding: 2rem 1rem; }
            .content-section { padding: 1.5rem; }
            .content-section h2 { font-size: 2rem; }
        }
    </style>
</head>
<body>
    <div class="ambient-orb"></div>
    <div class="ambient-orb ambient-orb-2"></div>

    <header>
        <a href="/" class="logo">dawn<span>book</span></a>
        <nav>
            <a href="/" class="${isHome ? 'active' : ''}">Home</a>
            <a href="/about.html" class="${title === 'About' ? 'active' : ''}">About</a>
            <a href="/contribute.html" class="${title === 'Contribute' ? 'active' : ''}">Contribute</a>
            <a href="/admin">Admin</a>
        </nav>
    </header>
    
    <main>
        ${content}
    </main>
</body>
</html>`;

  const indexContent = `
    <div class="hero">
        <h1>Discover Open Knowledge</h1>
        <p>A beautifully curated, open-source platform for educational books. Dive into topics written by experts and community contributors.</p>
    </div>
    
    <h2 style="margin-bottom: 2rem; font-size: 2rem; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem;">Available Books</h2>
    <div class="book-grid">
      ${builtBooks.map(b => `
        <a href="/books/${b.slug}/" class="book-card">
            <h3>${b.title}</h3>
            <p>${b.desc}</p>
            <div class="read-btn">Read Now 
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
        </a>
      `).join("")}
    </div>
  `;

  const aboutContent = `
    <div class="content-section">
        <h2>About Dawnbook</h2>
        <p>Dawnbook is a modern, highly scalable platform designed to democratize educational publishing. Built on top of mdBook and deployed to the edge with Cloudflare Pages, it delivers lightning-fast reading experiences globally.</p>
        <p>Our goal is to create a seamless authoring and reading environment. Whether you're exploring the intricacies of Piaget's Cognitive Development or exploring entirely new subjects, Dawnbook ensures content is beautifully presented and instantly accessible.</p>
    </div>
  `;

  const contributeContent = `
    <div class="content-section">
        <h2>Join the Authors</h2>
        <p>We believe knowledge should be free and openly collaborative. You can contribute by writing a new chapter, fixing typos, or even starting a brand new book.</p>
        <p>All contributions are managed via GitHub Pull Requests, ensuring a high standard of quality through peer review.</p>
        <a href="https://github.com/belajarcarabelajar/dawnbook" class="button" target="_blank">View on GitHub</a>
    </div>
  `;

  await writeFile(join(outputDir, "index.html"), generatePage("Home", indexContent, true));
  await writeFile(join(outputDir, "about.html"), generatePage("About", aboutContent));
  await writeFile(join(outputDir, "contribute.html"), generatePage("Contribute", contributeContent));
  await writeFile(join(outputDir, "manifest.json"), JSON.stringify({ books: builtBooks.map(b => b.slug) }, null, 2));

  console.log("Building admin dashboard...");
  try {
    await $`cd apps/admin && bun run build`;
    await $`rm -rf ${join(outputDir, "admin")}`;
    await $`cp -r apps/admin/dist ${join(outputDir, "admin")}`;
    const redirectsContent = `
/admin /admin/ 301
/admin/* /admin/index.html 200
`;
    await writeFile(join(outputDir, "_redirects"), redirectsContent.trim());
    
    console.log("Admin dashboard built and copied successfully.");
  } catch (error) {
    console.error("Failed to build or copy admin dashboard", error);
    process.exit(1);
  }

  console.log("Premium Hub site generated successfully.");
}

build().catch(console.error);
