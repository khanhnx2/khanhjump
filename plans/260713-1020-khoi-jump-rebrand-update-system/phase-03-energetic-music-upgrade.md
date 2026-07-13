---
phase: 3
title: Energetic Music Upgrade
status: completed
priority: P2
effort: 2h
dependencies: []
---

# Phase 3: Energetic Music Upgrade

## Overview
Make the background music noticeably more driving: faster tempo,
synthesized kick + hi-hat percussion, bass on every beat, and a catchier
16-step riff — all still procedural WebAudio in
`js/audio-manager.js`, zero external audio files.

## Requirements
- Functional: tempo 132 → 160; kick drum on every beat; hi-hat on
  off-beats; bass every beat (currently every 2nd); melody becomes a
  16-step pattern (currently 8 notes).
- Functional: existing event API unchanged — `start`/`restart` (play),
  `damage`/`bossStart`/`bossDefeated` (stings), `death`/`win` (pause),
  mute toggle all keep working identically.
- Non-functional: no audio files; `js/audio-manager.js` stays under 200
  lines; master gain stays at current level (~0.28) so overall loudness
  doesn't spike — percussion sits under the melody in the mix.

## Architecture
Current engine: `setInterval` at half-beat resolution calls
`scheduleBeat()`, which plays oscillator tones via `playTone(freq, start,
dur, type, gain)`. Extend with two synthesized drum voices:

- **Kick**: oscillator sine with `frequency.setValueAtTime(150)` then
  `exponentialRampToValueAtTime(50, t+0.12)`, gain envelope ~0.25 → fast
  decay. Classic synth kick, no samples.
- **Hi-hat**: short white-noise burst — one shared `AudioBuffer` of noise
  created lazily in `ensureContext()`, played through a `BufferSource` +
  highpass `BiquadFilter` (~7kHz) + fast gain decay (~0.05s), low gain
  (~0.06).

Pattern (16 half-beat steps per bar at 160 BPM):
- Kick: steps 0, 4, 8, 12 (four-on-the-floor).
- Hi-hat: steps 2, 6, 10, 14 (off-beats).
- Bass (sawtooth, note/2): every even step.
- Melody (square): every step, from a 16-entry note table — an energetic
  A-minor riff, e.g. ascending arpeggio runs with a hook; exact notes
  tunable during implementation, target "driving chase feel" vs the
  current gentle major loop.

`scheduleBeat` interval currently fires at `(60/tempo)*500` ms (half-beat)
— keep that clock, just raise tempo and index into the richer pattern.

## Related Code Files
- Modify: `js/audio-manager.js` only

## Implementation Steps
1. Bump `this.tempo` to 160; replace `this.notes` (8 entries) with a
   16-entry riff table (A-minor, mix of 220-880 Hz range).
2. In `ensureContext()`, lazily build the shared noise buffer
   (`context.sampleRate * 0.1` samples of `Math.random()*2-1`).
3. Add `playKick(startTime)` and `playHat(startTime)` private methods per
   Architecture. Both route through `this.master` so mute keeps working.
4. Rewrite `scheduleBeat()` to the 16-step pattern above (`this.step % 16`).
5. Leave `playDamageAlert`/`playBossAlert`/`playBossDefeat`/`toggleMute`/
   `playFromStart`/`pause` untouched.
6. `node --check js/audio-manager.js`; then browser test: start a run,
   listen for kick/hat/faster tempo; verify mute silences everything;
   verify death/win stops the loop and restart restarts it; verify boss
   stings still fire on level 11+.
7. Subjective check with user if possible — riff notes are tunable in one
   table without structural change.

## Success Criteria
- [ ] Audible: faster tempo, kick on beats, hi-hat off-beats, bass every beat
- [ ] Mute button silences music + drums + stings; unmute restores
- [ ] death/win pause, restart/start replay from step 0 (existing behavior)
- [ ] Boss stings unchanged
- [ ] No external audio files added; file <200 lines; `npm test` passes

## Risk Assessment
- "Energetic" is subjective — mitigated by isolating all taste into the
  16-entry note table + 3 gain constants, trivially tunable after user
  feedback without structural rework.
- Percussion could clip on cheap phone speakers if gains stack — keep kick
  ≤0.25, hat ≤0.06, verify no distortion at master 0.28.
