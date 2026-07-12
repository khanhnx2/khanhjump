// Boss roster and per-level fight queues for levels 11-20.
// `avatar` selects which family PNG gets the dark tint; big variants reuse it at 1.5x.

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
  20: ['father', 'big-father']
};

// Fresh objects per call so a fight can mutate hp without touching level data.
export function getBossSequence(levelNumber) {
  const keys = BOSS_SEQUENCES[levelNumber] || [];
  return keys.map((key) => ({ key, ...BOSS_TYPES[key] }));
}
