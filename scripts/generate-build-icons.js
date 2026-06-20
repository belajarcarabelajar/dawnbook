const fs = require('fs');
const path = require('path');

const buildIconsDir = path.join(__dirname, 'build-icons');
if (!fs.existsSync(buildIconsDir)) fs.mkdirSync(buildIconsDir, { recursive: true });

const svg1024 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#000000"/>
  <text x="50%" y="55%" font-size="400" text-anchor="middle" fill="#ffffff" dy=".3em">🌅</text>
</svg>`;

fs.writeFileSync(path.join(buildIconsDir, 'app.png'), svg1024); // Fake PNG (actually SVG) just as placeholder
console.log("Placeholder icon created in build-icons/");
