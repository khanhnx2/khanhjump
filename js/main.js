import { TILE, setPlayerFace } from './player-cube.js';
import { GameState } from './game-state.js';
import { drawObstacles, drawFinishLine } from './obstacle-renderer.js';
import { drawPickups, drawProjectiles } from './power-up-renderer.js';
import { drawBackground, drawFloor } from './background-parallax.js';
import { ParticleSystem } from './particle-effects.js';
import { Hud } from './hud-progress.js';
import { AudioManager } from './audio-manager.js';
import { Leaderboard } from './leaderboard.js';
import { MatchingGame } from './matching-game.js';
import { completeCharacterLevel, getCharacterLevel } from './character-level-progress.js';
import { CharacterManager } from './character-manager.js';
import { initAboutScreen } from './about-screen.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('message-overlay');
const messageTitle = document.getElementById('message-title');
const messageText = document.getElementById('message-text');
const characterSelect = document.getElementById('character-select');
const topTenPanel = document.getElementById('top-ten-panel');
const topTenList = document.getElementById('top-ten-list');
const matchingOverlay = document.getElementById('matching-overlay');
const aboutButton = document.getElementById('about-btn');
const aboutOverlay = document.getElementById('about-overlay');

const MAX_DT = 1 / 30;
const MAX_DPR = 2;

const view = {
  width: 0,
  height: 0,
  cameraX: 0,
  floorY: 0,
  anchorX: 0,
  worldToScreenX(wx) {
    return (wx - this.cameraX) * TILE + this.anchorX;
  },
  worldToScreenY(wy) {
    return this.floorY - wy * TILE;
  },
  screenToWorldX(sx) {
    return (sx - this.anchorX) / TILE + this.cameraX;
  },
};

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  view.width = width;
  view.height = height;
  view.floorY = Math.round(height * 0.72);
  view.anchorX = Math.round(width * 0.25);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);
resize();

let selectedCharacter = null;

function applyCharacterLevel() {
  game.setLevel(getCharacterLevel(selectedCharacter.id));
  updateStartCopy();
}

function updateStartCopy() {
  messageText.textContent = `Level ${game.level.number} · Tap to start`;
}

function selectCharacter(character) {
  selectedCharacter = character;
  setPlayerFace(character.faceSrc);
  applyCharacterLevel();
}

topTenPanel.addEventListener('mousedown', (event) => event.stopPropagation());
topTenPanel.addEventListener('touchstart', (event) => event.stopPropagation(), { passive: true });

const game = new GameState();
const particles = new ParticleSystem();
const audio = new AudioManager(game);
const hud = new Hud(game, audio);
const leaderboard = new Leaderboard(topTenList);
const matchingGame = new MatchingGame(matchingOverlay, () => game.startAfterMatch());
const characterManager = new CharacterManager(characterSelect, selectCharacter);
initAboutScreen({ openButton: aboutButton, overlay: aboutOverlay });
window.__game = game;
selectCharacter(characterManager.selected);

game.on('matchRequired', () => {
  characterSelect.classList.add('hidden');
  overlay.classList.add('hidden');
  matchingGame.start();
});
game.on('start', () => {
  characterSelect.classList.add('hidden');
  overlay.classList.add('hidden');
});
game.on('win', () => {
  const completedLevel = game.level.number;
  const nextLevel = completeCharacterLevel(selectedCharacter.id, completedLevel);
  leaderboard.record({
    character: selectedCharacter.name,
    attempts: game.attempts,
    seconds: game.elapsedSeconds,
    progress: game.progress,
    completed: true,
    level: completedLevel
  });
  game.setLevel(nextLevel);
  messageTitle.textContent = `LEVEL ${completedLevel} COMPLETE!`;
  messageText.textContent = `Next: Level ${game.level.number} · Attempts: ${game.attempts}`;
  characterSelect.classList.remove('hidden');
  overlay.classList.remove('hidden');
});
game.on('restart', () => {
  overlay.classList.add('hidden');
});
game.on('death', () => {
  leaderboard.record({
    character: selectedCharacter.name,
    attempts: game.attempts,
    seconds: game.elapsedSeconds,
    progress: game.progress,
    completed: false,
    level: game.level.number
  });
  particles.burst(game.player.x, game.player.y);
  messageTitle.textContent = 'GAME OVER';
  messageText.textContent = `Level ${game.level.number} · ${Math.round(game.progress * 100)}% · Tap to retry`;
  characterSelect.classList.remove('hidden');
  overlay.classList.remove('hidden');
});

function render() {
  drawBackground(ctx, view);
  drawFloor(ctx, view);
  drawPickups(ctx, game.pickups, view);
  drawObstacles(ctx, game.obstacles, view);
  drawProjectiles(ctx, game.projectiles, view);
  drawFinishLine(ctx, game.level.length, view);

  if (game.state !== 'dead') {
    game.player.draw(ctx, view);
  }

  particles.draw(ctx, view);
}

let lastTime = performance.now();

function frame(now) {
  if (!now) now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, MAX_DT);
  lastTime = now;

  game.update(dt);
  view.cameraX = game.player.x;

  if (game.state === 'playing') {
    particles.emitTrail(dt, game.player);
  }
  particles.update(dt);
  hud.update(dt);

  render();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      // The game still works in browsers that block service workers.
    });
  });
}
