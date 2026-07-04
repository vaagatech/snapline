import { join } from 'node:path';
import { api, testSuite } from '@vaagatech/core';
import { DEMO_EMAIL, fixturesDir, type ScenarioModule } from '@vaagatech/demo-shared';

const scenario: ScenarioModule = {
  name: '6. API vs DB (GraphQL + SQLite)',
  needsServer: true,
  needsDatabase: true,
  async run({ baseUrl, database }) {
    const fixtures = fixturesDir(import.meta.url);

    return testSuite('6. API vs DB (GraphQL + SQLite)', {
      baseUrl,
      apiToDb: {
        api: {
          ...api.graphql({
            endpoint: '/graphql',
            query:
              'query GetUser($email: String!) { user(email: $email) { email status role currentdate } }',
            variablesFile: join(fixtures, 'graphql-variables.json'),
            dataPath: 'user',
          }),
          expectedStatus: 200,
        },
        db: {
          db: database.appDb,
          query: `
            SELECT email, status, role
            FROM users_app
            WHERE email = :email
          `,
          params: { email: DEMO_EMAIL },
        },
        ignoreFields: ['currentdate'],
        dataMapping: { status: { synced: 'SYNCED' } },
      },
    });
  },
};

export default scenario;
