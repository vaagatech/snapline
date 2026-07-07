import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { runWarehouseComparison } from '@vaagatech/snapline-core';
import { finalizeRun, isMainModule } from './env.js';
import { seedWarehouseDemo } from './warehouse-seed.js';
import { warehouseTables } from './warehouse-table-manifest.js';

const SUITE_NAME = 'Project DB — SQL warehouse → NoSQL consistency (streamed)';

function readIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function run(): Promise<TestSuiteResult> {
  const { sourceDb, targetDb, cleanup } = seedWarehouseDemo();

  try {
    return await runWarehouseComparison({
      suiteName: SUITE_NAME,
      sourceDb,
      targetDb,
      tables: warehouseTables,
      chunkSize: readIntEnv('WAREHOUSE_CHUNK_SIZE', 50),
      maxRowsPerTable: readIntEnv('WAREHOUSE_MAX_ROWS_PER_TABLE', 10_000),
      maxTotalRows: readIntEnv('WAREHOUSE_MAX_TOTAL_ROWS', 50_000),
      report: {
        outputPath: process.env.WAREHOUSE_REPORT_PATH ?? './reports/warehouse-stream.jsonl',
        format: 'jsonl',
        redactFields: process.env.WAREHOUSE_REDACT_FIELDS?.split(',').filter(Boolean),
      },
    });
  } finally {
    cleanup();
  }
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
