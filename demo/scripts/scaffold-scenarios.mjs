#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const demoRoot = join(scriptDir, '..');
const repoRoot = join(demoRoot, '..');
const scenariosDir = join(demoRoot, 'scenarios');

const rootVersion = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).version;

/** Demo run order — ids only. Display order is assigned automatically (1-based index). */
const SCENARIO_ORDER = [
  'reconcile-ignore-fields',
  'reconcile-transformations',
  'db-vs-db-sqlite',
  'reconcile-data-mapping-function',
  'db-comparison-transformations',
  'reconcile-combined-options',
  'api-vs-file-rest',
  'api-vs-file-graphql',
  'api-vs-file-soap',
  'api-vs-db-rest',
  'api-vs-db-graphql',
  'api-vs-db-soap',
  'db-vs-api-rest',
  'db-vs-api-graphql',
  'db-vs-api-soap',
];

/** Per-scenario metadata — do not prefix titles with numbers. */
const SCENARIO_META = {
  'reconcile-ignore-fields': {
    title: 'Reconcile: ignoreFields (nested paths)',
    needsServer: true,
    needsDatabase: false,
    fixtures: ['tracked-expected.json'],
  },
  'reconcile-transformations': {
    title: 'Reconcile: transformations (fixture cases)',
    needsServer: false,
    needsDatabase: false,
    fixtures: [],
  },
  'db-vs-db-sqlite': {
    title: 'DB vs DB (SQLite multi-table warehouse)',
    needsServer: false,
    needsDatabase: true,
    fixtures: [],
  },
  'reconcile-data-mapping-function': {
    title: 'Reconcile: dataMapping (fixture cases + DB)',
    needsServer: false,
    needsDatabase: true,
    fixtures: [],
  },
  'db-comparison-transformations': {
    title: 'Reconcile: transformations (DB vs DB + SQLite)',
    needsServer: false,
    needsDatabase: true,
    fixtures: [],
  },
  'reconcile-combined-options': {
    title: 'Reconcile: combined options',
    needsServer: true,
    needsDatabase: true,
    fixtures: [],
  },
  'api-vs-file-rest': {
    title: 'API vs file (REST + OAuth2)',
    needsServer: true,
    needsDatabase: false,
    fixtures: ['rest-input.json', 'rest-expected.json'],
  },
  'api-vs-file-graphql': {
    title: 'API vs file (GraphQL + OAuth2 fixture cases)',
    needsServer: true,
    needsDatabase: false,
    fixtures: [],
  },
  'api-vs-file-soap': {
    title: 'API vs file (SOAP)',
    needsServer: true,
    needsDatabase: false,
    fixtures: ['soap-request.xml', 'soap-expected.json'],
  },
  'api-vs-db-rest': {
    title: 'API vs DB (REST vs multi-table SQLite JOIN)',
    needsServer: true,
    needsDatabase: true,
    fixtures: [],
  },
  'api-vs-db-graphql': {
    title: 'API vs DB (GraphQL + OAuth2 vs SQLite JOIN)',
    needsServer: true,
    needsDatabase: true,
    fixtures: ['graphql-variables.json'],
  },
  'db-vs-api-rest': {
    title: 'DB vs API (SQLite JOIN vs REST)',
    needsServer: true,
    needsDatabase: true,
    fixtures: [],
  },
  'db-vs-api-graphql': {
    title: 'DB vs API (SQLite JOIN vs OAuth2 GraphQL)',
    needsServer: true,
    needsDatabase: true,
    fixtures: [],
  },
  'api-vs-db-soap': {
    title: 'API vs DB (SOAP vs SQLite JOIN)',
    needsServer: true,
    needsDatabase: true,
    fixtures: ['soap-request.xml'],
  },
  'db-vs-api-soap': {
    title: 'DB vs API (SQLite JOIN vs SOAP)',
    needsServer: true,
    needsDatabase: true,
    fixtures: ['soap-request.xml'],
  },
};

function idToImportName(id) {
  return id
    .split('-')
    .map((part, index) => (index === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join('');
}

function workspaceName(id) {
  return `@vaagatech/reconcile-demo-scenario-${id}`;
}

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
      `Scenario directories not listed in SCENARIO_ORDER: ${unknown.join(', ')}. Add them to demo/scripts/scaffold-scenarios.mjs`,
    );
  }
}

