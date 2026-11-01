// Premium images are served from R2 behind the access check (GEMINI.md section 30), so the
// build moves them out of the Pages output into a staging folder that sync-media.ts uploads.
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

export const PREMIUM_MEDIA_DIR = ".premium-media";

/** Moves `<outputDir>/books/<slug>/images/` to `<stagingDir>/books/<slug>/images/` for every slug. */
export function stagePremiumMedia(opts: { outputDir: string; stagingDir: string; slugs: string[] }): { moved: string[] } {
  const { outputDir, stagingDir, slugs } = opts;
  // Recreated on every build: prune deletes every bucket key that is not staged, so a
  // leftover from an older build would keep an unused image alive.
  rmSync(stagingDir, { recursive: true, force: true });
  mkdirSync(join(stagingDir, "books"), { recursive: true });

  const moved: string[] = [];
  for (const slug of slugs) {
    const from = join(outputDir, "books", slug, "images");
    if (!existsSync(from)) continue;
    const to = join(stagingDir, "books", slug, "images");
    mkdirSync(dirname(to), { recursive: true });
    renameSync(from, to);
    moved.push(slug);
  }
  return { moved };
}
