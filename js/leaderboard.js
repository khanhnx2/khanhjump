const STORAGE_KEY = 'khanh-jump-top-ten';
const MAX_SCORES = 10;

function readScores() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeScores(scores) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

function sortScores(scores) {
  return scores.sort((a, b) => {
    const progressDiff = getProgress(b) - getProgress(a);
    if (progressDiff !== 0) return progressDiff;
    if (a.attempts !== b.attempts) return a.attempts - b.attempts;
    return a.seconds - b.seconds;
  });
}

function getProgress(score) {
  return Number.isFinite(score.progress) ? score.progress : 1;
}

function formatSeconds(seconds) {
  return `${seconds.toFixed(1)}s`;
}

function formatProgress(score) {
  return `${Math.round(getProgress(score) * 100)}%`;
}

function formatLevel(score) {
  return `L${score.level || 1}`;
}

export class Leaderboard {
  constructor(listEl) {
    this.listEl = listEl;
    this.render();
  }

  record({ character, attempts, seconds, progress, level, completed }) {
    const scores = sortScores([
      ...readScores(),
      {
        character,
        attempts,
        seconds: Number(seconds.toFixed(2)),
        progress: Number(progress.toFixed(4)),
        level,
        completed,
        date: Date.now()
      }
    ]).slice(0, MAX_SCORES);

    writeScores(scores);
    this.render(scores);
  }

  render(scores = readScores()) {
    this.listEl.textContent = '';

    if (scores.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'score-empty';
      empty.textContent = 'Chưa có điểm';
      this.listEl.appendChild(empty);
      return;
    }

    sortScores(scores).slice(0, MAX_SCORES).forEach((score) => {
      const item = document.createElement('li');
      const status = score.completed === false ? 'run' : 'clear';
      item.textContent = `${score.character} · ${formatLevel(score)} · ${formatProgress(score)} · ${score.attempts} attempt · ${formatSeconds(score.seconds)} · ${status}`;
      this.listEl.appendChild(item);
    });
  }
}
