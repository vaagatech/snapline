# @vaagatech/snapline-core

Declarative test orchestration — configure auth, API calls, and cross-system comparisons as data.

[![npm version](https://img.shields.io/npm/v/@vaagatech/snapline-core)](https://www.npmjs.com/package/@vaagatech/snapline-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install @vaagatech/snapline-core
```

## Test modes (pick one per `testSuite`)

| Mode | Config key | What it does |
|------|------------|--------------|
| **API ↔ file** | `api` | Call API, compare response to JSON fixture |
| **DB ↔ DB** | `dbComparison` | Query two databases, reconcile rows |
| **API ↔ DB** | `apiToDb` | Call API, reconcile response with DB row |
| **DB ↔ API** | `dbToApi` | Read DB, call API, reconcile row with response |

Combine modes in one `testSuite` — they run in sequence.

## API protocols

Use flat REST config (default) or explicit factories:

```javascript
import { testSuite, api } from '@vaagatech/snapline-core';

// REST (default — no factory needed)
api: { endpoint: '/users', method: 'GET', expectedFile: './out.json' }

// SOAP
api: { ...api.soap({ endpoint: '/soap/user', inputFile: './req.xml' }), expectedFile: './out.json' }

// GraphQL
api: { ...api.graphql({ endpoint: '/graphql', queryFile: './q.graphql' }), expectedFile: './out.json' }
```

## Quick demos

### 1. API vs file (REST)

```javascript
import { testSuite, auth } from '@vaagatech/snapline-core';

await testSuite('User sync', {
  auth: auth.oauth2({ tokenUrl: '...', clientId: '...', clientSecret: '...' }),
  baseUrl: 'https://api.example.com',
  api: {
    endpoint: '/api/v1/user/sync',
    method: 'POST',
    inputFile: './fixtures/input.json',
    expectedFile: './fixtures/expected.json',
    ignoreFields: ['pincode'],
    transformations: {
      currentdate: (v) =>
        typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? 'VALID_DATE' : 'INVALID_DATE',
    },
  },
});
```

### 2. DB vs DB (same query on both sides)

```javascript
import { testSuite, db, seedDb } from '@vaagatech/snapline-core';

seedDb('postgresql://localhost/src', [{ status: 'ABC', email: 'alice@example.com' }]);
seedDb('mysql://localhost/target', [{ status: 'CBA', email: 'alice@example.com' }]);

await testSuite('DB sync', {
  dbComparison: {
    sourceDb: db.postgres('postgresql://localhost/src'),
    targetDb: db.mysql('mysql://localhost/target'),
    query: 'SELECT status, email FROM users WHERE email = :email',
    params: { email: 'alice@example.com' },
    dataMapping: { status: { ABC: 'CBA' } },
  },
});
```

### 2b. DB vs DB (different queries + primary-key link)

Use `sourceQuery` / `targetQuery` when the source joins multiple tables but the target is looked up by a key from the source row:

```javascript
await testSuite('Orders sync', {
  dbComparison: {
    sourceDb: sourceDb,
    targetDb: targetDb,
    sourceQuery: `
      SELECT o.order_id AS orderId, o.email, o.status, o.amount AS total
      FROM orders o
      INNER JOIN customers c ON c.email = o.email
      WHERE c.email = :email
    `,
    sourceParams: { email: 'alice@example.com' },
    targetQuery: `
      SELECT order_id AS orderId, email, status, amount AS total
      FROM orders WHERE order_id = :orderId
    `,
    linkKeys: { orderId: 'orderId' },
    dataMapping: { status: { SHIPPED: 'DELIVERED' } },
  },
});
```

`linkKeys` maps target parameter names → source row fields. You can also pass `targetParamsFromSource: (row) => ({ ... })` for full control.

### 2c. NoSQL document comparison

Implement `DocumentStoreLike` (`find(collection, filter)`) or use the built-in in-memory store:

```javascript
import { testSuite, nosql } from '@vaagatech/snapline-core';

const sourceStore = nosql.memory();
const targetStore = nosql.memory();

nosql.seed(sourceStore, 'customers', [{ customerId: '1', email: 'alice@example.com', status: 'ACTIVE' }]);
nosql.seed(targetStore, 'snapshots', [{ id: '1', email: 'alice@example.com', status: 'ACTIVE' }]);

await testSuite('Document sync', {
  dbComparison: {
    sourceDb: sourceStore,
    targetDb: targetStore,
    sourceCollection: 'customers',
    targetCollection: 'snapshots',
    sourceFilter: { email: 'alice@example.com' },
    linkKeys: { id: 'customerId' },
  },
});
```

Wire your own MongoDB/DynamoDB client by implementing `DocumentStoreLike` and passing it as `sourceDb` / `targetDb`.

### 3. API vs DB

```javascript
import { testSuite, api, db, seedDb } from '@vaagatech/snapline-core';

seedDb('postgresql://localhost/app', [{ email: 'alice@example.com', status: 'SYNCED' }]);

await testSuite('API matches DB', {
  baseUrl: 'https://api.example.com',
  apiToDb: {
    api: api.rest({ endpoint: '/users/profile?email=alice@example.com', method: 'GET' }),
    db: {
      db: db.postgres('postgresql://localhost/app'),
      query: 'SELECT email, status FROM users WHERE email = :email',
      params: { email: 'alice@example.com' },
    },
  },
});
```

### 4. DB vs API

```javascript
import { testSuite, api, db, seedDb } from '@vaagatech/snapline-core';

seedDb('postgresql://localhost/app', [{ email: 'alice@example.com', status: 'SYNCED', role: 'member' }]);

await testSuite('DB matches API', {
  baseUrl: 'https://api.example.com',
  dbToApi: {
    db: {
      db: db.postgres('postgresql://localhost/app'),
      query: 'SELECT email, status, role FROM users WHERE email = :email',
      params: { email: 'alice@example.com' },
    },
    api: api.rest({ endpoint: '/users/profile', method: 'GET' }),
    inputFromDb: true, // DB row → GET query params / POST body / GraphQL variables
  },
});
```

### 5. API vs file (GraphQL)

```javascript
import { testSuite, api } from '@vaagatech/snapline-core';

await testSuite('GraphQL snapshot', {
  baseUrl: 'https://api.example.com',
  api: {
    ...api.graphql({
      endpoint: '/graphql',
      queryFile: './fixtures/query.graphql',
      variablesFile: './fixtures/variables.json',
      dataPath: 'user',
    }),
    expectedFile: './fixtures/expected.json',
  },
});
```

### 6. API vs file (SOAP)

```javascript
import { testSuite, api } from '@vaagatech/snapline-core';

await testSuite('SOAP snapshot', {
  baseUrl: 'https://api.example.com',
  api: {
    ...api.soap({
      endpoint: '/soap/user',
      soapAction: 'GetUser',
      inputFile: './fixtures/request.xml',
    }),
    expectedFile: './fixtures/expected.json',
  },
});
```

## `testSuite(name, config)`

| Field | Description |
|-------|-------------|
| `auth` | `auth.basic()`, `auth.oauth2()`, or `auth.openid()` |
| `baseUrl` | Prepended to relative API endpoints |
| `api` | API ↔ file test |
| `dbComparison` | DB ↔ DB test |
| `apiToDb` | API ↔ DB test |
| `dbToApi` | DB ↔ API test |
| `fetchImpl` | Custom `fetch` for mocking |

All comparison modes support `ignoreFields`, `transformations`, and `dataMapping` from `@vaagatech/snapline-engine`.

## Consumer utilities (no need to copy boilerplate)

These ship with `@vaagatech/snapline-core` so you can build fixture-driven test suites without reimplementing them:

| Export | Purpose |
|--------|---------|
| `moduleDir(import.meta.url)` | Resolve the current module directory (CJS or ESM) |
| `fixturesDir(import.meta.url, { relativePath })` | Fixtures directory (default: `../fixtures`) |
| `resolveReportConfig({ defaultOutputPath })` | Parse report CLI/env; customize default output path |
| `runApiFixtureCases(options)` | Run API fixture cases from a `cases/` directory |
| `runSnaplineFixtureCases(options)` | Run offline snapline fixture cases |

Configure fixture file names via `layout` (scenario-level), `defaults`, or per-case `case.json`:

```javascript
runApiFixtureCases({
  fixturesRoot: fixturesDir(import.meta.url, { relativePath: '../fixtures' }),
  layout: {
    casesDir: 'cases',
    queryFile: 'query.graphql',
    variablesFile: 'variables.json',
    expectedFile: 'expected.json',
  },
  defaults: { /* snapline options + optional file name overrides */ },
});
```

Set shared snapline options once in `defaults` on the scenario; per-case `case.json` fields override when present:

```javascript
runApiFixtureCases({
  fixturesRoot: fixturesDir(import.meta.url),
  baseUrl,
  defaults: {
    dataPath: 'customerAccount',
    ignoreFields: ['metadata.traceId', 'metadata.syncedAt'],
    transformations: 'graphqlAccount',  // preset name
    dataMapping: 'graphqlAccount',
  },
  presets: {
    transformations: { graphqlAccount: graphqlAccountTransforms },
    dataMapping: { graphqlAccount: { ...graphqlStatusMapping, ...graphqlPlanMapping } },
  },
});
```

A minimal `case.json` then only needs `name` and `expectMatch` unless a case should differ.

### `resolveReportConfig(options?)`

Resolves report output from CLI flags, env vars, or your own default.

| Source | Variable / flag |
|--------|-----------------|
| CLI | `--report-format=json\|html\|text`, `--report-output=./path` |
| Env | `REPORT_FORMAT`, `REPORT_OUTPUT` |
| Code | `defaultOutputPath` when neither CLI nor env set a path |

```javascript
import { resolveReportConfig } from '@vaagatech/snapline-core';

// Custom default path (string)
const report = resolveReportConfig({ defaultOutputPath: './artifacts/latest.json' });

// Or derive from format
const report2 = resolveReportConfig({
  defaultOutputPath: (format) => `./reports/run.${format === 'text' ? 'txt' : format}`,
});

// Still accepts argv array for tests
const report3 = resolveReportConfig(['node', 'run.mjs', '--report-format=html']);
```

Returns `undefined` when no format is configured (reporting is optional).

### `fixturesDir(metaUrl, options?)`

| Option | Default | Description |
|--------|---------|-------------|
| `relativePath` | `../fixtures` | Path relative to the scenario module directory |

### Fixture `layout` — file names and directories

Pass `layout` on `runApiFixtureCases` or `runSnaplineFixtureCases`. Any key can also be set in `defaults` or per-case `case.json` (case wins).

| Key | Default | Used for |
|-----|---------|----------|
| `casesDir` | `cases` | Subfolder under `fixturesRoot` |
| `caseMetaFile` | `case.json` | Case metadata |
| `expectedFile` | `expected.json` | Golden snapshot |
| `liveFile` | `live.json` | Offline snapline input (`runSnaplineFixtureCases`) |
| `queryFile` | `query.graphql` | GraphQL query |
| `variablesFile` | `variables.json` | GraphQL variables |
| `restInputFile` | `input.json` | REST request body |
| `soapInputFile` | `input.xml` | SOAP envelope |

**Override precedence:** `case.json` → `defaults` → `layout` → built-in default.

`DEFAULT_FIXTURE_LAYOUT` is exported if you want to spread/extend defaults in code.

### `runApiFixtureCases` / `runSnaplineFixtureCases` options

| Option | Description |
|--------|-------------|
| `suiteName` | Log label |
| `fixturesRoot` | Root fixtures directory (use `fixturesDir(import.meta.url)`) |
| `layout` | Scenario-level file/dir names (see table above) |
| `defaults` | Shared snapline options (`ignoreFields`, `transformations`, `dataMapping`, `dataPath`, …) and optional file-name overrides |
| `presets` | Named maps for `transformations` / `dataMapping` preset strings in `case.json` |
| `caseIds` | Run a subset of case folders (default: all under `casesDir`) |
| `baseUrl` | API base URL (`runApiFixtureCases` only) |
| `auth` / `authHeaders` | Auth for API cases |

Snapline rule types come from `@vaagatech/snapline-engine` as `SnaplineOptions` (alias of `ReconcileOptions`). The engine also exports `snapline()` as an alias of `reconcile()`.

## Examples

```bash
node packages/core/examples/api-to-db.mjs
node packages/core/examples/db-to-api.mjs
node packages/core/examples/db-comparison.mjs
node packages/core/examples/nosql-comparison.mjs
node packages/core/examples/graphql-file-test.mjs
node packages/core/examples/soap-file-test.mjs
```

## Run full monorepo demo (all 6 modes)

```bash
git clone https://github.com/vaagatech/snapline.git
cd snapline
npm install
npm run demo
```

## Related packages

| Package | Role |
|---------|------|
| [`@vaagatech/snapline-api-adapters`](https://www.npmjs.com/package/@vaagatech/snapline-api-adapters) | REST, SOAP, GraphQL executors |
| [`@vaagatech/snapline-engine`](https://www.npmjs.com/package/@vaagatech/snapline-engine) | Data reconciliation engine |
| [`@vaagatech/snapline-auth-adapters`](https://www.npmjs.com/package/@vaagatech/snapline-auth-adapters) | OAuth2, OpenID, Basic Auth |

## License

[MIT](../../LICENSE) — free to use, modify, distribute, fork, and contribute.
