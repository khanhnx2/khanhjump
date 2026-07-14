# Brainstorm: Levels 41-50 + Mini Father Companion

## Problem statement
Fourth level-range extension: 40→50 levels, companion upgraded to Mini
Father on 41-50.

## Confirmed decisions (AskUserQuestion)
1. Mini Father stats: 40 HP, fires every 1.0s — continues the established
   progression (+10 HP, −0.5s per tier: nguyen 20/2.0 → khoi 30/1.5 →
   father 40/1.0). Avatar 'father' (player-father.png exists).
2. Bosses 41-50: mirror 31-40 exactly (41→31 … 50→40), Mini Black Nguyên
   add unchanged (10 HP / 2s every fight).
3. Behavior identical to prior companions (fly behind, obstacle-immune,
   boss-bullet shield, permanent death at 0 HP, fresh on restart).

## Design (approved) — payoff of the COMPANION_TYPES parameterization
Only data files + docs change; game-state/boss-renderer/hud/boss-fight
need ZERO edits (all read stats/avatar/label from the companion instance):

1. `js/level-data.js`: LEVEL_COUNT 40→50; companionTypeFor gains
   `if (number >= 41) return 'father';` (before the >=31 check).
2. `js/boss-level-data.js`: BOSS_SEQUENCES 41-50 mirror 31-40 explicitly
   (existing per-level style).
3. `js/mini-companion-state.js`: add
   `father: { hp: 40, fireInterval: 1.0, avatar: 'father', label: 'Mini Father' }`.
4. `docs/gameplay-rules.md`: 40→50 levels; extend the companion comparison
   table with a Mini Father column; win-condition boss-win range 11-40 →
   11-50; unlock cap wording 40→50.

No storage changes; clampLevel auto-raises progress cap to 50.

## Risk (accepted)
41-50 boss fights easier again vs 31-40 (stronger shield + 2x DPS of
nguyen). Intentional progression-reward design per user; single-constant
tuning available if playtest disagrees.

## Verification approach
Same as 31-40: node assertions (LEVEL_COUNT, companionType boundaries
40/41/50, sequence mirroring 41≡31, 50≡40, father stats), browser eval
(lv41 stats + cadence ~10 shots/10s vs 6 (khoi) vs 4 (nguyen), boss-fight
shielding sim), regression matrix (5/11/21/31 unchanged), npm test, build
script.

## Next steps
/ck:plan with this report.

## Unresolved questions
None.
