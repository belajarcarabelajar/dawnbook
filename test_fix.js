const fs = require('fs');
let content = fs.readFileSync('/home/belajarcarabelajar/dawnbook/books/digital-minimalisme/src/content/07_membangun-rekreasi-berkualitas-tinggi-menemukan-ke.md', 'utf-8');
content = content.replace(/\\\(/g, '\\\\(');
content = content.replace(/\\\)/g, '\\\\)');
content = content.replace(/\\\[/g, '\\\\[');
content = content.replace(/\\\]/g, '\\\\]');
fs.writeFileSync('test.md', content);
