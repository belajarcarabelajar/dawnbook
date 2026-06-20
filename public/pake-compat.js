// pake-compat.js
// WebView-compatibility script for Pake Desktop App wrapper

(function() {
  document.addEventListener('click', function(e) {
    const anchor = e.target.closest('a');
    if (!anchor || !anchor.href) return;
    
    try {
      const url = new URL(anchor.href, window.location.origin);
      
      // If the link is HTTP/HTTPS and points to a different origin
      if (url.protocol.startsWith('http') && url.origin !== window.location.origin) {
        // Force external links to open in the system default browser
        // Pake (Tauri) automatically opens target="_blank" links in the OS default browser
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
      }
    } catch (err) {
      // Ignore parsing errors for custom protocols like mailto:
    }
  });
})();
