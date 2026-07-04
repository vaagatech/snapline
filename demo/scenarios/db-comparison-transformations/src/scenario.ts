import { testSuite } from '@vaagatech/reconcile-core';
import { DEMO_EMAIL, dateTransform, type ScenarioModule } from '@vaagatech/reconcile-demo-shared';

const scenario: ScenarioModule = {
  name: 'Reconcile: transformations (DB vs DB + SQLite)',
  needsServer: false,
  needsDatabase: true,
  async run({ database }) {
    return testSuite('Reconcile: transformations (DB vs DB + SQLite)', {
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
