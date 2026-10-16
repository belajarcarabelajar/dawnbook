// V1 static replay server (C1 serve.ts with free-form variant names). Usage: bun serve.ts <root> [port=8831]
// A trailing "/" maps to index.html, or to <v>.html with ?v=<name>, so the pathname stays public
// (books/shared-script.js:104 redirects any other basename, such as index-control.html, to /sign-in).
import path from "node:path";

const root = path.resolve(process.argv[2]);
const port = Number(process.argv[3] ?? 8831);
Bun.serve({
  port,
  hostname: "127.0.0.1",
  async fetch(req) {
    const u = new URL(req.url);
    let p = decodeURIComponent(u.pathname);
    const v = u.searchParams.get("v");
    if (p.endsWith("/")) p += v && /^[a-z0-9-]+$/.test(v) ? `${v}.html` : "index.html";
    const file = path.join(root, p);
    if (!file.startsWith(root + path.sep)) return new Response("forbidden", { status: 403 });
    const f = Bun.file(file);
    if (!(await f.exists())) return new Response("not found", { status: 404 });
    return new Response(f, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } });
  },
});
console.log(`serving ${root} on http://localhost:${port}`);
