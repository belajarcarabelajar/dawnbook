import { readFile } from "node:fs/promises";
import { basename } from "node:path";

export const DEFAULT_BUCKET = "dawnbook-media";
export const DEFAULT_PUBLIC_BASE = "https://media.dawnbook.belajarcarabelajar.com";
export const MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable";

export function loadConfig(env = process.env) {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID || env.CF_ACCOUNT_ID || "";
  const token =
    env.CLOUDFLARE_API_TOKEN || env.CF_API_TOKEN || "";
  if (!accountId || !token) {
    throw new Error(
      "Missing CLOUDFLARE_ACCOUNT_ID/CF_ACCOUNT_ID or CLOUDFLARE_API_TOKEN/CF_API_TOKEN (env or ~/cloudflare/.env)",
    );
  }
  return {
    accountId,
    token,
    bucket: env.R2_DAWNBOOK_BUCKET || DEFAULT_BUCKET,
    publicBase: env.R2_DAWNBOOK_PUBLIC_BASE || DEFAULT_PUBLIC_BASE,
  };
}

export function buildObjectUrl(publicBase, key) {
  return `${publicBase.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

export async function uploadToR2(localPath, key, contentType, config) {
  const buffer = await readFile(localPath);
  const url =
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}` +
    `/r2/buckets/${config.bucket}/objects/${key}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": contentType,
      "Cache-Control": MEDIA_CACHE_CONTROL,
    },
    body: buffer,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 upload failed ${res.status}: ${text.slice(0, 200)}`);
  }
  return buildObjectUrl(config.publicBase, key);
}

async function main() {
  const [, , localPath, key, contentType] = process.argv;
  if (!localPath || !key) {
    console.error(
      "Usage: bun scripts/upload-media-to-r2.mjs <local-path> <object-key> [content-type]",
    );
    process.exit(2);
  }
  const config = loadConfig();
  const publicUrl = await uploadToR2(
    localPath,
    key,
    contentType || "application/octet-stream",
    config,
  );
  console.log(`Uploaded ${basename(localPath)} -> ${publicUrl}`);
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
