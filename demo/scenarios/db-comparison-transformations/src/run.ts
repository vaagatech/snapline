import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { testSuite } from '@vaagatech/snapline-core';
import { openAuditDbs } from './db.js';
import { DEMO_EMAIL, dateTransform } from './demo-data.js';
import { finalizeRun, isMainModule } from './env.js';

const SUITE_NAME = 'Snapline: transformations (DB vs DB + SQLite)';

export async function run(): Promise<TestSuiteResult> {
  const { auditSourceDb, auditTargetDb } = openAuditDbs();

  return testSuite(SUITE_NAME, {
    dbComparison: {
      sourceDb: auditSourceDb,
      targetDb: auditTargetDb,
      query: `
        SELECT email, logged_at, status
        FROM users_audit
        WHERE email = :email
      `,
      params: { email: DEMO_EMAIL },
      transformations: dateTransform,
    },
  });
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
