// Boss roster and per-level fight queues for levels 11-20 and 21-30.
// `avatar` selects which family PNG gets the dark tint; big variants reuse it at 1.5x.
// 21-30 mirrors 11-20 exactly; the Mini Nguyên/Mini Black Nguyên companions
// added on top of those fights live in mini-companion-state.js and boss-fight-state.js.

export const BOSS_TYPES = {
  nguyen: { avatar: 'nguyen', hp: 10, fireInterval: 2.0, scale: 1 },
  khoi: { avatar: 'khoi', hp: 20, fireInterval: 1.5, scale: 1 },
  father: { avatar: 'father', hp: 30, fireInterval: 1.0, scale: 1 },
  'big-nguyen': { avatar: 'nguyen', hp: 15, fireInterval: 1.5, scale: 1.5 },
  'big-khoi': { avatar: 'khoi', hp: 25, fireInterval: 1.0, scale: 1.5 },
  'big-father': { avatar: 'father', hp: 40, fireInterval: 0.5, scale: 1.5 }
};

export const BOSS_LABELS = {
  nguyen: 'Black Nguyên',
  khoi: 'Black Khôi',
  father: 'Black Father',
  'big-nguyen': 'Big Black Nguyên',
  'big-khoi': 'Big Black Khôi',
  'big-father': 'Big Black Father'
};

const BOSS_SEQUENCES = {
  11: ['nguyen'],
  12: ['khoi'],
  13: ['father'],
  14: ['nguyen', 'khoi'],
  15: ['nguyen', 'father'],
  16: ['khoi', 'father'],
  17: ['nguyen', 'khoi', 'father'],
  18: ['nguyen', 'big-nguyen'],
  19: ['khoi', 'big-khoi'],
  20: ['father', 'big-father'],
  21: ['nguyen'],
  22: ['khoi'],
  23: ['father'],
  24: ['nguyen', 'khoi'],
  25: ['nguyen', 'father'],
  26: ['khoi', 'father'],
  27: ['nguyen', 'khoi', 'father'],
  28: ['nguyen', 'big-nguyen'],
  29: ['khoi', 'big-khoi'],
  30: ['father', 'big-father'],
  31: ['nguyen'],
  32: ['khoi'],
  33: ['father'],
  34: ['nguyen', 'khoi'],
  35: ['nguyen', 'father'],
  36: ['khoi', 'father'],
  37: ['nguyen', 'khoi', 'father'],
  38: ['nguyen', 'big-nguyen'],
  39: ['khoi', 'big-khoi'],
  40: ['father', 'big-father'],
  41: ['nguyen'],
  42: ['khoi'],
  43: ['father'],
  44: ['nguyen', 'khoi'],
  45: ['nguyen', 'father'],
  46: ['khoi', 'father'],
  47: ['nguyen', 'khoi', 'father'],
  48: ['nguyen', 'big-nguyen'],
  49: ['khoi', 'big-khoi'],
  50: ['father', 'big-father']
};

// Fresh objects per call so a fight can mutate hp without touching level data.
// Caller (level-data.js) already reduces levels 51-100 to their 1-50 source
// number before calling this, so levelNumber here is always <= 50.
export function getBossSequence(levelNumber) {
  const keys = BOSS_SEQUENCES[levelNumber] || [];
  return keys.map((key) => ({ key, ...BOSS_TYPES[key] }));
}
