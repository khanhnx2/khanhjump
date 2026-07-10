const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'www');
const entries = [
  'index.html',
  'styles.css',
  'styles-characters.css',
  'styles-leaderboard.css',
  'styles-powerups.css',
  'styles-matching.css',
  'styles-about.css',
  'styles-landscape.css',
  'manifest.webmanifest',
  'service-worker.js',
  'assets',
  'js'
];

fs.rmSync(webDir, { recursive: true, force: true });
fs.mkdirSync(webDir, { recursive: true });

for (const entry of entries) {
  const source = path.join(rootDir, entry);
  const destination = path.join(webDir, entry);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing Android web asset: ${entry}`);
  }

  fs.cpSync(source, destination, { recursive: true });
}

console.log(`Prepared Android web assets in ${path.relative(rootDir, webDir)}`);
