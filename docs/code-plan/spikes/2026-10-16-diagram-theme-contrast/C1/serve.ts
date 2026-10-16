// C1 static replay server. Usage: bun serve.ts <root> [port=8801]
// Serves files under <root>, maps a trailing "/" to index.html, sends no-store like the live zone.
import path from "node:path";

const root = path.resolve(process.argv[2]);
const port = Number(process.argv[3] ?? 8801);
Bun.serve({
  port,
  hostname: "127.0.0.1",
  async fetch(req) {
    const u = new URL(req.url);
    let p = decodeURIComponent(u.pathname);
    // ?v=b|c|d picks a variant file while the pathname stays a public book index
    // (books/shared-script.js:104 treats any other basename such as b.html as a gated chapter and redirects to /sign-in).
    const v = u.searchParams.get("v");
    if (p.endsWith("/")) p += v && /^[bcd]$/.test(v) ? `${v}.html` : "index.html";
    const file = path.join(root, p);
    if (!file.startsWith(root + path.sep)) return new Response("forbidden", { status: 403 });
    const f = Bun.file(file);
    if (!(await f.exists())) return new Response("not found", { status: 404 });
    return new Response(f, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } });
  },
});
console.log(`serving ${root} on http://localhost:${port}`);
