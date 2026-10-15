// Question: can a pure Markdown pass swap each mermaid fence for one-line inline SVG before mdBook runs?

export interface MermaidBlock {
  source: string;
  startLine: number;
}

interface Opener {
  indent: number;
  containerCol: number;
  char: "`" | "~";
  length: number;
  info: string;
}

const LIST_MARKER = /^( *)([-*+]|\d{1,9}[.)])( {1,4})(?=\S)/;

function leadingSpaces(line: string): number {
  return line.length - line.trimStart().length;
}

// Content column of the list item that holds line i, found from the nearest less-indented
// non-blank line. Spike scope: only that one line is consulted, so a fence indented deeper than
// a later paragraph of the same item is missed; blockquote containers are not modelled at all.
function containerColumn(lines: string[], i: number, indent: number): number {
  if (indent === 0) return 0;
  for (let j = i - 1; j >= 0; j--) {
    if (lines[j].trim() === "") continue;
    if (leadingSpaces(lines[j]) >= indent) continue;
    const m = LIST_MARKER.exec(lines[j]);
    return m && m[0].length <= indent ? m[0].length : 0;
  }
  return 0;
}

function parseOpener(lines: string[], i: number): Opener | null {
  const m = /^( *)(`{3,}|~{3,})(.*)$/.exec(lines[i]);
  if (!m) return null;
  const indent = m[1].length;
  const containerCol = containerColumn(lines, i, indent);
  if (indent - containerCol > 3) return null;
  const char = m[2][0] as "`" | "~";
  const info = m[3].trim();
  // CommonMark: a backtick fence whose info string holds a backtick is inline code, not a fence.
  if (char === "`" && info.includes("`")) return null;
  return { indent, containerCol, char, length: m[2].length, info };
}

function isCloser(line: string, opener: Opener): boolean {
  const m = /^( *)(`+|~+)[ \t]*$/.exec(line);
  if (!m) return false;
  const rel = m[1].length - opener.containerCol;
  return rel >= 0 && rel <= 3 && m[2][0] === opener.char && m[2].length >= opener.length;
}

function isMermaid(info: string): boolean {
  return /^mermaid(?:$|[\s,{])/.test(info);
}

function stripIndent(line: string, max: number): string {
  let n = 0;
  while (n < max && line[n] === " ") n++;
  return line.slice(n);
}

export function replaceMermaidFences(
  markdown: string,
  renderById: (source: string) => string,
): { markdown: string; blocks: MermaidBlock[] } {
  const lines = markdown.split("\n");
  const out: string[] = [];
  const blocks: MermaidBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const opener = parseOpener(lines, i);
    if (!opener) {
      out.push(lines[i]);
      i++;
      continue;
    }
    let close = -1;
    for (let j = i + 1; j < lines.length; j++) {
      if (isCloser(lines[j], opener)) {
        close = j;
        break;
      }
    }
    if (close === -1 || !isMermaid(opener.info)) {
      // Any fence is copied whole so a mermaid example inside it stays text; an unclosed fence
      // runs to the end of the document in CommonMark, so nothing after it is touched.
      const end = close === -1 ? lines.length : close + 1;
      out.push(...lines.slice(i, end));
      i = end;
      continue;
    }
    const source = lines
      .slice(i + 1, close)
      .map((l) => stripIndent(l, opener.indent))
      .join("\n");
    blocks.push({ source, startLine: i + 1 });
    if (out.length > 0 && out[out.length - 1].trim() !== "") out.push("");
    // An HTML block opened by <div> ends at the first blank line, so the SVG must be one line.
    const svg = renderById(source).trim().replace(/[ \t]*\r?\n[ \t\r\n]*/g, " ");
    out.push(`${" ".repeat(opener.indent)}<div class="dawnbook-diagram">${svg}</div>`);
    out.push("");
    i = close + 1;
    if (i < lines.length && lines[i].trim() === "") i++;
  }
  return { markdown: out.join("\n"), blocks };
}
