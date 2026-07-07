import { join } from 'node:path';
import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { api, fixturesDir, testSuite } from '@vaagatech/snapline-core';
import { closeSqliteConnections } from '@vaagatech/snapline-demo-shared';
import { createAuth } from './auth.js';
import { openAppDb } from './db.js';
import {
  apiPlanMapping,
  apiStatusMapping,
  appCustomerJoinQuery,
  DEMO_EMAIL,
} from './demo-data.js';
import { finalizeRun, isMainModule, requireEnv } from './env.js';

const SUITE_NAME = 'API vs DB (GraphQL + OAuth2 snapshot vs multi-table SQLite JOIN)';

export async function run(): Promise<TestSuiteResult> {
  const fixtures = fixturesDir(import.meta.url);
  const baseUrl = requireEnv('API_BASE_URL');
  const appDb = openAppDb();

  try {
    return await testSuite(SUITE_NAME, {
      auth: createAuth(),
      baseUrl,
      apiToDb: {
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
            variablesFile: join(fixtures, 'graphql-variables.json'),
            dataPath: 'customerSnapshot',
          }),
          expectedStatus: 200,
        },
        db: {
          db: appDb,
          query: appCustomerJoinQuery,
          params: { email: DEMO_EMAIL },
        },
        dataMapping: {
          ...apiStatusMapping,
          ...apiPlanMapping,
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
