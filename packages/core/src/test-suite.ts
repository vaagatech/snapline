import { executeApi } from '@vaagatech/reconcile-api-adapters';
import { assertAgainstFile } from '@vaagatech/reconcile-engine';
import { runApiToDb } from './cross-system/run-api-to-db.js';
import { runDbToApi } from './cross-system/run-db-to-api.js';
import { runDbComparison } from './db-comparison/run-db-comparison.js';
import { toApiRequestConfig } from './api/to-api-request-config.js';
import type { TestStepResult, TestSuiteConfig, TestSuiteResult } from './types.js';

function logStepResult(
  label: string,
  match: boolean,
  diff: unknown,
  onFail: () => void,
): void {
  if (match) {
    console.log(`  ✓ ${label}`);
  } else {
    onFail();
    console.log(`  ✗ ${label}`);
    console.log(`    diff: ${JSON.stringify(diff)}`);
  }
}

export async function testSuite(
  name: string,
  config: TestSuiteConfig,
): Promise<TestSuiteResult> {
  const {
    auth: authAdapter,
    api,
    dbComparison,
    apiToDb,
    dbToApi,
    baseUrl,
    fetchImpl = globalThis.fetch,
  } = config;

  const results: TestStepResult[] = [];
  let passed = true;
  const fail = () => {
    passed = false;
  };

  console.log(`\n▶ ${name}`);

  let authHeaders: Record<string, string> = {};
  if (authAdapter) {
    const authResult = await authAdapter.initialize();
    authHeaders = authResult.headers;
    results.push({
      step: 'auth',
      passed: true,
      token: authResult.token ? '[redacted]' : null,
    });
    console.log('  ✓ auth initialized');
  }

  if (api) {
    const {
      expectedFile,
      ignoreFields = [],
      transformations = {},
      dataMapping = {},
      expectedStatus = 200,
    } = api;

    const apiRequest = toApiRequestConfig(api);
    const response = await executeApi(apiRequest, {
      baseUrl,
      authHeaders,
      fetchImpl,
    });

    if (response.status !== expectedStatus) {
      fail();
      results.push({
        step: 'api',
        passed: false,
        message: `Expected status ${expectedStatus}, got ${response.status}`,
        data: response.data,
      });
      console.log(`  ✗ api status mismatch (expected ${expectedStatus}, got ${response.status})`);
    } else if (expectedFile) {
      const assertion = assertAgainstFile(response.data, expectedFile, {
        ignoreFields,
        transformations,
        dataMapping,
      });

      results.push({
        step: 'api-file',
        passed: assertion.match,
        diff: assertion.diff,
        processed: assertion.processed,
      });

      logStepResult('api response reconciled with fixture file', assertion.match, assertion.diff, fail);
    } else {
      results.push({ step: 'api', passed: true, data: response.data });
      console.log('  ✓ api request completed');
    }
  }

  if (dbComparison) {
    const dbResult = await runDbComparison(dbComparison);
    results.push({ step: 'db-to-db', passed: dbResult.match, ...dbResult });
    logStepResult('db-to-db reconciliation passed', dbResult.match, dbResult.diff, fail);
  }

  if (apiToDb) {
    const result = await runApiToDb(apiToDb, authHeaders, baseUrl, fetchImpl);
    results.push({ step: 'api-to-db', passed: result.match, ...result });
    logStepResult('api-to-db reconciliation passed', result.match, result.diff, fail);
  }

  if (dbToApi) {
    const result = await runDbToApi(dbToApi, authHeaders, baseUrl, fetchImpl);
    results.push({ step: 'db-to-api', passed: result.match, ...result });
    logStepResult('db-to-api reconciliation passed', result.match, result.diff, fail);
  }

  const summary = passed ? 'PASSED' : 'FAILED';
  console.log(`\n${passed ? '✅' : '❌'} ${name}: ${summary}\n`);

  return { name, passed, results };
}
