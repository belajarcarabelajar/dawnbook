import en from "../../i18n/en.json";
import id from "../../i18n/id.json";

export function getInterstitialHtml(originalUrl: string, publishableKey: string, locale: string = "en"): Response {
  const catalogs: Record<string, any> = { en, id };
  const catalog = catalogs[locale] || catalogs.en;

  const url = new URL(originalUrl);
  const redirectPath = url.pathname + url.search;
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(redirectPath)}`;

  const html = `
<!DOCTYPE html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <title>${catalog["interstitial.title"]}</title>
    <style>
      body {
        margin: 0;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #0d1117;
        color: #c9d1d9;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      }
      .loader {
        border: 4px solid rgba(255, 255, 255, 0.1);
        border-left-color: #58a6ff;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        animation: spin 1s linear infinite;
      }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div class="loader"></div>
    <script>
      var keyBody = '${publishableKey}'.replace(/^pk_(test|live)_/, '');
      while (keyBody.length % 4 !== 0) { keyBody += '='; }
      var domain = atob(keyBody).replace(/\\$$/, '');

      var script = document.createElement('script');
      script.src = 'https://' + domain + '/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
      script.setAttribute('data-clerk-publishable-key', '${publishableKey}');
      script.async = true;
      script.onload = function() {
        if (window.Clerk) {
          window.Clerk.load().then(async function() {
            if (window.Clerk.session) {
              var token = await window.Clerk.session.getToken();
              document.cookie = "__session=" + token + "; path=/; max-age=60; SameSite=Lax";
              window.location.reload();
            } else {
              window.location.href = '${signInUrl}';
            }
          }).catch(function() {
            window.location.href = '${signInUrl}';
          });
        } else {
          window.location.href = '${signInUrl}';
        }
      };
      script.onerror = function() {
        window.location.href = '${signInUrl}';
      };
      document.head.appendChild(script);
    </script>
  </body>
</html>
  `;

  return new Response(html, {
    status: 401,
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "private, no-store",
      "Vary": "Cookie"
    }
  });
}
