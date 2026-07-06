import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { api, testSuite } from '@vaagatech/snapline-core';
import { openAppDb } from './db.js';
import { apiStatusMapping, dateTransform, DEMO_EMAIL } from './demo-data.js';
import { finalizeRun, isMainModule, requireEnv } from './env.js';

const SUITE_NAME = 'Snapline: combined options (ignoreFields + transformations + dataMapping)';

export async function run(): Promise<TestSuiteResult> {
  const baseUrl = requireEnv('API_BASE_URL');
  const appDb = openAppDb();

  return testSuite(SUITE_NAME, {
    baseUrl,
    apiToDb: {
      api: api.rest({
        endpoint: `/api/v1/users/profile?email=${DEMO_EMAIL}`,
        method: 'GET',
      }),
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
      ignoreFields: ['traceId', 'currentdate'],
      transformations: dateTransform,
      dataMapping: apiStatusMapping,
    },
  });
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
