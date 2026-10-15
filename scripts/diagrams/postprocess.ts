export interface AccText {
  title: string;
  descr: string;
}

export function readAccText(source: string): AccText | null {
  const title = source.match(/^[ \t]*accTitle[ \t]*:[ \t]*(.*?)[ \t\r]*$/m)?.[1] ?? "";
  const block = source.match(/^[ \t]*accDescr[ \t]*\{([^}]*)\}/m);
  const descr = block
    ? block[1]
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ")
    : (source.match(/^[ \t]*accDescr[ \t]*:[ \t]*(.*?)[ \t\r]*$/m)?.[1] ?? "");
  if (!title || !descr) return null;
  return { title, descr };
}

interface Attr {
  name: string;
  value: string;
  raw: string;
}

interface Tag {
  name: string;
  attrs: Attr[];
  start: number;
  tagEnd: number;
  end: number;
}

function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(text: string): string {
  return escapeText(text).replace(/"/g, "&quot;");
}

function findTagEnd(svg: string, lt: number): number {
  let quote = "";
  for (let i = lt + 1; i < svg.length; i++) {
    const ch = svg[i];
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ">") {
      return i + 1;
    }
  }
  throw new Error("SVG has an unterminated tag");
}

function parseTag(svg: string, start: number, tagEnd: number): Tag {
  const text = svg.slice(start, tagEnd);
  const name = text.match(/^<([^\s/>]+)/)?.[1] ?? "";
  const body = text.slice(name.length + 1).replace(/\/?>$/, "");
  const attrs: Attr[] = [];
  for (const m of body.matchAll(/([^\s=/>]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g)) {
    const quoted = m[2] ?? "";
    const value = /^["']/.test(quoted) ? quoted.slice(1, -1) : quoted;
    attrs.push({ name: m[1], value, raw: m[0] });
  }
  return { name, attrs, start, tagEnd, end: text.endsWith("/>") ? tagEnd : -1 };
}

function openingTag(tag: Tag): string {
  return `<${tag.name}${tag.attrs.map((a) => ` ${a.raw}`).join("")}>`;
}

function setAttr(attrs: Attr[], name: string, value: string): void {
  const raw = `${name}="${escapeAttr(value)}"`;
  const existing = attrs.find((a) => a.name === name);
  if (existing) {
    existing.value = value;
    existing.raw = raw;
  } else {
    attrs.push({ name, value, raw });
  }
}

// Only direct children of the root count: a <title> inside a <g> or a nested <svg> names that element, not the diagram.
function directChildren(svg: string, from: number): Tag[] {
  const children: Tag[] = [];
  let open: Tag | null = null;
  let depth = 0;
  let i = from;
  for (;;) {
    const lt = svg.indexOf("<", i);
    if (lt < 0) return children;
    const skip = [
      ["<!--", "-->"],
      ["<![CDATA[", "]]>"],
      ["<?", "?>"],
      ["<!", ">"],
    ].find(([opener]) => svg.startsWith(opener, lt));
    if (skip) {
      const close = svg.indexOf(skip[1], lt);
      if (close < 0) return children;
      i = close + skip[1].length;
      continue;
    }
    const tagEnd = findTagEnd(svg, lt);
    if (svg.startsWith("</", lt)) {
      if (depth === 0) return children;
      depth--;
      if (depth === 0 && open) {
        open.end = tagEnd;
        children.push(open);
        open = null;
      }
    } else {
      const tag = parseTag(svg, lt, tagEnd);
      if (tag.end >= 0) {
        if (depth === 0) children.push(tag);
      } else {
        if (depth === 0) open = tag;
        depth++;
      }
    }
    i = tagEnd;
  }
}

function findRoot(svg: string): Tag {
  const match = /<svg(?=[\s/>])/.exec(svg);
  if (!match) throw new Error("SVG has no root <svg> element");
  const root = parseTag(svg, match.index, findTagEnd(svg, match.index));
  if (root.end >= 0) throw new Error("root <svg> element is self-closing and has no content");
  return root;
}

function viewBoxWidth(root: Tag): number {
  const viewBox = root.attrs.find((a) => a.name.toLowerCase() === "viewbox");
  if (!viewBox) throw new Error("root <svg> has no viewBox attribute");
  const parts = viewBox.value.trim().split(/[\s,]+/).map(Number);
  const width = parts[2];
  if (parts.length !== 4 || !Number.isFinite(width) || width <= 0) {
    throw new Error(`root <svg> has an invalid viewBox "${viewBox.value}"`);
  }
  return width;
}

export function finalizeSvg(svg: string, opts: { id: string; acc: AccText }): string {
  const oneLine = svg.replace(/\r?\n/g, " ");
  if (oneLine.includes('aria-roledescription="error"')) {
    throw new Error('Mermaid rendered an error diagram (aria-roledescription="error")');
  }

  const root = findRoot(oneLine);
  const width = viewBoxWidth(root);
  setAttr(
    root.attrs,
    "style",
    `width:100%;max-width:${Math.round(width)}px;min-width:${Math.round(0.75 * width)}px;height:auto;background-color:transparent`,
  );

  const children = directChildren(oneLine, root.tagEnd);
  const title = children.find((c) => c.name === "title");
  const desc = children.find((c) => c.name === "desc");
  const titleId = title?.attrs.find((a) => a.name === "id")?.value ?? `${opts.id}-title`;
  const descId = desc?.attrs.find((a) => a.name === "id")?.value ?? `${opts.id}-desc`;
  setAttr(root.attrs, "aria-labelledby", titleId);
  setAttr(root.attrs, "aria-describedby", descId);

  const titleEl = `<title id="${escapeAttr(titleId)}">${escapeText(opts.acc.title)}</title>`;
  const descEl = `<desc id="${escapeAttr(descId)}">${escapeText(opts.acc.descr)}</desc>`;

  const edits: { start: number; end: number; text: string }[] = [
    { start: root.start, end: root.tagEnd, text: openingTag(root) },
  ];
  if (!title) {
    edits.push({ start: root.tagEnd, end: root.tagEnd, text: titleEl + (desc ? "" : descEl) });
  } else if (!desc) {
    edits.push({ start: title.end, end: title.end, text: descEl });
  }
  for (const [tag, tagId] of [
    [title, titleId],
    [desc, descId],
  ] as const) {
    if (tag && !tag.attrs.some((a) => a.name === "id")) {
      setAttr(tag.attrs, "id", tagId);
      edits.push({ start: tag.start, end: tag.tagEnd, text: openingTag(tag) });
    }
  }

  // Applied back to front so earlier offsets stay valid; at a shared start the replacement goes first, so an insertion lands before it.
  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let result = oneLine;
  for (const edit of edits) {
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  }
  if (result.includes("{{")) {
    throw new Error('SVG contains "{{", which mdBook would process as a template expression');
  }
  return result;
}
