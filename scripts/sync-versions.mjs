#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ROOT_PACKAGE = 'package.json';

const VERSION_PATTERN = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/;

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);

function discoverPackagePaths(baseDir = root) {
  const results = [];

  function walk(currentDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) {
        continue;
      }

      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.name === 'package.json') {
        results.push(relative(root, fullPath));
      }
    }
  }

  walk(baseDir);
  return results.sort();
}

function isVaagaDependency(name) {
  return name.startsWith('@vaagatech/');
}

function dependencyVersion(relativePath, version) {
  return relativePath.startsWith('demo/') ? version : `^${version}`;
}

function readPackage(relativePath) {
  const path = join(root, relativePath);
  return { path, pkg: JSON.parse(readFileSync(path, 'utf8')) };
}

function writePackage(relativePath, pkg) {
  const path = join(root, relativePath);
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

export function bumpPatch(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

function assertValidVersion(version, label = 'version') {
  if (!version || !VERSION_PATTERN.test(version)) {
    throw new Error(`Invalid ${label}: ${version ?? '(empty)'}`);
  }
}

function readRootVersion() {
  const { pkg } = readPackage(ROOT_PACKAGE);
  assertValidVersion(pkg.version, 'root package.json version');
  return pkg.version;
}

/** Prefer CI tag (v1.2.3), then explicit VERSION env, then root package.json. */
function resolveExpectedVersion(explicit) {
  if (explicit) {
    assertValidVersion(explicit);
    return explicit;
  }

  const tag = process.env.GITHUB_REF_NAME ?? process.env.GIT_TAG ?? '';
  if (tag.startsWith('v')) {
    const fromTag = tag.slice(1);
    assertValidVersion(fromTag, `tag ${tag}`);
    return fromTag;
  }

  if (process.env.RELEASE_VERSION) {
    assertValidVersion(process.env.RELEASE_VERSION, 'RELEASE_VERSION');
    return process.env.RELEASE_VERSION;
  }

  return readRootVersion();
}

function syncPackageVersion(relativePath, version) {
  const { pkg } = readPackage(relativePath);
  pkg.version = version;

  if (pkg.dependencies) {
    for (const name of Object.keys(pkg.dependencies)) {
      if (isVaagaDependency(name)) {
        pkg.dependencies[name] = dependencyVersion(relativePath, version);
      }
    }
  }

  writePackage(relativePath, pkg);
  console.log(`Updated ${relativePath} to ${version}`);
}

function syncVersion(version) {
  assertValidVersion(version);
  for (const relativePath of discoverPackagePaths()) {
    syncPackageVersion(relativePath, version);
  }
}

function verifyVersion(expectedVersion) {
  assertValidVersion(expectedVersion);
  const mismatches = [];

  for (const relativePath of discoverPackagePaths()) {
    const { pkg } = readPackage(relativePath);

    if (pkg.version !== expectedVersion) {
      mismatches.push(`${relativePath}: version is ${pkg.version}, expected ${expectedVersion}`);
    }

    if (pkg.dependencies) {
      for (const name of Object.keys(pkg.dependencies)) {
        if (!isVaagaDependency(name)) {
          continue;
        }

        const expected = dependencyVersion(relativePath, expectedVersion);
        if (pkg.dependencies[name] !== expected) {
          mismatches.push(
            `${relativePath}: ${name} is ${pkg.dependencies[name]}, expected ${expected}`,
          );
        }
      }
    }
  }

  if (mismatches.length > 0) {
    console.error('Version mismatch:');
    for (const mismatch of mismatches) {
      console.error(`  - ${mismatch}`);
    }
    process.exit(1);
  }

  console.log(`All package.json files match version ${expectedVersion}`);
}

const args = process.argv.slice(2);
const mode = args[0];

if (mode === '--check') {
  verifyVersion(resolveExpectedVersion(args[1]));
} else if (mode === '--bump-patch') {
  const current = args[1] ?? readRootVersion();
  assertValidVersion(current);
  const next = bumpPatch(current);
  syncVersion(next);
  console.log(`Bumped monorepo version ${current} → ${next}`);
} else if (mode === '--sync' || mode === undefined) {
  const version = readRootVersion();
  syncVersion(version);
  console.log(`Synced all package.json files to ${version}`);
} else if (VERSION_PATTERN.test(mode)) {
  syncVersion(mode);
} else {
  console.error('Usage:');
  console.error('  node scripts/sync-versions.mjs              # sync all to root package.json version');
  console.error('  node scripts/sync-versions.mjs --sync       # same as default');
  console.error('  node scripts/sync-versions.mjs --check      # verify (tag env or root version)');
  console.error('  node scripts/sync-versions.mjs --bump-patch # bump root patch and sync all');
  process.exit(1);
}
