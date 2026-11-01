/**
 * functions/lib/sso-user.ts
 *
 * Resolves the Dawnbook user for a store hand-off (belajarcarabelajar.com).
 * The token carries only an email, already lower-cased and trimmed by
 * verifySsoToken, so lookup is by exact email.
 */

import type { D1Database } from "@cloudflare/workers-types";
import { generateUserId, getUserByEmail, type UserRow } from "./db";

// Placeholder sub for a store user who has not signed in with Google yet; the
// Google callback replaces it through linkGoogleSub on the first Google login.
export const BCB_SUB_PREFIX = "bcb:";

export async function findOrCreateBcbUser(
  db: D1Database,
  email: string,
): Promise<UserRow> {
  const existing = await getUserByEmail(db, email);
  if (existing) return existing;

  // DO NOTHING covers both UNIQUE columns, so a concurrent hand-off or Google
  // login that inserted the same email first is picked up by the re-read.
  await db
    .prepare(
      `INSERT INTO users (id, google_sub, email, name, picture, role)
       VALUES (?1, ?2, ?3, NULL, NULL, 'reader')
       ON CONFLICT DO NOTHING`,
    )
    .bind(generateUserId(), `${BCB_SUB_PREFIX}${email}`, email)
    .run();

  const row = await getUserByEmail(db, email);
  if (!row) throw new Error("findOrCreateBcbUser: row not found after insert");
  return row;
}
