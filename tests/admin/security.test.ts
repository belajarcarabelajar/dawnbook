import { expect, test, describe } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

describe("Admin Authorization", () => {
  test("assert that admin authorization uses roles and does NOT rely on hardcoded emails or IDs", () => {
    const appTsxPath = join(import.meta.dir, "../../apps/admin/src/App.tsx");
    if (!existsSync(appTsxPath)) return; // Skip if file is moved, but it shouldn't be
    const appTsx = readFileSync(appTsxPath, "utf-8");
    expect(appTsx).not.toContain("kurniawaniwan7906@gmail.com");
    expect(appTsx).not.toContain("user_3FGEVcEVho4UC4uCE6gs3TfyVwV");
    // D1-backed role check: AuthProvider exposes `isAdmin` derived from
    // the user's role in the D1 `users` table.
    expect(appTsx).toMatch(/isAdmin|role\s*===\s*['"]admin['"]/);
  });
});

describe("Google OAuth Credentials", () => {
  test("committed Google OAuth credentials are removed from .env.local and it is gitignored", () => {
    const envPath = join(import.meta.dir, "../../apps/admin/.env.local");
    const gitignorePath = join(import.meta.dir, "../../.gitignore");

    if (existsSync(envPath)) {
      // Check programmatically if the file is tracked in git
      let isTracked = false;
      try {
        const { execSync } = require("child_process");
        execSync(`git ls-files --error-unmatch apps/admin/.env.local`, { stdio: "ignore" });
        isTracked = true;
      } catch (e) {
        isTracked = false;
      }

      if (isTracked) {
        const content = readFileSync(envPath, "utf-8");
        expect(content).not.toContain("apps.googleusercontent.com");
        expect(content).not.toContain("GOCSPX-");
      }
    }

    if (existsSync(gitignorePath)) {
      const gitignore = readFileSync(gitignorePath, "utf-8");
      expect(gitignore).toContain(".env");
    }
  });
});

describe("Dead Code Elimination", () => {
  test("functions/lib/interstitial.ts has been removed", () => {
    const filePath = join(import.meta.dir, "../../functions/lib/interstitial.ts");
    expect(existsSync(filePath)).toBe(false);
  });

  test("admin app no longer imports @clerk/react", () => {
    const appTsx = readFileSync(join(import.meta.dir, "../../apps/admin/src/App.tsx"), "utf-8");
    const mainTsx = readFileSync(join(import.meta.dir, "../../apps/admin/src/main.tsx"), "utf-8");
    expect(appTsx).not.toContain("@clerk/react");
    expect(mainTsx).not.toContain("@clerk/react");
  });

  test("functions/lib/auth.ts no longer references @clerk/backend", () => {
    const authTs = readFileSync(join(import.meta.dir, "../../functions/lib/auth.ts"), "utf-8");
    expect(authTs).not.toContain("@clerk/backend");
    expect(authTs).not.toContain("verifyClerkSession");
  });
});
