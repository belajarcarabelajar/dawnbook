import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Loads environment variables from .env file into process.env if present.
 */
export async function loadEnv(): Promise<void> {
  try {
    const envPath = join(process.cwd(), ".env");
    const envContent = await readFile(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !match[1].startsWith("#")) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
  } catch {
    // skip if .env not present
  }
}
