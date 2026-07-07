import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { api, testSuite } from '@vaagatech/snapline-core';
import { closeSqliteConnections } from '@vaagatech/snapline-demo-shared';
import { openAppDb } from './db.js';
import { dbStatusMapping, DEMO_EMAIL } from './demo-data.js';
import { finalizeRun, isMainModule, requireEnv } from './env.js';

const SUITE_NAME = 'DB vs API (multi-table SQLite JOIN vs REST profile)';

export async function run(): Promise<TestSuiteResult> {
  const baseUrl = requireEnv('API_BASE_URL');
  const appDb = openAppDb();

  try {
    return await testSuite(SUITE_NAME, {
      baseUrl,
      dbToApi: {
        db: {
          db: appDb,
          query: `
          SELECT c.email, c.status, p.role
          FROM customers c
          INNER JOIN customer_profiles p ON c.email = p.email
          WHERE c.email = :email
        `,
          params: { email: DEMO_EMAIL },
        },
        api: api.rest({
          endpoint: '/api/v1/users/profile',
          method: 'GET',
        }),
        inputFromDb: true,
        ignoreFields: ['traceId', 'currentdate'],
        dataMapping: dbStatusMapping,
      },
    });
  } finally {
    closeSqliteConnections(appDb);
  }
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
