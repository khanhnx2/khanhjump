// Ally companion for levels 21-50. Tracks the player's y directly (no
// independent gravity/landing — it flies), trails behind during the run and
// shields the player in front during boss fights. All variants share every
// behavior; only stats/avatar differ.
export const COMPANION_TYPES = {
  nguyen: { hp: 20, fireInterval: 2.0, avatar: 'nguyen', label: 'Mini Nguyên' },
  khoi: { hp: 30, fireInterval: 1.5, avatar: 'khoi', label: 'Mini Khôi' },
  father: { hp: 40, fireInterval: 1.0, avatar: 'father', label: 'Mini Father' }
};

export const MINI_SCALE = 0.5;
const MINI_RUN_OFFSET_X = -0.8;
const MINI_BOSS_OFFSET_X = 0.5;

export class MiniCompanion {
  constructor(type = 'nguyen') {
    const def = COMPANION_TYPES[type] || COMPANION_TYPES.nguyen;
    this.maxHp = def.hp;
    this.fireInterval = def.fireInterval;
    this.avatar = def.avatar;
    this.label = def.label;
    this.scale = MINI_SCALE;
    this.reset();
  }

  reset() {
    this.hp = this.maxHp;
    this.alive = true;
    this.fireTimer = this.fireInterval;
    this.x = 0;
    this.y = 0;
  }

  // Ticks the fire timer and returns true the frame a bullet should spawn.
  tickFire(dt) {
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer += this.fireInterval;
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
