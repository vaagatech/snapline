#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SCENARIO_META,
  SCENARIO_ORDER,
  idToImportName,
  workspaceName,
} from './scenario-registry.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const demoRoot = join(scriptDir, '..');
const repoRoot = join(demoRoot, '..');
const scenariosDir = join(demoRoot, 'scenarios');

const rootVersion = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).version;

function hasFixtureFiles(fixturesDirPath) {
  if (!existsSync(fixturesDirPath)) {
    return false;
  }

  return readdirSync(fixturesDirPath).length > 0;
}

function validateScenarioRegistry() {
  const onDisk = readdirSync(scenariosDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const id of SCENARIO_ORDER) {
    if (!SCENARIO_META[id]) {
      throw new Error(`Missing SCENARIO_META for "${id}"`);
    }
    if (!onDisk.includes(id)) {
      throw new Error(`Scenario directory missing on disk: demo/scenarios/${id}`);
    }
  }

  const unknown = onDisk.filter((id) => !SCENARIO_ORDER.includes(id));
  if (unknown.length > 0) {
    throw new Error(
      `Scenario directories not listed in SCENARIO_ORDER: ${unknown.join(', ')}. Add them to demo/scripts/scenario-registry.mjs`,
    );
  }
}

function syncRootBuildDemos() {
  const rootPkgPath = join(repoRoot, 'package.json');
  const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'));

  const buildSteps = [
    'npm run build --workspace=@vaagatech/snapline-demo-shared',
    ...SCENARIO_ORDER.map((id) => `npm run build --workspace=${workspaceName(id)}`),
    'npm run build --workspace=@vaagatech/snapline-demo-run-all',
  ];

  rootPkg.scripts['build:demos'] = buildSteps.join(' && ');
  writeFileSync(rootPkgPath, `${JSON.stringify(rootPkg, null, 2)}\n`);
  console.log('Synced root package.json build:demos');
}

function syncRunAllPackageJson() {
  const runAllPkgPath = join(demoRoot, 'run-all', 'package.json');
  const runAllPkg = JSON.parse(readFileSync(runAllPkgPath, 'utf8'));

  runAllPkg.dependencies = runAllPkg.dependencies ?? {};
  runAllPkg.dependencies['@vaagatech/snapline-demo-shared'] = rootVersion;
  runAllPkg.dependencies['@vaagatech/snapline-core'] = rootVersion;

  for (const id of SCENARIO_ORDER) {
    runAllPkg.dependencies[workspaceName(id)] = rootVersion;
  }

  writeFileSync(runAllPkgPath, `${JSON.stringify(runAllPkg, null, 2)}\n`);
  console.log('Synced demo/run-all/package.json dependencies');
}

function syncRunAllSource() {
  const imports = SCENARIO_ORDER.map(
    (id) => `import ${idToImportName(id)} from '${workspaceName(id)}';`,
  ).join('\n');

  const scenarioRefs = SCENARIO_ORDER.map((id) => `  ${idToImportName(id)},`).join('\n');

  const source = `import { resolveReportConfig, writeTestReport } from '@vaagatech/snapline-core';
${imports}
import { createDemoDatabaseEnv, createMockServer } from '@vaagatech/snapline-demo-shared';

const runners = [
${scenarioRefs}
];

function applyDemoEnv(baseUrl: string, databaseEnv: ReturnType<typeof createDemoDatabaseEnv>): void {
  process.env.API_BASE_URL = baseUrl;
  process.env.CLIENT_ID = process.env.CLIENT_ID ?? 'demo-client';
  process.env.CLIENT_SECRET = process.env.CLIENT_SECRET ?? 'demo-secret';
  process.env.SOURCE_DATABASE_URL = databaseEnv.SOURCE_DATABASE_URL;
  process.env.TARGET_DATABASE_URL = databaseEnv.TARGET_DATABASE_URL;
  process.env.APP_DATABASE_URL = databaseEnv.APP_DATABASE_URL;
  process.env.AUDIT_SOURCE_DATABASE_URL = databaseEnv.AUDIT_SOURCE_DATABASE_URL;
  process.env.AUDIT_TARGET_DATABASE_URL = databaseEnv.AUDIT_TARGET_DATABASE_URL;
}

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Snapline — Full Integration Demo (monorepo)');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ${SCENARIO_ORDER.length} scenarios · npm run demo:list to browse');
  console.log('  npm run demo:run -- <id> to run one scenario from root');
  console.log('═══════════════════════════════════════════════════════');

  const { server, baseUrl } = await createMockServer();
  console.log(\`\\nMock API + GraphQL server listening at \${baseUrl}\`);

  const databaseEnv = createDemoDatabaseEnv();
  applyDemoEnv(baseUrl, databaseEnv);

  const reportConfig = resolveReportConfig();
  const startedAt = Date.now();

  try {
    const results = [];
    for (const run of runners) {
      results.push(await run());
    }

    const durationMs = Date.now() - startedAt;
    const passed = results.filter((result) => result.passed).length;
    const failed = results.length - passed;

    console.log('───────────────────────────────────────────────────────');
    console.log(\`  Summary: \${passed} passed, \${failed} failed (\${durationMs}ms)\`);
    console.log('───────────────────────────────────────────────────────');

    if (reportConfig) {
      const reportPath = writeTestReport(results, reportConfig, {
        durationMs,
        environment: {
          baseUrl,
          reportFormat: reportConfig.format,
        },
      });
      console.log(\`\\nReport written to \${reportPath}\`);
    }

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    databaseEnv.cleanup();
    server.close();
  }
}

main().catch((err: unknown) => {
  console.error('Demo failed:', err);
  process.exitCode = 1;
});
`;

  writeFileSync(join(demoRoot, 'run-all', 'src', 'run-all.ts'), source);
  console.log('Synced demo/run-all/src/run-all.ts');
}

