/**
 * functions/lib/security-headers.ts
 *
 * Single source of truth for the Content-Security-Policy applied to Dawnbook
 * responses. Consumed by:
 *   - scripts/builder/template-engine.ts (generates the deployed output/_headers)
 *   - functions/_middleware.ts (applies to function-generated responses)
 *   - the tracked root `_headers` file
 *
 * Two policies, identical except for script-src:
 *   - CONTENT_SECURITY_POLICY (every path except /books/*): no 'unsafe-inline'
 *     in script-src. Hub pages load their scripts from /hub-scripts/ and wire
 *     clicks through data- attributes, so a new page is strict by default.
 *   - BOOK_CONTENT_SECURITY_POLICY (/books/*): keeps 'unsafe-inline' in
 *     script-src, because mdBook output and the post-build pass
 *     (scripts/inject-gating.ts) still emit inline scripts.
 *
 * Origins allowed here mirror exactly what generated pages load:
 *   - 'unsafe-inline' style: hub and book pages use style attributes.
 *   - https://cdnjs.cloudflare.com and https://cdn.jsdelivr.net: MathJax/KaTeX.
 *   - https://www.googletagmanager.com + analytics endpoints: Google Analytics.
 *   - https://static.cloudflareinsights.com script + https://cloudflareinsights.com
 *     connect: Cloudflare Web Analytics beacon the zone injects on the custom domain.
 *   - https://challenges.cloudflare.com: Cloudflare Turnstile (script + iframe).
 *   - https://fonts.googleapis.com / https://fonts.gstatic.com: Google Fonts.
 *   - img/media https:: book content embeds third-party images and video.
 *   - https://www.youtube-nocookie.com: privacy-first YouTube embeds.
 */
const SCRIPT_HOSTS =
  "https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.googletagmanager.com https://challenges.cloudflare.com https://static.cloudflareinsights.com";

function policy(scriptSrc: string): string {
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "img-src 'self' data: https:",
    "media-src 'self' https:",
    "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://challenges.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com https://accounts.google.com https://*.googleusercontent.com https://analytics.google.com https://www.google.com https://cloudflareinsights.com",
    "frame-src 'self' https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.youtube.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export const CONTENT_SECURITY_POLICY = policy(`script-src 'self' ${SCRIPT_HOSTS}`);

export const BOOK_CONTENT_SECURITY_POLICY = policy(`script-src 'self' 'unsafe-inline' ${SCRIPT_HOSTS}`);

/** True for paths served under the /books/* rule of _headers. */
export function isBookPath(pathname: string): boolean {
  return pathname.startsWith("/books/");
}
