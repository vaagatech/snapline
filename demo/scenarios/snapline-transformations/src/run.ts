import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { fixturesDir, runSnaplineFixtureCases } from '@vaagatech/snapline-core';
import {
  dateFieldTransforms,
  enrichmentTransforms,
  roleTierOnlyTransforms,
} from './demo-data.js';
import { finalizeRun, isMainModule } from './env.js';

const SUITE_NAME = 'Snapline: transformations (fixture cases: pass + expected failures)';

export async function run(): Promise<TestSuiteResult> {
  return runSnaplineFixtureCases({
    suiteName: SUITE_NAME,
    fixturesRoot: fixturesDir(import.meta.url),
    defaults: {
      transformations: 'enrichment',
    },
    presets: {
      transformations: {
        enrichment: enrichmentTransforms,
        roleTierOnly: roleTierOnlyTransforms,
        datesOnly: dateFieldTransforms,
      },
    },
  });
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
