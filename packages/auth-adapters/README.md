# @vaagatech/snapline-auth-adapters

Pluggable authentication adapters for test automation and API clients. Initialize OAuth2, OpenID, or Basic Auth credentials and receive ready-to-use HTTP headers.

[![npm version](https://img.shields.io/npm/v/@vaagatech/snapline-auth-adapters)](https://www.npmjs.com/package/@vaagatech/snapline-auth-adapters)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install @vaagatech/snapline-auth-adapters
```

Supports **ESM**, **CommonJS**, and **TypeScript** out of the box.

## When to use

Use `@vaagatech/snapline-auth-adapters` when your tests or scripts need to:

- Attach **Basic Auth** headers to HTTP requests
- Obtain **OAuth2** access tokens via client credentials grant
- Forward **OpenID** tokens or exchange identity assertions

Works standalone or as part of [`@vaagatech/snapline-core`](https://www.npmjs.com/package/@vaagatech/snapline-core) test suites.

## Quick demo

### Basic Auth

```javascript
import { auth } from '@vaagatech/snapline-auth-adapters';

const adapter = auth.basic({
  username: 'service-account',
  password: process.env.API_PASSWORD,
});

const { headers, token } = await adapter.initialize();

const response = await fetch('https://api.example.com/v1/users', {
  headers: { ...headers, Accept: 'application/json' },
});

console.log(response.status);
```

### OAuth2 client credentials

```javascript
import { auth } from '@vaagatech/snapline-auth-adapters';

const adapter = auth.oauth2({
  tokenUrl: 'https://auth.example.com/oauth/token',
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  scope: 'api.read api.write',
});

const { headers } = await adapter.initialize();

const response = await fetch('https://api.example.com/v1/sync', {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'sync' }),
});

console.log(response.status);
```

### OpenID token passthrough

```javascript
import { auth } from '@vaagatech/snapline-auth-adapters';

const adapter = auth.openid({
  idToken: process.env.OPENID_ID_TOKEN,
});

const { headers } = await adapter.initialize();

await fetch('https://api.example.com/v1/profile', { headers });
```

### OpenID assertion exchange

```javascript
import { auth } from '@vaagatech/snapline-auth-adapters';

const adapter = auth.openid({
  assertion: {
    issuer: 'https://idp.example.com',
    subject: 'user-123',
    audience: 'api.example.com',
    tokenUrl: 'https://idp.example.com/token/exchange',
  },
});

const { headers, token } = await adapter.initialize();
console.log('Token acquired:', token ? 'yes' : 'no');
```

### CommonJS

```javascript
const { auth } = require('@vaagatech/snapline-auth-adapters');

(async () => {
  const adapter = auth.basic({ username: 'admin', password: 'secret' });
  const { headers } = await adapter.initialize();
  console.log(headers.Authorization);
})();
```

## Factory API

| Factory | Config | Result headers |
|---------|--------|----------------|
| `auth.basic({ username, password })` | Basic Auth credentials | `Authorization: Basic …` |
| `auth.oauth2({ tokenUrl, clientId, clientSecret, scope? })` | OAuth2 client credentials | `Authorization: Bearer …` |
| `auth.openid({ token? })` | Pre-issued access token | `Authorization: Bearer …` |
| `auth.openid({ idToken? })` | OpenID ID token | `Authorization: Bearer …` + `X-OpenID-Token` |
| `auth.openid({ assertion? })` | Identity assertion exchange | `Authorization: Bearer …` + `X-OpenID-Assertion` |

## Adapter classes

For custom extensions, use or subclass the adapter classes directly:

| Class | Use case |
|-------|----------|
| `AuthAdapter` | Base contract — implement `initialize()` |
| `BasicAuthAdapter` | Base64 Basic Auth |
| `OAuth2Adapter` | Client credentials grant |
| `OpenIdAdapter` | Token passthrough or assertion exchange |

```typescript
import { AuthAdapter, type AuthResult } from '@vaagatech/snapline-auth-adapters';

class ApiKeyAdapter extends AuthAdapter<{ apiKey: string }> {
  async initialize(): Promise<AuthResult> {
    this.headers = { 'X-API-Key': this.config.apiKey };
    this.token = this.config.apiKey;
    return { headers: this.getHeaders(), token: this.token };
  }
}
```

## Configuration reference

### `BasicAuthConfig`

| Field | Required | Description |
|-------|----------|-------------|
| `username` | Yes | Basic Auth username |
| `password` | Yes | Basic Auth password |

### `OAuth2Config`

| Field | Required | Description |
|-------|----------|-------------|
| `tokenUrl` | Yes | Token endpoint URL |
| `clientId` | Yes | OAuth2 client ID |
| `clientSecret` | Yes | OAuth2 client secret |
| `scope` | No | Space-delimited scopes |
| `fetchImpl` | No | Custom fetch implementation (testing/mocking) |

### `OpenIdConfig`

| Field | Required | Description |
|-------|----------|-------------|
| `token` | One of | Pre-issued bearer token |
| `idToken` | One of | OpenID ID token |
| `assertion` | One of | Assertion exchange payload |
| `fetchImpl` | No | Custom fetch implementation |

### `OpenIdAssertionConfig`

| Field | Required | Description |
|-------|----------|-------------|
| `issuer` | Yes | Token issuer (`iss`) |
| `subject` | Yes | Subject identifier (`sub`) |
| `audience` | Yes | Intended audience (`aud`) |
| `privateKey` | No | Assertion signing key |
| `tokenUrl` | No | Assertion exchange endpoint |

## Using with @vaagatech/snapline-core

```javascript
import { testSuite, auth } from '@vaagatech/snapline-core';

await testSuite('Authenticated API Test', {
  auth: auth.oauth2({
    tokenUrl: 'https://auth.example.com/oauth/token',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  }),
  api: {
    endpoint: '/api/v1/resource',
    method: 'GET',
    expectedFile: './fixtures/expected.json',
  },
});
```

## TypeScript

```typescript
import {
  auth,
  OAuth2Adapter,
  type OAuth2Config,
  type AuthResult,
} from '@vaagatech/snapline-auth-adapters';
```

## Module formats

| Import style | Entry | Types |
|--------------|-------|-------|
| ESM `import` | `dist/index.js` | `dist/index.d.ts` |
| CJS `require` | `dist/index.cjs` | `dist/index.d.cts` |

## Requirements

- Node.js **18+** (native `fetch`)

## Examples

Runnable examples ship with the package:

```bash
npm install @vaagatech/snapline-auth-adapters
node node_modules/@vaagatech/snapline-auth-adapters/examples/basic-auth.mjs
```

Or from a cloned monorepo:

```bash
npm run build
node packages/auth-adapters/examples/basic-auth.mjs
```

## Documentation

**https://vaagatech.github.io/snapline/** · [Python edition](https://vaagatech.github.io/snapline-python/)

## Related packages

| Package | Role |
|---------|------|
| [`@vaagatech/snapline-core`](https://www.npmjs.com/package/@vaagatech/snapline-core) | Test orchestration with built-in auth |
| [`@vaagatech/snapline-engine`](https://www.npmjs.com/package/@vaagatech/snapline-engine) | Data reconciliation engine |

## License

[MIT](../../LICENSE) — free to use, modify, distribute, fork, and contribute.

---

Built by [VaagaTech](https://www.vaagatech.com).
