import { join } from 'node:path';
import { api, testSuite } from '@vaagatech/snapline-core';
import { apiStatusMapping, DEMO_EMAIL, fixturesDir, type ScenarioModule } from '@vaagatech/snapline-demo-shared';

const scenario: ScenarioModule = {
  name: 'API vs DB (SOAP user vs multi-table SQLite JOIN)',
  needsServer: true,
  needsDatabase: true,
  async run({ baseUrl, database }) {
    const fixtures = fixturesDir(import.meta.url);

    return testSuite('API vs DB (SOAP user vs multi-table SQLite JOIN)', {
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
          db: database.appDb,
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
  },
};

export default scenario;
