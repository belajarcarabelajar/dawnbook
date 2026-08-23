/**
 * functions/api/stats.ts
 *
 * Cloudflare Pages Function — GET /api/stats
 *
 * Public, cacheable (5 min) aggregator that powers the /statistics.html page.
 * Most fields come from D1 (books, users). Total chapters and contributors
 * are baked at build time via scripts/builder/stats-aggregator.ts → built-stats.ts.
 *
 * No PII: donor names are never returned, only tier counts.
 */

import { Env } from "../lib/auth";
import { BUILT_TOTAL_CHAPTERS, BUILT_CONTRIBUTORS } from "../lib/built-stats";
import { jsonResponse, errorResponse } from "../lib/response";

interface SubjectRow {
  label: string | null;
  count: number;
}

interface RangeRow {
  first_release: string | null;
  last_release: string | null;
}

interface MonthlyRow {
  month: string; // "YYYY-MM"
  count: number;
}

interface TierRow {
  donation_badge: string;
  count: number;
}

function isoMonth(d: Date): string {
  // Returns "YYYY-MM" in UTC; created_at is stored ISO 8601 Z so UTC is the
  // canonical axis for grouping.
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

async function handleStats(env: Env): Promise<Response> {
  const db = env.DB;

  // Content section -------------------------------------------------------
  const totalBooksRow = await db
    .prepare(
      "SELECT COUNT(*) AS n FROM books WHERE status = ?1",
    )
    .bind("published")
    .first<{ n: number }>();
  const totalBooks = totalBooksRow?.n ?? 0;

  const subjectsResult = await db
    .prepare(
      `SELECT COALESCE(subject_label, '—') AS label, COUNT(*) AS count
         FROM books
         WHERE status = ?1
         GROUP BY subject_label
         ORDER BY count DESC, label ASC
         LIMIT 12`,
    )
    .bind("published")
    .all<SubjectRow>();

  const totalChapters = BUILT_TOTAL_CHAPTERS;
  const avgChaptersPerBook =
    totalBooks > 0 ? Math.round((totalChapters / totalBooks) * 10) / 10 : 0;

  // Engagement section ----------------------------------------------------
  const viewsRow = await db
    .prepare(
      "SELECT COALESCE(SUM(view_count), 0) AS v FROM books WHERE status = ?1",
    )
    .bind("published")
    .first<{ v: number }>();
  const totalViews = viewsRow?.v ?? 0;

  const rangeRow = await db
    .prepare(
      "SELECT MIN(created_at) AS first_release, MAX(created_at) AS last_release FROM books WHERE status = ?1",
    )
    .bind("published")
    .first<RangeRow>();

  // Monthly timeline: build the last 12 month buckets from D1 data so we can
  // include empty months as zeros rather than skipping them. D1's strftime is
  // available.
  const now = new Date();
  const twelveMonthsAgo = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
  );
  const monthsIso: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(
      Date.UTC(twelveMonthsAgo.getUTCFullYear(), twelveMonthsAgo.getUTCMonth() + i, 1),
    );
    monthsIso.push(isoMonth(d));
  }
  const cutoffIso = twelveMonthsAgo.toISOString();

  const monthlyResult = await db
    .prepare(
      `SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
         FROM books
         WHERE status = ?1 AND created_at >= ?2
         GROUP BY month
         ORDER BY month ASC`,
    )
    .bind("published", cutoffIso)
    .all<MonthlyRow>();

  const countsByMonth = new Map<string, number>();
  for (const row of monthlyResult.results ?? []) {
    countsByMonth.set(row.month, row.count);
  }
  const monthlyTimeline = monthsIso.map((m) => ({
    month: m,
    count: countsByMonth.get(m) ?? 0,
  }));
  const currentMonth = isoMonth(now);
  const publishedThisMonth =
    countsByMonth.get(currentMonth) ?? 0;

  // Donations section ----------------------------------------------------
  const tierResult = await db
    .prepare(
      `SELECT donation_badge, COUNT(*) AS count
         FROM users
         WHERE donation_badge IS NOT NULL
         GROUP BY donation_badge`,
    )
    .all<TierRow>();
  const tierCounts = new Map<string, number>();
  for (const row of tierResult.results ?? []) {
    tierCounts.set(row.donation_badge, row.count);
  }
  const gold = tierCounts.get("Gold") ?? 0;
  const silver = tierCounts.get("Silver") ?? 0;
  const bronze = tierCounts.get("Bronze") ?? 0;
  const totalBadgeHolders = gold + silver + bronze;

  // Contributors (build-time) -------------------------------------------
  // Ranked by number of published books authored, parsed from each
  // books/<slug>/book.toml at build time. See scripts/builder/stats-aggregator.ts.
  const contributors = {
    total: BUILT_CONTRIBUTORS.total,
    top: BUILT_CONTRIBUTORS.top.map((c) => ({
      name: c.name,
      books: c.books,
    })),
  };

  return jsonResponse(
    {
      generated_at: new Date().toISOString(),
      content: {
        total_books: totalBooks,
        total_chapters: totalChapters,
        avg_chapters_per_book: avgChaptersPerBook,
        by_subject: (subjectsResult.results ?? []).map((r) => ({
          label: r.label ?? "—",
          count: r.count,
        })),
      },
      engagement: {
        total_views: totalViews,
        published_this_month: publishedThisMonth,
        first_release: rangeRow?.first_release ?? null,
        last_release: rangeRow?.last_release ?? null,
        monthly_timeline: monthlyTimeline,
      },
      donations: {
        gold,
        silver,
        bronze,
        total_badge_holders: totalBadgeHolders,
      },
      contributors,
    },
    200,
    {
      // 5 min at the edge; browsers re-validate after that. Stats don't need
      // to be second-by-second fresh.
      "Cache-Control": "public, max-age=300",
    }
  );
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    return await handleStats(env);
  } catch (err) {
    console.error("API /api/stats error:", err);
    return errorResponse("Internal server error", 500);
  }
};
