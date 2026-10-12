# Research notes: Memahami Algoritma X untuk Pembaca

Compiled 2026-10-12 for plan `2026-10-12-dawnbook-mengatur-bacaan-x`. Every fact below was read on 2026-10-12 from the cited source (TinyFish fetch, GitHub API, or the local repository copy). Chapter authors use only these facts plus the source document lines named in their dispatch. Do not add numbers, dates, or names that are not here.

## 0. Framing rules for every chapter

- Two repositories exist. Name them consistently:
  - **Repositori lama**: `twitter/the-algorithm`, first published 31 March 2023, still online and not archived, last updated 3 September 2025 ("update for-you recommendations code"). The source copy in the Notion export is this September 2025 snapshot (7,667 files, all dated 2025-09-04). Write "repositori twitter/the-algorithm (pembaruan September 2025)" or "implementasi lama", never "kode 2023" for weights, RerankerUtil, Phoenix, or FeedbackFatigue details.
  - **Repositori baru**: `xai-org/x-algorithm`, created 19 January 2026, announced by @Engineering on 20 January 2026, big update 15 May 2026, updated nearly daily from 13 August to 9 October 2026. Rust and Python (plus Scala and Java since August), Apache-2.0.
- Neither repository is a full copy of production: configs, trained models, user data, and live experiments are outside what anyone can read. The new repo says experiments on roughly 10% or more of traffic are meant to show up in the repo, and cron scripts copy production default values into the code.
- Never present weights as "points per action". The new README warns that weights multiply the predicted probability of an action, not raw counts, so "1 report cancels 468 likes" is a misreading.
- Product menus differ per device, region, app version. Say so when giving menu paths.

## 0b. Math rendering rule measured 2026-10-12

- mdBook v0.5.4 renders `$$` blocks inside `<div>` as Markdown paragraphs, so a backslash before ASCII punctuation is removed: `\,` turns into a comma, `\\` into a single backslash (so `\begin{cases}` rows collapse). Never write `\,` `\;` `\!` `\\` `\{` `\}` `\|` inside math. Percent stays `\text{\%}` (renders as `\text{%}`, which MathJax shows as a literal percent). Use `\quad` for spacing. No space directly before `_`, no `*` inside math.

## 1. Sources (cite by ID in chapters; Referensi lists them all)

| ID | Source | URL | Date of source |
|---|---|---|---|
| S1 | twitter/the-algorithm repo root | https://github.com/twitter/the-algorithm | 2023-03-31, last commit 2025-09-03 |
| S2 | Home Mixer README | https://github.com/twitter/the-algorithm/blob/main/home-mixer/README.md | in repo |
| S3 | Retrieval signals table | https://github.com/twitter/the-algorithm/blob/main/RETREIVAL_SIGNALS.md | 2023-04-28 |
| S4 | User Signal Service README | https://github.com/twitter/the-algorithm/blob/main/user-signal-service/README.md | in repo |
| S5 | Unified User Actions README | https://github.com/twitter/the-algorithm/blob/main/unified_user_actions/README.md | in repo |
| S6 | SimClusters README | https://github.com/twitter/the-algorithm/blob/main/src/scala/com/twitter/simclusters_v2/README.md | in repo |
| S7 | Real Graph (interaction_graph) README | https://github.com/twitter/the-algorithm/blob/main/src/scala/com/twitter/interaction_graph/README.md | in repo |
| S8 | PredictedScoreFeature.scala | https://github.com/twitter/the-algorithm/blob/main/home-mixer/server/src/main/scala/com/twitter/home_mixer/model/PredictedScoreFeature.scala | 2025-09 snapshot |
| S9 | RerankerUtil.scala | https://github.com/twitter/the-algorithm/blob/main/home-mixer/server/src/main/scala/com/twitter/home_mixer/util/RerankerUtil.scala | 2025-09 snapshot |
| S10 | HomeGlobalParams.scala | https://github.com/twitter/the-algorithm/blob/main/home-mixer/server/src/main/scala/com/twitter/home_mixer/param/HomeGlobalParams.scala | 2025-09 snapshot |
| S11 | FeedbackFatigueScorer.scala | https://github.com/twitter/the-algorithm/blob/main/home-mixer/server/src/main/scala/com/twitter/home_mixer/functional_component/scorer/FeedbackFatigueScorer.scala | 2025-09 snapshot |
| S12 | Twitter engineering blog "Twitter's Recommendation Algorithm" (archived; live URL now 404) | https://web.archive.org/web/20260310113313/https://blog.x.com/engineering/en_us/topics/open-source/2023/twitter-recommendation-algorithm | 2023-03-31 |
| S13 | xai-org/x-algorithm repo (README) | https://github.com/xai-org/x-algorithm | live README, sections to 2026-09-18 |
| S14 | Ranking weights param.rs | https://github.com/xai-org/x-algorithm/blob/main/home-mixer/params/param.rs | synced 2026-10-08 |
| S15 | @Engineering announcement | https://x.com/Engineering/status/2013471689087086804 | 2026-01-20 |
| S16 | Help: For You and Following | https://help.x.com/en/using-x/x-timeline | n.d. |
| S17 | Help: Our approach to recommendations | https://help.x.com/en/rules-and-policies/recommendations | n.d. |
| S18 | Help: Lists | https://help.x.com/en/using-x/x-lists | n.d. |
| S19 | Help: Mute accounts | https://help.x.com/en/using-x/x-mute | n.d. |
| S20 | Help: Advanced muting options | https://help.x.com/en/using-x/advanced-x-mute-options | n.d. |
| S21 | Help: Topics | https://help.x.com/en/using-x/follow-and-unfollow-topics | n.d. |
| S22 | Help: Explore recommendations | https://help.x.com/en/resources/recommender-systems/explore-recommendations | n.d. |
| S23 | Help: Trends recommendations | https://help.x.com/en/resources/recommender-systems/trends-recommendations | n.d. |
| S24 | Help: Videos and autoplay | https://help.x.com/en/using-x/x-videos | n.d. |
| S25 | Help: Advanced search | https://help.x.com/en/using-x/x-advanced-search | n.d. |
| S26 | Help: Top search results FAQ (Latest tab) | https://help.x.com/en/using-x/top-search-results-faqs | n.d. |
| S27 | Phoenix README (new repo) | https://github.com/xai-org/x-algorithm/blob/main/phoenix/README.md | n.d. |

