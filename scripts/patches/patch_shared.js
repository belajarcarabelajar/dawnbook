const fs = require('fs');
let code = fs.readFileSync('books/shared-script.js', 'utf8');

code = code.replace(
  `window.saveProgress = function(isCompleted) {`,
  `window.saveProgress = function(isCompleted) {
            console.log("saveProgress called! path:", currentPath);`
);

fs.writeFileSync('books/shared-script.js', code);
