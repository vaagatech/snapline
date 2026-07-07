# @vaagatech/snapline-engine

Deep JSON comparison engine for declarative snapshot testing.

[![npm version](https://img.shields.io/npm/v/@vaagatech/snapline-engine)](https://www.npmjs.com/package/@vaagatech/snapline-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install @vaagatech/snapline-engine
```

Supports **ESM**, **CommonJS**, and **TypeScript** out of the box.

## When to use

Use `@vaagatech/snapline-engine` when you need to:

- Compare API responses or database rows against JSON golden files
- Ignore fields that change every run (`pincode`, transaction IDs, internal metadata)
- Normalize timestamps, UUIDs, or other dynamic values before diffing
- Map equivalent values across systems (`ABC` in DB-A → `CBA` in DB-B)

## Quick demo

### ESM

Save as `snapline-demo.mjs` and run with `node snapline-demo.mjs`.

```javascript
import { snapline, assertAgainstFile } from '@vaagatech/snapline-engine';
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

const result = snapline(liveResponse, expected, {
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
const { snapline } = require('@vaagatech/snapline-engine');

const result = snapline(
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

### `snapline(liveData, expectedData, options?)`

Full pipeline: strip ignored fields → apply transformations → apply data mapping → compare.

| Option | Type | Description |
|--------|------|-------------|
| `ignoreFields` | `string[]` | Field names or dot-paths to exclude (e.g. `['pincode', 'meta.requestId']`) |
| `transformations` | `Record<string, Function>` | Per-field functions applied to **live data only** |
| `dataMapping` | `Record<string, object \| Function>` | Value lookup tables or mappers applied to **live data only** |

**Returns:** `{ match, processed, expected, diff }`

### `assertAgainstFile(liveData, expectedFilePath, options?)`

Loads a JSON fixture from disk and runs `snapline`.

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
const transformations = {
  createdAt: (value) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value))
      ? 'VALID_DATE'
      : 'INVALID_DATE',
  updatedAt: (value) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value))
      ? 'VALID_DATE'
      : 'INVALID_DATE',
};
```

Expected fixtures should already contain normalized values (`VALID_DATE`), not raw ISO strings.

### Cross-database status mapping

```javascript
const dataMapping = {
  status: {
    ABC: 'CBA',
    PENDING: 'IN_PROGRESS',
  },
};
```

Functional mapping:

```javascript
const dataMapping = {
  status: (value) => (value === 'ABC' ? 'CBA' : value),
};
```

## TypeScript

Full types are exported:

```typescript
import {
  snapline,
  type SnaplineOptions,
  type SnaplineResult,
  type DiffResult,
} from '@vaagatech/snapline-engine';
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
npm install @vaagatech/snapline-engine
node node_modules/@vaagatech/snapline-engine/examples/basic-snapline.mjs
```

Or from a cloned monorepo:

```bash
npm run build
node packages/snapline/examples/basic-snapline.mjs
```

## Documentation

**https://vaagatech.github.io/snapline/** · [Python edition](https://vaagatech.github.io/snapline-python/)

## Related packages

| Package | Role |
|---------|------|
| [`@vaagatech/snapline-core`](https://www.npmjs.com/package/@vaagatech/snapline-core) | Full test orchestration DSL |
| [`@vaagatech/snapline-auth-adapters`](https://www.npmjs.com/package/@vaagatech/snapline-auth-adapters) | OAuth2, OpenID, Basic Auth |

## License

[MIT](../../LICENSE) — free to use, modify, distribute, fork, and contribute.

---

Built by [VaagaTech](https://www.vaagatech.com).
