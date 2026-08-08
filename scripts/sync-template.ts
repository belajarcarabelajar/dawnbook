import { readdir, readFile, writeFile, mkdir, stat, utimes } from "node:fs/promises";
import { join } from "node:path";

async function syncTemplate() {
    const rootDir = process.cwd();
    const booksDir = join(rootDir, "books");
    const templatePath = join(booksDir, "_template", "book.toml");
    
    const templateContent = await readFile(templatePath, "utf-8");
    
    // We want to extract everything from [output.html.print] onwards
    const syncRegex = /(\[output\.html\.print\].*)/s;
    const templateMatch = templateContent.match(syncRegex);
    
    if (!templateMatch) {
        console.error("Template does not have [output.html.print] section.");
        process.exit(1);
    }
    
    const templateConfig = templateMatch[1];
    
    const entries = await readdir(booksDir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== "_template" && !entry.name.startsWith(".")) {
            const bookTomlPath = join(booksDir, entry.name, "book.toml");
            try {
                const bookContent = await readFile(bookTomlPath, "utf-8");
                let newContent: string | null = null;
                if (bookContent.includes("[output.html.print]")) {
                    const replaced = bookContent.replace(/\[output\.html\.print\].*/s, templateConfig);
                    if (replaced !== bookContent) {
                        newContent = replaced;
                    }
                } else {
                    newContent = bookContent.trim() + "\n\n" + templateConfig;
                }

                if (newContent !== null) {
                    const prevStat = await stat(bookTomlPath).catch(() => null);
                    await writeFile(bookTomlPath, newContent);
                    if (prevStat) {
                        await utimes(bookTomlPath, prevStat.atime, prevStat.mtime);
                    }
                    console.log(`Synced template to ${entry.name}`);
                }
            } catch (e) {
                // Ignore if book.toml doesn't exist
            }

            // Sync theme/head.hbs for MathJax Rocket Loader bypass
            try {
                const templateHeadPath = join(booksDir, "_template", "theme", "head.hbs");
                const headContent = await readFile(templateHeadPath, "utf-8");
                const bookThemeDir = join(booksDir, entry.name, "theme");
                const targetHeadPath = join(bookThemeDir, "head.hbs");
                const existingHead = await readFile(targetHeadPath, "utf-8").catch(() => null);

                if (existingHead !== headContent) {
                    const prevHeadStat = await stat(targetHeadPath).catch(() => null);
                    await mkdir(bookThemeDir, { recursive: true });
                    await writeFile(targetHeadPath, headContent);
                    if (prevHeadStat) {
                        await utimes(targetHeadPath, prevHeadStat.atime, prevHeadStat.mtime);
                    }
                }
            } catch (e) {
                // Ignore if head.hbs missing
            }
        }
    }
}

syncTemplate().catch(console.error);

