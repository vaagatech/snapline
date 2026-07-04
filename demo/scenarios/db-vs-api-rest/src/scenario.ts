import { api, testSuite } from '@vaagatech/core';
import { DEMO_EMAIL, type ScenarioModule } from '@vaagatech/demo-shared';

const scenario: ScenarioModule = {
  name: '4. DB vs API (REST + SQLite)',
  needsServer: true,
  needsDatabase: true,
  async run({ baseUrl, database }) {
    return testSuite('4. DB vs API (REST + SQLite)', {
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
        api: api.rest({
          endpoint: '/api/v1/users/profile',
          method: 'GET',
        }),
        inputFromDb: true,
      },
    });
  },
};

export default scenario;
