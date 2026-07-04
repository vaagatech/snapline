import { testSuite } from '@vaagatech/core';
import { DEMO_EMAIL, type ScenarioModule } from '@vaagatech/demo-shared';

const scenario: ScenarioModule = {
  name: '2. DB vs DB (SQLite)',
  needsServer: false,
  needsDatabase: true,
  async run({ database }) {
    const { sourceDb, targetDb } = database;

    return testSuite('2. DB vs DB (SQLite)', {
      dbComparison: {
        sourceDb,
        targetDb,
        query: `
          SELECT status, email
          FROM users
          WHERE email = :email
        `,
        params: { email: DEMO_EMAIL },
        dataMapping: { status: { ABC: 'CBA' } },
      },
    });
  },
};

export default scenario;
