# Extended Khanh Jump to 50 Levels with Mini Father Companion Tier

**Date**: 2026-07-14 14:20–16:55  
**Severity**: Low (feature shipped clean; debugging detour caused 1.5h friction)  
**Component**: Game levels 41–50, companion parameterization, dev server cache isolation  
**Status**: Resolved (committed e2fc7da feature + 6c0df88 tooling; verified)

## What Happened

Extended game from 40 to 50 levels by mirroring 31–40's layout + boss sequences + Mini Black Nguyên enemy add exactly, with third companion tier: Mini Father (40 HP, 1.0s fire interval, continuing the +10HP/-0.5s progression: Nguyên 20/2.0, Khôi 30/1.5, Father 40/1.0). Implementation required only 4 file changes: (1) js/level-data.js LEVEL_COUNT→50, companionTypeFor gained `>=41` branch before existing `>=31`/`>=21` (checked first); (2) js/boss-level-data.js BOSS_SEQUENCES rows 41–50 copied from 31–40; (3) js/mini-companion-state.js COMPANION_TYPES['father'] entry; (4) docs/gameplay-rules.md retitled companion section "Levels 31–50 (Companion Upgrades)", added 3-column comparison table, win ranges 11–50. Zero logic changes to consumers (game-state.js, boss-renderer.js, hud-progress.js, boss-fight-state.js already read stats generically from companion instance).

## The Brutal Truth

This feature was a textbook win for parameterization—15 lines of config, zero code changes, shipped fast. Then live verification turned into a 1.5h debugging rabbit hole chasing a phantom bug that *didn't exist in the code*. Level 41 and 50 reported "Mini Khôi" even though direct file inspection and network-level fetches confirmed the code was correct. Blame: service worker cache-first strategy still running locally during dev preview, *plus* a residual browser module-graph staleness that survived unregister+clear+reload. The frustration: spent 45min debugging by the book (inspecting source, checking network, reloading) only to discover the problem lived *in the browser's live module instances*, not the code or network layer. The fix: switch verification to a *different port* (8242 instead of 8241), forcing a fresh browser cache partition. Now have a named tool (.claude/launch.json entry) instead of ad-hoc port-hunting. This friction was already logged as a known risk in the 31–40 session's journal; should have created the tooling config then instead of leaving it for the next person.

## Technical Details

- **Third companion tier**: Father: {hp:40, fireInterval:1.0, avatar:'father', label:'Mini Father'}. Progression holds: +10 HP and −0.5s per tier. Instance-based lookup continues to shield this from logic changes.
- **Companion type routing in level-data.js**: Check `>= 41` before `>= 31` and `>= 21`. Order matters because later-level overrides must come first. No branching in consumers; they read `.getStats()` generically.
- **Boss sequences 41–50**: Identical to 31–40. Mini Black Nguyên add (10 HP) spawns per-boss regardless of companion tier. Deep-equals testing confirmed levels 41≡31, 42≡32, ..., 50≡40 in boss order.
- **Documentation**: gameplay-rules.md retitled to reflect 31–50 span (not just 31–40), added table: Tier | HP | Fire Interval | Levels; Nguyên 20 / 2.0s / 21–30; Khôi 30 / 1.5s / 31–40; Father 40 / 1.0s / 41–50. Win ranges updated to 11–50.
- **The caching bug (NOT a code bug)**: Live browser eval on level 41 returned `companionType='khoi'` despite code file showing `>=41 → father`. Root cause trace: (a) Direct Node.js assertion on js/level-data.js confirmed correct source. (b) `fetch(url, {cache:'no-store'})` to running dev server returned fresh file. (c) Page reload (unregister SW + clear Cache Storage + reload) did NOT fix it—reloaded page's window.__game still read stale companion type. Hypothesis: service worker cache invalidation + browser module-graph stale references (ESM import graph cached in page execution context, not network). Testing: verified cache unregister+clear fully completed BEFORE reload, yet module instances were stale while network-level cache-busted fetches were fresh. Confirmed: staleness lived in browser's JS engine state, not network/SW layer. Solution: launch a second static server on different port (8242 vs 8241) via new .claude/launch.json `launch_8242` config. Different origin = different SW registration scope = fresh cache partition. Reloaded on 8242: companion type correct immediately. This technique was noted ad-hoc in prior session ("switching preview server ports 3 times"); now formalized as permanent named tool.
- **Verification on fresh port**: Companion stats correct at all 6 boundaries (5→null, 11→null, 21→nguyen, 31→khoi, 41→father, 50→father). Fire-cadence 10s simulation: Father 10 shots (1.0s), Khôi 6 shots (1.5s), Nguyên 4 shots (2.0s)—exact. Full boss-fight level 41: Mini Father shields (40→33 HP), zero player hearts lost, Mini Black add unharmed. Levels 20/30/40/50 all die identically under stress test (no dodge), confirming finale difficulty unchanged across all companion tiers (no regression). Mini-death bullet-purge logic (separate fix c8a35a7, earlier in session): ally-fired bullets tagged `fromMini`, purged immediately on companion death, colored cyan (vs yellow player, purple enemy add, red boss). Re-confirmed working on Father instance. HUD rendered "Mini Father ♥ 40/40" with correct avatar.
- **Code review**: Clean on first pass. Only note: launch.json scope-separation already described, applied before commit.

