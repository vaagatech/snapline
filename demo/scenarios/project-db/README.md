# project-db — sample data-warehouse consistency project

Validates that **all SQL warehouse rows** appear in the **NoSQL target** after ETL mapping rules — using **chunked, streamed comparison** so large datasets never load fully into memory.

## Demo substitutes (swap for production)

| Demo | Production |
|------|------------|
| SQLite via `createSqliteConnection` from `@vaagatech/snapline-demo-shared` | **Postgres** — implement `DbConnectionLike` with your `pg` client |
| `nosql.memory()` | **MongoDB** — implement `DocumentStoreLike.find()` against your collections |

See `src/warehouse-seed.ts` for seeding. Replace `seedWarehouseDemo()` with connections to your real stores; keep `warehouse-table-manifest.ts` as the mapping contract.

## Scale (26–30 tables)

This demo ships **8 tables** to stay readable. Add more `WarehouseTableSpec` entries to `src/warehouse-table-manifest.ts` — production pipelines often compare **26–30 tables** using the same manifest pattern.

## Framework API

Uses **`runWarehouseComparison`** from `@vaagatech/snapline-core`:

- Processes one **chunk** at a time (`WAREHOUSE_CHUNK_SIZE`, default 50)
- Optional caps: `WAREHOUSE_MAX_ROWS_PER_TABLE`, `WAREHOUSE_MAX_TOTAL_ROWS`
- **Streams** JSONL events to `WAREHOUSE_REPORT_PATH` (no full report in memory)
- Single process — no application restarts between tables

```bash
WAREHOUSE_CHUNK_SIZE=100 \
WAREHOUSE_MAX_ROWS_PER_TABLE=5000 \
WAREHOUSE_REPORT_PATH=./reports/warehouse.jsonl \
npm run demo:run -- project-db
```

## Stream report format (JSONL)

Each line is one event:

```jsonl
{"type":"chunk","tableId":"wh_customers","chunkIndex":0,"rowCount":1,"passed":1,"failed":0}
{"type":"row","tableId":"wh_customers","passed":true,"sourceKey":"cust_1"}
{"type":"summary","suiteName":"...","tables":8,"rowsCompared":8,"passed":8,"failed":0}
```

## Run

```bash
npm run demo:run -- project-db
```
