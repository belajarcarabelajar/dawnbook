/**
 * functions/lib/turnstile.ts
 *
 * Cloudflare Turnstile token verification helper.
 * Validates cf-turnstile-response tokens against Cloudflare's siteverify API.
 */

export interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

/**
 * Validates a Turnstile response token with Cloudflare siteverify endpoint.
 *
 * @param token - The response token submitted by the client widget (cf-turnstile-response)
 * @param secretKey - The Cloudflare Turnstile secret key (TURNSTILE_SECRET_KEY)
 * @param remoteIp - Optional client IP address (from CF-Connecting-IP header)
 * @returns boolean indicating whether the challenge token is valid
 */
export async function verifyTurnstileToken(
  token: string,
  secretKey: string,
  remoteIp?: string | null
): Promise<boolean> {
  if (!token || !secretKey) {
    return false;
  }

  const body = new URLSearchParams();
  body.append("secret", secretKey);
  body.append("response", token);
  if (remoteIp) {
    body.append("remoteip", remoteIp);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    if (!response.ok) {
      console.error(
        `Turnstile siteverify HTTP error: ${response.status} ${response.statusText}`
      );
      return false;
    }

    const outcome: TurnstileVerifyResponse = await response.json();
    if (!outcome.success) {
      console.warn("Turnstile validation failed:", outcome["error-codes"]);
    }
    return outcome.success === true;
  } catch (err) {
    console.error("Error during Turnstile verification fetch:", err);
    return false;
  }
}
