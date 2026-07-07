# Snapline

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

**Declarative Snapshot and Reconciliation Testing** for Node.js — an open-source product by [VaagaTech](https://www.vaagatech.com).

Published under the `@vaagatech` npm scope with a `snapline-*` prefix so other VaagaTech products can coexist (e.g. `@vaagatech/other-product-core`).

Compare APIs, databases, and JSON fixtures as data — no imperative assertion chains. Install from npm and point tests at **your** services.

```bash
npm install @vaagatech/snapline-core
```

## Getting started in 5 minutes

This walkthrough sets up **integration testing in a new Node.js project** — not the repo demo. You will install from npm, add fixtures, write a `testSuite`, and run it against your API.

Requires **Node.js 18+**.

---

### Minute 1 — Create your integration test project

```bash
mkdir my-app-integration-tests && cd my-app-integration-tests
npm init -y
npm install @vaagatech/snapline-core
```

Add `"type": "module"` to `package.json` (or use `.mjs` files).

Suggested layout:

```
my-app-integration-tests/
├── fixtures/
│   ├── input.json          # request body (REST POST) or reference data
│   └── expected.json       # golden snapshot — what you expect after reconcile
├── tests/
│   └── user-sync.test.mjs  # one testSuite per scenario (or group related ones)
├── .env                    # CLIENT_ID, CLIENT_SECRET, API_BASE_URL (optional)
└── package.json
```

Add a run script:

```json
{
  "type": "module",
  "scripts": {
    "test:integration": "node tests/user-sync.test.mjs"
  }
}
```

---

### Minute 2 — Add fixtures for your API

Capture a real response once, then normalize volatile fields in the **expected** file.

`fixtures/input.json` — what you send:

```json
{ "email": "alice@example.com" }
```

`fixtures/expected.json` — what you assert after reconcile rules are applied:

```json
{
  "email": "alice@example.com",
  "status": "synced",
  "currentdate": "VALID_DATE"
}
```

Use placeholder values like `"VALID_DATE"` for fields you will normalize with `transformations`. Omit or strip fields that change every run (`pincode`, trace IDs) via `ignoreFields`.

---

### Minute 3 — Write your first integration test

`tests/user-sync.test.mjs`:

```javascript
import { testSuite, auth } from '@vaagatech/snapline-core';

const baseUrl = process.env.API_BASE_URL ?? 'https://your-api.com';

const result = await testSuite('User sync — API vs fixture', {
  auth: auth.oauth2({
    tokenUrl: `${baseUrl}/oauth/token`,
    clientId: process.env.CLIENT_ID ?? 'your-client-id',
    clientSecret: process.env.CLIENT_SECRET ?? 'your-client-secret',
  }),
  baseUrl,
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

process.exitCode = result.passed ? 0 : 1;
```

Run it:

```bash
API_BASE_URL=https://staging.your-api.com \
CLIENT_ID=... CLIENT_SECRET=... \
npm run test:integration
```

On failure you get a structured diff (field path, actual vs expected). On success:

```
▶ User sync — API vs fixture
  ✓ auth initialized
  ✓ api response reconciled with fixture file
✅ User sync — API vs fixture: PASSED
```

---

### Minute 4 — Add a second test mode (API vs database)

When your API should match a row in Postgres, MySQL, or SQLite:

```javascript
import { testSuite, auth, api, db } from '@vaagatech/snapline-core';

await testSuite('Profile — API matches DB', {
  auth: auth.oauth2({ tokenUrl: '...', clientId: '...', clientSecret: '...' }),
  baseUrl: 'https://your-api.com',
  apiToDb: {
    api: api.rest({
      endpoint: '/api/v1/users/profile?email=alice@example.com',
      method: 'GET',
    }),
    db: {
      db: db.postgres(process.env.DATABASE_URL),
      query: `
        SELECT email, status, role
        FROM users
        WHERE email = :email
      `,
      params: { email: 'alice@example.com' },
    },
    ignoreFields: ['traceId', 'currentdate'],
    dataMapping: { status: { synced: 'SYNCED' } },
  },
});
```

Pick the mode that matches what you are validating:

| Goal | Config key |
|------|------------|
| API response vs JSON file | `api` |
| Same query on two databases | `dbComparison` |
| API response vs DB row | `apiToDb` |
| DB row drives API call, then compare | `dbToApi` |

---

### Minute 5 — CI, reports, and next tests

**Exit codes** — set `process.exitCode = result.passed ? 0 : 1` so CI fails on mismatch.

**HTML/JSON reports** for dashboards:

```javascript
import { writeTestReport } from '@vaagatech/snapline-core';

const result = await testSuite('User sync', { /* ... */ });

writeTestReport([result], { format: 'html', outputPath: './reports/integration.html' });
```

**GraphQL** — swap the `api` block for:

```javascript
api: {
  ...api.graphql({
    endpoint: '/graphql',
    queryFile: './fixtures/query.graphql',
    variablesFile: './fixtures/variables.json',
    dataPath: 'customerAccount',
  }),
  expectedFile: './fixtures/expected.json',
  ignoreFields: ['metadata.traceId'],
}
```

**More examples:** [`packages/core/README.md`](./packages/core/README.md) · [`packages/snapline/README.md`](./packages/snapline/README.md)

---

## Fixture-driven tests

For many cases against the same API (pass paths, expected failures, auth errors), use the **fixture case runners** built into `@vaagatech/snapline-core` instead of writing one `testSuite` per case.

### Suggested layout

```
my-app-integration-tests/
├── src/
│   └── customer-account.test.mjs   # scenario: defaults + presets
└── fixtures/
    └── cases/
        ├── 01-happy-path/
        │   ├── case.json
        │   ├── query.graphql
        │   ├── variables.json
        │   └── expected.json
        └── 02-wrong-status-mapping/
            ├── case.json
            └── ...
```

File names are **configurable** via `layout` (see [`packages/core/README.md`](./packages/core/README.md)).

### Scenario file — set defaults once

`src/customer-account.test.mjs`:

```javascript
import {
  fixturesDir,
  resolveReportConfig,
  runApiFixtureCases,
  writeTestReport,
} from '@vaagatech/snapline-core';

const result = await runApiFixtureCases({
  suiteName: 'Customer account — GraphQL fixture cases',
  fixturesRoot: fixturesDir(import.meta.url, { relativePath: '../fixtures' }),
  baseUrl: process.env.API_BASE_URL ?? 'https://your-api.com',
  defaults: {
    endpoint: '/graphql',
    protocol: 'graphql',
    dataPath: 'customerAccount',
    ignoreFields: ['metadata.traceId', 'metadata.syncedAt'],
    transformations: 'accountTransforms',   // preset name
    dataMapping: 'accountMapping',
  },
  presets: {
    transformations: { accountTransforms: { /* ... */ } },
    dataMapping: { accountMapping: { /* ... */ } },
  },
});

const reportConfig = resolveReportConfig({
  defaultOutputPath: './reports/customer-account.json',
});
if (reportConfig) {
  writeTestReport([result], reportConfig);
}

process.exitCode = result.passed ? 0 : 1;
```

### Minimal `case.json` — override only when needed

Most cases only need:

```json
{
  "name": "Happy path — full account",
  "expectMatch": true
}
```

Override a single field for failure cases:

```json
{
  "name": "Fail — wrong status mapping",
  "expectMatch": false,
  "failureType": "dataMapping",
  "expectedDiffPath": "status",
  "dataMapping": "statusOnly"
}
```

**Precedence:** `case.json` → `defaults` in scenario → `layout` → built-in file names.

### Offline snapline cases (no HTTP)

Compare `live.json` to `expected.json` without calling an API:

```javascript
import { fixturesDir, runSnaplineFixtureCases } from '@vaagatech/snapline-core';

await runSnaplineFixtureCases({
  suiteName: 'Transformations — fixture cases',
  fixturesRoot: fixturesDir(import.meta.url),
  defaults: { transformations: 'enrichment' },
  presets: { transformations: { enrichment: { /* ... */ } } },
});
```

### Reports from CLI

```bash
node src/customer-account.test.mjs --report-format=html --report-output=./reports/run.html
# or: REPORT_FORMAT=json REPORT_OUTPUT=./reports/run.json node src/customer-account.test.mjs
```

Full reference: [`packages/core/README.md` — Consumer utilities](./packages/core/README.md#consumer-utilities-no-need-to-copy-boilerplate)

---

## Test modes

| Mode | Config key | What it does | Protocols |
|------|------------|--------------|-----------|
| **API ↔ file** | `api` | Call an API and compare the response to a JSON fixture | REST, SOAP, GraphQL |
| **DB ↔ DB** | `dbComparison` | Compare rows from two databases (same or different queries) | Postgres, MySQL, SQLite, NoSQL* |
| **API ↔ DB** | `apiToDb` | Call an API and reconcile the response with a DB row | REST, SOAP, GraphQL |
| **DB ↔ API** | `dbToApi` | Read a DB row, call an API, reconcile row with response | REST, SOAP, GraphQL |

Combine multiple modes in one `testSuite` — they run in sequence.

\* **NoSQL:** implement `DocumentStoreLike` (`find(collection, filter)`) or use `nosql.memory()` from core. **Different SQL per side:** use `sourceQuery` / `targetQuery` with `linkKeys` to pass primary keys from the source row into the target query. See [`packages/core/README.md`](./packages/core/README.md).

## Snapline options

Every comparison accepts:

| Option | Purpose | Example |
|--------|---------|---------|
| `ignoreFields` | Strip volatile fields (supports dot paths) | `['pincode', 'metadata.traceId']` |
| `transformations` | Normalize dynamic values on the **live** side | Dates → `'VALID_DATE'`, uppercase enums |
| `dataMapping` | Map equivalent codes across systems | `{ status: { synced: 'SYNCED' } }` |

Processing order: **ignore → transform → map → deep compare**.

```javascript
import { reconcile, snapline, type SnaplineOptions } from '@vaagatech/snapline-core';

const { match, diff } = snapline(liveData, expectedData, {
  ignoreFields: ['metadata.requestId'],
  transformations: { tier: (v) => String(v).toUpperCase() },
  dataMapping: { status: { ACTIVE: 'ACTV' } },
} satisfies SnaplineOptions);
```

`reconcile()` and `snapline()` are equivalent. Prefer `SnaplineOptions` for new code (`ReconcileOptions` remains as an alias).

## Usage reference

### REST — API vs file

```javascript
import { testSuite, auth } from '@vaagatech/snapline-core';

await testSuite('REST snapshot', {
  auth: auth.oauth2({ tokenUrl: '...', clientId: '...', clientSecret: '...' }),
  baseUrl: 'https://api.example.com',
  api: {
    endpoint: '/api/v1/user/sync',
    method: 'POST',
    inputFile: './fixtures/input.json',
    expectedFile: './fixtures/expected.json',
    ignoreFields: ['pincode'],
  },
});
```

### GraphQL — API vs file

```javascript
import { testSuite, auth, api } from '@vaagatech/snapline-core';

await testSuite('GraphQL snapshot', {
  auth: auth.oauth2({ tokenUrl: '...', clientId: '...', clientSecret: '...' }),
  baseUrl: 'https://api.example.com',
  api: {
    ...api.graphql({
      endpoint: '/graphql',
      queryFile: './fixtures/query.graphql',
      variablesFile: './fixtures/variables.json',
      dataPath: 'customerAccount',
    }),
    expectedFile: './fixtures/expected.json',
    ignoreFields: ['metadata.traceId', 'metadata.syncedAt'],
    transformations: {
      lastLogin: (v) => (isValidDate(v) ? 'VALID_DATE' : 'INVALID_DATE'),
      role: (v) => String(v).toUpperCase(),
    },
    dataMapping: { status: { synced: 'ACTIVE' }, planCode: { PRO: 'premium' } },
  },
});
```

### SOAP — API vs file

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

### DB vs DB

```javascript
import { testSuite, db } from '@vaagatech/snapline-core';

// Same query on both sides
await testSuite('Warehouse sync', {
  dbComparison: {
    sourceDb: db.postgres(process.env.SOURCE_DATABASE_URL),
    targetDb: db.mysql(process.env.TARGET_DATABASE_URL),
    query: 'SELECT status, email FROM users WHERE email = :email',
    params: { email: 'alice@example.com' },
    dataMapping: { status: { ABC: 'CBA' } },
  },
});

// Different queries — source joins tables, target looks up by primary key
await testSuite('Orders sync', {
  dbComparison: {
    sourceDb,
    targetDb,
    sourceQuery: 'SELECT o.order_id AS orderId, o.status FROM orders o WHERE o.email = :email',
    sourceParams: { email: 'alice@example.com' },
    targetQuery: 'SELECT order_id AS orderId, status FROM orders WHERE order_id = :orderId',
    linkKeys: { orderId: 'orderId' },
  },
});
```

### DB vs API (`inputFromDb`)

```javascript
import { testSuite, api, db } from '@vaagatech/snapline-core';

await testSuite('DB row matches API', {
  baseUrl: 'https://api.example.com',
  dbToApi: {
    db: {
      db: db.postgres(process.env.DATABASE_URL),
      query: 'SELECT email, status FROM users WHERE email = :email',
      params: { email: 'alice@example.com' },
    },
    api: api.rest({ endpoint: '/api/v1/users/profile', method: 'GET' }),
    inputFromDb: true,
    dataMapping: { status: { SYNCED: 'synced' } },
  },
});
```

### Auth adapters

```javascript
import { auth } from '@vaagatech/snapline-core';

auth.oauth2({ tokenUrl, clientId, clientSecret });
auth.openid({ /* ... */ });
auth.basic({ username, password });
```

### `testSuite` config

| Field | Description |
|-------|-------------|
| `auth` | Optional — OAuth2, OpenID, or Basic; headers applied to all API calls |
| `baseUrl` | Prepended to relative endpoints |
| `api` | API ↔ JSON fixture |
| `dbComparison` | DB ↔ DB |
| `apiToDb` | API ↔ DB |
| `dbToApi` | DB ↔ API |
| `fetchImpl` | Custom `fetch` for mocking in unit tests |

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [`@vaagatech/snapline-core`](./packages/core) | [`@vaagatech/snapline-core`](https://www.npmjs.com/package/@vaagatech/snapline-core) | **Start here** — `testSuite`, DB helpers, reporting |
| [`@vaagatech/snapline-engine`](./packages/snapline) | [`@vaagatech/snapline-engine`](https://www.npmjs.com/package/@vaagatech/snapline-engine) | Reconciliation engine — `reconcile`, `assertAgainstFile` |
| [`@vaagatech/snapline-api-adapters`](./packages/api-adapters) | [`@vaagatech/snapline-api-adapters`](https://www.npmjs.com/package/@vaagatech/snapline-api-adapters) | REST, SOAP, GraphQL executors |
| [`@vaagatech/snapline-auth-adapters`](./packages/auth-adapters) | [`@vaagatech/snapline-auth-adapters`](https://www.npmjs.com/package/@vaagatech/snapline-auth-adapters) | OAuth2, OpenID Connect, Basic Auth |

Install `@vaagatech/snapline-core` only — it re-exports the rest.

## Why Snapline?

Traditional integration tests chain many field assertions that break when schemas evolve:

```javascript
expect(response.status).toBe(200);
expect(response.body.email).toBe('alice@example.com');
expect(response.body.status).toBe('synced');
```

Snapline lets you declare **what** should match and **how** to normalize differences in one config object — the framework handles HTTP, auth, deep compare, and structured diffs.

## Documentation

📖 **[Full documentation (GitHub Pages)](https://vaagatech.github.io/snapline/)**

| Page | Description |
|------|-------------|
| [Overview](https://vaagatech.github.io/snapline/) | Purpose, install, reconciliation pipeline |
| [Architecture](https://vaagatech.github.io/snapline/architecture.html) | Package layers, runtime flow, repo layout |
| [Getting Started](https://vaagatech.github.io/snapline/getting-started.html) | 5-minute integration test setup |
| [End-to-End Guide](https://vaagatech.github.io/snapline/guide.html) | All test modes, fixtures, CI reports |
| [Demo Scenarios](https://vaagatech.github.io/snapline/demos.html) | 19 runnable reference scenarios |
| [API Reference](https://vaagatech.github.io/snapline/reference.html) | Config and exports |

Local preview: open `docs/index.html` in a browser, or serve with `npx serve docs`.

| Resource | Description |
|----------|-------------|
| [`packages/core/README.md`](./packages/core/README.md) | Full `testSuite` API, fixture runners, DB/NoSQL comparison |
| [`packages/snapline/README.md`](./packages/snapline/README.md) | Snapline options and diff format |
| [`packages/api-adapters/README.md`](./packages/api-adapters/README.md) | REST, SOAP, GraphQL config |
| [`packages/auth-adapters/README.md`](./packages/auth-adapters/README.md) | OAuth2, OpenID, Basic Auth |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Development (maintainers)

```bash
git clone https://github.com/vaagatech/snapline.git
cd snapline
npm install
npm run build
npm run typecheck
npm run publish:packages   # publish all four npm packages
```

Monorepo layout: `packages/` (published) · `demo/` (private, not on npm) · `scripts/sync-versions.mjs`

## Full integration demo (optional)

The repo includes a **19-scenario demo** with a mock REST/GraphQL/SOAP server and SQLite seeds. It is reference material only — **not required** for using the npm packages.

```bash
git clone https://github.com/vaagatech/snapline.git
cd snapline
npm install
npm run demo          # build + run all scenarios
npm run demo:list     # list scenario ids
npm run demo:run -- api-vs-file-graphql   # one scenario (starts mock API/DB when needed)
npm run demo:build    # build demo workspaces only
```

| # | Scenario | Mode | Highlights |
|---|----------|------|------------|
| 1 | `snapline-ignore-fields` | API ↔ file | Nested `ignoreFields` |
| 2 | `snapline-transformations` | Fixture cases | Pass + expected transformation failures |
| 3 | `snapline-data-mapping-lookup` | Fixture cases | Lookup-table `dataMapping` (offline) |
| 4 | `db-vs-db-sqlite` | DB ↔ DB | Multi-table JOIN, `linkKeys` |
| 5 | `db-vs-db-cross-dialect` | DB ↔ DB | Postgres vs MySQL via `seedDb` stub |
| 6 | `nosql-vs-nosql` | NoSQL ↔ NoSQL | Document stores + `linkKeys` |
| 7 | `snapline-data-mapping-function` | Fixture + DB | Function mapper |
| 8 | `db-comparison-transformations` | DB ↔ DB | Date normalization |
| 9 | `snapline-combined-options` | API ↔ DB | All snapline options combined |
| 10 | `api-vs-file-rest` | API ↔ file | OAuth2 REST (single fixture) |
| 11 | `api-vs-file-rest-cases` | API ↔ file | OAuth2 REST fixture cases |
| 12 | `api-vs-file-graphql` | API ↔ file | OAuth2 GraphQL, 7 fixture cases |
| 13 | `api-vs-file-soap` | API ↔ file | SOAP vs JSON |
| 14–19 | `api-vs-db-*`, `db-vs-api-*` | Cross-system | REST, GraphQL, SOAP vs SQLite |

Run one scenario against your hosted API (copy `.env.example` → `.env` first):

```bash
cp demo/scenarios/api-vs-file-graphql/.env.example demo/scenarios/api-vs-file-graphql/.env
# edit API_BASE_URL, CLIENT_ID, CLIENT_SECRET
npm run start --workspace=@vaagatech/snapline-demo-scenario-api-vs-file-graphql
```

**Copy a whole scenario folder** into your project — each is a standalone integration test package:

```
api-vs-file-graphql/
├── .env.example
├── fixtures/cases/...
├── src/
│   ├── run.ts        # entry — same as a consumer would write
│   ├── env.ts        # requireEnv, reports
│   ├── auth.ts       # OAuth from env (when needed)
│   ├── demo-data.ts  # transforms / mappings for this suite
│   └── db.ts         # DB connections from env (when needed)
└── package.json      # only @vaagatech/snapline-core
```

`npm run demo` in the monorepo starts a **local mock API** and seeds **temp SQLite files**, then sets env vars — that wiring lives only in `demo/run-all`, not in individual scenarios.

## License

[MIT](./LICENSE) — free to use, modify, distribute, fork, and contribute.
