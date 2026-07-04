# @vaagatech/reconcile

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

**Declarative Snapshot and Reconciliation Testing** for Node.js — an open-source testing framework by [VaagaTech](https://www.vaagatech.com).

Write integration tests as data. Compare APIs, databases, and JSON fixtures — no imperative assertion chains. Designed for real-world integration scenarios: OAuth2-protected GraphQL, multi-table SQLite warehouses, cross-system status codes, and nested JSON payloads.

## Why reconcile?

Traditional integration tests often look like this:

```javascript
expect(response.status).toBe(200);
expect(response.body.email).toBe('alice@example.com');
expect(response.body.status).toBe('synced');
// … dozens more field assertions, brittle to schema drift
```

With reconcile, you declare **what** should match and **how** to normalize differences:

```javascript
await testSuite('User sync', {
  auth: auth.oauth2({ tokenUrl: '...', clientId: '...', clientSecret: '...' }),
  baseUrl: 'https://api.example.com',
  api: {
    endpoint: '/api/v1/user/sync',
    method: 'POST',
    inputFile: './fixtures/input.json',
    expectedFile: './fixtures/expected.json',
    ignoreFields: ['pincode', 'metadata.traceId'],
    transformations: { currentdate: (v) => (isValidDate(v) ? 'VALID_DATE' : 'INVALID_DATE') },
    dataMapping: { status: { synced: 'SYNCED' } },
  },
});
```

The framework handles HTTP calls, auth headers, deep object comparison, and structured diffs when values diverge.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [`@vaagatech/core`](./packages/core) | [`@vaagatech/core`](https://www.npmjs.com/package/@vaagatech/core) | Test orchestration DSL — `testSuite`, DB helpers, reporting |
| [`@vaagatech/api-adapters`](./packages/api-adapters) | [`@vaagatech/api-adapters`](https://www.npmjs.com/package/@vaagatech/api-adapters) | REST, SOAP, GraphQL executors |
| [`@vaagatech/reconcile`](./packages/reconcile) | [`@vaagatech/reconcile`](https://www.npmjs.com/package/@vaagatech/reconcile) | Data reconciliation engine — `reconcile`, `assertAgainstFile` |
| [`@vaagatech/auth-adapters`](./packages/auth-adapters) | [`@vaagatech/auth-adapters`](https://www.npmjs.com/package/@vaagatech/auth-adapters) | OAuth2, OpenID Connect, Basic Auth |

## Test modes

| Mode | Config key | What it does | Protocols |
|------|------------|--------------|-----------|
| **API ↔ file** | `api` | Call an API and compare the response to a JSON fixture | REST, SOAP, GraphQL |
| **DB ↔ DB** | `dbComparison` | Run the same query on two databases and reconcile the rows | Postgres, MySQL, SQLite |
| **API ↔ DB** | `apiToDb` | Call an API and reconcile the response with a DB row | REST, SOAP, GraphQL |
| **DB ↔ API** | `dbToApi` | Read a DB row, call an API, reconcile row with response | REST, SOAP, GraphQL |

Combine multiple modes in one `testSuite` — they run in sequence. All comparison modes support the same reconcile options (below).

## Reconcile options

Every comparison accepts these options from `@vaagatech/reconcile`:

| Option | Type | Purpose | Example |
|--------|------|---------|---------|
| `ignoreFields` | `string[]` | Strip volatile fields before compare (supports dot paths) | `['pincode', 'metadata.traceId']` |
| `transformations` | `Record<string, fn>` | Normalize dynamic values on the **live** side | Dates → `'VALID_DATE'`, role → uppercase |
| `dataMapping` | `Record<string, map\|fn>` | Map equivalent codes across systems | `{ status: { synced: 'SYNCED' } }` |

Processing order: **strip ignored fields → apply transformations → apply data mapping → deep compare**.

Use `@vaagatech/reconcile` directly for unit-style tests without HTTP:

```javascript
import { reconcile, assertAgainstFile } from '@vaagatech/reconcile';

const result = reconcile(liveData, expectedData, {
  ignoreFields: ['metadata.requestId'],
  transformations: { tier: (v) => String(v).toUpperCase() },
  dataMapping: { status: { ACTIVE: 'ACTV' } },
});

console.log(result.match, result.diff);
```

## Install

```bash
npm install @vaagatech/core
```

`@vaagatech/core` re-exports the reconcile engine, API adapters, and auth factories — one import covers most use cases.

## Quick start

```javascript
import { testSuite, auth, api, db } from '@vaagatech/core';

await testSuite('Integration test', {
  auth: auth.oauth2({ tokenUrl: '...', clientId: '...', clientSecret: '...' }),
  baseUrl: 'https://api.example.com',

  // API vs JSON fixture (REST)
  api: {
    endpoint: '/sync',
    method: 'POST',
    inputFile: './input.json',
    expectedFile: './expected.json',
    ignoreFields: ['pincode'],
  },

  // DB vs DB
  dbComparison: {
    sourceDb: db.postgres('postgresql://localhost/src'),
    targetDb: db.mysql('mysql://localhost/target'),
    query: 'SELECT status FROM users WHERE email = :email',
    params: { email: 'alice@example.com' },
    dataMapping: { status: { ABC: 'CBA' } },
  },

  // API vs DB
  apiToDb: {
    api: api.rest({ endpoint: '/profile', method: 'GET' }),
    db: {
      db: db.postgres('postgresql://localhost/app'),
      query: 'SELECT email, status FROM users WHERE email = :email',
      params: { email: 'alice@example.com' },
    },
    dataMapping: { status: { synced: 'SYNCED' } },
  },

  // DB vs API (DB row feeds API input)
  dbToApi: {
    db: {
      db: db.postgres('postgresql://localhost/app'),
      query: 'SELECT email, status FROM users WHERE email = :email',
      params: { email: 'alice@example.com' },
    },
    api: api.graphql({
      endpoint: '/graphql',
      query: 'query ($email: String!) { user(email: $email) { email status } }',
      dataPath: 'user',
    }),
    inputFromDb: true,
  },
});
```

### GraphQL with OAuth2

```javascript
import { testSuite, auth, api } from '@vaagatech/core';

await testSuite('GraphQL customer account', {
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
    dataMapping: {
      status: { synced: 'ACTIVE' },
      planCode: { PRO: 'premium' },
    },
  },
});
```

## Monorepo layout

```
testing-framework/
├── packages/
│   ├── core/              @vaagatech/core — testSuite, DB, reporting
│   ├── reconcile/         @vaagatech/reconcile — reconciliation engine
│   ├── api-adapters/      @vaagatech/api-adapters — REST, SOAP, GraphQL
│   └── auth-adapters/     @vaagatech/auth-adapters — OAuth2, OpenID, Basic
├── demo/
│   ├── shared/            Mock API + GraphQL server, SQLite seeds, fixture runners
│   ├── run-all/           Orchestrates all 15 scenarios
│   └── scenarios/         One npm workspace per scenario (15 total)
├── scripts/
│   └── sync-versions.mjs  Keeps package.json versions in sync across the monorepo
└── .github/workflows/     CI publish on version tags
```

Published to npm: `@vaagatech/core`, `@vaagatech/reconcile`, `@vaagatech/api-adapters`, `@vaagatech/auth-adapters`.

Demo workspaces are private and live under `demo/`.

## Full integration demo

The demo is a realistic customer-account domain: nested GraphQL types, OAuth2, multi-table SQLite (customers, profiles, subscriptions, orders), and warehouse DBs with different status/plan codes.

```bash
git clone https://github.com/vaagatech/reconcile.git
cd reconcile
npm install
npm run demo          # build + run all 15 scenarios
```

Run a single scenario:

```bash
npm run start --workspace=@vaagatech/demo-scenario-api-vs-file-graphql
npm run start --workspace=@vaagatech/demo-scenario-db-vs-db-sqlite
```

### Demo scenarios (15)

| # | Scenario | Mode | Highlights |
|---|----------|------|------------|
| 1 | `reconcile-ignore-fields` | API ↔ file | Nested `ignoreFields` (`metadata.trackedAt`) |
| 2 | `reconcile-transformations` | Fixture cases | Pass + expected transformation failures |
| 3 | `db-vs-db-sqlite` | DB ↔ DB | Multi-table JOIN (customers + orders), lookup mapping |
| 4 | `reconcile-data-mapping-function` | Fixture + DB | Function mapper + plan code lookup |
| 5 | `db-comparison-transformations` | DB ↔ DB | Date normalization on audit tables |
| 6 | `reconcile-combined-options` | API ↔ DB | ignoreFields + transformations + dataMapping |
| 7 | `api-vs-file-rest` | API ↔ file | OAuth2 POST + volatile field stripping |
| 8 | `api-vs-file-graphql` | API ↔ file | OAuth2 GraphQL, 7 fixture cases (pass + fail) |
| 9 | `api-vs-file-soap` | API ↔ file | SOAP envelope vs JSON fixture |
| 10 | `api-vs-db-rest` | API ↔ DB | REST profile vs multi-table SQLite JOIN |
| 11 | `api-vs-db-graphql` | API ↔ DB | OAuth2 GraphQL snapshot vs 3-table JOIN |
| 12 | `api-vs-db-soap` | API ↔ DB | SOAP user vs SQLite JOIN |
| 13 | `db-vs-api-rest` | DB ↔ API | SQLite JOIN vs REST (`inputFromDb`) |
| 14 | `db-vs-api-graphql` | DB ↔ API | SQLite JOIN vs OAuth2 GraphQL snapshot |
| 15 | `db-vs-api-soap` | DB ↔ API | SQLite JOIN vs SOAP |

### Multi-case fixtures (pass + expected failures)

Several scenarios use a **fixture case** pattern under `fixtures/cases/` — each case is a self-contained test with its own input and expected output:

```
fixtures/cases/
  01-pass-full-account/
    case.json          # metadata, reconcile options, expectMatch: true
    query.graphql      # or live.json for pure reconcile tests
    variables.json
    expected.json
  03-fail-data-mapping-status/
    case.json          # expectMatch: false, failureType, expectedDiffPath
    ...
  07-fail-auth-missing-token/
    case.json          # skipAuth: true, expectStatus: 401
    ...
```

`case.json` fields:

| Field | Purpose |
|-------|---------|
| `expectMatch: true` | Normal pass — reconcile must succeed |
| `expectMatch: false` | Negative test — mismatch is the expected outcome |
| `failureType` | `"dataMapping"`, `"transformation"`, or `"auth"` |
| `expectedDiffPath` | Assert the diff occurs at a specific field path |
| `skipAuth` | Omit Bearer token (for auth failure cases) |
| `expectStatus` | Expected HTTP status (default `200`) |

The shared helper `runApiFixtureCases()` (in `@vaagatech/demo-shared`) discovers case folders, initializes OAuth2 once, and validates both pass and expected-failure outcomes.

### Test reports

Generate uploadable reports for CI dashboards:

```bash
REPORT_FORMAT=json  npm run demo
REPORT_FORMAT=html  npm run demo
REPORT_FORMAT=text  npm run demo

# Or per-scenario CLI flags:
npm run start --workspace=@vaagatech/demo-run-all -- --report-format=html --report-output=./reports/run.html
```

Supported formats: **json**, **html**, **text**.

## Development

```bash
npm install
npm run build              # packages + demos
npm run build:packages     # publish-safe build order
npm run build:demos        # demo workspaces only
npm run typecheck
npm run demo               # full integration demo
npm run version:verify     # check all package.json versions match
npm run version:sync 0.1.5  # sync versions across monorepo
```

Package examples (no demo server required):

```bash
node packages/core/examples/api-to-db.mjs
node packages/core/examples/graphql-file-test.mjs
node packages/reconcile/examples/basic-reconcile.mjs
```

## Publishing

Packages publish to npm when a tag matching `v{major}.{minor}.{patch}` is pushed (e.g. `v0.1.4`). CI validates the tag, verifies version sync, builds in dependency order, and publishes all four packages.

```bash
# Local publish (maintainers)
npm run publish:packages
```

After a successful publish, CI bumps `main` to the next patch version and syncs all `package.json` files via `scripts/sync-versions.mjs`.

## Documentation

| Resource | Description |
|----------|-------------|
| [`packages/core/README.md`](./packages/core/README.md) | `testSuite` API, all test modes, reporting |
| [`packages/reconcile/README.md`](./packages/reconcile/README.md) | Reconcile options, `assertAgainstFile`, diff format |
| [`packages/api-adapters/README.md`](./packages/api-adapters/README.md) | REST, SOAP, GraphQL adapter config |
| [`packages/auth-adapters/README.md`](./packages/auth-adapters/README.md) | OAuth2, OpenID, Basic Auth setup |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) — free to use, modify, distribute, fork, and contribute.
