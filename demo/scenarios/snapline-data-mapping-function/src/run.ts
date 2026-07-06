import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { fixturesDir, runSnaplineFixtureCases, testSuite } from '@vaagatech/snapline-core';
import { openWarehouseDbs } from './db.js';
import {
  apiStatusMapping,
  DEMO_EMAIL,
  statusMappingFunction,
  warehousePlanMapping,
} from './demo-data.js';
import { finalizeRun, isMainModule } from './env.js';

const SUITE_NAME = 'Snapline: dataMapping (fixture cases + DB function mapper)';

export async function run(): Promise<TestSuiteResult> {
  const { sourceDb, targetDb } = openWarehouseDbs();

  const fixtureResult = await runSnaplineFixtureCases({
    suiteName: 'Snapline: dataMapping fixture cases (pass + expected failures)',
    fixturesRoot: fixturesDir(import.meta.url),
    presets: {
      dataMapping: {
        warehouseStatus: statusMappingFunction,
        warehousePlan: warehousePlanMapping,
        apiStatusOnly: apiStatusMapping,
      },
    },
  });

  const dbResult = await testSuite('Snapline: dataMapping (DB function mapper on warehouse)', {
    dbComparison: {
      sourceDb,
      targetDb,
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
    name: SUITE_NAME,
    passed: fixtureResult.passed && dbResult.passed,
    results: [...fixtureResult.results, ...dbResult.results],
  };
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
