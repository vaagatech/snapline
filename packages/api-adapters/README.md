# @vaagatech/snapline-api-adapters

Minimal API adapters for REST, SOAP, and GraphQL — file-driven test requests with zero browser dependencies.

[![npm version](https://img.shields.io/npm/v/@vaagatech/snapline-api-adapters)](https://www.npmjs.com/package/@vaagatech/snapline-api-adapters)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install @vaagatech/snapline-api-adapters
```

## When to use

Use when you need a single, minimal way to call APIs in tests — without learning protocol-specific clients. Pick a protocol, point at a file, get normalized JSON back.

| Protocol | Best for |
|----------|----------|
| **REST** | JSON HTTP APIs |
| **SOAP** | XML envelope services |
| **GraphQL** | Query/mutation endpoints |

## Quick demo

### REST

```javascript
import { api, executeApi } from '@vaagatech/snapline-api-adapters';

const result = await executeApi(
  api.rest({
    endpoint: 'https://api.example.com/users/1',
    method: 'GET',
  }),
);

console.log(result.status, result.data);
```

### SOAP

```javascript
import { api, executeApi } from '@vaagatech/snapline-api-adapters';

const result = await executeApi(
  api.soap({
    endpoint: 'https://api.example.com/soap/user',
    soapAction: 'GetUser',
    inputFile: './fixtures/soap-request.xml',
  }),
);

console.log(result.data); // parsed XML body as plain object
```

### GraphQL

```javascript
import { api, executeApi } from '@vaagatech/snapline-api-adapters';

const result = await executeApi(
  api.graphql({
    endpoint: 'https://api.example.com/graphql',
    queryFile: './fixtures/get-user.graphql',
    variablesFile: './fixtures/variables.json',
    dataPath: 'user',
  }),
);

console.log(result.data);
```

## Factory API

```javascript
import { api } from '@vaagatech/snapline-api-adapters';

api.rest({ endpoint, method, inputFile, body, headers }); // method, inputFile, body, headers optional
api.soap({ endpoint, soapAction, envelope, inputFile, headers }); // soapAction, envelope, inputFile, headers optional
api.graphql({ endpoint, query, queryFile, variables, variablesFile, dataPath, headers }); // all but endpoint optional
```

## Configuration

### REST (`api.rest`)

| Field | Required | Description |
|-------|----------|-------------|
| `endpoint` | Yes | URL or path (resolved with `baseUrl` in context) |
| `method` | No | `GET` `POST` `PUT` `PATCH` `DELETE` `HEAD` (default `GET`) |
| `inputFile` | No | JSON file used as request body |
| `body` | No | Inline JSON body |
| `headers` | No | Extra HTTP headers |

### SOAP (`api.soap`)

| Field | Required | Description |
|-------|----------|-------------|
| `endpoint` | Yes | SOAP service URL |
| `inputFile` | No | XML envelope file |
| `envelope` | No | Inline XML envelope string |
| `soapAction` | No | Value for `SOAPAction` header |
| `headers` | No | Extra HTTP headers |

### GraphQL (`api.graphql`)

| Field | Required | Description |
|-------|----------|-------------|
| `endpoint` | Yes | GraphQL endpoint URL |
| `query` | One of | Inline query string |
| `queryFile` | One of | `.graphql` or JSON `{ "query": "..." }` file |
| `variables` | No | Inline variables object |
| `variablesFile` | No | JSON variables file |
| `dataPath` | No | Dot-path into `data` (e.g. `"user"`) |
| `headers` | No | Extra HTTP headers |

## Execute context

Pass auth headers, base URL, or DB-driven input when calling `executeApi`:

```javascript
await executeApi(apiConfig, {
  baseUrl: 'https://api.example.com',
  authHeaders: { Authorization: 'Bearer token' },
  inputFromRow: { email: 'alice@example.com' }, // merged into body/variables or GET query params
});
```

## Examples

```bash
npm install @vaagatech/snapline-api-adapters
node node_modules/@vaagatech/snapline-api-adapters/examples/rest.mjs
node node_modules/@vaagatech/snapline-api-adapters/examples/soap.mjs
node node_modules/@vaagatech/snapline-api-adapters/examples/graphql.mjs
```

From monorepo:

```bash
npm run build
node packages/api-adapters/examples/rest.mjs
```

## TypeScript

```typescript
import { api, executeApi, type ApiRequestConfig, type ApiExecuteResult } from '@vaagatech/snapline-api-adapters';
```

## Module formats

| Import style | Entry | Types |
|--------------|-------|-------|
| ESM `import` | `dist/index.js` | `dist/index.d.ts` |
| CJS `require` | `dist/index.cjs` | `dist/index.d.cts` |

## Documentation

**https://vaagatech.github.io/snapline/** · [Python edition](https://vaagatech.github.io/snapline-python/)

## Related packages

| Package | Role |
|---------|------|
| [`@vaagatech/snapline-core`](https://www.npmjs.com/package/@vaagatech/snapline-core) | Full test orchestration with `api`, `apiToDb`, `dbToApi` |
| [`@vaagatech/snapline-engine`](https://www.npmjs.com/package/@vaagatech/snapline-engine) | Compare API/DB results against fixtures |

## License

[MIT](../../LICENSE) — free to use, modify, distribute, fork, and contribute.
