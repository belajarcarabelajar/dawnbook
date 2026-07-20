# Contributing to Educational Books Platform

Thank you for your interest in contributing! This platform is an open-source hub for educational books. All contributions are welcome, provided they follow our guidelines.

## Branch Protection and Review Process

- Direct pushes to the `main` branch are **restricted**.
- All changes must be submitted via a Pull Request (PR) from a fork or a feature branch.
- **Required Reviews**: Every PR requires review and approval from the repository owner before it can be merged. This ensures quality and consistency across all published books.
- Status Checks: Our automated CI workflows must pass before merging. These checks verify that all books build successfully and that any new chapters are properly referenced.

## How to Add a Chapter

1. **Find the Target Book**: Navigate to the `books/` directory and find the folder of the book you want to contribute to (e.g., `books/piaget/`).
2. **Create Markdown File**: Add your new chapter as a Markdown (`.md`) file inside the `src/` directory of that book.
3. **Register in SUMMARY**: Open `src/SUMMARY.md` in that book's folder and add a link to your new chapter. Example:
   ```markdown
   - [My New Chapter](./my-new-chapter.md)
   ```
4. **Test Locally**: Run `bun run build` to ensure your changes build cleanly.
5. **Open a PR**: Fill out the Pull Request template completely, describing your changes and confirming the originality of your work.

## How to Create a New Book

1. **Copy Template**: Copy the `books/_template` directory to `books/<your-new-book-slug>`.
2. **Configure**: Edit `book.toml` in your new directory to set the title and authors.
3. **Write Content**: Replace the `SUMMARY.md` and placeholder content in `src/` with your actual book structure and content.
4. **Open a PR**: Submit a PR to add the new book.

## License and Originality

By contributing, you confirm that your submission is your original work or you have the right to publish it, and you agree to license it under the repository's open-source license.

## Database: Cloudflare D1

