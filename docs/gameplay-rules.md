# Gameplay Rules

## Overview

Khanh Jump is a Canvas runner. The player moves forward automatically, taps to jump, and wins by reaching the end of the level.
The start screen includes an About me screen with creator contact information and website.

## Levels

- The game has `10` levels.
- Father, Khôi, and Nguyên each store their own current level.
- Custom characters also store their own current level.
- Character name and avatar can be changed from the start screen.
- New characters can be added, and existing characters can be deleted.
- Clearing a level unlocks the next level for that character, up to level `10`.

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

## Win And Lose

- Win when `player.x >= currentLevel.length`.
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
- All pickups (wings, gun, father, khôi, nguyên) only collect while the player is airborne (mid-jump); walking through them on the ground does not collect them.

## Scoring

- Top Ten stores both completed clears and failed runs.
- Ranking sorts by highest progress, then fewer attempts, then faster time.
