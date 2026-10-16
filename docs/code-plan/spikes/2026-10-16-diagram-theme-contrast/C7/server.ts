// C7 static server for /tmp/dtc-C7/site on port 8807. /api/* answers 404 (no gating backend), /sign-in answers 204;
// extensionless paths resolve to .html like Cloudflare Pages. Every request is logged to /tmp/dtc-C7/requests.log.
import fs from "node:fs";
import path from "node:path";

const ROOT = "/tmp/dtc-C7/site";
const LOG = "/tmp/dtc-C7/requests.log";
Bun.serve({
  port: 8807,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url);
    const p = decodeURIComponent(url.pathname);
    if (p.startsWith("/api/")) {
      fs.appendFileSync(LOG, `404api ${req.method} ${p}\n`);
      return new Response("not found", { status: 404 });
    }
    if (p === "/sign-in") {
      // shared-script.js redirects anonymous visitors of gated chapters here; 204 keeps the browser on the chapter page.
      fs.appendFileSync(LOG, `204signin ${req.method} ${p}${url.search}\n`);
      return new Response(null, { status: 204 });
    }
    let file = path.join(ROOT, path.normalize(p));
    if (!file.startsWith(ROOT)) return new Response("bad", { status: 400 });
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    else if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
    const ok = fs.existsSync(file);
    fs.appendFileSync(LOG, `${ok ? 200 : 404} ${req.method} ${p}\n`);
    if (!ok) return new Response("not found", { status: 404 });
    return new Response(Bun.file(file), { headers: { "cache-control": "no-store" } });
  },
});
console.log("listening 127.0.0.1:8807");
