#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const scenariosDir = join(root, 'scenarios');

const scenarios = [
  {
    id: 'api-vs-file-rest',
    name: '1. API vs file (REST)',
    needsServer: true,
    needsDatabase: false,
    fixtures: ['rest-input.json', 'rest-expected.json'],
  },
  {
    id: 'db-vs-db-sqlite',
    name: '2. DB vs DB (SQLite)',
    needsServer: false,
    needsDatabase: true,
    fixtures: [],
  },
  {
    id: 'api-vs-db-rest',
    name: '3. API vs DB (REST + SQLite)',
    needsServer: true,
    needsDatabase: true,
    fixtures: [],
  },
  {
    id: 'db-vs-api-rest',
    name: '4. DB vs API (REST + SQLite)',
    needsServer: true,
    needsDatabase: true,
    fixtures: [],
  },
  {
    id: 'api-vs-file-graphql',
    name: '5. API vs file (GraphQL)',
    needsServer: true,
    needsDatabase: false,
    fixtures: ['graphql-query.graphql', 'graphql-variables.json', 'graphql-expected.json'],
  },
  {
    id: 'api-vs-db-graphql',
    name: '6. API vs DB (GraphQL + SQLite)',
    needsServer: true,
    needsDatabase: true,
    fixtures: ['graphql-variables.json'],
  },
  {
    id: 'db-vs-api-graphql',
    name: '7. DB vs API (GraphQL + SQLite)',
    needsServer: true,
    needsDatabase: true,
    fixtures: [],
  },
  {
    id: 'api-vs-file-soap',
    name: '8. API vs file (SOAP)',
    needsServer: true,
    needsDatabase: false,
    fixtures: ['soap-request.xml', 'soap-expected.json'],
  },
  {
    id: 'api-vs-db-soap',
    name: '9. API vs DB (SOAP + SQLite)',
    needsServer: true,
    needsDatabase: true,
    fixtures: ['soap-request.xml'],
  },
  {
    id: 'db-vs-api-soap',
    name: '10. DB vs API (SOAP + SQLite)',
    needsServer: true,
    needsDatabase: true,
    fixtures: ['soap-request.xml'],
  },
];

const legacyFixtures = join(root, 'fixtures');

for (const scenario of scenarios) {
  const dir = join(scenariosDir, scenario.id);
  const fixturesDir = join(dir, 'fixtures');
  const srcDir = join(dir, 'src');
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(srcDir, { recursive: true });

  for (const fixture of scenario.fixtures) {
    cpSync(join(legacyFixtures, fixture), join(fixturesDir, fixture));
  }

  const packageName = `@vaagatech/demo-scenario-${scenario.id}`;
  const copyFixtures = scenario.fixtures.length > 0 ? ' && cp -R fixtures dist/' : '';

  writeFileSync(
    join(dir, 'package.json'),
    `${JSON.stringify(
      {
        name: packageName,
        private: true,
        version: '0.1.0',
        description: `Demo scenario: ${scenario.name}`,
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
          build: `tsup${copyFixtures}`,
          start: 'node dist/start.js',
          typecheck: 'tsc --noEmit',
        },
        dependencies: {
          '@vaagatech/core': '0.1.0',
          '@vaagatech/demo-shared': '0.1.0',
        },
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    join(dir, 'tsconfig.json'),
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

  writeFileSync(
    join(dir, 'tsup.config.ts'),
    `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/scenario.ts', 'src/start.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@vaagatech/core', '@vaagatech/demo-shared'],
});
`,
  );

  writeFileSync(
    join(dir, 'src', 'start.ts'),
    `import { bootstrapScenario } from '@vaagatech/demo-shared';
import scenario from './scenario.js';

const exitCode = await bootstrapScenario(scenario);
process.exitCode = exitCode;
`,
  );

  console.log(`Scaffolded ${scenario.id}`);
}

console.log('Done scaffolding scenario projects.');
