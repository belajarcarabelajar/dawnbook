// Store hand-off token from belajarcarabelajar.com. The bcb repo signs with the
// same format and must produce byte-identical tokens from
// tests/fixtures/sso/token.json, so the format below is a cross-repo contract:
//   <b64u(email)>.<exp>.<nonce>.<b64u(HMAC-SHA256(secret, "dawnbook-sso|<email>|<exp>|<nonce>"))>

export const SSO_MAX_AGE_S = 120;

const MIN_SECRET_LENGTH = 32;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NONCE_RE = /^[A-Za-z0-9_-]{22}$/;
const B64U_RE = /^[A-Za-z0-9_-]*$/;
const EXP_RE = /^[1-9][0-9]*$/;

export interface SsoClaims {
  email: string;
  nonce: string;
  exp: number;
}

export function assertSsoSecret(secret: string | undefined): string {
  if (typeof secret !== "string" || secret.length < MIN_SECRET_LENGTH) {
    const err = new Error(
      `SSO secret is missing or shorter than ${MIN_SECRET_LENGTH} characters`,
    );
    err.name = "SsoSecretError";
    throw err;
  }
  return secret;
}

function bytesToB64u(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Returns null for anything that is not canonical unpadded base64url, so two
// spellings of the same bytes can never both verify.
function b64uToBytes(text: string): Uint8Array<ArrayBuffer> | null {
  if (!B64U_RE.test(text) || text.length % 4 === 1) return null;
  let bin: string;
  try {
    bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return null;
  }
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if (bytesToB64u(bytes) !== text) return null;
  return bytes;
}

function message(email: string, exp: number, nonce: string): Uint8Array<ArrayBuffer> {
  // The copy pins the buffer type to ArrayBuffer, which workers-types requires for BufferSource.
  return new Uint8Array(new TextEncoder().encode(`dawnbook-sso|${email}|${exp}|${nonce}`));
}

function hmacKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

export async function signSsoToken(
  secret: string,
  email: string,
  exp: number,
  nonce: string,
): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const key = await hmacKey(secret, "sign");
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, message(normalized, exp, nonce)),
  );
  const emailPart = bytesToB64u(new TextEncoder().encode(normalized));
  return `${emailPart}.${exp}.${nonce}.${bytesToB64u(sig)}`;
}

export async function verifySsoToken(
  secret: string,
  token: string,
  nowSec: number,
): Promise<SsoClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [emailPart, expPart, nonce, sigPart] = parts;

  const emailBytes = b64uToBytes(emailPart);
  if (!emailBytes) return null;
  let email: string;
  try {
    email = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(emailBytes);
  } catch {
    return null;
  }
  if (!EMAIL_RE.test(email) || email !== email.trim().toLowerCase()) return null;

  if (!EXP_RE.test(expPart)) return null;
  const exp = Number(expPart);
  if (!Number.isSafeInteger(exp)) return null;
  if (exp <= nowSec || exp > nowSec + SSO_MAX_AGE_S) return null;

  if (!NONCE_RE.test(nonce)) return null;

  const sig = b64uToBytes(sigPart);
  if (!sig) return null;

  const key = await hmacKey(secret, "verify");
  // crypto.subtle.verify compares in constant time.
  const ok = await crypto.subtle.verify("HMAC", key, sig, message(email, exp, nonce));
  return ok ? { email, nonce, exp } : null;
}
