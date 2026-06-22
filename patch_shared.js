const fs = require('fs');
let code = fs.readFileSync('books/shared-script.js', 'utf8');

code = code.replace(/} else \{\n\s+window\.checkpointHandled = true;\n\s+window\.saveProgress\(\);\n\s+\}/, `} else {
            window.checkpointHandled = true;
            // Never save the root path as progress, as it overrides actual chapter progress.
            if (!isRoot) {
                window.saveProgress();
            }
        }`);

fs.writeFileSync('books/shared-script.js', code);
console.log("Patched");
