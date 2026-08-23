const fs = require('fs');

const targetFiles = [
    'books/shared-script.js',
    'books/human-capital-theory/shared-script.js'
];

// We also need to fix the fetch `.then` block:
// if (data.path && data.path !== currentPath) { window.location.replace(data.path + '?redirected=true'); }
// else { window.checkpointHandled = true; window.saveProgress(); }
// Here, if it IS root, we shouldn't save progress either.
targetFiles.forEach(function(filepath) {
    if (!fs.existsSync(filepath)) return;
    let code = fs.readFileSync(filepath, 'utf8');

    // Add data null checks if not present
    code = code.replace(/if\s*\(\s*data\.completed_paths\b/g, 'if (data && data.completed_paths');
    code = code.replace(/if\s*\(\s*data\.path\b/g, 'if (data && data.path');

    // Patch the else block in .then and .catch to ensure window.saveProgress() is only called if (!isRoot)
    code = code.replace(/} else \{\s+window\.checkpointHandled = true;(?:\s+if \(!isRoot\) \{\s+window\.saveProgress\(\);\s+\})?(?:\s+window\.saveProgress\(\);)?\s+\}\s+\}\)\s+\.catch\(function\(e\) \{\s+console\.error\('Failed to load progress', e\);\s+window\.checkpointHandled = true;(?:\s+if \(!isRoot\) \{\s+window\.saveProgress\(\);\s+\})?(?:\s+window\.saveProgress\(\);)?\s+\}\);/, `} else {
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

    fs.writeFileSync(filepath, code);
    console.log("Patched 2 for " + filepath);
});
