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
| `/api/books` | POST | Clerk JWT | Create/update a book |
| `/api/books/:slug` | GET | Public | Get a single book by slug |

Mutating endpoints require a valid Clerk session token in the `Authorization: Bearer <token>` header.

### Environment Variables (Pages)

Set these in the Cloudflare Pages dashboard under **Settings → Environment variables**:

| Variable | Purpose |
|---|---|
| `CLERK_SECRET_KEY` | Clerk backend secret for JWT/session verification (used by edge middleware + API handlers) |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key for JWKS domain resolution |
| `VITE_CLERK_PUBLISHABLE_KEY` | Same publishable key, exposed to the Vite build for the admin SPA and sign-in page |

> **Important**: Never commit Clerk keys to the repository. They must be set as environment variables in the Cloudflare Pages dashboard.

## Auth-Gated Content

Dawnbook uses a "free auth-gated content" model: book content beyond the first chapter requires a free authenticated Clerk session. Enforcement happens at the Cloudflare edge via `functions/_middleware.ts`, before any static file is served.

### Public Preview vs Gated Content

| Path Pattern | Access | Description |
|---|---|---|
| `/`, `/about.html`, `/contribute.html` | **Public** | Hub pages |
| `/admin/*` | **Public at edge** | Admin SPA (Clerk UI gates it client-side) |
| `/api/*` | **Public at edge** | API handlers enforce their own auth |
| `/books/<slug>/` | **Public** | Book index (first chapter) |
| `/books/<slug>/01 - *.html` | **Public** | First chapter = public preview |
| `/books/<slug>/02 - *.html` and beyond | **Gated** | Requires authenticated session |
| All static assets (CSS, JS, fonts, images) | **Public** | Always served without auth |
| `/sign-in` | **Public** | Clerk sign-in page |

### How It Works

1. Every request passes through `functions/_middleware.ts`.
2. The middleware calls `isPublicPath()` (from `functions/lib/gating.ts`) to check the URL.
3. **Public paths** → request passes through unchanged.
4. **Gated paths** → middleware reads the Clerk session token from `__session` cookie or `Authorization` header, verifies it with `@clerk/backend` using `CLERK_SECRET_KEY`.
   - **Valid session** → request passes through, response gets `Cache-Control: private, no-store` and `Vary: Cookie` headers.
   - **Invalid/missing session** → HTML requests get `302` redirect to `/sign-in?redirect_url=...`; API requests get `401` JSON.

### Clerk Roles

| Role | Assigned To | Access |
|---|---|---|
| `reader` | Default role for all new signups | Gated book content |
| `admin` | Manually assigned | Admin portal + all reader access |

Any authenticated session (regardless of role) is sufficient for gated content. The `admin` role is only required for `/admin/*` and is enforced client-side by the existing Clerk integration.

### Testing Gating Locally

1. Start the local dev server with Pages Functions:
   ```bash
   CLERK_SECRET_KEY=sk_test_... CLERK_PUBLISHABLE_KEY=pk_test_... npx wrangler pages dev output
   ```

2. Run the verification tests:
   ```bash
   ./scripts/test-gating.sh http://localhost:8788
   ```

   The test script verifies:
   - Gated URLs return 302/401 without auth
   - Public preview URLs return 200 without auth
   - Gated responses carry safe cache headers
