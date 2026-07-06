import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { fixturesDir, runApiFixtureCases } from '@vaagatech/snapline-core';
import { createAuth } from './auth.js';
import { dateTransform, noDateTransform } from './demo-data.js';
import { finalizeRun, isMainModule, requireEnv } from './env.js';

const SUITE_NAME = 'API vs file (REST fixture cases + OAuth2: pass + expected failures)';

export async function run(): Promise<TestSuiteResult> {
  const baseUrl = requireEnv('API_BASE_URL');

  return runApiFixtureCases({
    suiteName: SUITE_NAME,
    fixturesRoot: fixturesDir(import.meta.url),
    baseUrl,
    auth: createAuth(),
    defaults: {
      endpoint: '/api/v1/user/sync',
      protocol: 'rest',
      ignoreFields: ['pincode'],
      transformations: 'datesOnly',
    },
    presets: {
      transformations: {
        datesOnly: dateTransform,
        noDates: noDateTransform,
      },
    },
  });
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
