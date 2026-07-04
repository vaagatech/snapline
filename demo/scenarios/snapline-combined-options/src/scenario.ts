import { api, testSuite } from '@vaagatech/snapline-core';
import {
  apiStatusMapping,
  dateTransform,
  DEMO_EMAIL,
  type ScenarioModule,
} from '@vaagatech/snapline-demo-shared';

const scenario: ScenarioModule = {
  name: 'Snapline: combined options (ignoreFields + transformations + dataMapping)',
  needsServer: true,
  needsDatabase: true,
  async run({ baseUrl, database }) {
    return testSuite(
      'Snapline: combined options (ignoreFields + transformations + dataMapping)',
      {
        baseUrl,
        apiToDb: {
          api: api.rest({
            endpoint: `/api/v1/users/profile?email=${DEMO_EMAIL}`,
            method: 'GET',
          }),
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
          ignoreFields: ['traceId', 'currentdate'],
          transformations: dateTransform,
          dataMapping: apiStatusMapping,
        },
      },
    );
  },
};

export default scenario;