## 2. Facts by chapter

### Ch01 Tentukan apa yang ingin kamu baca (source lines 1-55)
- Content is the source's own guidance (needs table, example goal, separate sessions or Lists, personal limits are not algorithm requirements). No external facts needed beyond the framing rules.
- List separation helps choose reading but does not isolate all account signals (activity anywhere on X can still be recorded).

### Ch02 Jalur baca selain For You (source lines 57-73 and 393-410)
- Help (S16): Home has For You and Following tabs; X reopens the tab you used last. Following shows posts only from accounts you follow. The Help page does NOT say chronological and offers no sort option.
- Old implementation (S2): Home Mixer has three products: For You (in-network plus out-of-network), Following (reverse chronological posts from people you follow), Lists (reverse chronological posts from List members). Ads can appear in all three. Who-to-follow appears in For You and Following, not Lists. So "chronological" must be attributed to the old Home Mixer README, not to X Help today.
- New repo (S13): covers only For You; it does not describe Following or Lists.
- Lists (S18): new Lists are public by default; a Private toggle limits a List to you; pinned Lists appear next to the For You and Following tabs. List names max 25 characters and cannot start with a number.
- Search (S25, S26): advanced search filters by words (all, exact phrase, any, exclude, hashtag, language), accounts, places, dates; needs a logged-in session on x.com. Search result tabs include Top and Latest (S26).
- Explore (S22): For You tab in Explore recommends Trends, Events, Topics, Videos (personalized). Trending tab is tied to a location and described as not personalized for every account.
- Trends (S23): the Trends you see depend on Topics you follow, recent engagement, interests shared with groups of similar users, and location. Feedback: "not interested" affects only your own Trends; "harmful or spammy" is a report that affects Trends across X. In the EU, the What's happening box is not personalized.

