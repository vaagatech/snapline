import { executeApi } from '@vaagatech/snapline-api-adapters';
import { assertAgainstFile } from '@vaagatech/snapline-engine';
import { runApiToDb } from './cross-system/run-api-to-db.js';
import { runDbToApi } from './cross-system/run-db-to-api.js';
import { runPublishAndPoll } from './cross-system/run-publish-and-poll.js';
import { runDbComparison } from './db-comparison/run-db-comparison.js';
import { toApiRequestConfig } from './api/to-api-request-config.js';
import { createStreamReportWriter } from './reporting/stream-report.js';
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
    publishAndPoll,
    baseUrl,
    fetchImpl = globalThis.fetch,
    streamReport,
  } = config;

  const writer = streamReport ? createStreamReportWriter(streamReport) : null;
  const emitStep = (step: TestStepResult): void => {
    writer?.write({ type: 'step', suiteName: name, ...step });
  };

  const results: TestStepResult[] = [];
  let passed = true;
  const fail = () => {
    passed = false;
  };

  console.log(`\n▶ ${name}`);

  let authHeaders: Record<string, string> = {};
  if (authAdapter) {
    try {
      const authResult = await authAdapter.initialize();
      authHeaders = authResult.headers;
      results.push({
        step: 'auth',
        passed: true,
        token: authResult.token ? '[redacted]' : null,
      });
      emitStep(results[results.length - 1]!);
      console.log('  ✓ auth initialized');
    } catch (error) {
      fail();
      const message = error instanceof Error ? error.message : String(error);
      results.push({ step: 'auth', passed: false, message });
      console.log(`  ✗ auth failed: ${message}`);
      return { name, passed: false, results };
    }
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

      const stepResult: TestStepResult = {
        step: 'api-file',
        passed: assertion.match,
        diff: assertion.diff,
        processed: assertion.processed,
      };
      results.push(stepResult);
      emitStep(stepResult);

      logStepResult('api response matched fixture file', assertion.match, assertion.diff, fail);
    } else {
      const stepResult: TestStepResult = { step: 'api', passed: true, data: response.data };
      results.push(stepResult);
      emitStep(stepResult);
      console.log('  ✓ api request completed');
    }
  }

  if (dbComparison) {
    const dbResult = await runDbComparison(dbComparison);
    const stepResult: TestStepResult = { step: 'db-to-db', passed: dbResult.match, ...dbResult };
    results.push(stepResult);
    emitStep(stepResult);
    logStepResult('db-to-db reconciliation passed', dbResult.match, dbResult.diff, fail);
  }

  if (apiToDb) {
    const result = await runApiToDb(apiToDb, authHeaders, baseUrl, fetchImpl);
    const stepResult: TestStepResult = { step: 'api-to-db', passed: result.match, ...result };
    results.push(stepResult);
    emitStep(stepResult);
    logStepResult('api-to-db reconciliation passed', result.match, result.diff, fail);
  }

  if (dbToApi) {
    const result = await runDbToApi(dbToApi, authHeaders, baseUrl, fetchImpl);
    const stepResult: TestStepResult = { step: 'db-to-api', passed: result.match, ...result };
    results.push(stepResult);
    emitStep(stepResult);
    logStepResult('db-to-api reconciliation passed', result.match, result.diff, fail);
  }

  if (publishAndPoll) {
    const result = await runPublishAndPoll(publishAndPoll);
    const stepResult: TestStepResult = { step: 'publish-and-poll', passed: result.match, ...result };
    results.push(stepResult);
    emitStep(stepResult);
    logStepResult('publish-and-poll reconciliation passed', result.match, result.diff, fail);
  }

  if (writer) {
    const reportPath = writer.finalize({
      type: 'summary',
      suiteName: name,
      mode: 'test-suite',
      passed,
      steps: results.length,
      at: new Date().toISOString(),
    });
    console.log(`  Stream report: ${reportPath}`);
  }

  const summary = passed ? 'PASSED' : 'FAILED';
  console.log(`\n${passed ? '✅' : '❌'} ${name}: ${summary}\n`);

  return { name, passed, results };
}
