#!/usr/bin/env bun
/**
 * set-user-badge.ts
 *
 * CLI helper to manage user donation badges via Clerk SDK.
 *
 * Usage:
 *   bun run scripts/set-user-badge.ts <email-or-userId> <badge-tier>
 *
 * Examples:
 *   bun run scripts/set-user-badge.ts user@example.com Gold
 *   bun run scripts/set-user-badge.ts user_abc123 Silver
 *   bun run scripts/set-user-badge.ts user@example.com remove
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClerkClient } from "@clerk/backend";

type BadgeTier = "Gold" | "Silver" | "Bronze";
const VALID_TIERS: ReadonlySet<string> = new Set(["Gold", "Silver", "Bronze", "remove"]);

async function loadClerkSecret(): Promise<string> {
  const envPath = join(import.meta.dir, "..", "apps", "admin", ".env.local");
  let content: string;

  try {
    content = await readFile(envPath, "utf-8");
  } catch {
    console.error(`❌ Failed to read env file at: ${envPath}`);
    process.exit(1);
  }

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").trim().replace(/^["']|["']$/g, "");

    if (key === "CLERK_SECRET_KEY" || key === "VITE_CLERK_SECRET_KEY") {
      if (value) return value;
    }
  }

  console.error("❌ CLERK_SECRET_KEY or VITE_CLERK_SECRET_KEY not found in apps/admin/.env.local");
  process.exit(1);
}

function printUsage(): never {
  console.log(`
Usage: bun run scripts/set-user-badge.ts <email-or-userId> <badge-tier>

  email-or-userId   User email address or Clerk user ID (starts with "user_")
  badge-tier        One of: Gold, Silver, Bronze, remove

Examples:
  bun run scripts/set-user-badge.ts user@example.com Gold
  bun run scripts/set-user-badge.ts user_abc123 Silver
  bun run scripts/set-user-badge.ts user@example.com remove
`);
  process.exit(1);
}

async function resolveUser(
  clerkClient: ReturnType<typeof createClerkClient>,
  identifier: string
) {
  // User ID path
  if (identifier.startsWith("user_")) {
    try {
      const user = await clerkClient.users.getUser(identifier);
      return user;
    } catch (err) {
      console.error(`❌ User not found for ID: ${identifier}`);
      throw err;
    }
  }

  // Email path
  const { data: users } = await clerkClient.users.getUserList({
    emailAddress: [identifier],
    limit: 1,
  });

  if (!users.length) {
    console.error(`❌ No user found with email: ${identifier}`);
    process.exit(1);
  }

  return users[0];
}

async function main() {
  const [identifier, tier] = process.argv.slice(2);

  if (!identifier || !tier) {
    console.error("❌ Missing required arguments.");
    printUsage();
  }

  if (!VALID_TIERS.has(tier)) {
    console.error(`❌ Invalid badge tier: "${tier}". Must be one of: Gold, Silver, Bronze, remove`);
    process.exit(1);
  }

  const secretKey = await loadClerkSecret();
  const clerkClient = createClerkClient({ secretKey });

  console.log(`🔍 Looking up user: ${identifier}...`);
  const user = await resolveUser(clerkClient, identifier);

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.emailAddresses?.[0]?.emailAddress ||
    user.id;

  console.log(`✅ Found user: ${displayName} (${user.id})`);

  // Build updated publicMetadata
  const existingMetadata = (user.publicMetadata ?? {}) as Record<string, unknown>;

  if (tier === "remove") {
    const { donation_badge: _, ...rest } = existingMetadata;
    await clerkClient.users.updateUser(user.id, {
      publicMetadata: rest,
    });
    console.log(`🗑️  Removed donation badge from ${displayName}`);
  } else {
    await clerkClient.users.updateUser(user.id, {
      publicMetadata: {
        ...existingMetadata,
        donation_badge: tier as BadgeTier,
      },
    });
    console.log(`🏅 Set donation badge to "${tier}" for ${displayName}`);
  }
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
