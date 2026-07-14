import { JUMP_VELOCITY, GRAVITY } from './player-cube.js';
import { WORLD_HEIGHT } from './gravity-context.js';

// End-of-level duel: player locks in place, bosses spawn one at a time from the
// level's bossSequence. Bullets fly in the ground band [0, 1); an airborne body
// (bottom at y >= 1) dodges. Player bullets step ~0.73 tiles per capped frame
// (22 tiles/s at MAX_DT 1/30), boss bullets ~0.37 tiles/frame (11 tiles/s) —
// both under the 1-tile hitbox width, so no tunneling checks needed.
// Inverted gravity mirrors the ground band to the top: a grounded body's
// bottom sits at groundY (4.8), and the mirror of "bottom < 1" is "bottom >
// WORLD_HEIGHT - 1 - DODGE_BAND_TOP" (3.8), NOT "> WORLD_HEIGHT - DODGE_BAND_TOP" —
// that off-by-one would make grounded bodies un-hittable/invulnerable.
export const BOSS_DISTANCE = 6;
const PLAYER_BULLET_SPEED = 22;
const BOSS_BULLET_SPEED = 11; // half of PLAYER_BULLET_SPEED, per user request
const HOP_ROLL_INTERVAL = 0.5;
const DODGE_BAND_TOP = 1;
const MINI_ADD_HP = 10;
const MINI_ADD_FIRE_INTERVAL = 2.0;
const MINI_ADD_SCALE = 0.5;
const MINI_ADD_OFFSET_X = -1;

export class BossFight {
  constructor(bossSequence, playerX, miniNguyen = null, hasMiniAdd = false, gravity = { skyDir: 1, groundY: 0 }) {
    this.queue = bossSequence.map((boss) => ({ ...boss }));
    this.spawnX = playerX + BOSS_DISTANCE;
    this.boss = null;
    this.miniAdd = null;
    this.miniNguyen = miniNguyen;
    this.hasMiniAdd = hasMiniAdd;
    this.skyDir = gravity.skyDir;
    this.groundY = gravity.groundY;
    this.bulletY = this.skyDir > 0 ? 0.5 : WORLD_HEIGHT - 0.5;
    this.bossBullets = [];
    this.playerBullets = [];
    this.playerHit = false;
    this.bossDefeated = false;
    this.defeatedBoss = null;
    this.done = false;
    this.spawnNext();
  }

  inGroundBand(y) {
    return this.skyDir > 0 ? y < DODGE_BAND_TOP : y > WORLD_HEIGHT - 1 - DODGE_BAND_TOP;
  }

  spawnNext() {
    const def = this.queue.shift();
    if (!def) {
      this.boss = null;
      this.miniAdd = null;
      this.done = true;
      return;
    }
    this.boss = {
      ...def,
      maxHp: def.hp,
      x: this.spawnX,
      y: this.groundY,
      vy: 0,
      grounded: true,
      fireTimer: def.fireInterval,
      hopTimer: HOP_ROLL_INTERVAL
    };
    this.miniAdd = this.hasMiniAdd
      ? {
          hp: MINI_ADD_HP,
          maxHp: MINI_ADD_HP,
          avatar: 'nguyen',
          scale: MINI_ADD_SCALE,
          fireInterval: MINI_ADD_FIRE_INTERVAL,
          fireTimer: MINI_ADD_FIRE_INTERVAL,
          x: this.boss.x + MINI_ADD_OFFSET_X,
          y: this.groundY
        }
      : null;
  }

  shootFromPlayer(player) {
    this.playerBullets.push({ x: player.x + 1, y: this.bulletY });
  }

  update(dt, player, rng = Math.random) {
    this.playerHit = false;
    this.bossDefeated = false;
    if (this.done) return;
    this.updateBoss(dt, rng);
    this.updateMiniAdd(dt);
    this.updateMiniNguyen(dt, player);
    this.updateBullets(dt, player);
  }

  updateMiniAdd(dt) {
    if (!this.miniAdd) return;
    this.miniAdd.fireTimer -= dt;
    if (this.miniAdd.fireTimer <= 0) {
      this.miniAdd.fireTimer += this.miniAdd.fireInterval;
      this.bossBullets.push({ x: this.miniAdd.x - 0.2, y: this.bulletY, fromMini: true });
    }
  }

  updateMiniNguyen(dt, player) {
    if (!this.miniNguyen || !this.miniNguyen.alive) return;
    const shouldFire = this.miniNguyen.updateBossPosition(dt, player);
    if (shouldFire) this.playerBullets.push({ x: this.miniNguyen.x + 1, y: this.bulletY, fromMini: true });
  }

  updateBoss(dt, rng) {
    const boss = this.boss;
    const skyDir = this.skyDir;

    boss.fireTimer -= dt;
    if (boss.fireTimer <= 0) {
      boss.fireTimer += boss.fireInterval;
      this.bossBullets.push({ x: boss.x - 0.2, y: this.bulletY });
    }

    boss.hopTimer -= dt;
    if (boss.hopTimer <= 0) {
      boss.hopTimer += HOP_ROLL_INTERVAL;
      if (boss.grounded && Math.floor(rng() * 2) === 1) {
        boss.vy = skyDir * JUMP_VELOCITY;
        boss.grounded = false;
      }
    }

    if (!boss.grounded) {
      boss.vy -= skyDir * GRAVITY * dt;
      boss.y += boss.vy * dt;
      if (skyDir * (boss.y - this.groundY) <= 0) {
        boss.y = this.groundY;
        boss.vy = 0;
        boss.grounded = true;
      }
    }
  }

  updateBullets(dt, player) {
    const boss = this.boss;

    for (const bullet of this.playerBullets) {
      bullet.x += PLAYER_BULLET_SPEED * dt;
      if (this.miniAdd && this.miniAdd.hp > 0 && bullet.x > this.miniAdd.x && bullet.x < this.miniAdd.x + this.miniAdd.scale) {
        bullet.destroyed = true;
        this.miniAdd.hp -= 1;
        if (this.miniAdd.hp <= 0) {
          this.miniAdd = null;
          // A dead shooter's in-flight bullets vanish with it (matches the
          // full bossBullets wipe on main-boss defeat).
          this.bossBullets = this.bossBullets.filter((b) => !b.fromMini);
        }
        continue;
      }
      if (this.inGroundBand(boss.y) && bullet.x > boss.x && bullet.x < boss.x + boss.scale) {
        bullet.destroyed = true;
        boss.hp -= 1;
      }
    }
    this.playerBullets = this.playerBullets.filter(
      (bullet) => !bullet.destroyed && bullet.x < this.spawnX + BOSS_DISTANCE * 4
    );

    for (const bullet of this.bossBullets) {
      bullet.x -= BOSS_BULLET_SPEED * dt;
      if (this.miniNguyen && this.miniNguyen.alive && bullet.x > this.miniNguyen.x && bullet.x < this.miniNguyen.x + this.miniNguyen.scale) {
        bullet.destroyed = true;
        this.miniNguyen.takeDamage(1);
        if (!this.miniNguyen.alive) {
          this.playerBullets = this.playerBullets.filter((b) => !b.fromMini);
        }
        continue;
      }
      if (this.inGroundBand(player.y) && bullet.x > player.x && bullet.x < player.x + 1) {
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
