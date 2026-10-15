import { describe, expect, it, afterEach } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  cachePath,
  diagramId,
  diagramKey,
  loadRenderConfig,
  normalizeSource,
} from "../../scripts/diagrams/cache";

const repoRoot = path.join(import.meta.dir, "..", "..");
const realConfig = path.join(repoRoot, "scripts", "diagrams", "render-config.json");
const realCss = path.join(repoRoot, "scripts", "diagrams", "theme.css");

const roots: string[] = [];

interface RootOptions {
  configText?: string;
  css?: string;
  devDependencies?: Record<string, string>;
}

function makeRoot(opts: RootOptions = {}): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "diagrams-cache-"));
  roots.push(root);
  const dir = path.join(root, "scripts", "diagrams");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "render-config.json"), opts.configText ?? fs.readFileSync(realConfig, "utf8"));
  fs.writeFileSync(path.join(dir, "theme.css"), opts.css ?? fs.readFileSync(realCss, "utf8"));
  const devDependencies = opts.devDependencies ?? { "@mermaid-js/mermaid-cli": "12.0.0" };
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "fixture", devDependencies }, null, 2));
  return root;
}

afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

const source = "flowchart TD\n  A[Mulai] --> B[Selesai]";

describe("normalizeSource", () => {
  it("turns CRLF into LF, strips trailing whitespace and trims blank edge lines", () => {
    expect(normalizeSource("\r\n  \r\nflowchart TD  \r\n  A --> B\t\r\n\r\n")).toBe("flowchart TD\n  A --> B");
  });

  it("keeps leading indentation of inner lines", () => {
    expect(normalizeSource("flowchart TD\n    A --> B")).toBe("flowchart TD\n    A --> B");
  });
});

describe("diagramKey", () => {
  it("gives the same key for the same source", () => {
    const root = makeRoot();
    expect(diagramKey(source, root)).toBe(diagramKey(source, root));
  });

  it("is 12 lowercase hex characters", () => {
    const root = makeRoot();
    expect(diagramKey(source, root)).toMatch(/^[0-9a-f]{12}$/);
  });

  it("accepts an empty source", () => {
    const root = makeRoot();
    expect(diagramKey("", root)).toMatch(/^[0-9a-f]{12}$/);
  });

  it("ignores CRLF line endings and trailing spaces", () => {
    const root = makeRoot();
    const noisy = "flowchart TD   \r\n  A[Mulai] --> B[Selesai] \t\r\n";
    expect(diagramKey(noisy, root)).toBe(diagramKey(source, root));
  });

  it("changes when the source changes", () => {
    const root = makeRoot();
    expect(diagramKey(source.replace("Selesai", "Akhir"), root)).not.toBe(diagramKey(source, root));
  });

  it("changes when the render config text changes", () => {
    const base = makeRoot();
    const changed = makeRoot({ configText: fs.readFileSync(realConfig, "utf8").replace("dagre", "elk") });
    expect(diagramKey(source, changed)).not.toBe(diagramKey(source, base));
  });

  it("changes when the theme css text changes", () => {
    const base = makeRoot();
    const changed = makeRoot({ css: fs.readFileSync(realCss, "utf8") + "\n.node rect { rx: 4px; }\n" });
    expect(diagramKey(source, changed)).not.toBe(diagramKey(source, base));
  });

  it("changes when the mermaid-cli version changes", () => {
    const base = makeRoot();
    const changed = makeRoot({ devDependencies: { "@mermaid-js/mermaid-cli": "12.0.1" } });
    expect(diagramKey(source, changed)).not.toBe(diagramKey(source, base));
  });
});

describe("loadRenderConfig", () => {
  it("returns the parsed config, raw texts and the exact cli version", () => {
    const root = makeRoot();
    const loaded = loadRenderConfig(root);
    expect(loaded.config.theme).toBe("base");
    expect(loaded.config.securityLevel).toBe("strict");
    expect(loaded.configText).toBe(fs.readFileSync(realConfig, "utf8"));
    expect(loaded.css).toBe(fs.readFileSync(realCss, "utf8"));
    expect(loaded.cliVersion).toBe("12.0.0");
  });

  it("throws naming @mermaid-js/mermaid-cli when the devDependency is missing", () => {
    const root = makeRoot({ devDependencies: { "@types/bun": "1.2.2" } });
    expect(() => loadRenderConfig(root)).toThrow("@mermaid-js/mermaid-cli");
  });

  it("throws when the devDependency uses a caret range", () => {
    const root = makeRoot({ devDependencies: { "@mermaid-js/mermaid-cli": "^12.0.0" } });
    expect(() => loadRenderConfig(root)).toThrow("@mermaid-js/mermaid-cli");
  });
});

describe("diagramId and cachePath", () => {
  it("prefixes the key with dbd-", () => {
    expect(diagramId("0123456789ab")).toBe("dbd-0123456789ab");
  });

  it("places the svg under the book diagrams folder", () => {
    expect(cachePath("/repo/books/buku-uji", "0123456789ab")).toBe(
      path.join("/repo/books/buku-uji", "diagrams", "0123456789ab.svg"),
    );
  });
});
