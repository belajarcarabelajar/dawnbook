// Client-side gating
(function() {
    var path = decodeURIComponent(window.location.pathname);
    var basename = path.split('/').pop() || '';

    // Gating rule: Dynamic SEO-first gating based on entry point
    var freeChapter = null;
    try { freeChapter = sessionStorage.getItem('free_chapter_viewed'); } catch(e) {}
    var isPublic = (freeChapter === path) || basename === 'index.html' || basename === '' || basename === 'toc.html' || basename === '404.html';

    if (!isPublic) {
        document.documentElement.style.opacity = '0';
        document.documentElement.style.visibility = 'hidden';

        var clerkPk = 'pk_test_cmlnaHQtZ2FubmV0LTk5LmNsZXJrLmFjY291bnRzLmRldiQ';
        // mdbook doesn't have the meta tag, so we hardcode the fallback but also check
        var keyBody = clerkPk.replace(/^pk_(test|live)_/, '');
        while (keyBody.length % 4 !== 0) { keyBody += '='; }
        var domain = atob(keyBody).replace(/\$$/, '');

        var script = document.createElement('script');
        script.src = 'https://' + domain + '/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
        script.setAttribute('data-clerk-publishable-key', clerkPk);
        script.async = true;

        script.onload = function() {
            if (window.Clerk) {
                window.Clerk.load().then(function() {
                    if (window.Clerk.user) {
                        document.documentElement.style.opacity = '1';
                        document.documentElement.style.visibility = 'visible';
                    } else {
                        window.location.href = '/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname);
                    }
                }).catch(function() {
                    window.location.href = '/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname);
                });
            } else {
                window.location.href = '/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname);
            }
        };
        script.onerror = function() {
            window.location.href = '/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname);
        }
        document.head.appendChild(script);
    }
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
                    } catch(err) {}
                }
            }
        });
    }
});
