'use strict';

// Lightweight sanity check — no test framework, no dependencies.
// CI runs this to confirm required assets and vendor libs are present.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const REQUIRED = [
  'index.html',
  'loading-test.html',
  'server.js',
  'package.json',
  'salmon.glb',
  'targets.mind',
  'vendor/aframe-1.6.0.min.js',
  'vendor/mindar-image-aframe.prod.js',
  'vendor/aframe-extras-7.2.0.min.js',
];

let failed = false;

for (const rel of REQUIRED) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    console.error(`missing: ${rel}`);
    failed = true;
    continue;
  }
  const stat = fs.statSync(abs);
  if (!stat.isFile()) {
    console.error(`not a file: ${rel}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`ok — ${REQUIRED.length} required files present`);
