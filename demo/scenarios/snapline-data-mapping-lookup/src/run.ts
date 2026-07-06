import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { fixturesDir, runSnaplineFixtureCases } from '@vaagatech/snapline-core';
import { statusLookup, wrongStatusLookup } from './demo-data.js';
import { finalizeRun, isMainModule } from './env.js';

const SUITE_NAME = 'Snapline: dataMapping lookup table (fixture cases: pass + expected failures)';

export async function run(): Promise<TestSuiteResult> {
  return runSnaplineFixtureCases({
    suiteName: SUITE_NAME,
    fixturesRoot: fixturesDir(import.meta.url),
    presets: {
      dataMapping: {
        warehouseStatus: statusLookup,
        wrongStatus: wrongStatusLookup,
      },
    },
  });
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