function scaffoldScenarioProject(id, index) {
  const meta = SCENARIO_META[id];
  const dir = join(scenariosDir, id);
  const fixturesDirPath = join(dir, 'fixtures');
  const srcDir = join(dir, 'src');
  const legacyFixtures = join(demoRoot, 'fixtures');

  mkdirSync(fixturesDirPath, { recursive: true });
  mkdirSync(srcDir, { recursive: true });

  for (const fixture of meta.fixtures) {
    const legacyPath = join(legacyFixtures, fixture);
    const targetPath = join(fixturesDirPath, fixture);
    if (existsSync(legacyPath) && !existsSync(targetPath)) {
      cpSync(legacyPath, targetPath);
    }
  }

  const packageName = workspaceName(id);
  const buildScript = hasFixtureFiles(fixturesDirPath)
    ? 'tsup && cp -R fixtures dist/'
    : 'tsup';

  const packageJsonPath = join(dir, 'package.json');
  if (!existsSync(packageJsonPath)) {
    writeFileSync(
      packageJsonPath,
      `${JSON.stringify(
        {
          name: packageName,
          private: true,
          version: rootVersion,
          description: `Demo scenario: ${meta.title}`,
          type: 'module',
          main: './dist/scenario.js',
          types: './dist/scenario.d.ts',
          exports: {
            '.': {
              types: './dist/scenario.d.ts',
              default: './dist/scenario.js',
            },
            './start': './dist/start.js',
          },
          scripts: {
            build: buildScript,
            start: 'node dist/start.js',
            typecheck: 'tsc --noEmit',
          },
          dependencies: {
            '@vaagatech/snapline-core': rootVersion,
          },
        },
        null,
        2,
      )}\n`,
    );
  }

  const tsconfigPath = join(dir, 'tsconfig.json');
  if (!existsSync(tsconfigPath)) {
    writeFileSync(
      tsconfigPath,
      `${JSON.stringify(
        {
          extends: '../../../tsconfig.base.json',
          compilerOptions: {
            rootDir: 'src',
            outDir: 'dist',
          },
          include: ['src'],
        },
        null,
        2,
      )}\n`,
    );
  }

  const tsupPath = join(dir, 'tsup.config.ts');
  if (!existsSync(tsupPath)) {
    writeFileSync(
      tsupPath,
      `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/run.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@vaagatech/snapline-core', '@vaagatech/snapline-demo-shared', 'better-sqlite3'],
});
`,
    );
  }

  const envExamplePath = join(dir, '.env.example');
  if (!existsSync(envExamplePath)) {
    const lines = ['API_BASE_URL=https://api.example.com'];
    if (meta.needsServer) {
      lines.push('CLIENT_ID=', 'CLIENT_SECRET=');
    }
    if (meta.needsDatabase) {
      lines.push(
        'SOURCE_DATABASE_URL=',
        'TARGET_DATABASE_URL=',
        'APP_DATABASE_URL=',
        'AUDIT_SOURCE_DATABASE_URL=',
        'AUDIT_TARGET_DATABASE_URL=',
      );
    }
    writeFileSync(envExamplePath, `${lines.join('\n')}\n`);
  }

  const runPath = join(srcDir, 'run.ts');
  if (!existsSync(runPath)) {
    writeFileSync(
      runPath,
      `import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { testSuite } from '@vaagatech/snapline-core';
import { finalizeRun, isMainModule, requireEnv } from './env.js';

const SUITE_NAME = '${meta.title.replace(/'/g, "\\'")}';

export async function run(): Promise<TestSuiteResult> {
  const baseUrl = requireEnv('API_BASE_URL');
  return testSuite(SUITE_NAME, { baseUrl });
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
`,
    );
  }

  const envPath = join(srcDir, 'env.ts');
  if (!existsSync(envPath)) {
    writeFileSync(
      envPath,
      `import { pathToFileURL } from 'node:url';
import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { resolveReportConfig, writeTestReport } from '@vaagatech/snapline-core';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(\`Set \${name} (see .env.example)\`);
  return value;
}

export function finalizeRun(result: TestSuiteResult, suiteName: string): TestSuiteResult {
  const reportConfig = resolveReportConfig();
  if (reportConfig) {
    writeTestReport([result], reportConfig, { environment: { suite: suiteName } });
  }
  return result;
}

export function isMainModule(metaUrl: string): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href || metaUrl.endsWith(entry);
}
`,
    );
  }

  console.log(`Scaffolded demo/scenarios/${id} (#${index + 1} in run order)`);
}

const mode = process.argv[2] ?? '--sync';

validateScenarioRegistry();

if (mode === '--scaffold') {
  for (const [index, id] of SCENARIO_ORDER.entries()) {
    scaffoldScenarioProject(id, index);
  }
}

syncRootBuildDemos();
syncRunAllPackageJson();
syncRunAllSource();

console.log(`Done. ${SCENARIO_ORDER.length} scenarios registered in run order.`);
