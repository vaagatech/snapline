import { join } from 'node:path';
import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { api, fixturesDir, testSuite } from '@vaagatech/snapline-core';
import { finalizeRun, isMainModule, requireEnv } from './env.js';

const SUITE_NAME = 'API vs file (SOAP)';

export async function run(): Promise<TestSuiteResult> {
  const fixtures = fixturesDir(import.meta.url);
  const baseUrl = requireEnv('API_BASE_URL');

  return testSuite(SUITE_NAME, {
    baseUrl,
    api: {
      ...api.soap({
        endpoint: '/soap/user',
        soapAction: 'GetUser',
        inputFile: join(fixtures, 'soap-request.xml'),
      }),
      expectedFile: join(fixtures, 'soap-expected.json'),
    },
  });
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
