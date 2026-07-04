import { api, testSuite } from '@vaagatech/core';
import { DEMO_EMAIL, type ScenarioModule } from '@vaagatech/demo-shared';

const scenario: ScenarioModule = {
  name: '7. DB vs API (GraphQL + SQLite)',
  needsServer: true,
  needsDatabase: true,
  async run({ baseUrl, database }) {
    return testSuite('7. DB vs API (GraphQL + SQLite)', {
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
          ...api.graphql({
            endpoint: '/graphql',
            query: 'query GetUser($email: String!) { user(email: $email) { email status role } }',
            dataPath: 'user',
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
