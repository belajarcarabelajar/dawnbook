import { readdir, readFile, writeFile } from "node:fs/promises";
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
                if (bookContent.includes("[output.html.print]")) {
                    const newContent = bookContent.replace(/\[output\.html\.print\].*/s, templateConfig);
                    if (newContent !== bookContent) {
                        await writeFile(bookTomlPath, newContent);
                        console.log(`Synced template to ${entry.name}`);
                    }
                } else {
                    // Append if not exists
                    const newContent = bookContent.trim() + "\n\n" + templateConfig;
                    await writeFile(bookTomlPath, newContent);
                    console.log(`Appended template to ${entry.name}`);
                }
            } catch (e) {
                // Ignore if book.toml doesn't exist
            }
        }
    }
}

syncTemplate().catch(console.error);
