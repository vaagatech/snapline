# @vaagatech/reconcile

Deep data reconciliation engine for declarative snapshot testing. Compare live API or database payloads against JSON fixtures while ignoring volatile fields, normalizing dynamic values, and mapping cross-system schema differences.

[![npm version](https://img.shields.io/npm/v/@vaagatech/reconcile)](https://www.npmjs.com/package/@vaagatech/reconcile)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install @vaagatech/reconcile
```

Supports **ESM**, **CommonJS**, and **TypeScript** out of the box.

## When to use

Use `@vaagatech/reconcile` when you need to:

- Compare API responses or database rows against JSON golden files
- Ignore fields that change every run (`pincode`, transaction IDs, internal metadata)
- Normalize timestamps, UUIDs, or other dynamic values before diffing
- Map equivalent values across systems (`ABC` in DB-A → `CBA` in DB-B)

## Quick demo

### ESM

Save as `reconcile-demo.mjs` and run with `node reconcile-demo.mjs`.

```javascript
import { reconcile, assertAgainstFile } from '@vaagatech/reconcile';
import { writeFileSync } from 'node:fs';

// --- Live response from your API (dynamic fields included) ---
const liveResponse = {
  id: 'usr_001',
  email: 'alice@example.com',
  status: 'synced',
  currentdate: new Date().toISOString(),
  pincode: '482910',
};

// --- Expected fixture (pre-normalized values) ---
const expected = {
  id: 'usr_001',
  email: 'alice@example.com',
  status: 'synced',
  currentdate: 'VALID_DATE',
};

const result = reconcile(liveResponse, expected, {
  ignoreFields: ['pincode'],
  transformations: {
    currentdate: (value) =>
      typeof value === 'string' && !Number.isNaN(Date.parse(value))
        ? 'VALID_DATE'
        : 'INVALID_DATE',
  },
});

console.log(result.match ? 'PASS' : 'FAIL');
console.log(result.diff ?? 'No differences');

// --- File-based assertion ---
writeFileSync('./expected-output.json', JSON.stringify(expected, null, 2));

const fileResult = assertAgainstFile(liveResponse, './expected-output.json', {
  ignoreFields: ['pincode'],
  transformations: {
    currentdate: (value) =>
      typeof value === 'string' && !Number.isNaN(Date.parse(value))
        ? 'VALID_DATE'
        : 'INVALID_DATE',
  },
});

console.log(fileResult.match ? 'File assertion PASS' : 'File assertion FAIL');
```

### CommonJS

```javascript
const { reconcile } = require('@vaagatech/reconcile');

const result = reconcile(
  { id: 1, updatedAt: '2026-07-04T10:00:00Z', traceId: 'abc' },
  { id: 1, updatedAt: 'VALID_DATE' },
  {
    ignoreFields: ['traceId'],
    transformations: {
      updatedAt: (v) =>
        typeof v === 'string' && !Number.isNaN(Date.parse(v))
          ? 'VALID_DATE'
          : 'INVALID_DATE',
    },
  },
);

console.log(result.match);
```

## API reference

### `reconcile(liveData, expectedData, options?)`

Full pipeline: strip ignored fields → apply transformations → apply data mapping → compare.

| Option | Type | Description |
|--------|------|-------------|
| `ignoreFields` | `string[]` | Field names or dot-paths to exclude (e.g. `['pincode', 'meta.requestId']`) |
| `transformations` | `Record<string, Function>` | Per-field functions applied to **live data only** |
| `dataMapping` | `Record<string, object \| Function>` | Value lookup tables or mappers applied to **live data only** |

**Returns:** `{ match, processed, expected, diff }`

### `assertAgainstFile(liveData, expectedFilePath, options?)`

Loads a JSON fixture from disk and runs `reconcile`.

### Standalone utilities

| Function | Purpose |
|----------|---------|
| `stripFields(data, ignoreFields)` | Remove ignored fields recursively |
| `applyTransformations(data, transformations)` | Run field transformers |
| `applyDataMapping(data, dataMapping)` | Apply cross-system value maps |
| `compareObjects(actual, expected)` | Deep structural compare |
| `diffValues(actual, expected)` | Return first diff or `null` |
| `loadJsonFile(path)` | Read and parse a JSON fixture |
| `deepClone(value)` | JSON-safe deep clone |
| `isPlainObject(value)` | Plain object type guard |
| `stableStringify(value)` | Deterministic JSON string |

## Configuration patterns

### Ignore dynamic fields

```javascript
ignoreFields: ['pincode', 'transactionId', 'response.headers.date']
```

### Normalize timestamps

```javascript
transformations: {
  createdAt: (value) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value))
      ? 'VALID_DATE'
      : 'INVALID_DATE',
  updatedAt: (value) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value))
      ? 'VALID_DATE'
      : 'INVALID_DATE',
}
```

Expected fixtures should already contain normalized values (`VALID_DATE`), not raw ISO strings.

### Cross-database status mapping

```javascript
dataMapping: {
  status: {
    ABC: 'CBA',
    PENDING: 'IN_PROGRESS',
  },
}
```

Functional mapping:

```javascript
dataMapping: {
  status: (value) => (value === 'ABC' ? 'CBA' : value),
}
```

## TypeScript

Full types are exported:

```typescript
import {
  reconcile,
  type ReconcileOptions,
  type ReconcileResult,
  type DiffResult,
} from '@vaagatech/reconcile';
```

## Module formats

| Import style | Entry | Types |
|--------------|-------|-------|
| ESM `import` | `dist/index.js` | `dist/index.d.ts` |
| CJS `require` | `dist/index.cjs` | `dist/index.d.cts` |

## Requirements

- Node.js **18+**

## Examples

Runnable examples ship with the package:

```bash
npm install @vaagatech/reconcile
node node_modules/@vaagatech/reconcile/examples/basic-reconcile.mjs
```

Or from a cloned monorepo:

```bash
npm run build
node packages/reconcile/examples/basic-reconcile.mjs
```

## Related packages

| Package | Role |
|---------|------|
| [`@vaagatech/core`](https://www.npmjs.com/package/@vaagatech/core) | Full test orchestration DSL |
| [`@vaagatech/auth-adapters`](https://www.npmjs.com/package/@vaagatech/auth-adapters) | OAuth2, OpenID, Basic Auth |

## License

[MIT](../../LICENSE) — free to use, modify, distribute, fork, and contribute.

---

Built by [VaagaTech](https://www.vaagatech.com).
