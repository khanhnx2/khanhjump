# Gameplay Rules

## Overview

Khôi Jump is a Canvas runner. The player moves forward automatically, taps to jump, and wins by reaching the end of the level.
The start screen includes an About me screen with creator contact information and website.

## Levels

- The game has `30` levels.
- Levels `11-20` reuse the exact map layouts of levels `1-10` (11=1, 12=2, … 20=10) and add a boss fight at the finish line.
- Levels `21-30` reuse the exact map layouts of levels `1-10` and the boss roster of levels `11-20`, with new companion mechanics (see below).
- Father, Khôi, and Nguyên each store their own current level.
- Custom characters also store their own current level.
- Character name and avatar can be changed from the start screen.
- New characters can be added, and existing characters can be deleted.
- Clearing a level unlocks the next level for that character, up to level `30`.

## Start Gate

- Every start or retry rolls `random(3)`.
- The English matching board opens only when the random result is `0`.
- The board is `3x4`: `6` English beginner words and `6` Vietnamese meanings.
- In landscape, the same board displays as `4x3` so it fits the screen.
- Matching tracks how many times each English word has appeared.
- If at least `6` words have appeared `5+` times, the game rolls `random(2)`.
- When that result is `0`, matching uses `6` words from the `5+` appearance group as face-down cards.
- Otherwise matching uses the `6` least-seen words with all cards visible from the start.
- The runner starts only after all `6` pairs are matched.
- The word bank has `200` beginner nouns and `50` beginner verbs.

## Boss Levels (11-20)

- Reaching the finish line on levels `11-20` starts a boss fight instead of an instant win.
- The player stops running, stands in place, and can only jump.
- The player auto-fires `1` bullet every `0.5` seconds with infinite ammo (separate from the gun pickup).
- Bullets from both sides fly at ground height; a target that is mid-jump dodges the bullet.
- Each boss bullet that hits removes `1` heart. Hearts carry over from the run (no reset at the boss).
- Each player bullet that hits removes `1` boss heart.
- Bosses stand still `6` tiles ahead and every `0.5` seconds roll `random(2)`; on `1` they jump in place.
- Bosses are dark-tinted versions of the Nguyên, Khôi, and Father avatars; Big variants are `1.5x` size.
- Bosses appear one at a time; killing one spawns the next in the queue. Beating the last boss wins the level.
- Losing all hearts during a boss fight restarts the whole level from the beginning.

| Level | Bosses (in order) |
|---|---|
| 11 | Black Nguyên (10 hearts, shoots every 2s) |
| 12 | Black Khôi (20 hearts, every 1.5s) |
| 13 | Black Father (30 hearts, every 1s) |
| 14 | Black Nguyên → Black Khôi |
| 15 | Black Nguyên → Black Father |
| 16 | Black Khôi → Black Father |
| 17 | Black Nguyên → Black Khôi → Black Father |
| 18 | Black Nguyên → Big Black Nguyên (15 hearts, every 1.5s) |
| 19 | Black Khôi → Big Black Khôi (25 hearts, every 1s) |
| 20 | Black Father → Big Black Father (40 hearts, every 0.5s) |

## Boss Levels (21-30)

- Levels `21-30` follow the same boss-fight rules as levels `11-20` but add two new companion units.
- The boss roster for levels `21-30` mirrors levels `11-20` exactly (level 21 has the same boss sequence as level 11, level 22 mirrors 12, etc.).

### Mini Nguyên (Ally Companion)

- Mini Nguyên is automatically present for the entire run on levels `21-30`.
- During the run phase, Mini Nguyên trails behind the player (flying, mirrors player's y position exactly, no independent physics).
- Mini Nguyên's bullets can destroy obstacles, acting identically to player bullets fired from gun pickups.
- During boss fights, Mini Nguyên repositions in front of the player and shields incoming boss bullets (each hit taken by Mini Nguyên instead of the player removes `1` Mini Nguyên heart instead of `1` player heart).
- Mini Nguyên continues firing its own bullets at the boss even while shielding.
- Mini Nguyên: `20` hearts, no regen, fires `1` bullet every `2` seconds.
- If Mini Nguyên's hearts reach `0` during a level attempt, it dies (no mid-attempt respawn; a fresh one spawns on `restart()`).
- Mini Nguyên takes `1` damage on obstacle contact (same damage rules as the player).

### Mini Black Nguyên (Enemy Add)

- Mini Black Nguyên spawns fresh alongside every main boss encountered on levels `21-30` (works for single-boss and multi-boss sequences; respawns for each boss in the sequence).
- Mini Black Nguyên is an independent kill target for the player's bullets (killing it does not damage the main boss; killing the main boss does not kill the add).
- Mini Black Nguyên: `10` hearts, fires `1` bullet every `2` seconds at the player.

## Boss Roster (Levels 21-30)

- Levels `21-30` use the identical boss sequences as levels `11-20`, plus a fresh Mini Black Nguyên spawns alongside each main boss.

| Level | Bosses (in order) |
|---|---|
| 21 | Black Nguyên (10 hearts, shoots every 2s) + Mini Black Nguyên (10 hearts, every 2s) |
| 22 | Black Khôi (20 hearts, every 1.5s) + Mini Black Nguyên (10 hearts, every 2s) |
| 23 | Black Father (30 hearts, every 1s) + Mini Black Nguyên (10 hearts, every 2s) |
| 24 | Black Nguyên → Black Khôi (+ Mini Black Nguyên spawns for each) |
| 25 | Black Nguyên → Black Father (+ Mini Black Nguyên spawns for each) |
| 26 | Black Khôi → Black Father (+ Mini Black Nguyên spawns for each) |
| 27 | Black Nguyên → Black Khôi → Black Father (+ Mini Black Nguyên spawns for each) |
| 28 | Black Nguyên → Big Black Nguyên (15 hearts, every 1.5s) (+ Mini Black Nguyên spawns for each) |
| 29 | Black Khôi → Big Black Khôi (25 hearts, every 1s) (+ Mini Black Nguyên spawns for each) |
| 30 | Black Father → Big Black Father (40 hearts, every 0.5s) (+ Mini Black Nguyên spawns for each) |

## Win And Lose

- Win when `player.x >= currentLevel.length` (levels 1-10, 21-30), or after defeating every boss (levels 11-20, 21-30).
- Lose only when hearts reach `0`.
- Colliding with an obstacle removes `1` heart and destroys that obstacle.
- Flying high into ceiling spikes also removes `1` heart.
- Losing a heart flashes the player and plays a short warning sound.

## Hearts

- Each run starts with `10` hearts.
- Maximum hearts: `10`.
- Father pickup adds `2` hearts.
- Khôi pickup adds `1` heart.
- Nguyên pickup adds `1` heart.

## Power Ups

- Wings enable hold-to-fly for `3` seconds.
- If the fly timer runs out while the player is still airborne, they get `2` seconds of invincibility while falling back down, shown with a pulsing cyan shield ring around the player. Landing on blocks still works normally; hitting a spike/block/ceiling-spike during this window destroys it silently instead of costing a heart.
- Gun auto-fires for `2.5` seconds.
- Gun fires `1` shot every `0.25` seconds, for `10` shots total.
- Shield pickup grants `3` seconds of invincibility immediately (same effect as the post-fly shield: obstacles destroyed silently on contact, no heart lost).
- All pickups (wings, gun, shield, father, khôi, nguyên) only collect while the player is airborne (mid-jump); walking through them on the ground does not collect them.

## Scoring

- Top Ten stores both completed clears and failed runs.
- Ranking sorts by highest progress, then fewer attempts, then faster time.
