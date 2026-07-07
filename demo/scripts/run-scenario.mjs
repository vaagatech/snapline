#!/usr/bin/env node
/**
 * Run one or all demo scenarios from the repo root with local mock API / SQLite when needed.
 *
 * Usage:
 *   npm run demo:list
 *   npm run demo:run -- api-vs-file-graphql
 *   npm run demo:run -- --build api-vs-file-graphql   # build scenario first
 *   npm run demo:all
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DOCS_URL, SCENARIO_META, SCENARIO_ORDER, PYTHON_DOCS_URL, workspaceName } from './scenario-registry.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '../..');
const scenariosDir = join(repoRoot, 'demo/scenarios');

function printList() {
  console.log('Demo scenarios (npm run demo:run -- <id>):\n');
  for (const [index, id] of SCENARIO_ORDER.entries()) {
    const meta = SCENARIO_META[id];
    const flags = [
      meta.needsServer ? 'api' : null,
      meta.needsDatabase ? 'db' : null,
    ]
      .filter(Boolean)
      .join('+');
    const modes = meta.modes?.join(', ') ?? '';
    console.log(
      `  ${String(index + 1).padStart(2, ' ')}. ${id.padEnd(32)} [${flags || 'standalone'}] ${modes}`,
    );
  }
  console.log('\nRun all: npm run demo:all');
  console.log(`\nDocumentation: ${DOCS_URL}`);
  console.log(`Python docs:  ${PYTHON_DOCS_URL}`);
}

async function loadDemoShared() {
  try {
    return await import('@vaagatech/snapline-demo-shared');
  } catch {
    console.error('Build demo shared first: npm run build --workspace=@vaagatech/snapline-demo-shared');
    process.exit(1);
  }
}

async function createLocalEnv(meta) {
  const shared = await loadDemoShared();
  const cleanups = [];

  if (meta.needsServer) {
    const handle = await shared.createMockServer();
    process.env.API_BASE_URL = handle.baseUrl;
    process.env.CLIENT_ID = process.env.CLIENT_ID ?? 'demo-client';
    process.env.CLIENT_SECRET = process.env.CLIENT_SECRET ?? 'demo-secret';
    cleanups.push(() => handle.server.close());
    console.log(`Mock API listening at ${handle.baseUrl}`);
  }

  if (meta.needsDatabase) {
    const dbEnv = shared.createDemoDatabaseEnv();
    process.env.SOURCE_DATABASE_URL = dbEnv.SOURCE_DATABASE_URL;
    process.env.TARGET_DATABASE_URL = dbEnv.TARGET_DATABASE_URL;
    process.env.APP_DATABASE_URL = dbEnv.APP_DATABASE_URL;
    process.env.AUDIT_SOURCE_DATABASE_URL = dbEnv.AUDIT_SOURCE_DATABASE_URL;
    process.env.AUDIT_TARGET_DATABASE_URL = dbEnv.AUDIT_TARGET_DATABASE_URL;
    cleanups.push(() => dbEnv.cleanup());
  }

  return () => {
    for (const cleanup of cleanups.reverse()) {
      cleanup();
    }
  };
}

function buildScenario(id) {
  const code = spawnSync('npm', ['run', 'build', `--workspace=${workspaceName(id)}`], {
    cwd: repoRoot,
    stdio: 'inherit',
  }).status;
  if (code !== 0) {
    process.exit(code ?? 1);
  }
}

async function runScenarioDist(id) {
  const runPath = join(scenariosDir, id, 'dist/run.js');
  if (!existsSync(runPath)) {
    console.error(`Missing ${runPath} — run with --build or npm run demo:build`);
    process.exit(1);
  }

  // Import in-process so the mock API server (same event loop) can handle OAuth/HTTP
  // while the scenario runs. spawnSync blocks the loop and deadlocks server-backed cases.
  const mod = await import(pathToFileURL(runPath).href);
  const run = mod.default ?? mod.run;
  if (typeof run !== 'function') {
    throw new Error(`Scenario ${id} does not export a run function`);
  }

  const result = await run();
  return result.passed ? 0 : 1;
}

async function runOne(id, options = {}) {
  const meta = SCENARIO_META[id];
  if (!meta) {
    console.error(`Unknown scenario "${id}". Run npm run demo:list`);
    process.exit(1);
  }

  if (options.build) {
    buildScenario(id);
  }

  const cleanup = await createLocalEnv(meta);
  try {
    process.exitCode = await runScenarioDist(id);
  } finally {
    cleanup();
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--list') || args.includes('-l')) {
    printList();
    return;
  }

  if (args.includes('--all')) {
    const code = spawnSync('npm', ['run', 'start', '--workspace=@vaagatech/snapline-demo-run-all'], {
      cwd: repoRoot,
      stdio: 'inherit',
    }).status;
    process.exitCode = code ?? 0;
    return;
  }

  const build = args.includes('--build') || args.includes('-b');
  const id = args.find((arg) => !arg.startsWith('-'));
  if (!id) {
    console.error('Pass a scenario id. Example: npm run demo:run -- api-vs-file-graphql');
    process.exit(1);
  }

  await runOne(id, { build });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
