import { join } from 'node:path';
import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { api, fixturesDir, testSuite } from '@vaagatech/snapline-core';
import { finalizeRun, isMainModule, requireEnv } from './env.js';

const SUITE_NAME = 'Snapline: ignoreFields (nested paths)';

export async function run(): Promise<TestSuiteResult> {
  const fixtures = fixturesDir(import.meta.url);
  const baseUrl = requireEnv('API_BASE_URL');

  return testSuite(SUITE_NAME, {
    baseUrl,
    api: {
      ...api.rest({
        endpoint: '/api/v1/events/tracked',
        method: 'GET',
      }),
      expectedFile: join(fixtures, 'tracked-expected.json'),
      ignoreFields: ['metadata.trackedAt', 'metadata.requestId'],
    },
  });
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
