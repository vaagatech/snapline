import { api, testSuite } from '@vaagatech/reconcile-core';
import { dbStatusMapping, DEMO_EMAIL, type ScenarioModule } from '@vaagatech/reconcile-demo-shared';

const scenario: ScenarioModule = {
  name: 'DB vs API (multi-table SQLite JOIN vs REST profile)',
  needsServer: true,
  needsDatabase: true,
  async run({ baseUrl, database }) {
    return testSuite('DB vs API (multi-table SQLite JOIN vs REST profile)', {
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
        api: api.rest({
          endpoint: '/api/v1/users/profile',
          method: 'GET',
        }),
        inputFromDb: true,
        ignoreFields: ['traceId', 'currentdate'],
        dataMapping: dbStatusMapping,
      },
    });
  },
};

export default scenario;
