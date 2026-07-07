import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { api, testSuite } from '@vaagatech/snapline-core';
import { closeSqliteConnections } from '@vaagatech/snapline-demo-shared';
import { createAuth } from './auth.js';
import { openAppDb } from './db.js';
import {
  appCustomerJoinQuery,
  dbPlanMapping,
  dbStatusMapping,
  DEMO_EMAIL,
} from './demo-data.js';
import { finalizeRun, isMainModule, requireEnv } from './env.js';

const SUITE_NAME = 'DB vs API (OAuth2 GraphQL snapshot vs multi-table SQLite JOIN)';

export async function run(): Promise<TestSuiteResult> {
  const baseUrl = requireEnv('API_BASE_URL');
  const appDb = openAppDb();

  try {
    return await testSuite(SUITE_NAME, {
      auth: createAuth(),
      baseUrl,
      dbToApi: {
        db: {
          db: appDb,
          query: appCustomerJoinQuery,
          params: { email: DEMO_EMAIL },
        },
        api: {
          ...api.graphql({
            endpoint: '/graphql',
            query: `
            query CustomerSnapshot($email: String!) {
              customerSnapshot(email: $email) {
                email
                status
                tier
                role
                department
                planCode
                renewsAt
                lastLogin
              }
            }
          `,
            dataPath: 'customerSnapshot',
          }),
          expectedStatus: 200,
        },
        inputFromDb: true,
        dataMapping: {
          ...dbStatusMapping,
          ...dbPlanMapping,
        },
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
