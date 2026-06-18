# MEDIA_EMBED_AUDIT.md

## Audit Report

| File | Media Type | Status (PASS/FAIL) | Evidence | Remediation |
|---|---|---|---|---|
| `books/*/book.toml` | Raw HTML | PASS | No config disables mdBook's native raw HTML passthrough | None needed |
| `books/shared-header-v3.css` | Image, Video, YouTube | FAIL | Missing responsive `img` properties and `.embed-responsive` wrapper | Added responsive `img { max-width: 100% }` and `.embed-responsive` container for `<iframe>` and `<video>` |
| `books/shared-script-v3.js` | Image, Video, YouTube | PASS | Gating logic changes document opacity without stripping media elements | None needed |
| `books/*/src/*.md` | Image, Video, YouTube | PASS | Zero usages of disallowed embeds (`youtube.com`); no videos or images found yet. | None needed |
| `scripts/build.ts` (_headers CSP) | Image, Video, YouTube | FAIL | Missing `https:` for `img-src` and `media-src`. Missing `youtube-nocookie.com` in `frame-src`. | Added `img-src 'self' data: https:`, `media-src 'self' https:`, and `frame-src 'self' ... https://www.youtube-nocookie.com https://www.youtube.com;` |
| `scripts/inject-gating.ts` | Image, Video, YouTube | PASS | Post-build mutation correctly preserves media HTML in `<main>` | None needed |
| `functions/_middleware.ts` | Edge Delivery | PASS | Cloudflare Pages `Cache-Control: private, no-store` correctly gates content without dropping HTTP requests for relative image/video assets | None needed |

## Open Questions

- We currently allow all `https:` origins for `img-src` and `media-src` to enable third-party asset linking. Should we lock this down to a specific CDN in the future to improve security?
- Do we want to implement a custom mdBook preprocessor to automatically convert standard markdown links into `embed-responsive` wrappers for YouTube videos, saving authors from writing raw HTML?

## Verification

To verify the build and the media guardrail:

```bash
bun run scripts/check-media-support.ts
bun run build
```

Expected output:
\`\`\`
Checking media embed support across all books...
✅ All media embed support checks passed.
\`\`\`

You can manually verify rendered media locally by adding test content to a chapter, serving the output, and opening:
`http://localhost:XXXX/books/piaget/<chapter>.html`
- Image: `![alt](https://via.placeholder.com/150)`
- Video: `<video controls src="https://www.w3schools.com/html/mov_bbb.mp4"></video>`
- YouTube: `<div class="embed-responsive"><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" allowfullscreen loading="lazy"></iframe></div>`
