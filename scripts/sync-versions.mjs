#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const VERSION_PATTERN = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/;

const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);

function discoverPackagePaths(baseDir = root) {
  const results = [];

  function walk(currentDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) {
        continue;
      }

      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.name === "package.json") {
        results.push(relative(root, fullPath));
      }
    }
  }

  walk(baseDir);
  return results.sort();
}

function isVaagaDependency(name) {
  return name.startsWith("@vaagatech/");
}

function dependencyVersion(relativePath, version) {
  return relativePath.startsWith("demo/") ? version : `^${version}`;
}

function readPackage(relativePath) {
  const path = join(root, relativePath);
  return { path, pkg: JSON.parse(readFileSync(path, "utf8")) };
}

function writePackage(relativePath, pkg) {
  const path = join(root, relativePath);
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
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
  for (const relativePath of discoverPackagePaths()) {
    syncPackageVersion(relativePath, version);
  }
}

function verifyVersion(expectedVersion) {
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
    console.error("Version mismatch:");
    for (const mismatch of mismatches) {
      console.error(`  - ${mismatch}`);
    }
    process.exit(1);
  }

  console.log(`All package.json files match version ${expectedVersion}`);
}

export function bumpPatch(version) {
  const [major, minor, patch] = version.split(".").map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

const [mode, value] = process.argv.slice(2);

if (mode === "--check") {
  if (!value || !VERSION_PATTERN.test(value)) {
    console.error("Usage: node scripts/sync-versions.mjs --check <version>");
    process.exit(1);
  }
  verifyVersion(value);
} else if (mode === "--bump-patch") {
  if (!value || !VERSION_PATTERN.test(value)) {
    console.error("Usage: node scripts/sync-versions.mjs --bump-patch <version>");
    process.exit(1);
  }
  console.log(bumpPatch(value));
} else if (mode && VERSION_PATTERN.test(mode)) {
  syncVersion(mode);
} else {
  console.error("Usage:");
  console.error("  node scripts/sync-versions.mjs <version>");
  console.error("  node scripts/sync-versions.mjs --check <version>");
  console.error("  node scripts/sync-versions.mjs --bump-patch <version>");
  process.exit(1);
}
