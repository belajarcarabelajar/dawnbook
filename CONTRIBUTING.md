# Contributing to Educational Books Platform

Thank you for your interest in contributing! This platform is an open-source hub for educational books. All contributions are welcome, provided they follow our guidelines.

## Branch Protection and Review Process

- Direct pushes to the `main` branch are **restricted**.
- All changes must be submitted via a Pull Request (PR) from a fork or a feature branch.
- **Required Reviews**: Every PR requires review and approval from the repository owner before it can be merged. This ensures quality and consistency across all published books.
- Status Checks: Our automated CI workflows must pass before merging. These checks verify that all books build successfully and that any new chapters are properly referenced.

## How to Add a Chapter

1. **Find the Target Book**: Navigate to the `books/` directory and find the folder of the book you want to contribute to (e.g., `books/piaget/`).
2. **Create the chapter file**: add it as `src/content/NN_kebab-case-name.md` in that book: a two-digit number, then lowercase words joined by hyphens (e.g. `src/content/05_proses-asimilasi.md`). Never put a chapter directly in `src/`: mdBook compiles every Markdown file there, and the page would appear twice.
3. **Title and SUMMARY**: start the file with a level-2 heading (`## Proses Asimilasi`), and add the same title to the book's `src/SUMMARY.md`:
   ```markdown
   - [Proses Asimilasi](content/05_proses-asimilasi.md)
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

Apply the schema migrations in `db/migrations/` (the remote command is the one `scripts/deploy-website.sh` runs):

```bash
# Remote (production)
CI=true bunx wrangler d1 migrations apply dawnbook-db --remote

# Local (development)
bunx wrangler d1 migrations apply dawnbook-db --local
```

### Seeding Data from File-Based Books

The seed script reads all books from `books/` (skipping `_`-prefixed directories) and upserts them into D1. It is idempotent - running it multiple times produces identical results:

```bash
bun run scripts/migrate-to-d1.ts
```

This script:
1. Traverses `books/`, reads `book.toml` for metadata and `src/*.md` for content
2. Generates `INSERT ... ON CONFLICT(slug) DO UPDATE` SQL
3. Executes each statement against D1 with `cf d1 query --sql` (the Cloudflare CLI), never as one SQL file

### Pages Functions (API Layer)

The API is implemented as Cloudflare Pages Functions under `functions/api/books/`:

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/books` | GET | Public | List all books |
| `/api/books` | POST | D1 session + admin role | Create/update a book |
| `/api/books/:slug` | GET | Public | Get a single book by slug |
| `/api/auth/login` | GET | Public | Redirect to Google OAuth consent |
| `/api/auth/callback` | GET | Public | Exchange OAuth code → set session cookie |
| `/api/auth/logout` | POST | Public | Clear the __Host-session_id cookie |
| `/api/auth/me` | GET | Public | Current user JSON (or 401) |
| `/api/progress` | GET / POST | D1 session | Reading progress (POST) + completed paths (GET) |

Mutating endpoints require a valid `__Host-session_id` cookie (set automatically by `/api/auth/callback`). The browser sends it on every same-origin request; programmatic clients can also pass `Authorization: Session <hex>`.

### Environment Variables (Pages)

Set these in the Cloudflare Pages dashboard under **Settings → Environment variables**:

| Variable | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID (from Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret: used by `/api/auth/callback` to exchange codes |

The D1 binding (`DB`) is configured in `wrangler.toml` and is automatically available to every Pages Function as `env.DB`.

> **Important**: Never commit OAuth secrets to the repository. They must be set as environment variables in the Cloudflare Pages dashboard, or loaded from the git-ignored root `.env` for local development. See `.env.example` for the full tracked template.

## LaTeX Support

Books render math with MathJax 2.7.9, loaded with `defer` by `books/_template/theme/head.hbs`. The build copies that file into every book (`scripts/sync-template.ts`), so never edit a book's own `head.hbs`.

Every `book.toml` keeps `mathjax-support = false` under `[output.html]`, so mdBook does not inject a second MathJax tag:

```toml
[output.html]
mathjax-support = false
```

Copy `book.toml` from `books/_template/` and change only the title, authors and description; the build syncs the rest from the template.

The Cloudflare Pages CSP `_headers` is pre-configured to allow MathJax loading from `cdnjs.cloudflare.com` and `cdn.jsdelivr.net`.

### Writing math (mdBook v0.5.4)

mdBook parses chapters with **pulldown-cmark**, which removes a backslash in front of ASCII punctuation outside raw HTML. That is why `\(x^2\)` and `\\(x^2\\)` never reach MathJax intact. The full, measured rules live in `GEMINI.md` section 9; the essentials:

1. **Inline math** uses `$...$` with no space after the opening `$` or before the closing one (`$P_e$`). Never use `\(...\)` or `\[...\]`.
2. **Display math** is a protected block: `<div>`, `$$`, the formula, `$$`, `</div>`, with no blank line inside and a blank line before and after the whole block. Inside a list item, indent all five lines to the item's text column.
   ```markdown
   <div>
   $$
   \text{MC} = \frac{d\text{TC}}{dQ} = 10Q + 20
   $$
   </div>
   ```
3. **Multi-letter names** inside math use `\text{...}` (`\text{NPV}`, not `NPV`, which renders as N×P×V).
4. **Percent signs:** `%` starts a TeX comment. Write `\text{\%}` in inline math and `\%` inside a protected block.
5. **Subscripts:** when a paragraph holds more than one subscript, write the underscore as `\_` in inline math, so pulldown-cmark cannot pair two underscores into `<em>`.
6. **Never write** `\,` `\;` `\!` `\\` `\{` `\}` `\|` inside math, and do not use `cases` or `aligned`. Split a long formula into two protected blocks.
7. **Currency:** do not leave a bare `$` amount in prose when another `$` can follow in the same paragraph; write "USD 700 juta".

### Validation

Read each formula in the built page (`bun run build`, then open `output/books/<slug>/`). `bun scripts/check-latex-support.ts` is an optional extra check and is not part of the build. It checks percent signs by context: `\text{\%}` in ordinary math, `\%` inside a protected block.

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
4. **Gated paths** → middleware reads the `__Host-session_id` cookie (or `Authorization: Session <hex>` header), looks it up in D1 (`sessions` joined with `users`).
   - **Valid session** → request passes through, response gets `Cache-Control: private, no-store` and `Vary: Cookie` headers.
   - **Invalid/missing session** → HTML requests get `302` redirect to `/sign-in?redirect_url=...`; API requests get `401` JSON.

### Roles

| Role | Assigned To | Access |
|---|---|---|
| `reader` | Default role for all new Google sign-ins | Gated book content |
| `admin` | Manually assigned (see "Promoting an admin" below) | Admin portal + all reader access |

Any authenticated session (regardless of role) is sufficient for gated content. The `admin` role is required for write endpoints under `/api/books` and is enforced server-side by checking `users.role === 'admin'`.

### Promoting an admin

The owner can promote a user with a one-off D1 update: no separate admin tool is required for the initial bootstrap:

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
