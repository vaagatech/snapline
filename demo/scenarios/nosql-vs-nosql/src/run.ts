import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { nosql, testSuite } from '@vaagatech/snapline-core';
import { DEMO_EMAIL, sourceCustomer, targetSnapshot } from './demo-data.js';
import { finalizeRun, isMainModule } from './env.js';

const SUITE_NAME = 'NoSQL vs NoSQL (document stores + linkKeys)';

export async function run(): Promise<TestSuiteResult> {
  const sourceStore = nosql.memory();
  const targetStore = nosql.memory();

  nosql.seed(sourceStore, 'customers', [sourceCustomer]);
  nosql.seed(targetStore, 'customer_snapshots', [targetSnapshot]);

  return testSuite(SUITE_NAME, {
    dbComparison: {
      sourceDb: sourceStore,
      targetDb: targetStore,
      sourceCollection: 'customers',
      targetCollection: 'customer_snapshots',
      sourceFilter: { email: DEMO_EMAIL },
      linkKeys: { customerId: 'customerId' },
    },
  });
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
