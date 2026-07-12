import { JUMP_VELOCITY, GRAVITY } from './player-cube.js';

// End-of-level duel: player locks in place, bosses spawn one at a time from the
// level's bossSequence. Bullets fly in the ground band [0, 1); an airborne body
// (bottom at y >= 1) dodges. Player bullets step ~0.73 tiles per capped frame
// (22 tiles/s at MAX_DT 1/30), boss bullets ~0.37 tiles/frame (11 tiles/s) —
// both under the 1-tile hitbox width, so no tunneling checks needed.
export const BOSS_DISTANCE = 6;
const PLAYER_BULLET_SPEED = 22;
const BOSS_BULLET_SPEED = 11; // half of PLAYER_BULLET_SPEED, per user request
const HOP_ROLL_INTERVAL = 0.5;
const DODGE_BAND_TOP = 1;

export class BossFight {
  constructor(bossSequence, playerX) {
    this.queue = bossSequence.map((boss) => ({ ...boss }));
    this.spawnX = playerX + BOSS_DISTANCE;
    this.boss = null;
    this.bossBullets = [];
    this.playerBullets = [];
    this.playerHit = false;
    this.bossDefeated = false;
    this.defeatedBoss = null;
    this.done = false;
    this.spawnNext();
  }

  spawnNext() {
    const def = this.queue.shift();
    if (!def) {
      this.boss = null;
      this.done = true;
      return;
    }
    this.boss = {
      ...def,
      maxHp: def.hp,
      x: this.spawnX,
      y: 0,
      vy: 0,
      grounded: true,
      fireTimer: def.fireInterval,
      hopTimer: HOP_ROLL_INTERVAL
    };
  }

  shootFromPlayer(player) {
    this.playerBullets.push({ x: player.x + 1, y: 0.5 });
  }

  update(dt, player, rng = Math.random) {
    this.playerHit = false;
    this.bossDefeated = false;
    if (this.done) return;
    this.updateBoss(dt, rng);
    this.updateBullets(dt, player);
  }

  updateBoss(dt, rng) {
    const boss = this.boss;

    boss.fireTimer -= dt;
    if (boss.fireTimer <= 0) {
      boss.fireTimer += boss.fireInterval;
      this.bossBullets.push({ x: boss.x - 0.2, y: 0.5 });
    }

    boss.hopTimer -= dt;
    if (boss.hopTimer <= 0) {
      boss.hopTimer += HOP_ROLL_INTERVAL;
      if (boss.grounded && Math.floor(rng() * 2) === 1) {
        boss.vy = JUMP_VELOCITY;
        boss.grounded = false;
      }
    }

    if (!boss.grounded) {
      boss.vy -= GRAVITY * dt;
      boss.y += boss.vy * dt;
      if (boss.y <= 0) {
        boss.y = 0;
        boss.vy = 0;
        boss.grounded = true;
      }
    }
  }

  updateBullets(dt, player) {
    const boss = this.boss;

    for (const bullet of this.playerBullets) {
      bullet.x += PLAYER_BULLET_SPEED * dt;
      if (boss.y < DODGE_BAND_TOP && bullet.x > boss.x && bullet.x < boss.x + boss.scale) {
        bullet.destroyed = true;
        boss.hp -= 1;
      }
    }
    this.playerBullets = this.playerBullets.filter(
      (bullet) => !bullet.destroyed && bullet.x < this.spawnX + BOSS_DISTANCE * 4
    );

    for (const bullet of this.bossBullets) {
      bullet.x -= BOSS_BULLET_SPEED * dt;
      if (player.y < DODGE_BAND_TOP && bullet.x > player.x && bullet.x < player.x + 1) {
        bullet.destroyed = true;
        this.playerHit = true;
      }
    }
    this.bossBullets = this.bossBullets.filter(
      (bullet) => !bullet.destroyed && bullet.x > player.x - BOSS_DISTANCE * 4
    );

    if (boss.hp <= 0) {
      this.bossDefeated = true;
      this.defeatedBoss = boss;
      this.bossBullets = [];
      this.spawnNext();
    }
  }
}
