import { describe, expect, it, afterEach } from "bun:test";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  cachePath,
  diagramId,
  diagramKey,
  installedPackageVersion,
  keyMaterial,
  loadRenderConfig,
  normalizeSource,
} from "../../scripts/diagrams/cache";

const SEP = String.fromCharCode(0);

const repoRoot = path.join(import.meta.dir, "..", "..");
const realConfig = path.join(repoRoot, "scripts", "diagrams", "render-config.json");
const realCss = path.join(repoRoot, "scripts", "diagrams", "theme.css");
const realPostprocess = path.join(repoRoot, "scripts", "diagrams", "postprocess.ts");

function installedMermaidVersion(): string {
  const pkgPath = path.join(repoRoot, "node_modules", "mermaid", "package.json");
  return (JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { version: string }).version;
}

function sha256(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

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

  it("is the first 12 hex characters of the sha256 of the key material", () => {
    const root = makeRoot();
    expect(diagramKey(source, root)).toBe(sha256(keyMaterial(source, loadRenderConfig(root))).slice(0, 12));
  });

  it("differs from a key built from the source, config, css and cli version alone", () => {
    const root = makeRoot();
    const fourInputs = [
      normalizeSource(source),
      fs.readFileSync(realConfig, "utf8"),
      fs.readFileSync(realCss, "utf8"),
      "12.0.0",
    ].join(SEP);
    expect(diagramKey(source, root)).not.toBe(sha256(fourInputs).slice(0, 12));
  });
});

describe("keyMaterial", () => {
  it("joins source, config, css, cli version, mermaid version and post-processor hash in that order", () => {
    const root = makeRoot();
    const parts = keyMaterial("flowchart TD  \r\n  A --> B\r\n", loadRenderConfig(root)).split(SEP);
    expect(parts).toEqual([
      "flowchart TD\n  A --> B",
      fs.readFileSync(realConfig, "utf8"),
      fs.readFileSync(realCss, "utf8"),
      "12.0.0",
      installedMermaidVersion(),
      sha256(fs.readFileSync(realPostprocess)),
    ]);
  });

  it("changes when only the mermaid version changes", () => {
    const loaded = loadRenderConfig(makeRoot());
    expect(keyMaterial(source, { ...loaded, mermaidVersion: "0.0.1" })).not.toBe(keyMaterial(source, loaded));
  });

  it("changes when only the post-processor hash changes", () => {
    const loaded = loadRenderConfig(makeRoot());
    expect(keyMaterial(source, { ...loaded, postprocessHash: "0".repeat(64) })).not.toBe(keyMaterial(source, loaded));
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

  it("reports the installed mermaid version even for a root without node_modules", () => {
    const loaded = loadRenderConfig(makeRoot());
    expect(loaded.mermaidVersion).toMatch(/^\d+\.\d+\.\d+/);
    expect(loaded.mermaidVersion).toBe(installedMermaidVersion());
  });

  it("reports the sha256 of the post-processor source", () => {
    const loaded = loadRenderConfig(makeRoot());
    expect(loaded.postprocessHash).toMatch(/^[0-9a-f]{64}$/);
    expect(loaded.postprocessHash).toBe(sha256(fs.readFileSync(realPostprocess)));
  });
});

describe("installedPackageVersion", () => {
  it("reads the installed mermaid version from node_modules, not the declared range", () => {
    expect(installedPackageVersion("mermaid")).toBe(installedMermaidVersion());
  });

  it("throws naming the package and bun install when the package cannot be resolved", () => {
    expect(() => installedPackageVersion("dawnbook-no-such-package")).toThrow(/dawnbook-no-such-package[\s\S]*bun install/);
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
