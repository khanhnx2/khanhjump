// Mini Nguyên: a flying companion for levels 21-30. Tracks the player's y
// directly (no independent gravity/landing — it flies), trails behind during
// the run and shields the player in front during boss fights.
export const MINI_MAX_HP = 20;
export const MINI_FIRE_INTERVAL = 2.0;
export const MINI_SCALE = 0.5;
const MINI_RUN_OFFSET_X = -0.8;
const MINI_BOSS_OFFSET_X = 0.5;

export class MiniCompanion {
  constructor() {
    this.scale = MINI_SCALE;
    this.reset();
  }

  reset() {
    this.hp = MINI_MAX_HP;
    this.alive = true;
    this.fireTimer = MINI_FIRE_INTERVAL;
    this.x = 0;
    this.y = 0;
    this.lastHitObstacle = null;
  }

  // Ticks the fire timer and returns true the frame a bullet should spawn.
  tickFire(dt) {
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer += MINI_FIRE_INTERVAL;
      return true;
    }
    return false;
  }

  updateRun(dt, player) {
    this.x = player.x + MINI_RUN_OFFSET_X;
    this.y = player.y;
    return this.tickFire(dt);
  }

  updateBossPosition(dt, player) {
    this.x = player.x + MINI_BOSS_OFFSET_X;
    this.y = player.y;
    return this.tickFire(dt);
  }

  takeDamage(amount = 1) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) this.alive = false;
  }
}
