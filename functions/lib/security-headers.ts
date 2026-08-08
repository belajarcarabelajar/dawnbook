/**
 * functions/lib/security-headers.ts
 *
 * Single source of truth for the Content-Security-Policy applied to Dawnbook
 * responses. Consumed by:
 *   - scripts/builder/template-engine.ts (generates the deployed output/_headers)
 *   - functions/_middleware.ts (applies to function-generated responses)
 *   - the tracked root `_headers` file
 *
 * Origins allowed here mirror exactly what generated pages load:
 *   - 'unsafe-inline' script/style: mdBook + hub pages use inline scripts and
 *     style attributes (tightening to hashes/nonces is future work).
 *   - https://cdnjs.cloudflare.com and https://cdn.jsdelivr.net: MathJax/KaTeX.
 *   - https://www.googletagmanager.com + analytics endpoints: Google Analytics.
 *   - https://challenges.cloudflare.com: Cloudflare Turnstile (script + iframe).
 *   - https://fonts.googleapis.com / https://fonts.gstatic.com: Google Fonts.
 *   - img/media https:: book content embeds third-party images and video.
 *   - https://www.youtube-nocookie.com: privacy-first YouTube embeds.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.googletagmanager.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
  "img-src 'self' data: https:",
  "media-src 'self' https:",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://challenges.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com https://accounts.google.com https://*.googleusercontent.com",
  "frame-src 'self' https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.youtube.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");
