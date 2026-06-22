const fs = require('fs');

let buildTs = fs.readFileSync('scripts/build.ts', 'utf8');
buildTs = buildTs.replace(/<link rel="manifest" href="\/manifest\.webmanifest">\n\s*<script src="\/register-sw\.js" defer><\/script>\n/, '');
fs.writeFileSync('scripts/build.ts', buildTs);

let injectTs = fs.readFileSync('scripts/inject-gating.ts', 'utf8');
injectTs = injectTs.replace(/<link rel="manifest" href="\/manifest\.webmanifest">\n\s*<script src="\/register-sw\.js" defer><\/script>\n/, '');
fs.writeFileSync('scripts/inject-gating.ts', injectTs);

console.log("Removed PWA from HTML builders");
