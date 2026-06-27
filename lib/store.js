'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const TARGETS_DIR = path.join(DATA_DIR, 'targets');
const MANIFEST_PATH = path.join(DATA_DIR, 'manifest.json');
const BUNDLED_TARGET = path.join(__dirname, '..', 'targets.mind');

function ensureDirs() {
  fs.mkdirSync(TARGETS_DIR, { recursive: true });
}

function readManifest() {
  ensureDirs();
  if (!fs.existsSync(MANIFEST_PATH)) {
    return seedManifest();
  }
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return seedManifest();
  }
}

function writeManifest(manifest) {
  ensureDirs();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function seedManifest() {
  ensureDirs();
  const id = 'default';
  const targetPath = path.join(TARGETS_DIR, `${id}.mind`);

  if (fs.existsSync(BUNDLED_TARGET) && !fs.existsSync(targetPath)) {
    fs.copyFileSync(BUNDLED_TARGET, targetPath);
  }

  const manifest = {
    activeId: fs.existsSync(targetPath) ? id : null,
    targets: fs.existsSync(targetPath)
      ? [{
          id,
          name: 'Bundled salmon sign',
          imageNames: ['(bundled)'],
          imageCount: 1,
          createdAt: new Date().toISOString(),
        }]
      : [],
  };

  writeManifest(manifest);
  return manifest;
}

function getTargetPath(id) {
  return path.join(TARGETS_DIR, `${id}.mind`);
}

function listTargets() {
  const manifest = readManifest();
  return {
    activeId: manifest.activeId,
    targets: manifest.targets.map((t) => ({
      ...t,
      active: t.id === manifest.activeId,
    })),
  };
}

function getActiveTarget() {
  const manifest = readManifest();
  if (!manifest.activeId) return null;

  const meta = manifest.targets.find((t) => t.id === manifest.activeId);
  const filePath = getTargetPath(manifest.activeId);
  if (!meta || !fs.existsSync(filePath)) return null;

  return { meta, filePath };
}

function createTarget({ name, imageNames, mindBuffer }) {
  const manifest = readManifest();
  const id = crypto.randomBytes(8).toString('hex');
  const filePath = getTargetPath(id);

  try {
    fs.writeFileSync(filePath, mindBuffer);
  } catch (err) {
    throw new Error(`Could not save target file: ${err.message}`);
  }

  const entry = {
    id,
    name: name || `Target set ${manifest.targets.length + 1}`,
    imageNames: imageNames || [],
    imageCount: (imageNames || []).length,
    createdAt: new Date().toISOString(),
  };

  manifest.targets.unshift(entry);
  manifest.activeId = id;
  writeManifest(manifest);

  return entry;
}

function createTargetFromFile({ name, imageNames, sourcePath }) {
  const manifest = readManifest();
  const id = crypto.randomBytes(8).toString('hex');
  const filePath = getTargetPath(id);

  try {
    fs.renameSync(sourcePath, filePath);
  } catch (err) {
    try {
      fs.copyFileSync(sourcePath, filePath);
      fs.unlinkSync(sourcePath);
    } catch (copyErr) {
      throw new Error(`Could not save target file: ${copyErr.message}`);
    }
  }

  const entry = {
    id,
    name: name || `Target set ${manifest.targets.length + 1}`,
    imageNames: imageNames || [],
    imageCount: (imageNames || []).length,
    createdAt: new Date().toISOString(),
  };

  manifest.targets.unshift(entry);
  manifest.activeId = id;
  writeManifest(manifest);

  return entry;
}

function setActive(id) {
  const manifest = readManifest();
  const exists = manifest.targets.some((t) => t.id === id);
  if (!exists) return false;
  if (!fs.existsSync(getTargetPath(id))) return false;

  manifest.activeId = id;
  writeManifest(manifest);
  return true;
}

function deleteTarget(id) {
  const manifest = readManifest();
  const idx = manifest.targets.findIndex((t) => t.id === id);
  if (idx === -1) return false;

  manifest.targets.splice(idx, 1);
  const filePath = getTargetPath(id);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  if (manifest.activeId === id) {
    manifest.activeId = manifest.targets[0]?.id || null;
  }

  writeManifest(manifest);
  return true;
}

module.exports = {
  DATA_DIR,
  TARGETS_DIR,
  listTargets,
  getActiveTarget,
  createTarget,
  createTargetFromFile,
  setActive,
  deleteTarget,
};
