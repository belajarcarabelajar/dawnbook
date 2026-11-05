/**
 * functions/lib/cookies.ts
 *
 * Names of the auth cookies, shared by every handler that reads or sets them.
 */

// The __Host- prefix makes the browser refuse a cookie set by another subdomain or without Secure/Path=/.
export const SESSION_COOKIE = "__Host-session_id";
export const OAUTH_STATE_COOKIE = "__Host-oauth_state";
export const OAUTH_REDIRECT_COOKIE = "__Host-oauth_redirect";
