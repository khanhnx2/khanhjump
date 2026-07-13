# Brainstorm: Player Data Persistence Across Updates

## Question
Updates keep adding levels/features — can character level progress, top-ten,
and character list survive updates without being wiped?

## Answer: YES — already guaranteed by existing design (no code change needed)

Evidence (verified in code):
- All 3 data types live in localStorage under stable keys:
  `khanhJumpCharacterLevelsV1` (progress), `khanh-jump-top-ten` (leaderboard),
  `khanhJumpCharactersV1` (character list).
- SW update path only deletes Cache Storage (`caches.delete` in
  service-worker.js activate) — never touches localStorage.
- `clampLevel` (js/character-level-progress.js) caps to `LEVEL_COUNT` on
  read: ADDING levels preserves progress and raises the cap; only removing
  levels would clamp down.
- Rebrand (0908313) deliberately kept all keys unchanged.
- New update-toast system (same commit) removed the old "clear cache to
  update" advice — which was the biggest real wipe risk (users choosing
  "clear site data" by mistake).

## Residual risks (outside app control)
- User clears browser site data / Android app data.
- iOS Safari ~7-day storage eviction for unused non-installed sites.
- Origin change would strand data.
- Future code renaming keys / changing shapes without migration.

## Outcome (user-approved)
Documented storage-stability rules in docs/deployment-guide.md (new
"Storage Stability" section): keys immutable, shape changes require
migration, level-count semantics, same-origin requirement. No code changes.
Option "backup/export button" offered, declined (YAGNI for now).

## Unresolved questions
None.
