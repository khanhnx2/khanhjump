const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

const cacheVersion = computeCacheVersion(webDir);
patchServiceWorkerCacheVersion(webDir, cacheVersion);

console.log(`Prepared Android web assets in ${path.relative(rootDir, webDir)}`);
console.log(`Cache version: ${cacheVersion}`);

// Content hash of the shipped assets (excluding the SW file itself) so every
// code change auto-busts the service worker cache without a manual bump.
function computeCacheVersion(dir) {
  const files = listFiles(dir)
    .filter((relativePath) => relativePath !== 'service-worker.js')
    .sort();

  const hash = crypto.createHash('sha256');
  for (const relativePath of files) {
    hash.update(relativePath);
    hash.update(fs.readFileSync(path.join(dir, relativePath)));
  }
  return hash.digest('hex').slice(0, 10);
}

function listFiles(dir, base = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(listFiles(fullPath, base));
    } else {
      files.push(path.relative(base, fullPath));
    }
  }
  return files;
}

function patchServiceWorkerCacheVersion(dir, version) {
  const swPath = path.join(dir, 'service-worker.js');
  const source = fs.readFileSync(swPath, 'utf8');
  const patched = source.replace('__CACHE_VERSION__', version);
  if (patched === source) {
    throw new Error('service-worker.js is missing the __CACHE_VERSION__ placeholder');
  }
  fs.writeFileSync(swPath, patched);
}
