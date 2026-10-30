# In Their World — Claude Independent Review Packet (for ChatGPT second review)

Status: PARTIAL. Static code audit + offline logic tests only. Browser, a11y, TTS, art, Milo, lint/tsc/build were NOT run by Claude. ChatGPT has not seen or approved any of this.

## 1. Repository state
- Repo: github.com/darayavahoush/manaslearning-platform, branch `main`, audited commit `b074482` (Antigravity pushed Packet #6 directly to `main`, 99 files, ~23 MB screenshots in git).
- Claude's changes are an UNCOMMITTED local patch (`itw-claude-review.patch`) against that commit. Nothing was committed or pushed by Claude. No .env or DB files were in the commit.

## 2. Architecture (verified in code)
- `web/components/itw/InTheirWorld.jsx` (~7.9k lines): ADHD module from ~line 2099, dyslexia passage library from ~line 3255.
- ADHD: `AdhdWorkspaceSim` runs a timer-driven scheduler; PRNG `createPrng` is Mulberry32.

## 3. ADHD findings (before patch)
1. Event order fixed: `pool[poolIdx % pool.length]` — PRNG varied timing only; content order identical every session.
2. Seed was `Date.now()+19`: not reproducible, not exposed.
3. `autoExpire` defined on all 12 events, never read: events never expired.
4. When `maxActive` reached, event dropped but index advanced: events silently lost.
5. `soundOn` in the scheduler effect deps: toggling sound restarted the scheduler and replayed from event 0.
6. Snooze `setTimeout` untracked: survived unmount and fired while paused.
7. Tangents are static text; only counters change. No task-switching cost to the assignment (NOT changed).
8. `filter` support disables the scheduler entirely rather than filtering (NOT changed).

## 4. ADHD changes in patch
- Seeded Fisher–Yates shuffle over all 12 events (external + thought mixed), refilled when exhausted, no repeat across reshuffle boundary.
- Per-session seed from `Date.now() ^ Math.random()`.
- Events self-expire using `autoExpire` (min 4s).
- Blocked events requeue instead of being lost.
- Sound read via ref; scheduler no longer restarts on sound toggle.
- Snooze timers tracked, cleared on unmount, not scheduled while paused.
- Not changed: audio default (untouched), intensity config values, assignment state.

## 5. Deterministic seed outcomes (`scripts/verify-claude-itw-review.mjs`)
First 8 events by seed:
- 1: portal_reminder, thought_tea, batt_warning, friend_dm, thought_tabs, deliv_update, cal_checkin, thought_camera
- 42: batt_warning, chat_citation, library_room, thought_tea, thought_tabs, thought_camera, deliv_update, cal_checkin
- 1337: chat_citation, thought_tabs, cal_checkin, portal_reminder, friend_dm, thought_garden, thought_tea, deliv_update
- 2026: thought_tea, batt_warning, chat_citation, thought_tabs, thought_pelicans, portal_reminder, thought_garden, cal_checkin
- 99999: cal_checkin, deliv_update, batt_warning, thought_pelicans, portal_reminder, thought_tea, thought_garden, chat_citation
All 5 differ; same seed reproduces; all 12 events can open a session over 600 seeds (40–59 each).
Limit: tests the ordering function, not timing/overlap in a live browser.

## 6. Dyslexia library
- 12 passages, 12 unique passage IDs, 6 unique pair IDs, 3 questions each, all `correct` indexes in range.
- Pairs: monsoon_rainwater, terrace_garden, lake_birds, science_fair, pottery_craft, train_journey (IDs `pairN_<topic>_a|b`).
- Word counts 95–110; every passage is exactly 5 sentences (suspiciously uniform — templating suspected).
- Correct-answer index pattern `1,0,2` appears in 7 of 12 passages: positional bias a reader could exploit. NOT changed in patch.
- Equal counts do not prove equal difficulty. Long-word (9+ letters) counts differ within pairs (rainwater 7 vs 9, terrace 7 vs 10, science_fair 10 vs 11, pottery 5 vs 9, train 4 vs 6). Claude has not completed a qualitative vocabulary/clause/question-complexity review.

## 7. Rotation (before → after)
- Before: sequential `sessionStorage` counter, no reshuffle, resets each browser session (always starts at pair 1), storage failure silently returned pair 0.
- After: shuffled cycle in `sessionStorage`; last completed pair remembered in `localStorage`; new cycle never opens on the pair just finished; storage failure picks randomly instead of silently reusing pair 0.
- Test, 24 consecutive attempts: `2 1 5 0 4 3 | 2 3 0 1 4 5 | 1 5 3 2 0 4 | 0 2 4 5 1 3` — each cycle uses all 6 pairs once, no immediate repeats, refresh mid-run keeps the pair, new session avoids last pair, Run 1/Run 2 text differs in every pair. Pair only advances on completing Run 2 (abandoning a run repeats the pair).

## 8. Not verified
Browser flows, all three intensities live, overlap/burst behaviour, screenshots (existing ones in `web/docs/itw/screenshots` not inspected), 320px reflow, 200% zoom, keyboard/focus, screen-reader announcements, reduced motion, TTS and its unmount cleanup, reader toolbar, ruler, art files (only sizes checked: 150–340 KB webp), Milo owl/launcher, `apps-patch.js`, dyscalculia/dysgraphia/APD/executive modules, ESLint, `tsc`, production build. Antigravity's own claims on these are unverified by Claude.

## 9. Questions for ChatGPT
1. Is a fixed-length 12-event shuffle with 4–14 s lifetimes unpredictable enough, or should event types depend on task step? 
2. Should thought events carry a real task-switching cost (e.g., lost place in the assignment) without becoming a score?
3. Is the `filter` support's all-or-nothing behaviour a fair experiment, or should it filter a live stream?
4. Pair parity: please assess difficulty equivalence of each A/B pair beyond word counts; flag any materially harder passage.
5. Is answer-position bias (`102` in 7/12) acceptable, or should options be shuffled at render time?
6. Does a seed exposed for testing conflict with the "intensity user-controlled / no diagnostic claim" principles?
7. Any remaining representation concerns with "simulated view" wording in the dyslexia module (older code still contains it).
