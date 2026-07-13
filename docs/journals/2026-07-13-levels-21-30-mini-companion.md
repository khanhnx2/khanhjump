# Extended Khanh Jump to 30 Levels with Mini Nguyên Companion & Mini Boss Add

**Date**: 2026-07-13 08:47–11:15  
**Severity**: Low  
**Component**: Game levels, companion AI, boss fight encounters  
**Status**: Resolved (committed, playtested)

## What Happened

Completed full implementation of levels 21–30. Reused layout+boss structure from 11–20 (identical HP/fireInterval/scale, shifted boss sequences). Added two new mechanics: (1) Mini Nguyên — flying ally companion (20 HP, 2s fire rate) that trails player during run, shields boss bullets during fights, dies permanently on 0 HP; (2) Mini Black Nguyên — enemy add spawning fresh with each main boss, independent kill target (10 HP, 2s fire). All 5 plan phases completed pre-implementation with Full-tier validation (18/18 verifications, zero failures). Code review scored 10/10. Playtest data: boss threat density +15–42% vs 11–20 levels (judged intentional).

## The Brutal Truth

Execution was clean, but revealed a pre-existing dev-workflow pain: the project's service worker (cache-first strategy, static CACHE_NAME with unbuilt `__CACHE_VERSION__` placeholder) aggressively cached stale JS across browser test iterations. Switched preview server ports 3 times during validation to get clean cache partitions for reliable in-browser verification. Not a code issue, but it's a known gotcha that will plague future browser-based testing on this repo until the build pipeline injects a content-hash-based cache-buster.

## Technical Details

- **User clarification mid-task**: Initial request said "level 31–40", but scouting revealed LEVEL_COUNT=20. User clarified the whole request was actually 21–30, not 31–40. 
- **Mini Nguyên implementation**: trails at exact player Y during run phase (no independent physics). Bullet collision with obstacles mirrors player gun-pickup behavior. Boss-phase repositioning: floats ahead of player, intercepts boss bullets before they reach player hitbox (absorption model, not reflection). One fresh spawn per attempt.
- **Mini Black Nguyên implementation**: spawns fresh per main boss, including multi-boss levels (e.g., level 27 spawns three Mini Black adds alongside three main bosses). Independent kill target; shares no HP/shield logic with main boss.
- **Service worker cache friction**: cache-first policy + static CACHE_NAME → browser served old JS despite dev edits. Workaround: unregister SW in DevTools or switch port. Root cause remains: no content-hash bust at build. Pre-existing issue, exposed by this multi-iteration validation cycle.
- **Playtest threat scaling**: raw bullet density up 15–42% on 21–30 vs 11–20 equivalents. Mini Nguyên's shielding partially offsets increase. Judged acceptable; tuning deferred.

## Lessons Learned

1. **Plan validation before code saves iterations.** Full-tier verification (Fact Checker, Flow Tracer, Scope Auditor, Contract Verifier) caught a user-intent mismatch (31–40 vs 21–30) and prevented rework. 18/18 verifications passed; implementation had zero surprise unknowns.
2. **Service worker cache-first is a dev friction multiplier.** Multiple port switches needed to bypass stale cache. Build-time content-hash injection would eliminate this across all future browser test sessions.
3. **Companion AI state isolation is doable.** New `js/mini-companion-state.js` module kept companion logic cleanly separated; easy to extend (e.g., later add more companion types).
4. **Multi-boss levels work (respawn per boss).** Level 27's three-boss fight spawns fresh Mini Black adds per boss correctly; no state bleed between boss transitions.

## What We Tried

- Initial approach: cache-buster on service worker scope — rejected (outside feature scope, pre-existing issue).
- Validation: headless simulation + live browser (desktop/mobile) on same server — hit cache issue mid-cycle, pivoted to port switching for cache isolation. Worked but revealed friction for future sessions.

## Next Steps

- Service worker cache-bust via build-time content-hash injection should be prioritized for the Android build pipeline (already wired there; web dev needs it too).
- Difficulty curve on 21–30 is playable; no further tuning needed unless post-release data suggests otherwise.
- Two deferred design decisions remain open: (1) dying at boss records failure row (intentional), (2) simultaneous last-boss-kill + fatal hit resolves as death (intentional).

---

**Status:** DONE  
**Summary:** Extended Khanh Jump to 30 levels with Mini Nguyên companion (flying ally, shields boss bullets) and Mini Black Nguyên boss add (10 HP, respawns per boss). Plan 100%, code review 10/10, live testing complete. Exposed pre-existing service worker cache-first dev friction (workaround: port switching; permanent fix: content-hash bust at build).  
**Concerns:** Service worker cache stale-JS issue (pre-existing, known workaround); boss threat density up 15–42% on 21–30 (judged intentional, not tuned further).
