import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CLI_PACKAGE = "@mermaid-js/mermaid-cli";
const EXACT_VERSION = /^\d+\.\d+\.\d+$/;

interface RenderConfig {
  config: Record<string, unknown>;
  configText: string;
  css: string;
  cliVersion: string;
  mermaidVersion: string;
  postprocessHash: string;
}

const configByRoot = new Map<string, RenderConfig>();

interface CodeInputs {
  mermaidVersion: string;
  postprocessHash: string;
}

let codeInputs: CodeInputs | undefined;

// The CLI depends on a mermaid range and finalizeSvg shapes the saved bytes, so both must reach the key or a
// lockfile refresh or post-processor edit would leave cached SVGs stale. They come from the code location,
// not the render root, and are read once per process.
function loadCodeInputs(): CodeInputs {
  codeInputs ??= {
    mermaidVersion: installedPackageVersion("mermaid"),
    postprocessHash: createHash("sha256").update(readFileSync(join(import.meta.dir, "postprocess.ts"))).digest("hex"),
  };
  return codeInputs;
}

export function normalizeSource(source: string): string {
  const lines = source.replace(/\r\n/g, "\n").split("\n").map((line) => line.replace(/\s+$/, ""));
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start] === "") start++;
  while (end > start && lines[end - 1] === "") end--;
  return lines.slice(start, end).join("\n");
}

// Resolved from this file's directory, not the render root, so the version is the one the renderer actually loads.
export function installedPackageVersion(name: string, fromDir: string = import.meta.dir): string {
  let pkgPath: string;
  try {
    pkgPath = Bun.resolveSync(`${name}/package.json`, fromDir);
  } catch {
    throw new Error(`cannot resolve the installed "${name}" package (needed for the diagram cache key); run bun install`);
  }
  return (JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string }).version;
}

export function loadRenderConfig(root: string = process.cwd()): RenderConfig {
  const cached = configByRoot.get(root);
  if (cached) return cached;

  const dir = join(root, "scripts", "diagrams");
  const configText = readFileSync(join(dir, "render-config.json"), "utf8");
  const css = readFileSync(join(dir, "theme.css"), "utf8");
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
    devDependencies?: Record<string, string>;
  };
  const cliVersion = pkg.devDependencies?.[CLI_PACKAGE];
  if (cliVersion === undefined) {
    throw new Error(`package.json devDependencies is missing "${CLI_PACKAGE}" (needed for the diagram cache key)`);
  }
  // A range would let the installed CLI drift without changing the key, so cached SVGs could go stale silently.
  if (!EXACT_VERSION.test(cliVersion)) {
    throw new Error(`package.json devDependencies "${CLI_PACKAGE}" must be an exact version like 12.0.0, got "${cliVersion}"`);
  }

  const loaded: RenderConfig = {
    config: JSON.parse(configText) as Record<string, unknown>,
    configText,
    css,
    cliVersion,
    ...loadCodeInputs(),
  };
  configByRoot.set(root, loaded);
  return loaded;
}

export type KeyInputs = Pick<RenderConfig, "configText" | "css" | "cliVersion" | "mermaidVersion" | "postprocessHash">;

export function keyMaterial(source: string, inputs: KeyInputs): string {
  const { configText, css, cliVersion, mermaidVersion, postprocessHash } = inputs;
  return [normalizeSource(source), configText, css, cliVersion, mermaidVersion, postprocessHash].join("\u0000");
}

export function diagramKey(source: string, root?: string): string {
  const material = keyMaterial(source, loadRenderConfig(root));
  return createHash("sha256").update(material).digest("hex").slice(0, 12);
}

export function diagramId(key: string): string {
  return `dbd-${key}`;
}

export function cachePath(bookDir: string, key: string): string {
  return join(bookDir, "diagrams", `${key}.svg`);
}
