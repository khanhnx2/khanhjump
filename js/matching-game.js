import { BEGINNER_WORDS } from './beginner-word-bank.js';

const PAIR_COUNT = 6;
const FLIP_BACK_MS = 650;
const FREQUENT_THRESHOLD = 5;
const FREQUENT_RANDOM_RANGE = 2;
const WORD_COUNT_KEY = 'khanhJumpWordAppearancesV1';

export class MatchingGame {
  constructor(root, onComplete) {
    this.root = root;
    this.board = root.querySelector('#matching-board');
    this.status = root.querySelector('#matching-status');
    this.onComplete = onComplete;
    this.openCards = [];
    this.matchedPairs = 0;
    this.locked = false;
    this.root.addEventListener('mousedown', (event) => event.stopPropagation());
    this.root.addEventListener('touchstart', (event) => event.stopPropagation(), { passive: true });
    this.root.addEventListener('click', (event) => this.handleClick(event));
  }

  start() {
    this.openCards = [];
    this.matchedPairs = 0;
    this.locked = false;
    this.root.classList.remove('hidden');
    const round = createRound();
    this.renderBoard(round.cards, round.revealAll);
    this.updateStatus();
  }

  hide() {
    this.root.classList.add('hidden');
  }

  handleClick(event) {
    const card = event.target.closest('.matching-card');
    if (!card || this.locked || card.classList.contains('matched') || card.classList.contains('open')) return;

    card.classList.add('open');
    this.openCards.push(card);
    if (this.openCards.length === 2) this.checkOpenCards();
  }

  checkOpenCards() {
    const [first, second] = this.openCards;
    const isMatch = first.dataset.pairId === second.dataset.pairId;
    if (isMatch) {
      first.classList.add('matched');
      second.classList.add('matched');
      this.openCards = [];
      this.matchedPairs += 1;
      this.updateStatus();
      if (this.matchedPairs === PAIR_COUNT) this.finish();
      return;
    }

    this.locked = true;
    window.setTimeout(() => {
      first.classList.remove('open');
      second.classList.remove('open');
      this.openCards = [];
      this.locked = false;
    }, FLIP_BACK_MS);
  }

  finish() {
    this.locked = true;
    window.setTimeout(() => {
      this.hide();
      this.onComplete();
    }, 350);
  }

  renderBoard(cards, revealAll) {
    this.board.innerHTML = '';
    for (const card of cards) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = revealAll ? 'matching-card revealed' : 'matching-card';
      button.dataset.pairId = card.pairId;
      button.textContent = card.text;
      this.board.appendChild(button);
    }
  }

  updateStatus() {
    this.status.textContent = `${this.matchedPairs}/${PAIR_COUNT}`;
  }
}

function createRound() {
  const round = choosePairsForRound();
  incrementAppearanceCounts(round.pairs);
  return {
    revealAll: round.revealAll,
    cards: shuffle(round.pairs.flatMap((pair, index) => [
    { pairId: String(index), text: pair.word },
    { pairId: String(index), text: pair.meaning }
    ]))
  };
}

function choosePairsForRound() {
  const counts = loadAppearanceCounts();
  const frequent = BEGINNER_WORDS.filter((item) => countFor(counts, item) >= FREQUENT_THRESHOLD);
  if (frequent.length >= PAIR_COUNT && Math.floor(Math.random() * FREQUENT_RANDOM_RANGE) === 0) {
    return { pairs: sampleUniquePairs(frequent), revealAll: false };
  }

  return { pairs: leastSeenPairs(counts), revealAll: true };
}

function leastSeenPairs(counts) {
  return shuffle([...BEGINNER_WORDS])
    .sort((a, b) => countFor(counts, a) - countFor(counts, b))
    .slice(0, PAIR_COUNT);
}

function sampleUniquePairs(sourceWords) {
  const shuffled = shuffle([...sourceWords]);
  const chosen = [];
  const usedWords = new Set();
  const usedMeanings = new Set();

  for (const item of shuffled) {
    if (usedWords.has(item.word) || usedMeanings.has(item.meaning)) continue;
    chosen.push(item);
    usedWords.add(item.word);
    usedMeanings.add(item.meaning);
    if (chosen.length === PAIR_COUNT) return chosen;
  }
  return chosen;
}

function incrementAppearanceCounts(pairs) {
  const counts = loadAppearanceCounts();
  for (const pair of pairs) counts[pair.word] = countFor(counts, pair) + 1;
  saveAppearanceCounts(counts);
}

function countFor(counts, item) {
  return Number(counts[item.word] || 0);
}

function loadAppearanceCounts() {
  try {
    return JSON.parse(localStorage.getItem(WORD_COUNT_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAppearanceCounts(counts) {
  try {
    localStorage.setItem(WORD_COUNT_KEY, JSON.stringify(counts));
  } catch {
    // Matching still works when storage is unavailable.
  }
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
