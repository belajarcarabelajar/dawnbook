// Client-side gating & checkpoint system
(function() {
    var icon = document.querySelector("link[rel~='icon']");
    if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.appendChild(icon); }
    icon.type = 'image/svg+xml';
    icon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📓</text></svg>';

    var currentPath = window.location.pathname;
    var path = decodeURIComponent(currentPath);
    var basename = path.split('/').pop() || '';

    // Gating rule: Dynamic SEO-first gating based on entry point
    var freeChapter = null;
    try { freeChapter = sessionStorage.getItem('free_chapter_viewed'); } catch(e) { console.warn('sessionStorage getItem error', e); }
    var isPublic = (freeChapter === currentPath) || (freeChapter && decodeURIComponent(freeChapter) === path) || basename === 'index.html' || basename === '' || basename === 'toc.html' || basename === '404.html';


    if (!isPublic) {
        document.documentElement.style.opacity = '0';
        document.documentElement.style.visibility = 'hidden';
    }

    var meta = document.querySelector('meta[name="clerk-publishable-key"]');
    var clerkPk = meta ? meta.getAttribute('content') : '';
    if (!clerkPk) {
        console.error('Clerk publishable key missing');
        return;
    }
    var keyBody = clerkPk.replace(/^pk_(test|live)_/, '');
    while (keyBody.length % 4 !== 0) { keyBody += '='; }
    var domain = atob(keyBody).replace(/\$$/, '');

    var script = document.createElement('script');
    script.src = 'https://' + domain + '/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
    script.setAttribute('data-clerk-publishable-key', clerkPk);
    script.async = true;

    function handleCheckpoint() {
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
    }

    script.onload = function() {
        if (!isPublic) {
            document.documentElement.style.opacity = '1';
            document.documentElement.style.visibility = 'visible';
        }

        if (window.Clerk) {
            window.Clerk.load().then(function() {
                if (!window.Clerk.user && !isPublic) {
                    window.location.href = '/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname);
                    return;
                }
                
                // Call handleCheckpoint AFTER Clerk is loaded so __session cookies are valid
                handleCheckpoint();
            }).catch(function(e) {
                console.error('Clerk load failed', e);
                // Fallback to calling handleCheckpoint even if Clerk fails, for public users
                handleCheckpoint();
            });
        } else {
            if (!isPublic) {
                window.location.href = '/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname);
            } else {
                handleCheckpoint();
            }
        }
    };

    script.onerror = function() {
        if (!isPublic) {
            window.location.href = '/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname);
        }
    }
    document.head.appendChild(script);
})();

document.addEventListener('DOMContentLoaded', function() {
    const rightButtons = document.querySelector('.right-buttons');
    if (rightButtons) {
        const backToHub = document.createElement('a');
        backToHub.href = '/';
        backToHub.className = 'icon-button';
        backToHub.title = 'Back to Hub';
        backToHub.setAttribute('aria-label', 'Back to Hub');
        backToHub.innerHTML = `<span class="fa-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>`;
        rightButtons.appendChild(backToHub);
    }

    // Auto-close sidebar on mobile after clicking a chapter link
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            // Only trigger if it's an actual link with an href (not just a toggle)
            if (link && link.getAttribute('href')) {
                if (window.innerWidth < 1080) {
                    const htmlTag = document.documentElement;
                    htmlTag.classList.remove('sidebar-visible');
                    htmlTag.classList.add('sidebar-hidden');

                    const toggle = document.getElementById('mdbook-sidebar-toggle-anchor');
                    if (toggle) {
                        toggle.checked = false;
                    }

                    try {
                        localStorage.setItem('mdbook-sidebar', 'hidden');
                    } catch(err) { console.warn('localStorage setItem error', err); }
                }
            }
        });
    }

    // Book Progress Bar Setup
    const bookProgressBar = document.createElement('div');
    bookProgressBar.id = 'book-progress-bar';
    document.body.appendChild(bookProgressBar);

    function normalizePath(p) {
        if (!p) return '';
        p = p.split('#')[0].split('?')[0];
        if (p.endsWith('/')) p += 'index.html';
        return p;
    }

    let totalChapterCount = 0;
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    const validChapters = new Set();
    sidebarLinks.forEach(link => {
        if (link.pathname) {
            validChapters.add(normalizePath(link.pathname));
        }
    });
    totalChapterCount = validChapters.size;

    window.updateBookProgress = function(completedPaths) {
        if (totalChapterCount === 0 || !completedPaths) return;
        let completedCount = 0;
        const normalizedCompleted = completedPaths.map(normalizePath);
        validChapters.forEach(ch => {
            if (normalizedCompleted.includes(ch)) {
                completedCount++;
            }
        });
        const progress = Math.min((completedCount / totalChapterCount) * 100, 100);
        bookProgressBar.style.width = progress + '%';
    };

    // Scroll Progress Bar
    const progressBar = document.createElement('div');
    progressBar.id = 'scroll-progress-bar';
    document.body.appendChild(progressBar);

    let isCompleted = false;

    function updateProgress() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 100;
        
        progressBar.style.width = progress + '%';

        if (progress >= 98 && !isCompleted) {
            if (window.saveProgress && window.checkpointHandled !== false) {
                isCompleted = true;
                window.saveProgress(true);
            }
        }
    }
    
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
});
