# project-graphql — sample GraphQL integration project

This scenario models a **real customer GraphQL API** with three operations and **Auth0/Okta-style** machine-to-machine auth.

## Operations under test

| # | GraphQL operation | Type | Fixture case |
|---|-------------------|------|--------------|
| 1 | `customerAccount(email)` | Query | `01-pass-customer-account`, `04-fail-segment-mapping` |
| 2 | `syncCustomerProfile(customerId, segment)` | Mutation | `03-pass-sync-profile` |
| 3 | `customerOrders(email, limit)` | Query | `02-pass-customer-orders`, `05-fail-orders-count` |

Auth failure: `06-fail-auth` (expected HTTP 401).

## Mock vs production auth

**Demo mock** (started by `npm run demo`):

```bash
AUTH_TOKEN_URL=http://127.0.0.1:3847/oauth/token
CLIENT_ID=demo-client
CLIENT_SECRET=demo-secret
```

**Auth0** (client credentials):

```javascript
auth.oauth2({
  tokenUrl: 'https://YOUR_TENANT.auth0.com/oauth/token',
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  scope: 'read:graphql write:graphql',
});
```

Set `AUTH_TOKEN_URL` to your Auth0 token URL when running this scenario standalone.

**Okta**:

```javascript
auth.oauth2({
  tokenUrl: 'https://YOUR_DOMAIN.okta.com/oauth2/default/v1/token',
  clientId: process.env.OKTA_CLIENT_ID,
  clientSecret: process.env.OKTA_CLIENT_SECRET,
  scope: 'snapline.graphql',
});
```

See `src/auth.ts` for the shared `createAuth()` helper used by all fixture cases.

## Run

```bash
npm run demo:run -- project-graphql
```

## Swap the mock API

Replace `API_BASE_URL` with your GraphQL gateway. Keep fixture `expected.json` files as golden snapshots and adjust `dataMapping` / `transformations` presets in `src/demo-data.ts`.