## Lessons Learned

1. **Parameterization prediction from 31–40 was 100% correct.** Third tier = 15 lines of config, zero logic changes. Demonstrates the COMPANION_TYPES pattern scales elegantly. Future tiers now obvious: just add entry and branch in companionTypeFor. No inheritance debt, no duplicate fire/shield logic.
2. **Service-worker cache + browser module staleness = a new class of dev-cycle friction.** Not a coding bug; a tooling issue. Unregister+clear+reload is *not sufficient* when the page load races ahead of cache clearing. Different-port isolation (fresh browser cache partition) now the reliable workaround. Logged as permanent .claude/launch.json entry so next feature doesn't re-discover this by trial-and-error.
3. **Known risks from prior session should trigger immediate tooling fixes, not defer.** The 31–40 journal flagged "switching ports multiple times" as a friction point. Should have formalized the second-port config immediately instead of leaving it for 41–50. 45min of debugging could have been 2min of "switch to 8242 and reload."
4. **Order matters in branching logic for companion selection.** `>= 41` must come before `>= 31` in companionTypeFor, else level 41 matches the earlier branch. Easy mistake when adding a tier retroactively. Code review didn't catch it (code was correct), but the pattern is worth documenting in a comment.

## What We Tried

- **Initial parameterization check**: Confirmed js/mini-companion-state.js COMPANION_TYPES pattern holds (add Father entry). Worked first time—no surprises.
- **Verification attempt 1 (local port 8241)**: Live eval showed level 41 as 'khoi' (wrong). Inspected source (correct), fetched fresh file (correct), reloaded page (still wrong). 45min of investigating network/cache mechanics.
- **Verification attempt 2 (port 8242)**: Launched second dev server, same codebase, different origin. Reloaded level 41 on 8242: 'father' (correct). Confirmed all 6 boundaries + fire cadence + boss sequences + stress test.
- **Tooling fix**: Added .claude/launch.json `launch_8242` config to formalize the workaround (not ad-hoc port-hunting).

## Next Steps

1. **Automate the cache-switching workaround.** Script to detect stale-module symptoms and auto-launch second port. Low priority (manual switch takes 20s) but removes cognitive load.
2. **Test framework (still critical).** No test suite meant verification relied 100% on manual window.__game evals. Next feature (50→60 or new companion mechanic) risks similar cache friction being mistaken for a code bug. Vitest + DOM mocks would isolate cache issues from logic bugs.
3. **Service-worker content-hash bust** (original 2026-07-13 deferred item). Migrating to hash-based SW cache keys would make SW cache-first strategy safe for local dev. Currently workaround is "use a different port"; ideal is "hash invalidates stale assets automatically."

---

**Status:** DONE  
**Summary:** Extended Khanh Jump to 50 levels with Mini Father companion (40 HP, 1.0s fire interval). Parameterization pattern required zero logic changes; feature shipped via 4 file edits (level-data companionTypeFor, boss-level-data rows 41–50, mini-companion-state.js COMPANION_TYPES entry, gameplay-rules.md table). Live verification triggered 1.5h debugging detour: service-worker cache + browser module-graph staleness created phantom companion-type bug (code was correct, network was correct, page execution was stale). Root cause: unregister+clear+reload insufficient. Solution: second dev server on different port (8242) providing fresh cache partition. Formalized as permanent .claude/launch.json entry. All 6 boundaries, fire cadence, boss sequences, stress test passed on clean port.  
**Concerns:** None on code. Tooling friction (cache staleness workaround) now documented and systematized. Test framework still critical blocker for next feature.
