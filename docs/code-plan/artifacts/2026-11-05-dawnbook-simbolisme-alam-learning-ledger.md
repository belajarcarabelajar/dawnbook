# Learning ledger: Simbolisme Alam dalam Sastra

Plan: docs/code-plan/plans/2026-11-05-dawnbook-simbolisme-alam.md (task S1)
Date: 2026-11-05

Operational mistakes and near misses of this session, each with the evidence, then the candidate rule and its gate result (Minimum-Signal: it cost a fix round or a gate failure; 30-Day Horizon: it will recur in the next new-book or rewrite session).

| # | What happened | Evidence | Candidate rule | Gates | Verdict |
|---|---|---|---|---|---|
| L1 | 7 of 13 parallel chapter writers named their hypothetical character "Laras", and three of them gave her the same job-loss scene, because the shared contract only said "a new character name" | parent read in V1; 6 renames and 2 scene changes | WHEN parallel writers may invent example characters or scenes, DO assign each chapter its own name and situation in the dispatch table, NOT "use a new name" (independent writers converge on the same default, as section 21 already observed for closers) | cost a V1 edit pass; recurs in every multi-writer book | KEEP |
| L2 | The full `bun run build` in the session worktree on the external NTFS disk timed out twice (600 s, then 1800 s, exit 124) while another session's `bun install` and `git status` kept the disk 100% busy; the same build on an NVMe scratch worktree took 59 s | build3.log `build exit=124 seconds=1800`; build-nvme.log `build exit=0 seconds=59`; /proc/diskstats busy 5003 ms per 5 s | WHEN the full dawnbook build must run for a worktree on /mnt/belajarcarabelajar, DO run it in a detached worktree under ~/.cache/tmp at the same files (literal path, `git worktree add --detach`), compare built-stats.ts with cmp, then remove it, NOT retry with longer timeouts on the HDD | cost about 45 minutes; recurs whenever wt-new places a dawnbook worktree on the HDD | KEEP |
| L3 | A rename inside a chapter opener pushed the first sentence past 155 characters; the structure gate caught it | `check-book-structure` exit 1, "opener's first sentence would be truncated" | Re-run the structure checker after any edit to a first sentence | gate caught it in seconds; already covered by running gates after edits | DROP (covered) |
| L4 | `git worktree add` with the path in a shell variable was refused by worktree-guard | hook message "Target .../$D ada di NVMe" | Pass worktree paths as literals to hook-guarded commands | one retry; the hook message names the fix | DROP (hook explains itself) |
| L5 | Two fixers ran `git diff --no-index` to make word diffs despite "never run git" | fixer reports | Give fixers a non-git diff command in the contract (`diff -U0` or a sentence diff script) | read-only, no harm | DROP (no damage) |
| L6 | Reviewers flagged 25 P2, almost all a reading stated as fact or an unsourced generalisation; writers had a hedge rule in the contract | review report | Already covered by new-book-authoring-traps items 2 and 5 (hedges drop in recaps and generalisations creep in) | known pattern, handled by the review round | DROP (existing memory) |

KEEP rules L1 and L2 are written to project memory (new-book-authoring-traps items 10 and 11).
