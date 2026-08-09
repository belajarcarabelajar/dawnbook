import { expect, test, describe } from "bun:test";

import { onRequest } from "../../../functions/api/stats";
import {
  createMockEnv,
  mockRequest,
  setQueryHandler,
} from "../../helpers/mocks";

describe("API: /api/stats", () => {
  test("GET returns 200 with all four sections", async () => {
    const env = createMockEnv();
    // Default mock returns empty arrays; set up reasonable shapes so the
    // handler does not produce undefined fields.
    setQueryHandler(env, "SELECT", (sql) => {
      const upper = sql.trimStart().toUpperCase();
      if (upper.startsWith("SELECT COUNT(*) AS N FROM BOOKS")) {
        return [{ n: 7 }];
      }
      if (upper.startsWith("SELECT COALESCE(SUM(VIEW_COUNT)")) {
        return [{ v: 1234 }];
      }
      if (upper.includes("SUBJECT_LABEL")) {
        return [
          { label: "Psikologi", count: 4 },
          { label: "Sastra", count: 2 },
          { label: "Manajemen", count: 1 },
        ];
      }
      if (upper.startsWith("SELECT STRFTIME('%Y-%M'")) {
        return [
          { month: "2025-09", count: 2 },
          { month: "2026-04", count: 1 },
        ];
      }
      if (upper.startsWith("SELECT MIN(CREATED_AT)")) {
        return [{ first_release: "2025-01-15T00:00:00.000Z", last_release: "2026-06-01T00:00:00.000Z" }];
      }
      if (upper.startsWith("SELECT DONATION_BADGE")) {
        return [
          { donation_badge: "Gold", count: 1 },
          { donation_badge: "Silver", count: 2 },
          { donation_badge: "Bronze", count: 3 },
        ];
      }
      return [];
    });

    const req = mockRequest("https://example.com/api/stats", { method: "GET" });
    const res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=300");

    const data = await res.json();
    expect(data).toHaveProperty("generated_at");
    expect(data.content.total_books).toBe(7);
    // 572 from built-stats.ts (recomputed at build time)
    expect(data.content.total_chapters).toBe(572);
    expect(data.content.avg_chapters_per_book).toBeCloseTo(572 / 7, 1);
    expect(data.content.by_subject).toEqual([
      { label: "Psikologi", count: 4 },
      { label: "Sastra", count: 2 },
      { label: "Manajemen", count: 1 },
    ]);

    expect(data.engagement.total_views).toBe(1234);
    expect(data.engagement.first_release).toBe("2025-01-15T00:00:00.000Z");
    expect(data.engagement.last_release).toBe("2026-06-01T00:00:00.000Z");
    expect(data.engagement.monthly_timeline).toHaveLength(12);

    expect(data.donations).toEqual({
      gold: 1,
      silver: 2,
      bronze: 3,
      total_badge_holders: 6,
    });

    expect(data.contributors.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(data.contributors.top)).toBe(true);
  });

  test("POST returns 405", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/stats", { method: "POST" });
    const res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(405);
    const data = await res.json();
    expect(data).toHaveProperty("error");
  });
});