Dawnbook uses [Cloudflare D1](https://developers.cloudflare.com/d1/) as its persistent database layer. The database is named `dawnbook-db` and is bound to the project as `DB` in `wrangler.toml`.

### Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) installed (comes with the project's `wrangler` dependency)
- Cloudflare account with Pages and D1 access
- `CLOUDFLARE_ACCOUNT_ID` set in your environment or `wrangler.toml`

### Creating the D1 Database (one-time setup)

If you're setting up a fresh environment, create the database:

```bash
npx wrangler d1 create dawnbook-db
```

Then update the `database_id` in `wrangler.toml` with the ID from the output.

### Applying Schema Migrations

Apply the initial schema (and any future migrations) to D1:

```bash
# Remote (production)
npx wrangler d1 execute dawnbook-db --remote --file=db/migrations/0001_init.sql --yes

# Local (development)
npx wrangler d1 execute dawnbook-db --local --file=db/migrations/0001_init.sql
```

### Seeding Data from File-Based Books

The seed script reads all books from `books/` (skipping `_`-prefixed directories) and upserts them into D1. It is idempotent — running it multiple times produces identical results:

```bash
bun run scripts/migrate-to-d1.ts
```

This script:
1. Traverses `books/`, reads `book.toml` for metadata and `src/*.md` for content
2. Generates `INSERT ... ON CONFLICT(slug) DO UPDATE` SQL
3. Executes the SQL against D1 via `wrangler d1 execute`

### Pages Functions (API Layer)

The API is implemented as Cloudflare Pages Functions under `functions/api/books/`:

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/books` | GET | Public | List all books |
| `/api/books` | POST | D1 session + admin role | Create/update a book |
| `/api/books/:slug` | GET | Public | Get a single book by slug |
| `/api/auth/login` | GET | Public | Redirect to Google OAuth consent |
| `/api/auth/callback` | GET | Public | Exchange OAuth code → set session cookie |
| `/api/auth/logout` | POST | Public | Clear the session_id cookie |
| `/api/auth/me` | GET | Public | Current user JSON (or 401) |
| `/api/progress` | GET / POST | D1 session | Reading progress (POST) + completed paths (GET) |

Mutating endpoints require a valid `session_id` cookie (set automatically by `/api/auth/callback`). The browser sends it on every same-origin request; programmatic clients can also pass `Authorization: Session <hex>`.

### Environment Variables (Pages)

Set these in the Cloudflare Pages dashboard under **Settings → Environment variables**:

| Variable | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID (from Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret — used by `/api/auth/callback` to exchange codes |

The D1 binding (`DB`) is configured in `wrangler.toml` and is automatically available to every Pages Function as `env.DB`.

> **Important**: Never commit OAuth secrets to the repository. They must be set as environment variables in the Cloudflare Pages dashboard, or loaded from the git-ignored root `.env` for local development. See `.env.example` for the full tracked template.

## LaTeX Support

Dawnbook enforces mathematical rendering consistency via the `latex-support` build rule. All new and existing books must support mathematical equations (LaTeX) using mdBook's native MathJax integration unless a different preprocessor like KaTeX is already explicitly set up.

When creating a new book or editing `book.toml`, you **must** include the following under `[output.html]`:

```toml
[output.html]
mathjax-support = true
```

The build pipeline (`scripts/build.ts`) automatically validates this configuration via `scripts/check-latex-support.ts`. If this key is missing, the build will fail to prevent regressions where equations fail to render.

The Cloudflare Pages CSP `_headers` is pre-configured to allow MathJax loading from `cdnjs.cloudflare.com` and `cdn.jsdelivr.net` to support Edge rendering on auth-gated pages.

## Embedding media

Dawnbook supports responsive images, self-hosted videos, and YouTube embeds natively. All media components are secured by a strict Content Security Policy (CSP) and must follow standard canonical formats to pass the `media-embed-support` CI check:

- **Images**: Use standard Markdown `![alt text](path/to/image.jpg)`.
- **Self-Hosted Video**: Use HTML `<video controls src="path/to/video.mp4"></video>`.
- **YouTube Embeds**: You must use the privacy-friendly domain `youtube-nocookie.com` and wrap the iframe in the responsive container.

```html
<div class="embed-responsive">
  <iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" allowfullscreen loading="lazy"></iframe>
</div>
```

**Note:** Regular `youtube.com` domains or other third-party video providers are blocked by default by the CSP `frame-src`.

## Auth-Gated Content

Dawnbook uses a "free auth-gated content" model: book content beyond the first chapter requires a free Google sign-in. Enforcement happens at the Cloudflare edge via `functions/_middleware.ts`, before any static file is served.

### Public Preview vs Gated Content

| Path Pattern | Access | Description |
|---|---|---|
| `/`, `/about.html`, `/contribute.html` | **Public** | Hub pages |
| `/admin/*` | **Public at edge** | Admin SPA (gates itself via `/api/auth/me` client-side) |
| `/api/*` | **Public at edge** | API handlers enforce their own auth |
| `/books/<slug>/` | **Public** | Book index (first chapter) |
| `/books/<slug>/01 - *.html` | **Public** | First chapter = public preview |
| `/books/<slug>/02 - *.html` and beyond | **Gated** | Requires authenticated session |
| All static assets (CSS, JS, fonts, images) | **Public** | Always served without auth |
| `/sign-in`, `/sign-up` | **Public** | OAuth start page |

### How It Works

1. Every request passes through `functions/_middleware.ts`.
2. The middleware calls `isPublicPath()` (from `functions/lib/gating.ts`) to check the URL.
3. **Public paths** → request passes through unchanged.
4. **Gated paths** → middleware reads the `session_id` cookie (or `Authorization: Session <hex>` header), looks it up in D1 (`sessions` joined with `users`).
   - **Valid session** → request passes through, response gets `Cache-Control: private, no-store` and `Vary: Cookie` headers.
   - **Invalid/missing session** → HTML requests get `302` redirect to `/sign-in?redirect_url=...`; API requests get `401` JSON.

### Roles

| Role | Assigned To | Access |
|---|---|---|
| `reader` | Default role for all new Google sign-ins | Gated book content |
| `admin` | Manually assigned (see "Promoting an admin" below) | Admin portal + all reader access |

Any authenticated session (regardless of role) is sufficient for gated content. The `admin` role is required for write endpoints under `/api/books` and is enforced server-side by checking `users.role === 'admin'`.

### Promoting an admin

The owner can promote a user with a one-off D1 update — no separate admin tool is required for the initial bootstrap:

```bash
npx wrangler d1 execute dawnbook-db --remote \
  --command "UPDATE users SET role = 'admin' WHERE email = 'you@example.com'" --yes
```

### Testing Gating Locally

1. Start the local dev server with Pages Functions (uses the git-ignored root `.env`):
   ```bash
   npx wrangler pages dev output
   ```

2. Run the verification tests:
   ```bash
   ./scripts/test-gating.sh http://localhost:8788
   ```

   The test script verifies:
   - Gated URLs return 302/401 without auth
   - Public preview URLs return 200 without auth
   - Gated responses carry safe cache headers
