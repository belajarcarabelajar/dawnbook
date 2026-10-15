import fs from "node:fs";
import path from "node:path";
import { findDiagramBlocks, replaceDiagramBlocks } from "./extract";
import { cachePath, diagramKey } from "./cache";
import { markdownFiles, toPosix } from "./books";

export function inlineDiagramsInBook(
  tmpBookDir: string,
  srcBookDir: string,
  root: string = process.cwd(),
): { replaced: number } {
  const slug = path.basename(srcBookDir);
  const misses: string[] = [];
  const pending: Array<{ file: string; text: string }> = [];
  let replaced = 0;

  for (const full of markdownFiles(path.join(tmpBookDir, "src"))) {
    const markdown = fs.readFileSync(full, "utf8");
    // Checked before any diagramKey call, so books without diagrams never load the render config.
    if (findDiagramBlocks(markdown).length === 0) continue;
    const file = toPosix(path.relative(tmpBookDir, full));
    const text = replaceDiagramBlocks(markdown, (block) => {
      const key = diagramKey(block.source, root);
      const svgPath = cachePath(srcBookDir, key);
      if (!fs.existsSync(svgPath)) {
        misses.push(`${slug}/${file}:${block.startLine} has no cached SVG ${key}.svg; run: bun run diagrams:render --book ${slug}`);
        return "";
      }
      replaced++;
      return `<div class="dawnbook-diagram">${fs.readFileSync(svgPath, "utf8").trim()}</div>`;
    });
    if (text !== markdown) pending.push({ file: full, text });
  }

  if (misses.length > 0) throw new Error(misses.join("\n"));
  for (const { file, text } of pending) fs.writeFileSync(file, text);
  return { replaced };
}
