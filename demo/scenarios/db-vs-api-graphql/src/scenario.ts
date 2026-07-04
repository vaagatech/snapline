import { api, testSuite } from '@vaagatech/snapline-core';
import {
  appCustomerJoinQuery,
  createDemoAuth,
  dbPlanMapping,
  dbStatusMapping,
  DEMO_EMAIL,
  type ScenarioModule,
} from '@vaagatech/snapline-demo-shared';

const scenario: ScenarioModule = {
  name: 'DB vs API (OAuth2 GraphQL snapshot vs multi-table SQLite JOIN)',
  needsServer: true,
  needsDatabase: true,
  async run({ baseUrl, database }) {
    return testSuite('DB vs API (OAuth2 GraphQL snapshot vs multi-table SQLite JOIN)', {
      auth: createDemoAuth(baseUrl),
      baseUrl,
      dbToApi: {
        db: {
          db: database.appDb,
          query: appCustomerJoinQuery,
          params: { email: DEMO_EMAIL },
        },
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
            dataPath: 'customerSnapshot',
          }),
          expectedStatus: 200,
        },
        inputFromDb: true,
        dataMapping: {
          ...dbStatusMapping,
          ...dbPlanMapping,
        },
      },
    });
  },
};

export default scenario;
