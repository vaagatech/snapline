import { testSuite } from '@vaagatech/reconcile-core';
import {
  apiStatusMapping,
  DEMO_EMAIL,
  fixturesDir,
  runReconcileFixtureCases,
  statusMappingFunction,
  warehousePlanMapping,
  type ScenarioModule,
} from '@vaagatech/reconcile-demo-shared';

const scenario: ScenarioModule = {
  name: 'Reconcile: dataMapping (fixture cases + DB function mapper)',
  needsServer: false,
  needsDatabase: true,
  async run({ database }) {
    const fixtureResult = await runReconcileFixtureCases({
      suiteName: 'Reconcile: dataMapping fixture cases (pass + expected failures)',
      fixturesRoot: fixturesDir(import.meta.url),
      presets: {
        dataMapping: {
          warehouseStatus: statusMappingFunction,
          warehousePlan: warehousePlanMapping,
          apiStatusOnly: apiStatusMapping,
        },
      },
    });

    const dbResult = await testSuite('Reconcile: dataMapping (DB function mapper on warehouse)', {
      dbComparison: {
        sourceDb: database.sourceDb,
        targetDb: database.targetDb,
        query: `
          SELECT c.email, c.status_code AS status
          FROM customers c
          WHERE c.email = :email
        `,
        params: { email: DEMO_EMAIL },
        dataMapping: statusMappingFunction,
      },
    });

    return {
      name: 'Reconcile: dataMapping (fixture cases + DB function mapper)',
      passed: fixtureResult.passed && dbResult.passed,
      results: [...fixtureResult.results, ...dbResult.results],
    };
  },
};

export default scenario;
