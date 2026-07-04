import { join } from 'node:path';
import { api, testSuite } from '@vaagatech/core';
import { DEMO_EMAIL, fixturesDir, type ScenarioModule } from '@vaagatech/demo-shared';

const scenario: ScenarioModule = {
  name: '10. DB vs API (SOAP + SQLite)',
  needsServer: true,
  needsDatabase: true,
  async run({ baseUrl, database }) {
    const fixtures = fixturesDir(import.meta.url);

    return testSuite('10. DB vs API (SOAP + SQLite)', {
      baseUrl,
      dbToApi: {
        db: {
          db: database.appDb,
          query: `
            SELECT email, status, role
            FROM users_app
            WHERE email = :email
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
        dataMapping: { status: { SYNCED: 'synced' } },
      },
    });
  },
};

export default scenario;
