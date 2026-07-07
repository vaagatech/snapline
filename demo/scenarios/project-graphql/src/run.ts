import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { fixturesDir, runApiFixtureCases } from '@vaagatech/snapline-core';
import { createAuth } from './auth.js';
import { accountMapping, accountTransforms, ordersMapping, syncMapping } from './demo-data.js';
import { finalizeRun, isMainModule, requireEnv } from './env.js';

const SUITE_NAME = 'Project GraphQL — 3 operations (Auth0/Okta + fixture cases)';

export async function run(): Promise<TestSuiteResult> {
  const baseUrl = requireEnv('API_BASE_URL');

  return runApiFixtureCases({
    suiteName: SUITE_NAME,
    fixturesRoot: fixturesDir(import.meta.url),
    baseUrl,
    auth: createAuth(),
    defaults: {
      endpoint: '/project/graphql',
      protocol: 'graphql',
      ignoreFields: [],
    },
    presets: {
      transformations: { account: accountTransforms },
      dataMapping: {
        account: accountMapping,
        orders: ordersMapping,
        sync: syncMapping,
      },
    },
  });
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
