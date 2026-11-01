import { describe, expect, test } from "bun:test";
import {
  SSO_MAX_AGE_S,
  assertSsoSecret,
  signSsoToken,
  verifySsoToken,
} from "../../../functions/lib/bcb-sso";
import fixture from "../../fixtures/sso/token.json";

// Tokens below were signed with openssl (HMAC-SHA256 over the same message
// shape), so each refusal comes from the rule under test, not a bad signature.
const UPPER_CASE_EMAIL_TOKEN =
  "UGVtYmVsaUBjb250b2guaWQ.1893456000.AAAAAAAAAAAAAAAAAAAAAA.F9VRGui0ZVoeBIE3Gw8f3ZLPDKKF7kvQGymjUBPU2o8";
const NONCE_21_TOKEN =
  "cGVtYmVsaUBjb250b2guaWQ.1893456000.AAAAAAAAAAAAAAAAAAAAA.dN36CtSx7qcSXZH-SWZKUckRO2FZ-f-i4xd2pQ1r_LE";

const NOW = fixture.exp - 60;
const parts = fixture.token.split(".");

function withPart(index: number, value: string): string {
  const copy = [...parts];
  copy[index] = value;
  return copy.join(".");
}

describe("functions/lib/bcb-sso.ts", () => {
  test("SSO_MAX_AGE_S is 120 seconds", () => {
    expect(SSO_MAX_AGE_S).toBe(120);
  });

  test("fixture token verifies one minute before expiry", async () => {
    const result = await verifySsoToken(fixture.secret, fixture.token, NOW);
    expect(result).toEqual({
      email: fixture.email,
      nonce: fixture.nonce,
      exp: fixture.exp,
    });
  });

  test("signSsoToken reproduces the openssl-computed fixture token", async () => {
    const token = await signSsoToken(
      fixture.secret,
      fixture.email,
      fixture.exp,
      fixture.nonce,
    );
    expect(token).toBe(fixture.token);
  });

  test("refuses a token checked with the wrong secret", async () => {
    const wrong = "rahasia-lain-yang-juga-panjangnya-cukup-0000";
    expect(await verifySsoToken(wrong, fixture.token, NOW)).toBeNull();
  });

  test("refuses a token whose email part was changed", async () => {
    const other = Buffer.from("lain@contoh.id").toString("base64url");
    expect(await verifySsoToken(fixture.secret, withPart(0, other), NOW)).toBeNull();
  });

  test("refuses a token whose exp was changed", async () => {
    const token = withPart(1, String(fixture.exp + 1));
    expect(await verifySsoToken(fixture.secret, token, NOW)).toBeNull();
  });

  test("refuses an expired token (nowSec equals exp)", async () => {
    expect(await verifySsoToken(fixture.secret, fixture.token, fixture.exp)).toBeNull();
  });

  test("refuses a token that expires more than SSO_MAX_AGE_S ahead", async () => {
    expect(
      await verifySsoToken(fixture.secret, fixture.token, fixture.exp - 121),
    ).toBeNull();
  });

  test("accepts a token that expires exactly SSO_MAX_AGE_S ahead", async () => {
    expect(
      await verifySsoToken(fixture.secret, fixture.token, fixture.exp - 120),
    ).not.toBeNull();
  });

  test("refuses a token with three parts", async () => {
    const token = parts.slice(0, 3).join(".");
    expect(await verifySsoToken(fixture.secret, token, NOW)).toBeNull();
  });

  test("refuses a token with bad base64url in the email part", async () => {
    const token = withPart(0, `${parts[0]}!`);
    expect(await verifySsoToken(fixture.secret, token, NOW)).toBeNull();
  });

  test("refuses a correctly signed token with a 21-character nonce", async () => {
    expect(await verifySsoToken(fixture.secret, NONCE_21_TOKEN, NOW)).toBeNull();
  });

  test("refuses a correctly signed token with an upper-case email", async () => {
    expect(
      await verifySsoToken(fixture.secret, UPPER_CASE_EMAIL_TOKEN, NOW),
    ).toBeNull();
  });

  test("assertSsoSecret throws SsoSecretError for undefined without echoing", () => {
    let caught: unknown;
    try {
      assertSsoSecret(undefined);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).name).toBe("SsoSecretError");
  });

  test("assertSsoSecret throws for 31 characters without echoing the value", () => {
    const short = "s".repeat(31);
    let caught: unknown;
    try {
      assertSsoSecret(short);
    } catch (err) {
      caught = err;
    }
    expect((caught as Error).name).toBe("SsoSecretError");
    expect((caught as Error).message).not.toContain(short);
  });

  test("assertSsoSecret returns a 32-character secret", () => {
    const ok = "k".repeat(32);
    expect(assertSsoSecret(ok)).toBe(ok);
  });
});
