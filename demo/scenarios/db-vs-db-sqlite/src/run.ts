import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { testSuite } from '@vaagatech/snapline-core';
import { closeSqliteConnections } from '@vaagatech/snapline-demo-shared';
import { openWarehouseDbs } from './db.js';
import {
  DEMO_EMAIL,
  statusMappingLookup,
  warehouseCustomerJoinQuery,
  warehouseOrderByIdQuery,
  warehouseOrderJoinQuery,
  warehouseOrderStatusMapping,
} from './demo-data.js';
import { finalizeRun, isMainModule } from './env.js';

const SUITE_NAME = 'DB vs DB (SQLite multi-table warehouse + dataMapping)';

export async function run(): Promise<TestSuiteResult> {
  const { sourceDb, targetDb } = openWarehouseDbs();

  try {
    const customerResult = await testSuite('DB vs DB: customer domain (profiles + subscriptions)', {
      dbComparison: {
        sourceDb,
        targetDb,
        query: warehouseCustomerJoinQuery,
        params: { email: DEMO_EMAIL },
        dataMapping: statusMappingLookup,
      },
    });

    const ordersResult = await testSuite('DB vs DB: orders (multi-table source, PK lookup on target)', {
      dbComparison: {
        sourceDb,
        targetDb,
        sourceQuery: warehouseOrderJoinQuery,
        sourceParams: { email: DEMO_EMAIL },
        targetQuery: warehouseOrderByIdQuery,
        linkKeys: { orderId: 'orderId' },
        dataMapping: warehouseOrderStatusMapping,
      },
    });

    return {
      name: SUITE_NAME,
      passed: customerResult.passed && ordersResult.passed,
      results: [...customerResult.results, ...ordersResult.results],
    };
  } finally {
    closeSqliteConnections(sourceDb, targetDb);
  }
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