function syncRootBuildDemos() {
  const rootPkgPath = join(repoRoot, 'package.json');
  const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'));

  const buildSteps = [
    'npm run build --workspace=@vaagatech/reconcile-demo-shared',
    ...SCENARIO_ORDER.map((id) => `npm run build --workspace=${workspaceName(id)}`),
    'npm run build --workspace=@vaagatech/reconcile-demo-run-all',
  ];

  rootPkg.scripts['build:demos'] = buildSteps.join(' && ');
  writeFileSync(rootPkgPath, `${JSON.stringify(rootPkg, null, 2)}\n`);
  console.log('Synced root package.json build:demos');
}

function syncRunAllPackageJson() {
  const runAllPkgPath = join(demoRoot, 'run-all', 'package.json');
  const runAllPkg = JSON.parse(readFileSync(runAllPkgPath, 'utf8'));

  runAllPkg.dependencies = runAllPkg.dependencies ?? {};
  runAllPkg.dependencies['@vaagatech/reconcile-demo-shared'] = rootVersion;
  runAllPkg.dependencies['@vaagatech/reconcile-core'] = rootVersion;

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

  const source = `import { writeTestReport } from '@vaagatech/reconcile-core';
${imports}
import {
  closeDemoDatabase,
  createDemoDatabase,
  createMockServer,
  resolveReportConfig,
  type ScenarioModule,
} from '@vaagatech/reconcile-demo-shared';

const scenarios: ScenarioModule[] = [
${scenarioRefs}
];

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  @vaagatech/reconcile-engine — Full Integration Demo');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Projects: ${SCENARIO_ORDER.length} scenario workspaces under demo/scenarios/');
  console.log('  Modes: API↔file · DB↔DB · API↔DB · DB↔API');
  console.log('  Protocols: REST · GraphQL · SOAP · SQLite · OAuth2');
  console.log('  Reconcile: ignoreFields · transformations · dataMapping');
  console.log('  Reports: json · html · text (via REPORT_FORMAT env or CLI flags)');
  console.log('  Built by VaagaTech — https://www.vaagatech.com');
  console.log('═══════════════════════════════════════════════════════');

  const { server, baseUrl } = await createMockServer();
  console.log(\`\\nMock API + GraphQL server listening at \${baseUrl}\`);

  const database = createDemoDatabase();
  const reportConfig = resolveReportConfig();
  const startedAt = Date.now();
  const context = { baseUrl, database };

  try {
    const results = [];
    for (const scenario of scenarios) {
      results.push(await scenario.run(context));
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
      console.log('Upload this artifact to your CI dashboard or reporting system.');
    }

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    closeDemoDatabase(database);
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
            '@vaagatech/reconcile-core': rootVersion,
            '@vaagatech/reconcile-demo-shared': rootVersion,
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
  entry: ['src/scenario.ts', 'src/start.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@vaagatech/reconcile-core', '@vaagatech/reconcile-demo-shared'],
});
`,
    );
  }

  const startPath = join(srcDir, 'start.ts');
  if (!existsSync(startPath)) {
    writeFileSync(
      startPath,
      `import { bootstrapScenario } from '@vaagatech/reconcile-demo-shared';
import scenario from './scenario.js';

const exitCode = await bootstrapScenario(scenario);
process.exitCode = exitCode;
`,
    );
  }

  const scenarioPath = join(srcDir, 'scenario.ts');
  if (!existsSync(scenarioPath)) {
    writeFileSync(
      scenarioPath,
      `import { testSuite } from '@vaagatech/reconcile-core';
import { type ScenarioModule } from '@vaagatech/reconcile-demo-shared';

const scenario: ScenarioModule = {
  name: '${meta.title.replace(/'/g, "\\'")}',
  needsServer: ${meta.needsServer},
  needsDatabase: ${meta.needsDatabase},
  async run({ baseUrl, database }) {
    return testSuite('${meta.title.replace(/'/g, "\\'")}', {
      baseUrl,
    });
  },
};

export default scenario;
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
