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

### 2. DB vs DB

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

## Examples

```bash
node packages/core/examples/api-to-db.mjs
node packages/core/examples/db-to-api.mjs
node packages/core/examples/db-comparison.mjs
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
