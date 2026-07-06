import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { fixturesDir, runApiFixtureCases } from '@vaagatech/snapline-core';
import { createAuth } from './auth.js';
import {
  dateFieldTransforms,
  graphqlAccountTransforms,
  graphqlPlanMapping,
  graphqlSnapshotTransforms,
  graphqlStatusMapping,
  roleTierOnlyTransforms,
} from './demo-data.js';
import { finalizeRun, isMainModule, requireEnv } from './env.js';

const SUITE_NAME = 'API vs file (GraphQL + OAuth2 fixture cases: pass + expected failures)';

export async function run(): Promise<TestSuiteResult> {
  const baseUrl = requireEnv('API_BASE_URL');

  return runApiFixtureCases({
    suiteName: SUITE_NAME,
    fixturesRoot: fixturesDir(import.meta.url),
    baseUrl,
    auth: createAuth(),
    defaults: {
      endpoint: '/graphql',
      protocol: 'graphql',
      dataPath: 'customerAccount',
      ignoreFields: ['metadata.traceId', 'metadata.syncedAt'],
      transformations: 'graphqlAccount',
      dataMapping: 'graphqlAccount',
    },
    presets: {
      transformations: {
        graphqlAccount: graphqlAccountTransforms,
        graphqlSnapshot: graphqlSnapshotTransforms,
        roleTierOnly: roleTierOnlyTransforms,
        datesOnly: dateFieldTransforms,
      },
      dataMapping: {
        graphqlAccount: {
          ...graphqlStatusMapping,
          ...graphqlPlanMapping,
        },
        planOnly: graphqlPlanMapping,
        statusOnly: graphqlStatusMapping,
      },
    },
  });
}

export default run;

if (isMainModule(import.meta.url)) {
  const result = finalizeRun(await run(), SUITE_NAME);
  process.exitCode = result.passed ? 0 : 1;
}
