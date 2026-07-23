const fs = require('fs');
let code = fs.readFileSync('books/shared-script.js', 'utf8');

// Replace the entire handleCheckpoint logic to be simpler and bug-free
const target = `    function handleCheckpoint() {
        var pathParts = currentPath.split('/').filter(Boolean);
        var bookIndex = pathParts.indexOf('books');
        if (bookIndex === -1 || pathParts.length <= bookIndex + 1) return;
        
        var bookSlug = pathParts[bookIndex + 1];
        var isRoot = (currentPath === '/books/' + bookSlug) || (currentPath === '/books/' + bookSlug + '/') || (currentPath === '/books/' + bookSlug + '/index.html');
        var hasRedirected = new URLSearchParams(window.location.search).get('redirected');
        var isInternalNavigation = document.referrer && document.referrer.indexOf('/books/' + bookSlug + '/') !== -1;

        window.saveProgress = function(isCompleted) {
            var payload = { bookSlug: bookSlug, path: currentPath };
            if (isCompleted) {
                payload.completed_path = currentPath;
            }
            fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
                keepalive: true
            }).then(function(res) {
                if (!res.ok) { console.error('Save progress failed: HTTP ' + res.status); }
                return res.json();
            }).then(function(data) {
                if (data && data.completed_paths && window.updateBookProgress) {
                    window.updateBookProgress(data.completed_paths);
                }
            }).catch(function(e) { console.error('Save progress network error', e); });
        };

        window.checkpointHandled = false;
        
        // If we are on the root page (table of contents) and we haven't been redirected here
        if (isRoot && !hasRedirected) {
            try {
                if (!sessionStorage.getItem('viewed_' + bookSlug)) {
                    fetch('/api/books/' + encodeURIComponent(bookSlug) + '/view', { method: 'POST', credentials: 'same-origin', keepalive: true }).catch(function(){});
                    sessionStorage.setItem('viewed_' + bookSlug, '1');
                }
            } catch(e) { console.warn('sessionStorage setItem error', e); }
            
            // Only try to redirect if we aren't coming from internal navigation (e.g. clicking 'Back to Hub')
            if (!isInternalNavigation) {
                fetch('/api/progress?bookSlug=' + encodeURIComponent(bookSlug), {
                    credentials: 'same-origin'
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    if (data.completed_paths && window.updateBookProgress) {
                        window.updateBookProgress(data.completed_paths);
                    }
                    if (data.path && data.path !== currentPath && !data.path.endsWith('/books/' + bookSlug + '/')) {
                        // Redirect to the saved chapter path!
                        window.location.replace(data.path + '?redirected=true');
                    } else {
                        window.checkpointHandled = true;
                    }
                })
                .catch(function(e) { 
                    console.error('Failed to load progress', e);
                    window.checkpointHandled = true;
                });
            } else {
                window.checkpointHandled = true;
            }
        } else {
            // If we are NOT on the root page (i.e. we are on a Chapter page), OR we've been redirected here...
            window.checkpointHandled = true;
            if (!isRoot) {
                // Only save progress if we are actually on a chapter page!
                // Never save the root page as progress.
                window.saveProgress();
            }
        }
    }`;

code = code.replace(/    function handleCheckpoint\(\) \{[\s\S]*?    \}\n\n    script\.onload/, target + '\n\n    script.onload');
fs.writeFileSync('books/shared-script.js', code);
