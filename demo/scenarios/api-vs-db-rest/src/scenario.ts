import { api, testSuite } from '@vaagatech/core';
import { DEMO_EMAIL, type ScenarioModule } from '@vaagatech/demo-shared';

const scenario: ScenarioModule = {
  name: '3. API vs DB (REST + SQLite)',
  needsServer: true,
  needsDatabase: true,
  async run({ baseUrl, database }) {
    return testSuite('3. API vs DB (REST + SQLite)', {
      baseUrl,
      apiToDb: {
        api: api.rest({
          endpoint: `/api/v1/users/profile?email=${DEMO_EMAIL}`,
          method: 'GET',
        }),
        db: {
          db: database.appDb,
          query: `
            SELECT email, status, role
            FROM users_app
            WHERE email = :email
          `,
          params: { email: DEMO_EMAIL },
        },
      },
    });
  },
};

export default scenario;
