import { LEVEL_COUNT } from './level-data.js';

const STORAGE_KEY = 'khanhJumpCharacterLevelsV1';

export function getCharacterLevel(character) {
  const progress = readProgress();
  return clampLevel(progress[character] || 1);
}

export function completeCharacterLevel(character, completedLevel) {
  const progress = readProgress();
  progress[character] = clampLevel(Math.max(getCharacterLevel(character), completedLevel + 1));
  writeProgress(progress);
  return progress[character];
}

function clampLevel(level) {
  return Math.max(1, Math.min(LEVEL_COUNT, Number(level) || 1));
}

function readProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Progress falls back to level 1 if storage is unavailable.
  }
}
