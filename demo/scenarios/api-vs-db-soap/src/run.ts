import { join } from 'node:path';
import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { api, fixturesDir, testSuite } from '@vaagatech/snapline-core';
import { closeSqliteConnections } from '@vaagatech/snapline-demo-shared';
import { openAppDb } from './db.js';
import { apiStatusMapping, DEMO_EMAIL } from './demo-data.js';
import { finalizeRun, isMainModule, requireEnv } from './env.js';

const SUITE_NAME = 'API vs DB (SOAP user vs multi-table SQLite JOIN)';

export async function run(): Promise<TestSuiteResult> {
  const fixtures = fixturesDir(import.meta.url);
  const baseUrl = requireEnv('API_BASE_URL');
  const appDb = openAppDb();

  try {
    return await testSuite(SUITE_NAME, {
      baseUrl,
      apiToDb: {
        api: {
          ...api.soap({
            endpoint: '/soap/user',
            soapAction: 'GetUser',
            inputFile: join(fixtures, 'soap-request.xml'),
          }),
          expectedStatus: 200,
        },
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
        dataMapping: apiStatusMapping,
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
