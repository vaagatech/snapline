# @vaagatech/reconcile

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

**Declarative Snapshot and Reconciliation Testing** for Node.js — an open-source testing framework by [VaagaTech](https://www.vaagatech.com).

Write integration tests as data. Compare APIs, databases, and JSON fixtures — no imperative assertion chains.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [`@vaagatech/core`](./packages/core) | [`@vaagatech/core`](https://www.npmjs.com/package/@vaagatech/core) | Test orchestration DSL |
| [`@vaagatech/api-adapters`](./packages/api-adapters) | [`@vaagatech/api-adapters`](https://www.npmjs.com/package/@vaagatech/api-adapters) | REST, SOAP, GraphQL |
| [`@vaagatech/reconcile`](./packages/reconcile) | [`@vaagatech/reconcile`](https://www.npmjs.com/package/@vaagatech/reconcile) | Data reconciliation engine |
| [`@vaagatech/auth-adapters`](./packages/auth-adapters) | [`@vaagatech/auth-adapters`](https://www.npmjs.com/package/@vaagatech/auth-adapters) | OAuth2, OpenID, Basic Auth |

## Test modes

| Mode | Config | Protocols |
|------|--------|-----------|
| API ↔ file | `api` | REST, SOAP, GraphQL |
| DB ↔ DB | `dbComparison` | Any SQL-backed DB |
| API ↔ DB | `apiToDb` | REST, SOAP, GraphQL |
| DB ↔ API | `dbToApi` | REST, SOAP, GraphQL |

## Install

```bash
npm install @vaagatech/core
```

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
  },

  // DB vs DB
  dbComparison: {
    sourceDb: db.postgres('postgresql://localhost/src'),
    targetDb: db.mysql('mysql://localhost/target'),
    query: 'SELECT status FROM users WHERE email = :email',
    dataMapping: { status: { ABC: 'CBA' } },
  },

  // API vs DB
  apiToDb: {
    api: api.rest({ endpoint: '/profile', method: 'GET' }),
    db: { db: db.postgres('postgresql://localhost/app'), query: 'SELECT ...' },
  },
});
```

## Full demo (6 modes)

```bash
git clone https://github.com/vaagatech/reconcile.git
cd reconcile
npm install
npm run demo
```

Runs: REST file test · DB↔DB · API↔DB · DB↔API · GraphQL file test · SOAP file test.

## Development

```bash
npm install
npm run build
npm run typecheck
npm run demo
```

## Publishing

```bash
npm run publish:packages
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
