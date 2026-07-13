const fs = require('fs');
let code = fs.readFileSync('books/shared-script.js', 'utf8');

// We also need to fix the fetch `.then` block:
// if (data.path && data.path !== currentPath) { window.location.replace(data.path + '?redirected=true'); }
// else { window.checkpointHandled = true; window.saveProgress(); }
// Here, if it IS root, we shouldn't save progress either.
code = code.replace(/} else \{\n\s+window\.checkpointHandled = true;\n\s+window\.saveProgress\(\);\n\s+\}\n\s+\}\)\n\s+\.catch\(function\(e\) \{\n\s+console\.error\('Failed to load progress', e\);\n\s+window\.checkpointHandled = true;\n\s+window\.saveProgress\(\);\n\s+\}\);/, `} else {
                    window.checkpointHandled = true;
                    if (!isRoot) {
                        window.saveProgress();
                    }
                }
            })
            .catch(function(e) { 
                console.error('Failed to load progress', e);
                window.checkpointHandled = true;
                if (!isRoot) {
                    window.saveProgress();
                }
            });`);

fs.writeFileSync('books/shared-script.js', code);
console.log("Patched 2");
