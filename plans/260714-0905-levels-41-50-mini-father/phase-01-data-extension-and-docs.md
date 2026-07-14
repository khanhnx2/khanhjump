---
phase: 1
title: Data Extension and Docs
status: completed
priority: P1
effort: 45m
dependencies: []
---

# Phase 1: Data Extension and Docs

## Overview
All code + docs changes for 41-50 in one pass — three data files and the
gameplay doc. No consumer changes needed (verified: all read from the
companion instance since commit 10f29cd).

## Requirements
- Functional: 50 levels; 41-50 layouts auto-cycle 1-10; boss sequences
  41-50 identical to 31-40; `companionType === 'father'` for 41-50.
- Functional: `new MiniCompanion('father')` → 40 HP, 1.0s fire interval,
  avatar 'father' (player-father.png exists), label 'Mini Father'.
- Non-functional: zero storage-key changes (docs/deployment-guide.md
  "Storage Stability" rules); progress cap auto-raises to 50 via
  `clampLevel`.

## Architecture
Verified current state (post-71a5a50): `js/level-data.js:5`
LEVEL_COUNT = 40; `companionTypeFor` at lines 9-13 checks `>= 31` then
`>= 21`; `js/boss-level-data.js` BOSS_SEQUENCES ends at 40;
`js/mini-companion-state.js:5-8` COMPANION_TYPES has nguyen + khoi.

## Related Code Files
- Modify: `js/level-data.js` (LEVEL_COUNT 50; add `if (number >= 41) return 'father';` as the first check in companionTypeFor; update the range comment above it)
- Modify: `js/boss-level-data.js` (add 41: ['nguyen'] … 50: ['father','big-father'], copying rows 31-40)
- Modify: `js/mini-companion-state.js` (add `father: { hp: 40, fireInterval: 1.0, avatar: 'father', label: 'Mini Father' }`; update the file's range comment "levels 21-40" → "21-50")
- Modify: `docs/gameplay-rules.md`:
  - "The game has `40` levels" → 50; unlock cap `40` → `50`
  - Levels list: add line for 41-50 mirroring 31-40 with Mini Father
  - "Levels 31-40 (Mini Khôi)" section: extend the comparison table with a Mini Father column (Hearts 40 / Fire interval 1.0s / Avatar Father) — consider retitling the section "Levels 31-50 (companion upgrades)" or adding a one-liner 41-50 subsection; keep whichever reads cleaner without duplicating behavior text
  - Win And Lose: boss-win range `11-40` → `11-50`

## Implementation Steps
1. Apply the four file edits above.
2. `npm test`.
3. `grep -n "40" docs/gameplay-rules.md` — review remaining "40" mentions
   for staleness (boss hearts values like "40 hearts" are legitimate).

## Success Criteria
- [ ] `npm test` passes
- [ ] Node assertion one-liner: LEVEL_COUNT 50; companionType at levels 40/41/50 = 'khoi'/'father'/'father'; level 41 bossSequence deep-equals level 31; MiniCompanion('father') stats correct
- [ ] No storage keys touched (`git diff` review)
- [ ] Docs internally consistent (no stale 40-level references)

## Risk Assessment
Minimal — pure data. Only real risk is docs staleness, covered by the grep
review step.
