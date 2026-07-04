import { join } from 'node:path';
import { api, testSuite } from '@vaagatech/reconcile-core';
import { dbStatusMapping, DEMO_EMAIL, fixturesDir, type ScenarioModule } from '@vaagatech/reconcile-demo-shared';

const scenario: ScenarioModule = {
  name: 'DB vs API (multi-table SQLite JOIN vs SOAP user)',
  needsServer: true,
  needsDatabase: true,
  async run({ baseUrl, database }) {
    const fixtures = fixturesDir(import.meta.url);

    return testSuite('DB vs API (multi-table SQLite JOIN vs SOAP user)', {
      baseUrl,
      dbToApi: {
        db: {
          db: database.appDb,
          query: `
            SELECT c.email, c.status, p.role
            FROM customers c
            INNER JOIN customer_profiles p ON c.email = p.email
            WHERE c.email = :email
          `,
          params: { email: DEMO_EMAIL },
        },
        api: {
          ...api.soap({
            endpoint: '/soap/user',
            soapAction: 'GetUser',
            inputFile: join(fixtures, 'soap-request.xml'),
          }),
          expectedStatus: 200,
        },
        inputFromDb: true,
        dataMapping: dbStatusMapping,
      },
    });
  },
};

export default scenario;
