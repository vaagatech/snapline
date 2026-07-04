import { testSuite } from '@vaagatech/snapline-core';
import { DEMO_EMAIL, dateTransform, type ScenarioModule } from '@vaagatech/snapline-demo-shared';

const scenario: ScenarioModule = {
  name: 'Snapline: transformations (DB vs DB + SQLite)',
  needsServer: false,
  needsDatabase: true,
  async run({ database }) {
    return testSuite('Snapline: transformations (DB vs DB + SQLite)', {
      dbComparison: {
        sourceDb: database.auditSourceDb,
        targetDb: database.auditTargetDb,
        query: `
          SELECT email, logged_at, status
          FROM users_audit
          WHERE email = :email
        `,
        params: { email: DEMO_EMAIL },
        transformations: dateTransform,
      },
    });
  },
};

export default scenario;
