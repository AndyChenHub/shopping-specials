#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(appDir, '..');

const appJsonPath = path.join(appDir, 'app.json');
const appPkgPath = path.join(appDir, 'package.json');
const rootPkgPath = path.join(rootDir, 'package.json');
const versionInfoPath = path.join(appDir, 'src', 'versionInfo.json');

function safeExec(cmd) {
  try {
    return execSync(cmd, { cwd: rootDir, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const appPkg = JSON.parse(fs.readFileSync(appPkgPath, 'utf8'));
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
const prevVersionInfo = fs.existsSync(versionInfoPath)
  ? JSON.parse(fs.readFileSync(versionInfoPath, 'utf8'))
  : {};

const rawBase = String(appJson?.expo?.version || '1.0.0').trim();
const semverMatch = rawBase.match(/^(\d+)\.(\d+)\.(\d+)/);
const major = semverMatch ? parseInt(semverMatch[1], 10) : 1;
const minor = semverMatch ? parseInt(semverMatch[2], 10) : 0;
const basePatch = semverMatch ? parseInt(semverMatch[3], 10) : 0;

// Inspect all existing git tags v<major>.<minor>.<patch>
const rawTags = safeExec('git tag -l "v*"');
const tagLines = rawTags.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);

let maxExistingPatch = -1;
const prefixRegex = new RegExp(`^v${major}\\.${minor}\\.(\\d+)$`);
for (const tag of tagLines) {
  const m = tag.match(prefixRegex);
  if (m) {
    const p = parseInt(m[1], 10);
    if (Number.isFinite(p) && p > maxExistingPatch) {
      maxExistingPatch = p;
    }
  }
}

const nextPatch =
  maxExistingPatch >= 0 ? Math.max(basePatch, maxExistingPatch + 1) : basePatch;
const nextVersion = `${major}.${minor}.${nextPatch}`;
const tagName = `v${nextVersion}`;

// Strictly monotonic integer buildNumber for iOS CFBundleVersion
const prevBuild = parseInt(String(appJson?.expo?.ios?.buildNumber || '0'), 10) || 0;
const ciRunNumber = parseInt(String(process.env.GITHUB_RUN_NUMBER || '0'), 10) || 0;
const nextBuild = Math.max(prevBuild + 1, ciRunNumber);
const buildNumberStr = String(nextBuild);

const gitSha = safeExec('git rev-parse --short HEAD') || 'local';
const repo =
  process.env.GITHUB_REPOSITORY ||
  prevVersionInfo.repo ||
  'AndyChenHub/shopping-specials';
const builtAt = new Date().toISOString();
const ipaFilename = `AussieSpecials-${tagName}-b${buildNumberStr}.ipa`;

// Update files prior to Expo Prebuild & Xcode compilation
appJson.expo.version = nextVersion;
appJson.expo.ios = {
  ...(appJson.expo.ios || {}),
  buildNumber: buildNumberStr,
};
appJson.expo.android = {
  ...(appJson.expo.android || {}),
  versionCode: nextBuild,
};
appPkg.version = nextVersion;
rootPkg.version = nextVersion;

const newVersionInfo = {
  version: nextVersion,
  buildNumber: buildNumberStr,
  tagName,
  gitSha,
  builtAt,
  repo,
};

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n', 'utf8');
fs.writeFileSync(appPkgPath, JSON.stringify(appPkg, null, 2) + '\n', 'utf8');
fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n', 'utf8');
fs.writeFileSync(
  versionInfoPath,
  JSON.stringify(newVersionInfo, null, 2) + '\n',
  'utf8'
);

console.log(`Prepared iOS release: ${tagName} (Build ${buildNumberStr}) [${gitSha}] -> ${ipaFilename}`);

if (process.env.GITHUB_OUTPUT) {
  const outLines = [
    `version=${nextVersion}`,
    `build_number=${buildNumberStr}`,
    `tag_name=${tagName}`,
    `ipa_filename=${ipaFilename}`,
    `git_sha=${gitSha}`,
  ];
  fs.appendFileSync(process.env.GITHUB_OUTPUT, outLines.join('\n') + '\n', 'utf8');
}
