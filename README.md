# Reconcile

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

**Declarative Snapshot and Reconciliation Testing** for Node.js — an open-source product by [VaagaTech](https://www.vaagatech.com).

Published under the `@vaagatech` npm scope with a `reconcile-*` prefix so other VaagaTech products can coexist (e.g. `@vaagatech/other-product-core`).

Compare APIs, databases, and JSON fixtures as data — no imperative assertion chains. Install from npm and point tests at **your** services.

```bash
npm install @vaagatech/reconcile-core
```

## Getting started in 5 minutes

This walkthrough sets up **integration testing in a new Node.js project** — not the repo demo. You will install from npm, add fixtures, write a `testSuite`, and run it against your API.

Requires **Node.js 18+**.

---

### Minute 1 — Create your integration test project

```bash
mkdir my-app-integration-tests && cd my-app-integration-tests
npm init -y
npm install @vaagatech/reconcile-core
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
import { testSuite, auth } from '@vaagatech/reconcile-core';

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
import { testSuite, auth, api, db } from '@vaagatech/reconcile-core';

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
import { writeTestReport } from '@vaagatech/reconcile-core';

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

**More examples:** [`packages/core/README.md`](./packages/core/README.md) · [`packages/reconcile/README.md`](./packages/reconcile/README.md)

---

## Test modes

| Mode | Config key | What it does | Protocols |
|------|------------|--------------|-----------|
| **API ↔ file** | `api` | Call an API and compare the response to a JSON fixture | REST, SOAP, GraphQL |
| **DB ↔ DB** | `dbComparison` | Run the same query on two databases and reconcile the rows | Postgres, MySQL, SQLite |
| **API ↔ DB** | `apiToDb` | Call an API and reconcile the response with a DB row | REST, SOAP, GraphQL |
| **DB ↔ API** | `dbToApi` | Read a DB row, call an API, reconcile row with response | REST, SOAP, GraphQL |

Combine multiple modes in one `testSuite` — they run in sequence.

## Reconcile options

Every comparison accepts:

| Option | Purpose | Example |
|--------|---------|---------|
| `ignoreFields` | Strip volatile fields (supports dot paths) | `['pincode', 'metadata.traceId']` |
| `transformations` | Normalize dynamic values on the **live** side | Dates → `'VALID_DATE'`, uppercase enums |
| `dataMapping` | Map equivalent codes across systems | `{ status: { synced: 'SYNCED' } }` |

Processing order: **ignore → transform → map → deep compare**.

```javascript
import { reconcile } from '@vaagatech/reconcile-core';

const { match, diff } = reconcile(liveData, expectedData, {
  ignoreFields: ['metadata.requestId'],
  transformations: { tier: (v) => String(v).toUpperCase() },
  dataMapping: { status: { ACTIVE: 'ACTV' } },
});
```

## Usage reference

### REST — API vs file

```javascript
import { testSuite, auth } from '@vaagatech/reconcile-core';

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
import { testSuite, auth, api } from '@vaagatech/reconcile-core';

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
import { testSuite, api } from '@vaagatech/reconcile-core';

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
import { testSuite, db } from '@vaagatech/reconcile-core';

await testSuite('Warehouse sync', {
  dbComparison: {
    sourceDb: db.postgres(process.env.SOURCE_DATABASE_URL),
    targetDb: db.mysql(process.env.TARGET_DATABASE_URL),
    query: 'SELECT status, email FROM users WHERE email = :email',
    params: { email: 'alice@example.com' },
    dataMapping: { status: { ABC: 'CBA' } },
  },
});
```

### DB vs API (`inputFromDb`)

```javascript
import { testSuite, api, db } from '@vaagatech/reconcile-core';

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
import { auth } from '@vaagatech/reconcile-core';

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
| [`@vaagatech/reconcile-core`](./packages/core) | [`@vaagatech/reconcile-core`](https://www.npmjs.com/package/@vaagatech/reconcile-core) | **Start here** — `testSuite`, DB helpers, reporting |
| [`@vaagatech/reconcile-engine`](./packages/reconcile) | [`@vaagatech/reconcile-engine`](https://www.npmjs.com/package/@vaagatech/reconcile-engine) | Reconciliation engine — `reconcile`, `assertAgainstFile` |
| [`@vaagatech/reconcile-api-adapters`](./packages/api-adapters) | [`@vaagatech/reconcile-api-adapters`](https://www.npmjs.com/package/@vaagatech/reconcile-api-adapters) | REST, SOAP, GraphQL executors |
| [`@vaagatech/reconcile-auth-adapters`](./packages/auth-adapters) | [`@vaagatech/reconcile-auth-adapters`](https://www.npmjs.com/package/@vaagatech/reconcile-auth-adapters) | OAuth2, OpenID Connect, Basic Auth |

Install `@vaagatech/reconcile-core` only — it re-exports the rest.

## Why reconcile?

Traditional integration tests chain many field assertions that break when schemas evolve:

```javascript
expect(response.status).toBe(200);
expect(response.body.email).toBe('alice@example.com');
expect(response.body.status).toBe('synced');
```

Reconcile lets you declare **what** should match and **how** to normalize differences in one config object — the framework handles HTTP, auth, deep compare, and structured diffs.

## Documentation

| Resource | Description |
|----------|-------------|
| [`packages/core/README.md`](./packages/core/README.md) | Full `testSuite` API and examples |
| [`packages/reconcile/README.md`](./packages/reconcile/README.md) | Reconcile options and diff format |
| [`packages/api-adapters/README.md`](./packages/api-adapters/README.md) | REST, SOAP, GraphQL config |
| [`packages/auth-adapters/README.md`](./packages/auth-adapters/README.md) | OAuth2, OpenID, Basic Auth |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Development (maintainers)

```bash
git clone https://github.com/vaagatech/reconcile.git
cd reconcile
npm install
npm run build
npm run typecheck
npm run publish:packages   # publish all four npm packages
```

Monorepo layout: `packages/` (published) · `demo/` (private, not on npm) · `scripts/sync-versions.mjs`

## Full integration demo (optional)

The repo includes a **15-scenario demo** with a mock REST/GraphQL/SOAP server and SQLite seeds. It is reference material only — **not required** for using the npm packages.

```bash
git clone https://github.com/vaagatech/reconcile.git
cd reconcile
npm install
npm run demo
```

| # | Scenario | Mode | Highlights |
|---|----------|------|------------|
| 1 | `reconcile-ignore-fields` | API ↔ file | Nested `ignoreFields` |
| 2 | `reconcile-transformations` | Fixture cases | Pass + expected transformation failures |
| 3 | `db-vs-db-sqlite` | DB ↔ DB | Multi-table JOIN, lookup mapping |
| 4 | `reconcile-data-mapping-function` | Fixture + DB | Function mapper |
| 5 | `db-comparison-transformations` | DB ↔ DB | Date normalization |
| 6 | `reconcile-combined-options` | API ↔ DB | All reconcile options combined |
| 7 | `api-vs-file-rest` | API ↔ file | OAuth2 REST |
| 8 | `api-vs-file-graphql` | API ↔ file | OAuth2 GraphQL, 7 fixture cases |
| 9 | `api-vs-file-soap` | API ↔ file | SOAP vs JSON |
| 10–15 | `api-vs-db-*`, `db-vs-api-*` | Cross-system | REST, GraphQL, SOAP vs SQLite |

Run one scenario: `npm run start --workspace=@vaagatech/reconcile-demo-scenario-api-vs-file-graphql`

Copy fixture patterns from `demo/scenarios/*/fixtures/` into your own project.

## License

[MIT](./LICENSE) — free to use, modify, distribute, fork, and contribute.
