import { join } from 'node:path';
import { api, testSuite } from '@vaagatech/core';
import {
  apiPlanMapping,
  apiStatusMapping,
  appCustomerJoinQuery,
  createDemoAuth,
  DEMO_EMAIL,
  fixturesDir,
  type ScenarioModule,
} from '@vaagatech/demo-shared';

const scenario: ScenarioModule = {
  name: 'API vs DB (GraphQL + OAuth2 snapshot vs multi-table SQLite JOIN)',
  needsServer: true,
  needsDatabase: true,
  async run({ baseUrl, database }) {
    const fixtures = fixturesDir(import.meta.url);

    return testSuite('API vs DB (GraphQL + OAuth2 snapshot vs multi-table SQLite JOIN)', {
      auth: createDemoAuth(baseUrl),
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
          db: database.appDb,
          query: appCustomerJoinQuery,
          params: { email: DEMO_EMAIL },
        },
        dataMapping: {
          ...apiStatusMapping,
          ...apiPlanMapping,
        },
      },
    });
  },
};

export default scenario;
