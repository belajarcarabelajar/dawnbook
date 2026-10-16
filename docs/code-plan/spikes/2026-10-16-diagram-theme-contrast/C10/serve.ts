// C10 throwaway static server. Usage: bun serve.ts <root> <port>
import { join, normalize } from "node:path";
import { statSync } from "node:fs";

const [root, port] = process.argv.slice(2);
Bun.serve({
  port: Number(port),
  fetch(req) {
    let p = normalize(decodeURIComponent(new URL(req.url).pathname));
    if (p.includes("..")) return new Response("bad", { status: 400 });
    let f = join(root, p);
    try { if (statSync(f).isDirectory()) f = join(f, "index.html"); } catch {}
    const file = Bun.file(f);
    return file.size > 0 || p.endsWith(".html") ? new Response(file, { headers: { "cache-control": "no-store" } }) : new Response("nf", { status: 404 });
  },
  error() { return new Response("nf", { status: 404 }); },
});
console.log(`serving ${root} on ${port}`);
