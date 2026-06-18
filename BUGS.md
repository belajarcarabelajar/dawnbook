# Dawnbook Audit & Bug Fix Report

This document summarizes the architectural and security vulnerabilities discovered in the Dawnbook monorepo and the fixes applied to resolve them.

## 1. Bypassable Client-Side Gating

### Bug Detection
The content gating was strictly client-side. Unauthenticated users were prevented from reading gated chapters using an anti-FOUC (Flash of Unstyled Content) script injected into the `<head>`. This script relied on `sessionStorage` and CSS (`opacity: 0` and `visibility: hidden`). Because the actual content was sent over the wire in plain HTML, a user could bypass the paywall entirely by simply disabling JavaScript in their browser, using `curl`, or inspecting the page source. 
Simultaneously, `_middleware.ts` blindly bypassed authorization for all URLs evaluated by `isPublicPath()`, which was designed for SEO (all book pages return `true`) rather than security.

### Fix
Implemented a robust **Server-Side Gating** approach that maintains SEO integrity without compromising security:
1. **Target Identification**: Modified the build injection script (`scripts/inject-gating.ts`) to add a `.gated-chapter` CSS class to the `<main>` element of chapters that require authentication.
2. **Edge Interception**: Updated `functions/_middleware.ts` to inspect all HTML requests for book paths inside the `isPublicPath()` block.
3. **HTMLRewriter**: If the request is from a human visitor (determined by `User-Agent` bot detection) and is unauthenticated, the middleware uses Cloudflare's `HTMLRewriter` to target `.gated-chapter` elements. It replaces the secure content payload at the edge with an actionable "Terkunci" (Locked) call-to-action block, completely redacting the premium content before it reaches the browser.
4. **Clean up**: Removed the obsolete client-side opacity anti-FOUC hack from `scripts/inject-gating.ts` and `books/shared-script.js`.

## 2. Insecure View-Count Endpoint

### Bug Detection
The view-counting API endpoint (`/api/books/[slug]/view`) was fully public and lacked authentication. While the client-side `shared-script.js` used `sessionStorage` to limit increments to one per browser session, an attacker could trivially bypass this and bombard the API with direct POST requests (e.g., using `curl`), artificially inflating view statistics indefinitely.

### Fix
1. **Require Session**: Protected the view count endpoint by requiring a valid Clerk session via `verifyClerkSession`.
2. **Client-Side Trigger**: Updated `books/shared-script.js` to strictly delay and wrap the `/api/books/:slug/view` API call until `window.Clerk.user` confirms the user is authenticated. This protects data integrity by tying reading statistics purely to verified users.

## 3. Custom JWKS Parser / Clerk SDK Outdated Practices

### Bug Detection
The application relied on a manual implementation of JWKS key fetching, parsing, and cryptographic verification (`functions/lib/auth.ts`) which fetched keys directly from the `.well-known/jwks.json` endpoint and used the Web Crypto API. This was not only verbose and complex but inherently brittle as it did not safely cache keys efficiently across isolate lifecycles.

### Fix
1. **Migrated to `@clerk/backend`**: Fully replaced the custom 150-line JWKS fetching logic with `@clerk/backend`'s `verifyToken` API. 
2. **Edge-optimized Caching**: `verifyToken` natively handles aggressive in-memory caching of the JWKS keys securely across Cloudflare edge workers, accelerating authenticated request latency.

## 4. Gated Content Missing Semantic SEO Attributes

### Bug Detection
The previous structured JSON-LD schema (`application/ld+json`) incorrectly signaled that premium chapters were universally free (`isAccessibleForFree` was omitted/assumed true). Search engines crawling gated pages might index the premium content and later penalize the site if the content shown to users significantly differed from the content indexed for crawlers (cloaking).

### Fix
Injected `"isAccessibleForFree": "False"` and explicitly defined the `hasPart` WebPageElement mapped to the `.gated-chapter` CSS selector in the schema. This properly informs Googlebot that the page employs a paywall structure.
