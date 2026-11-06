import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { normalizeInternalLinks } from "../inject-gating";

/**
 * mdBook 0.5 writes each book's sidebar into `toc-<hash>.js`, outside the HTML pages that
 * inject-gating rewrites, so its `.html` chapter links would hit Cloudflare's 308 redirect.
 */
export async function normalizeTocLinks(outputBooksDir: string): Promise<{ files: number; changed: number }> {
  let files = 0;
  let changed = 0;
  const entries = await readdir(outputBooksDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const bookDir = join(outputBooksDir, entry.name);
    for (const name of await readdir(bookDir)) {
      if (!/^toc-.*\.js$/.test(name)) continue;
      files++;
      const path = join(bookDir, name);
      const text = await readFile(path, "utf8");
      const next = normalizeInternalLinks(text);
      if (next !== text) {
        await writeFile(path, next);
        changed++;
      }
    }
  }
  return { files, changed };
}
