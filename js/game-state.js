import { PlayerCube } from './player-cube.js';
import { levels } from './level-data.js';
import { resolveCollisions } from './collision-detection.js';
import { findProjectileHit } from './projectile-collision.js';
import { BossFight } from './boss-fight-state.js';
import { MiniCompanion } from './mini-companion-state.js';

// State machine: ready → playing → dead/win → playing
const FLY_SECONDS = 3;
const POST_FLY_INVINCIBLE_SECONDS = 2;
const SHIELD_SECONDS = 3;
const AUTO_FIRE_SECONDS = 2.5;
const AUTO_FIRE_INTERVAL = 0.25;
const MAX_AMMO = AUTO_FIRE_SECONDS / AUTO_FIRE_INTERVAL;
const START_HEARTS = 10;
const MAX_HEARTS = 10;
const PROJECTILE_SPEED = 22;
const PROJECTILE_RADIUS = 0.18;
const HEART_PICKUPS = { father: 2, khoi: 1, nguyen: 1 };
const MATCHING_RANDOM_RANGE = 3;
const BOSS_PLAYER_FIRE_INTERVAL = 0.5;

export class GameState {
  constructor() {
    this.player = new PlayerCube();
    this.state = 'ready';
    this.attempts = 1;
    this.inputHeld = false;
    this.elapsedSeconds = 0;
    this.ammo = 0;
    this.autoFireTimer = 0;
    this.hearts = START_HEARTS;
    this.flyTimer = 0;
    this.invincibleTimer = 0;
    this.levelIndex = 0;
    this.level = levels[this.levelIndex];
    this.obstacles = [];
    this.pickups = [];
    this.projectiles = [];
    this.bossFight = null;
    this.bossFireTimer = 0;
    this.miniNguyen = null;
    this.listeners = { damage: [], death: [], restart: [], win: [], start: [], powerup: [], health: [], matchRequired: [], bossStart: [], bossDefeated: [] };
    this.resetLevelObjects();
    this.bindInput();
  }
  on(event, fn) {
    this.listeners[event].push(fn);
  }
  emit(event) {
    for (const fn of this.listeners[event]) fn(this);
  }
  setLevel(levelNumber) {
    this.levelIndex = Math.max(0, Math.min(levels.length - 1, levelNumber - 1));
    this.level = levels[this.levelIndex];
    this.bossFight = null;
    this.miniNguyen = this.level.companionType ? new MiniCompanion(this.level.companionType) : null;
    this.player.reset();
    this.elapsedSeconds = 0;
    this.resetLevelObjects();
  }
  bindInput() {
    const press = (e) => {
      if (e && e.type === 'keydown' && e.code !== 'Space') return;
      if (e && e.type === 'keydown' && e.repeat) return;
      if (e && e.cancelable) e.preventDefault();
      this.inputHeld = true;
      this.handlePress();
    };
    const release = (e) => {
      if (e && e.type === 'keyup' && e.code !== 'Space') return;
      this.inputHeld = false;
    };
    window.addEventListener('keydown', press);
    window.addEventListener('keyup', release);
    window.addEventListener('mousedown', press);
    window.addEventListener('mouseup', release);
    window.addEventListener('touchstart', press, { passive: false });
    window.addEventListener('touchend', release);
    window.addEventListener('touchcancel', release);
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  handlePress() {
    if (this.state === 'ready' || this.state === 'win' || this.state === 'dead') {
      this.requestRunStart();
    } else if (this.state === 'playing' || this.state === 'boss') {
      this.player.jump();
    }
  }
  requestRunStart() {
    if (Math.floor(Math.random() * MATCHING_RANDOM_RANGE) === 0) {
      this.emit('matchRequired');
    } else {
      this.startAfterMatch();
    }
  }
  startAfterMatch() {
    if (this.state === 'ready') {
      this.elapsedSeconds = 0;
      this.state = 'playing';
      this.emit('start');
    } else if (this.state === 'win') {
      this.attempts = 1;
      this.restart();
    } else if (this.state === 'dead') {
      this.restart();
    }
  }
  restart() {
    this.player.reset();
    this.elapsedSeconds = 0;
    this.ammo = 0;
    this.autoFireTimer = 0;
    this.hearts = START_HEARTS;
    this.flyTimer = 0;
    this.invincibleTimer = 0;
    this.projectiles = [];
    this.bossFight = null;
    this.bossFireTimer = 0;
    this.miniNguyen = this.level.companionType ? new MiniCompanion(this.level.companionType) : null;
    this.resetLevelObjects();
    this.state = 'playing';
    this.emit('health');
    this.emit('restart');
  }
  shoot() {
    if (this.state !== 'playing' || this.ammo <= 0) return false;
    this.ammo -= 1;
    this.projectiles.push({ x: this.player.x + 1, y: this.player.y + 0.5 });
    return true;
  }
  resetLevelObjects() {
    this.obstacles = this.level.obstacles.map((obstacle) => ({ ...obstacle }));
    this.pickups = this.level.pickups.map((pickup) => ({ ...pickup, collected: false }));
  }
  die() {
    this.state = 'dead';
    this.emit('death');
    this.attempts += 1;
  }
  update(dt) {
    if (this.state === 'boss') return this.updateBossFight(dt);
    if (this.state !== 'playing') return;
    this.elapsedSeconds += dt;
    const wasFlying = this.flyTimer > 0;
    this.flyTimer = Math.max(0, this.flyTimer - dt);
    this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
    this.updateAutoFire(dt);
    const prevBottom = this.player.y;
    this.player.update(dt, this.inputHeld, this.flyTimer > 0);
    if (wasFlying && this.flyTimer <= 0 && !this.player.grounded) {
      this.invincibleTimer = POST_FLY_INVINCIBLE_SECONDS;
    }
    this.collectPickups();
    this.updateProjectiles(dt);
    if (this.miniNguyen && this.miniNguyen.alive) this.updateMiniNguyen(dt);
    const hitObstacle = resolveCollisions(this.player, prevBottom, this.obstacles);
    if (hitObstacle) {
      if (this.invincibleTimer > 0) this.destroyObstacle(hitObstacle);
      else this.takeDamage(hitObstacle);
    }
    if (this.state === 'dead') return;
    if (this.player.x >= this.level.length) {
      if (this.level.bossSequence && this.level.bossSequence.length) this.enterBossFight();
      else this.winLevel();
    }
  }
  winLevel() {
    this.state = 'win';
    this.emit('win');
  }
  enterBossFight() {
    // The duel starts clean: any leftover run power-ups are dropped.
    this.flyTimer = 0;
    this.invincibleTimer = 0;
    this.ammo = 0;
    this.projectiles = [];
    this.bossFireTimer = BOSS_PLAYER_FIRE_INTERVAL;
    this.bossFight = new BossFight(this.level.bossSequence, this.player.x, this.miniNguyen, Boolean(this.level.companionType));
    this.state = 'boss';
    this.emit('bossStart');
  }
  updateBossFight(dt) {
    this.elapsedSeconds += dt;
    this.player.update(dt, this.inputHeld, false, true);
    this.bossFireTimer -= dt;
    if (this.bossFireTimer <= 0) {
      this.bossFireTimer += BOSS_PLAYER_FIRE_INTERVAL;
      this.bossFight.shootFromPlayer(this.player);
    }
    this.bossFight.update(dt, this.player);
    if (this.bossFight.bossDefeated) this.emit('bossDefeated');
    if (this.bossFight.playerHit) {
      this.hearts = Math.max(0, this.hearts - 1);
      this.player.flash();
      this.emit('damage');
      this.emit('health');
      if (this.hearts <= 0) return this.die();
    }
    if (this.bossFight.done) this.winLevel();
  }
  // Mini Nguyên is immune to run-phase obstacles: it mirrors the player's y
  // in real time at a fixed x offset rather than replaying it with a matching
  // delay, so its arc doesn't track the terrain's jump-timing the way the
  // player's does — obstacle contact would punish it for gaps it can't
  // actually dodge. It only takes damage from boss bullets it shields.
  updateMiniNguyen(dt) {
    const shouldFire = this.miniNguyen.updateRun(dt, this.player);
    if (shouldFire) {
      this.projectiles.push({ x: this.miniNguyen.x + 1, y: this.miniNguyen.y + 0.5, fromMini: true });
    }
  }
  get progress() {
    return Math.min(1, Math.max(0, this.player.x / this.level.length));
  }
  collectPickups() {
    for (const pickup of this.pickups) {
      if (pickup.collected || pickup.x + 1 < this.player.x || pickup.x > this.player.x + 1) continue;
      if (this.player.y < pickup.y + 1 && this.player.y + 1 > pickup.y) {
        pickup.collected = true;
        if (pickup.type === 'wings') this.flyTimer = FLY_SECONDS;
        if (pickup.type === 'shield') this.invincibleTimer = SHIELD_SECONDS;
        if (pickup.type === 'gun') {
          this.ammo = MAX_AMMO;
          this.autoFireTimer = 0;
        }
        if (HEART_PICKUPS[pickup.type]) {
          this.hearts = Math.min(MAX_HEARTS, this.hearts + HEART_PICKUPS[pickup.type]);
          this.emit('health');
        }
        this.emit('powerup');
      }
    }
  }
  destroyObstacle(obstacle) {
    obstacle.destroyed = true;
    this.obstacles = this.obstacles.filter((item) => !item.destroyed);
  }
  takeDamage(obstacle) {
    this.destroyObstacle(obstacle);
    this.hearts = Math.max(0, this.hearts - 1);
    this.player.flash();
    this.emit('damage');
    this.emit('health');
    if (this.hearts <= 0) this.die();
  }
  updateProjectiles(dt) {
    for (const projectile of this.projectiles) {
      projectile.x += PROJECTILE_SPEED * dt;
      const hit = findProjectileHit(projectile, this.obstacles, PROJECTILE_RADIUS);
      if (hit) {
        hit.destroyed = true;
        projectile.destroyed = true;
      }
    }
    this.obstacles = this.obstacles.filter((obstacle) => !obstacle.destroyed);
    this.projectiles = this.projectiles.filter(
      (projectile) => !projectile.destroyed && projectile.x < this.player.x + 24
    );
  }
  updateAutoFire(dt) {
    if (this.ammo <= 0) return;
    this.autoFireTimer -= dt;
    if (this.autoFireTimer > 0) return;
    this.shoot();
    this.autoFireTimer = AUTO_FIRE_INTERVAL;
  }
}
