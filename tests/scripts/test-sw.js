const fs = require('fs');
let code = fs.readFileSync('public/sw.js', 'utf8');
console.log(code);
