#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const appDir = path.join(rootDir, 'app');

const bumpType = (process.argv[2] || 'patch').toLowerCase();
if (!['major', 'minor', 'patch'].includes(bumpType)) {
  console.error('Usage: node scripts/bump-version.mjs <patch|minor|major>');
  process.exit(1);
}

const appJsonPath = path.join(appDir, 'app.json');
const appPkgPath = path.join(appDir, 'package.json');
const rootPkgPath = path.join(rootDir, 'package.json');
const versionInfoPath = path.join(appDir, 'src', 'versionInfo.json');

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const appPkg = JSON.parse(fs.readFileSync(appPkgPath, 'utf8'));
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
const prevInfo = fs.existsSync(versionInfoPath)
  ? JSON.parse(fs.readFileSync(versionInfoPath, 'utf8'))
  : {};

const current = String(appJson?.expo?.version || '1.0.0').trim();
const m = current.match(/^(\d+)\.(\d+)\.(\d+)/);
let major = m ? parseInt(m[1], 10) : 1;
let minor = m ? parseInt(m[2], 10) : 0;
let patch = m ? parseInt(m[3], 10) : 0;

if (bumpType === 'major') {
  major += 1;
  minor = 0;
  patch = 0;
} else if (bumpType === 'minor') {
  minor += 1;
  patch = 0;
} else {
  patch += 1;
}

const nextVersion = `${major}.${minor}.${patch}`;
const prevBuild = parseInt(String(appJson?.expo?.ios?.buildNumber || '1'), 10) || 1;
const nextBuild = String(prevBuild + 1);

let gitSha = 'local';
try {
  gitSha = execSync('git rev-parse --short HEAD', {
    cwd: rootDir,
    encoding: 'utf8',
  }).trim();
} catch {
  // ignore
}

appJson.expo.version = nextVersion;
appJson.expo.ios = { ...(appJson.expo.ios || {}), buildNumber: nextBuild };
appPkg.version = nextVersion;
rootPkg.version = nextVersion;

const updatedInfo = {
  version: nextVersion,
  buildNumber: nextBuild,
  tagName: `v${nextVersion}`,
  gitSha,
  builtAt: new Date().toISOString(),
  repo: prevInfo.repo || 'AndyChenHub/shopping-specials',
};

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n', 'utf8');
fs.writeFileSync(appPkgPath, JSON.stringify(appPkg, null, 2) + '\n', 'utf8');
fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n', 'utf8');
fs.writeFileSync(versionInfoPath, JSON.stringify(updatedInfo, null, 2) + '\n', 'utf8');

console.log(`Bumped app version: ${current} -> ${nextVersion} (iOS Build ${nextBuild})`);