### Ch03 Perjalanan sebuah post menuju For You (source lines 75-113) plus the 2026 section
Old implementation (S2, S12):
- Stages: candidate sourcing, feature hydration (Home Mixer README mentions about 6,000 features), scoring with a model, filters and heuristics, mixing with ads, who-to-follow, prompts. Some filters run before scoring; there are backup and conditional paths (for example a backup reverse-chron pipeline if scoring fails).
- Candidate sources named in the Home Mixer README (S2): Earlybird (search index, in-network), UTEG (User Tweet Entity Graph), Cr Mixer, FRS (Follow Recommendations Service). In S2, Tweet Mixer appears only as a pipeline name; the root README (next bullet) is the source that describes tweet-mixer.
- Root README (S1, https://github.com/twitter/the-algorithm, table of components): search-index (Earlybird) finds and ranks in-network posts, and "~50% of posts come from this candidate source"; tweet-mixer is the coordination layer for fetching out-of-network tweet candidates from underlying compute services; user-tweet-entity-graph (UTEG) maintains an in-memory user-to-post interaction graph and finds candidates by traversing it, built on the GraphJet framework; follow-recommendation-service (FRS) recommends accounts to follow and posts from those accounts. The restriction in the previous bullet applies to the Home Mixer README only; Tweet Mixer may be named when attributed to the root README.
- Heuristics: author diversity, content balance, feedback fatigue, dedup and previously seen, visibility filtering (S2). Conversation modules belong to serving features.
- Feed is not a sorted list of top scores (diversity adjustments, seen content, feedback, visibility filtering, ads).

New repo (S13, S15, S27, verified by parent 2026-10-12):
- Announced 20 January 2026 by @Engineering as powered by the same transformer architecture as xAI's Grok model (S15).
- Home Mixer (Rust) orchestrates. Pipeline: query hydration (your recent engagement sequence, follow list, blocks and mutes, muted keywords, seen and served posts, followed topics), candidate sources in parallel (in-network from Thunder, an in-memory store of recent posts from accounts you follow; out-of-network from Phoenix retrieval, SimClusters, and popular posts), candidate hydration, pre-scoring filters, scoring (PhoenixScorer predicts actions, RankingScorer combines with weights and adjustments, VMRanker reorders for diversity), top-K selection, post-selection visibility filtering and conversation dedup. A separate blending step inserts ads, who-to-follow, and prompts.
- Pre-scoring filters include duplicates, posts older than 48 hours, your own posts, blocked and muted accounts, muted keywords, posts already seen or served, subscriber-only posts you cannot access (S13).
- Phoenix ranking reads roughly 1,000 positions of your recent engagement history (S27; say "sekitar seribu aktivitas terbaru").
- Update 15 May 2026 added among others a small pre-trained Phoenix model, content classifiers (spam, post category, policy), an ads blending module, more user context (followed topics, mutual follows, served history). 13 August 2026 added weights, visibility filtering, and SimClusters as an additional out-of-network source. 18 September 2026: the "Under the Hood" transparency tool also shows if posts were withheld in a country for legal reasons.
- The old component names Earlybird and UTEG do not appear in the new README.
- What still holds: For You mixes followed and recommended posts; the overall flow (gather, filter, score, visibility filter, mix) is the same; mute, block, muted keywords, and not interested remain the reader's main controls.

### Ch04 Sinyal yang terkirim saat kamu membaca (source lines 115-159)
- USS (S4): provides explicit signals (README examples: favorites, retweets, replies) and implicit signals (tweet clicks, video views, profile visits) for candidate retrieval and ranking features. Follow exists as a signal in the code (signal.thrift AccountFollow), not as a README example.
- UUA (S5): a centralized real-time stream (Kafka) of user actions; bookmark is recorded as an action.
- Retrieval signals table (S3), 18 rows, columns USS, SimClusters, TwHin, UTEG, FRS, Light Ranking:
  - Like (favorite): used by all six.
  - Follow: all except Light Ranking.
  - Reply, Retweet, Quote: all except SimClusters.
  - Unlike (unfavorite): USS and SimClusters.
  - Share: USS and FRS.
  - Bookmark: USS only.
  - Unfollow: USS only.
  - Tweet click: USS, FRS, and Light Ranking as a label.
  - Video watch: USS, SimClusters, Light Ranking as a label.
  - Mute and Block: USS and FRS.
  - Don't like (not interested) and Report: USS only.
  - There is NO profile-visit row in this table; profile visits come from the USS README and Real Graph (S7).
- Predicted outputs in the old model file (S8, 15 features): favorite, reply, retweet, reply engaged by author, two "good click" variants, good profile click, video quality view (two variants), bookmark, share, dwell, video quality watch, video watch time, negative feedback. Report is not in this main list.
- Recorded vs used as input vs predicted are different roles; recorded does not mean a major ranking factor.
- New repo code comment (S14): for an action to count in recommendations it must happen on a post served in the Home timeline; directly navigating to a post has no ranking impact.
- Bookmark: it is a USS signal and a predicted output (S3, S8), so it is not signal-free. Saving a link outside X avoids the bookmark action but not the click already made.

### Ch05 Cara sistem menebak minatmu (source lines 161-212)
- SimClusters (S6): KnownFor matrix V (producers to communities, about 20 million producers, about 145 thousand communities); InterestedIn U = A V where A is the follow graph. Cosine similarity builds the producer similarity graph; community detection itself uses Metropolis-Hastings sampling. A post's embedding starts empty and each user who likes it adds their InterestedIn vector.
- Formula to use: `U = A V` and cosine similarity `\cos(a,b)=\frac{a\cdot b}{\lVert a\rVert\,\lVert b\rVert}` (both vectors non-zero).
- Real Graph (S7): a gradient-boosted classifier predicting whether one user will interact with another; inputs include public engagements (favorites, retweets, follows) and private ones (profile views, tweet clicks, address book); interaction history is rolled up as a decayed sum (older activity weighs less, it does not vanish on a fixed date).
- New repo (S13, S27): Phoenix retrieval is a two-tower embedding search that represents you by what you interacted with (no per-user ID embedding); SimClusters is still used as an extra out-of-network source since August 2026.
- You cannot type your own interest vector; influence comes through sources, activity, and product controls.

### Ch06 Skor rekomendasi bukan ukuran manfaat (source lines 214-252)
Old implementation (S8, S9, S10):
- RerankerUtil combines predictions with weights. Positive weights: score times weight. Negative heads: either plain multiplication or a threshold rule (relative to that head's maximum across candidates, or a fixed constant); below the threshold a negative prediction adds nothing. Negative totals are rescaled; a small constant 0.001 is added on some paths.
- About 30 weight params in HomeGlobalParams default to 0.0 (bounds plus or minus 10,000) and are overridden through request config and an optimizer that assigns weight buckets per user. Defaults of 0.0 are not the live influence of any action.
- HeuristicScorer multiplies around 15 rescoring factors (out-of-network, replies, author diversity, feedback fatigue, and others). Phoenix exists as an alternative scorer path in this 2025 snapshot.
- Simplified positive part: `S_{+}=\sum_{i:w_i\geq 0} w_i p_i` (not a reproduction of production).
New repo (S13, S14, verified by parent):
- Final Score = sum over actions of weight times predicted probability; positive actions positive weights, negative actions negative weights. Then author diversity (decaying multiplier to a floor), out-of-network discount (factor below 1, also on replies and reposts from accounts you follow), new-author boost, then VMRanker diversity.
- Current defaults (param.rs, last sync 2026-10-08T16:00:35Z): like 0.5, reply 5, repost 1, quote 5, share 2, share via DM 5, share via copy link 20, follow author 4, click 0.3, dwell 0.05, profile click 0; not interested -47.52, block author -31.2, mute author -58.8, report -234, not dwelled -0.02. A reply on an original post from someone you follow who follows you back gets a +15 boost to the reply weight.
- The code comment explains: weights mix how much an action is valued with how rare it is; a report's baseline probability is more than 1000 times lower than a like, so its weight is larger for the prediction to matter at all. Weights apply to predicted probabilities, not counts.
- Values are synced from production config and can change; treat them as a snapshot dated 8 October 2026.

### Ch07 Not interested, mute, dan unfollow (source lines 254-311)
- Help (S17): menu offers "Not interested in this post" and "Not interested in this Topic"; X then recommends less of that content. No single signal has a statically assigned greater weight.
- Help (S19): muting removes an account's posts without unfollowing or blocking; the muted account is not notified. If you follow the muted account, its replies and mentions still appear in Notifications and its replies show when you open a conversation. Direct messages are unaffected.
- Help (S20): muted words apply to Home timeline and or Notifications (toggle when adding), also hide posts in replies and push, SMS, email notifications; durations Forever (default), 24 hours, 7 days, 30 days. Exception: mobile notifications you turned on for posts from an account you follow. "Mute this conversation" stops notifications from that conversation but the posts can still appear in your timeline.
- S17 also says muting only applies to notifications and Home timeline, so do not promise muted words disappear everywhere (for example search).
- Old implementation (S11): FeedbackFatigueScorer counts only SeeFewer feedback younger than 140 days. Multiplier = 0.2 at day 0 rising in 4 increments of 0.2, each 35 days: 0,2 / 0,4 / 0,6 / 0,8 / 1,0 at days 0 / 35 / 70 / 105 / 140. Code formula: (days since feedback / 35) times 0.2 plus 0.2. Use the linear summary `m(t)=0{,}2+0{,}8\,\frac{t}{140}` for `0 \le t < 140` and `m(t)=1` for `t \ge 140`. Factors (original author, liker, follower, retweeter) multiply, each only under its own condition (liker factor only if every liker shown is discounted; follower factor only if every follower shown is discounted and there are no likers; retweeter factor only for reposts). On a positive base score, 0,2 keeps 20% of that factor's score; it is not a 20% chance of appearing.
- Old implementation FeedbackFatigueFilter: SeeFewer only, default 14 days (overridable 0 to 100 days). Filtering and score reduction are different mechanisms; neither resets interest history.
- New repo (S13, S14): blocked and muted accounts and muted keywords are filtered before scoring; predicted not interested, mute, block, and report carry negative weights.

### Ch08 Menata ulang pengaturan akun (source lines 313-391)
- A Lists (S18): facts above (public default, Private toggle, pin).
- B Following and mute (S16, S19).
- C Not interested (S17).
- D Muted words (S20): documented path is the Notifications tab, gear icon, Muted, Muted words. The account-mute page (S19) documents Settings and privacy, Privacy and safety, Mute and block for muted accounts. Durations Forever, 24 hours, 7 days, 30 days.
- E Topics and Interests (S21): you can follow and unfollow Topics; Topics you follow ARE public to anyone who can see your full profile (followers only if posts are protected); you can deselect "Interests from X" in Your X data.
- F Autoplay (S24): iOS and Android path Settings and privacy, Accessibility, display, and languages, Data usage, Video autoplay, Never. On web the setting is "Autoplay" with options On cellular or Wi-Fi, or Never. Web and app settings are independent.
- G Search (S25, S26): see Ch02 facts; use Latest tab.
- No third-party apps that ask for account access without a clear reason.

### Ch09 Memilih tindakan di tengah sesi baca (source lines 412-430 plus widget text)
Widget "pilihan-baca-x" situations (decision aid, not a feed simulator):
- Useful post: read, open the source, like if you appreciate it, bookmark if you will reuse it, follow after judging several posts. Like, bookmark, click, follow are recorded as signals or predicted outputs; their effect on your feed cannot be computed from the public code.
- Need to save, not yet verified: save the link in personal notes; bookmark is fine but not signal-free; the first click can still be recorded.
- Pulled into a debate: skip if no reply is needed; use Not interested on unwanted recommendations; if you must correct information, do it consciously. Reply, conversation clicks, and dwell can be inputs; the code does not prove every angry comment boosts the same topic.
- One account keeps bothering you: mute to reduce its posts, unfollow if it no longer belongs in your sources, block for interaction limits (check current policy). Mute and unfollow differ; visibility rules filter muted accounts.
- One theme keeps appearing: Not interested on recommendations; muted words for specific phrases, check Home timeline is selected. Interest feedback and word matching are different mechanisms.
- Want to read without random discovery: open your curated List; Following for followed accounts; search for a specific question. Chronological order does not guarantee truth, does not remove ads, and activity is still recorded.
- Plus source lines 418-430 (AI-for-work example, mixed-interest account, separate account trade-off).

### Ch10 Evaluasi satu minggu (source lines 432-470)
- Source content (7-day table, 20 organic posts sample, three classes, troubleshooting list). The number 20 and the 7 days are practice choices, not algorithm parameters.
- Formula: `\text{Proporsi berguna}=\frac{\text{post berguna}}{\text{post organik yang diperiksa}}\times 100\text{\%}`.

### Ch11 Rencana bacaan pribadi (source lines 472-482 and 561-676)
- Source content only: reading text is not automatically healthier (no research basis given to claim lower dopamine response; the guide makes no such claim), decide when a session ends, keep sources that test your views; then the personal template condensed (needs, sources and paths, interaction rules, limits, evaluation, reading note, checklist).

### Ch12 Referensi
- List S1-S27 grouped: repositori lama, repositori baru, dokumentasi resmi X. Add a short "cakupan pemeriksaan" note: static reading of the September 2025 snapshot (archive sha256 92fa7db2...) and the live new repo on 12 Oktober 2026; production config, trained models, user data, and experiments are not covered.

## 3. Corrections against the source document

1. "Kode 2023" is wrong for weights, RerankerUtil, Phoenix, FeedbackFatigue: those are in the September 2025 update of the old repo.
2. The Home Mixer README (S2) names Cr Mixer as a candidate source, while the root README (S1) describes tweet-mixer as the coordination layer for out-of-network candidates. Both names are valid when attributed to the right README.
3. RETREIVAL_SIGNALS.md has no profile-visit row.
4. Following being chronological is from the old Home Mixer README, not X Help.
5. Muted-words web path in the source is not the documented one; use S20's path.
6. Topics you follow are public (not "may be").
7. "Muted words still appear via search" rests on S17's general statement that muting applies to notifications and Home timeline; do not cite S20 for it.
8. The engineering blog post of 31 March 2023 is offline; cite the archived copy S12.
9. Report is not in the main predicted-output list of the old model file.

Not read: full Phoenix scorer files in the old snapshot (counted only); xai-value-model scoring.rs (exact decay, floor, and discount values not established, so do not state them).
