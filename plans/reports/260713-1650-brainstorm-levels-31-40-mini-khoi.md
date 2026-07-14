# Brainstorm: Levels 31-40 + Mini Khôi Companion

## Problem statement
Extend game 30→40 levels. Levels 31-40 replace the Mini Nguyên companion
with Mini Khôi: fires 0.5s faster (2.0s → 1.5s interval), +10 HP (20 → 30).

## Confirmed decisions (AskUserQuestion)
1. Bosses 31-40: mirror 21-30 exactly (Black Nguyên/Khôi/Father sequences,
   31→21 … 40→30 pattern, same Mini Black Nguyên add 10HP/2s every fight).
2. Levels 21-30 unchanged — keep Mini Nguyên. Companion upgrade is the
   distinguishing feature of 31-40.
3. Mini Khôi behavior identical to Mini Nguyên except stats/avatar:
   flies behind player, obstacle-immune (run phase), shields boss bullets,
   bullets destroy obstacles, dies permanently at 0 HP, fresh on restart.
   HP 30, fire interval 1.5s, avatar 'khoi' (player-khoi.png exists).

## Design (approved)

### Data
- `js/level-data.js`: LEVEL_COUNT 30→40. Replace boolean `hasMiniNguyen`
  with `companionType`: 'nguyen' (21-30), 'khoi' (31-40), null (1-20).
  Internal rename only — zero player-data impact; clampLevel auto-raises
  progress cap to 40.
- `js/boss-level-data.js`: add BOSS_SEQUENCES 31-40 mirroring 21-30
  explicitly (existing style: explicit per-level entries).

### MiniCompanion parameterization (no new class)
`js/mini-companion-state.js`:
```js
const COMPANION_TYPES = {
  nguyen: { hp: 20, fireInterval: 2.0, avatar: 'nguyen', label: 'Mini Nguyên' },
  khoi:   { hp: 30, fireInterval: 1.5, avatar: 'khoi',   label: 'Mini Khôi' }
};
```
`new MiniCompanion(type)` → instance carries maxHp/fireInterval/avatar/label.
All behavior methods unchanged.

### Touchpoints
- `js/game-state.js`: `new MiniCompanion(this.level.companionType)`;
  pass `Boolean(companionType)` as hasMiniAdd to BossFight (was
  `hasMiniNguyen`).
- `js/boss-renderer.js` drawCompanion: `characterImages[companion.avatar]`
  (was hardcoded `.nguyen`).
- `js/hud-progress.js`: label/maxHp from instance (was hardcoded
  "Mini Nguyên"/MINI_MAX_HP import).
- `js/boss-fight-state.js`: no logic change (miniNguyen param already
  type-agnostic).
- `docs/gameplay-rules.md`: 30→40 levels, new short 31-40 section w/
  Mini Nguyên vs Mini Khôi comparison table.

## Out of scope
New art assets, storage changes, update-system changes, boss stat changes.

## Risk
31-40 boss fights slightly EASIER than 21-30 (stronger shield + faster
companion DPS vs same bosses) — accepted; tune via one constant in
playtest phase if needed.

## Next steps
/ck:plan with this report.
