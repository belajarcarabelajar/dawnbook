# Error Handling and Logging Audit Report

## Summary
A comprehensive audit of error handling and logging was performed across 16 specified files in the Dawnbook repository, covering serverless edge functions, D1 access code, frontend admin components, and build scripts.

Overall, the API edge functions demonstrate a strong security posture regarding error handling. Top-level `try/catch` blocks are consistently used in `api/progress.ts` and `api/books/*` endpoints to ensure that all exceptions are caught and sanitized into structured `500 Internal Server Error` JSON responses. Database queries using D1 explicitly check for `.success` and return safe error messages rather than leaking underlying database exceptions or stack traces. Furthermore, no secrets (`CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, or session JWTs) are leaked in logs or client-facing errors.

However, a few areas require improvement. The core `_middleware.ts` lacks a top-level `try/catch`, meaning uncaught exceptions downstream could result in blank Cloudflare 500 responses instead of structured JSON. Additionally, `decodeURIComponent` in `lib/gating.ts` is unprotected against `URIError`. Frontend services contain some unhandled promise rejections on network failures, and several scripts intentionally swallow errors using empty catch blocks.

## Coverage

| File | Error Handling | Logging |
|---|---|---|
| `functions/_middleware.ts` | Yes | No |
| `functions/api/progress.ts` | Yes | Yes |
| `functions/api/books/index.ts` | Yes | Yes |
| `functions/api/books/[slug].ts` | Yes | Yes |
| `functions/api/books/[slug]/view.ts` | Yes | Yes |
| `functions/lib/auth.ts` | Yes | Yes |
| `functions/lib/i18n.ts` | Neither | Neither |
| `functions/lib/gating.ts` | Neither | Neither |
| `apps/admin/src/services/book-service.ts`| Yes | No |
| `apps/admin/src/App.tsx` | Yes | Yes |
| `apps/admin/src/main.tsx` | Neither | Neither |
| `scripts/build.ts` | Yes | Yes |
| `scripts/sync-template.ts` | Yes | Yes |
| `scripts/inject-gating.ts` | Yes | Yes |
| `scripts/migrate-to-d1.ts` | Yes | Yes |
| `books/shared-script.js` | Yes | Yes |

## Findings

### 1. Missing Top-Level Error Handling in Middleware
- **File**: `functions/_middleware.ts`
- **Issue**: The `onRequest` handler lacks a top-level `try/catch` block. If `next()` or `nextWithLocale()` throws an unhandled exception, it will bypass the application's JSON error structure and rely on Cloudflare's default 500 error page (which lacks a structured JSON body).
- **Recommendation**: Wrap the entire `onRequest` execution in a `try/catch` that returns a sanitized 500 JSON response on failure.

### 2. Unhandled `URIError` in URL Decoding
- **File**: `functions/lib/gating.ts`
- **Issue**: The `isPublicPath` function calls `decodeURIComponent(pathname)` without a `try/catch`. Malformed percent-encoded URLs (e.g., `%E0%A4%A`) will throw a `URIError`, crashing the execution.
- **Recommendation**: Wrap `decodeURIComponent` in a `try/catch`. If it throws, fallback to using the raw `pathname` or reject the request as a 400 Bad Request.

### 3. Swallowed Errors (Empty Catch Blocks)
Several files use empty catch blocks to silently suppress errors. While these are mostly non-critical (like `localStorage` or `sessionStorage` failures), silently swallowing them can obscure underlying bugs.
- **`books/shared-script.js`**: `sessionStorage.getItem` and `sessionStorage.setItem` exceptions are silently caught and ignored.
- **`apps/admin/src/App.tsx`**: `localStorage.setItem` throws are explicitly ignored with `/* ignore storage errors */`.
- **`scripts/build.ts`**: Fails to parse `book.toml`, `SUMMARY.md`, or `.env.local` silently using empty catches.
- **`scripts/migrate-to-d1.ts`**: Fails to `fs.unlink(bookSqlPath)` silently.

### 4. Unhandled Promise Rejections in Frontend Service
- **File**: `apps/admin/src/services/book-service.ts`
- **Issue**: The service uses `fetch` to interact with the API. If the network is down or the fetch fails at the network level, `fetch` will throw an error. These errors are not caught inside `fetchBooks`, `fetchBook`, `deleteBook`, or `publishChapter`. While components like `MarkdownEditor` have `.catch()` on `BookService.fetchBook()`, other calls (like `deleteBook` in `BookManagement.tsx` and `fetchBooks` in `BookManagement.tsx`) do not, which could lead to unhandled promise rejections in the browser console.
- **Recommendation**: Add internal `try/catch` blocks around `fetch` calls in `book-service.ts` to return standard structured error objects on network failure, or ensure all React components explicitly `.catch()` the service promises.

### 5. D1 Query Error Handling (Positive Finding)
- **Files**: `functions/api/books/*.ts`, `functions/api/progress.ts`
- **Finding**: D1 database interactions are well-handled. The code consistently checks the `.success` property of `env.DB.prepare().run()` operations. If an operation fails, it returns a generic, safe `500 Internal Server Error` message (`Database write failed`, `Database metadata write failed`) without leaking internal SQL query strings or database stack traces.

### 6. Authentication and External API Logging (Positive Finding)
- **File**: `functions/lib/auth.ts`
- **Finding**: The JWKS and Clerk Backend API verification steps use `try/catch`. When they fail, they use `console.error` to log the failure reason for debugging but safely return `null` to the caller, preventing the error from bubbling up or leaking to the client.

## Assumptions
- It is assumed that Cloudflare Pages Functions natively catches unhandled promise rejections returning a generic 500 error if they escape `_middleware.ts`.
- It is assumed that suppressing storage errors in `shared-script.js` and `App.tsx` is an intentional design choice to support privacy modes (like Safari Private Browsing) without interrupting the user experience, but they are noted in findings for completeness.
- The audit focused strictly on the 16 specified files; CSS, design tokens, external libraries, and migration SQL files were excluded from the analysis as requested.
