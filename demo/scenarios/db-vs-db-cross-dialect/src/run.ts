import { testSuite } from '@vaagatech/snapline-core';
import { db, seedDb } from '@vaagatech/snapline-demo-shared';
import type { TestSuiteResult } from '@vaagatech/snapline-core';
import {
  crossDialectStatusMapping,
  DEMO_EMAIL,
  SOURCE_DSN,
  TARGET_DSN,
  userSyncQuery,
} from './demo-data.js';
import { finalizeRun, isMainModule } from './env.js';

const SUITE_NAME = 'DB vs DB (Postgres source vs MySQL target via seedDb stub)';

export async function run(): Promise<TestSuiteResult> {
  seedDb(SOURCE_DSN, [{ status: 'ABC', email: DEMO_EMAIL }]);
  seedDb(TARGET_DSN, [{ status: 'CBA', email: DEMO_EMAIL }]);

  return testSuite(SUITE_NAME, {
    dbComparison: {
      sourceDb: db.postgres(SOURCE_DSN),
      targetDb: db.mysql(TARGET_DSN),
      query: userSyncQuery,
      params: { email: DEMO_EMAIL },
      dataMapping: crossDialectStatusMapping,
    },
  });
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
