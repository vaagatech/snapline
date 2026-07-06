import { join } from 'node:path';
import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { fixturesDir, testSuite } from '@vaagatech/snapline-core';
import { createAuth } from './auth.js';
import { dateTransform } from './demo-data.js';
import { finalizeRun, isMainModule, requireEnv } from './env.js';

const SUITE_NAME = 'API vs file (REST + OAuth2 + ignoreFields + transformations)';

export async function run(): Promise<TestSuiteResult> {
  const fixtures = fixturesDir(import.meta.url);
  const baseUrl = requireEnv('API_BASE_URL');

  return testSuite(SUITE_NAME, {
    auth: createAuth(),
    baseUrl,
    api: {
      endpoint: '/api/v1/user/sync',
      method: 'POST',
      inputFile: join(fixtures, 'rest-input.json'),
      expectedFile: join(fixtures, 'rest-expected.json'),
      ignoreFields: ['pincode'],
      transformations: dateTransform,
    },
  });
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
