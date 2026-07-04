import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  api,
  assertAgainstFile,
  executeApi,
  loadJsonFile,
  toApiRequestConfig,
  type TestStepResult,
  type TestSuiteResult,
} from '@vaagatech/snapline-core';
import type { AuthAdapter } from '@vaagatech/snapline-auth-adapters';
import type { ReconcileOptions } from '@vaagatech/snapline-engine';

export interface FixtureCaseMeta extends ReconcileOptions {
  name: string;
  expectMatch: boolean;
  failureType?: 'dataMapping' | 'transformation' | 'auth';
  expectedDiffPath?: string;
  skipAuth?: boolean;
  expectStatus?: number;
  dataPath?: string;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
  protocol?: 'rest' | 'graphql' | 'soap';
  soapAction?: string;
}

export interface FixtureCasePresetMaps {
  transformations?: Record<string, ReconcileOptions['transformations']>;
  dataMapping?: Record<string, ReconcileOptions['dataMapping']>;
}

export interface RunApiFixtureCasesOptions {
  suiteName: string;
  fixturesRoot: string;
  baseUrl: string;
  auth?: AuthAdapter;
  authHeaders?: Record<string, string>;
  defaults?: ReconcileOptions & {
    endpoint?: string;
    protocol?: 'rest' | 'graphql' | 'soap';
    dataPath?: string;
  };
  presets?: FixtureCasePresetMaps;
  caseIds?: string[];
}

function readCaseMeta(caseDir: string): FixtureCaseMeta {
  return loadJsonFile(join(caseDir, 'case.json')) as FixtureCaseMeta;
}

function resolvePreset<T extends Record<string, unknown> | undefined>(
  value: unknown,
  presets: Record<string, T> | undefined,
): T | undefined {
  if (typeof value === 'string') {
    return presets?.[value];
  }

  if (value && typeof value === 'object') {
    return value as T;
  }

  return undefined;
}

function discoverCaseIds(casesRoot: string): string[] {
  return readdirSync(casesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function buildApiConfig(caseDir: string, meta: FixtureCaseMeta, defaults: RunApiFixtureCasesOptions['defaults']) {
  const protocol = meta.protocol ?? defaults?.protocol ?? 'graphql';
  const endpoint = meta.endpoint ?? defaults?.endpoint ?? '/graphql';
  const dataPath = meta.dataPath ?? defaults?.dataPath;

  if (protocol === 'graphql') {
    return {
      ...api.graphql({
        endpoint,
        queryFile: join(caseDir, 'query.graphql'),
        variablesFile: join(caseDir, 'variables.json'),
        dataPath,
      }),
    };
  }

  if (protocol === 'soap') {
    return {
      ...api.soap({
        endpoint,
        soapAction: meta.soapAction ?? 'GetUser',
        inputFile: join(caseDir, 'input.xml'),
      }),
    };
  }

  return {
    endpoint,
    method: meta.method ?? 'GET',
    protocol: 'rest' as const,
    inputFile: exists(join(caseDir, 'input.json')) ? join(caseDir, 'input.json') : undefined,
  };
}

function exists(path: string): boolean {
  try {
    readFileSync(path);
    return true;
  } catch {
    return false;
  }
}

function logCaseResult(
  caseName: string,
  passed: boolean,
  expectMatch: boolean,
  match: boolean,
  diff: unknown,
  failureType?: string,
): void {
  if (passed) {
    const suffix =
      failureType === 'auth'
        ? ' (expected HTTP 401)'
        : expectMatch
          ? ''
          : ' (expected mismatch)';
    console.log(`  ✓ ${caseName}${suffix}`);
    return;
  }

  console.log(`  ✗ ${caseName}`);
  console.log(`    expected match=${String(expectMatch)}, got match=${String(match)}`);
  if (diff) {
    console.log(`    diff: ${JSON.stringify(diff)}`);
  }
}

export async function runApiFixtureCases(
  options: RunApiFixtureCasesOptions,
): Promise<TestSuiteResult> {
  const {
    suiteName,
    fixturesRoot,
    baseUrl,
    auth,
    defaults = {},
    presets = {},
    caseIds,
  } = options;

  const casesRoot = join(fixturesRoot, 'cases');
  const ids = caseIds ?? discoverCaseIds(casesRoot);
  const results: TestStepResult[] = [];
  let passed = true;

  console.log(`\n▶ ${suiteName}`);

  let authHeaders = options.authHeaders ?? {};
  if (auth) {
    const authResult = await auth.initialize();
    authHeaders = authResult.headers;
    results.push({
      step: 'auth',
      passed: true,
      token: authResult.token ? '[redacted]' : null,
    });
    console.log('  ✓ auth initialized');
  }

  for (const caseId of ids) {
    const caseDir = join(casesRoot, caseId);
    const meta = readCaseMeta(caseDir);
    const expectMatch = meta.expectMatch;
    const expectedStatus = meta.expectStatus ?? 200;
    const apiConfig = buildApiConfig(caseDir, meta, defaults);
    const request = toApiRequestConfig(apiConfig);
    const caseAuthHeaders = meta.skipAuth ? {} : authHeaders;
    const response = await executeApi(request, { baseUrl, authHeaders: caseAuthHeaders });

    if (response.status !== expectedStatus) {
      passed = false;
      results.push({
        step: caseId,
        passed: false,
        message: `Expected HTTP ${expectedStatus}, got ${response.status}`,
        data: response.data,
      });
      console.log(`  ✗ ${meta.name}`);
      console.log(`    HTTP ${response.status}`);
      continue;
    }

    if (expectedStatus !== 200) {
      const casePassed = !expectMatch;
      if (!casePassed) {
        passed = false;
      }
      results.push({
        step: caseId,
        passed: casePassed,
        message: meta.failureType,
        data: response.data,
      });
      logCaseResult(meta.name, casePassed, expectMatch, false, null, meta.failureType);
      continue;
    }

    const reconcileOptions: ReconcileOptions = {
      ignoreFields: meta.ignoreFields ?? defaults.ignoreFields,
      transformations:
        resolvePreset(meta.transformations, presets.transformations) ??
        meta.transformations ??
        defaults.transformations,
      dataMapping:
        resolvePreset(meta.dataMapping, presets.dataMapping) ??
        meta.dataMapping ??
        defaults.dataMapping,
    };

    const assertion = assertAgainstFile(response.data, join(caseDir, 'expected.json'), reconcileOptions);
    const casePassed = assertion.match === expectMatch;

    if (meta.expectedDiffPath && !expectMatch) {
      const diffPath = assertion.diff?.path ?? '';
      if (!diffPath.startsWith(meta.expectedDiffPath)) {
        passed = false;
        results.push({
          step: caseId,
          passed: false,
          message: `Expected diff at "${meta.expectedDiffPath}", got "${diffPath || '(none)'}"`,
          diff: assertion.diff,
          processed: assertion.processed,
        });
        logCaseResult(meta.name, false, expectMatch, assertion.match, assertion.diff);
        continue;
      }
    }

    if (!casePassed) {
      passed = false;
    }

    results.push({
      step: caseId,
      passed: casePassed,
      diff: assertion.diff,
      processed: assertion.processed,
      message: meta.failureType,
    });

    logCaseResult(meta.name, casePassed, expectMatch, assertion.match, casePassed ? null : assertion.diff);
  }

  const summary = passed ? 'PASSED' : 'FAILED';
  console.log(`\n${passed ? '✅' : '❌'} ${suiteName}: ${summary}\n`);

  return { name: suiteName, passed, results };
}

export async function runReconcileFixtureCases(options: {
  suiteName: string;
  fixturesRoot: string;
  presets?: FixtureCasePresetMaps;
  caseIds?: string[];
}): Promise<TestSuiteResult> {
  const { suiteName, fixturesRoot, presets = {}, caseIds } = options;
  const casesRoot = join(fixturesRoot, 'cases');
  const ids = caseIds ?? discoverCaseIds(casesRoot);
  const results: TestStepResult[] = [];
  let passed = true;

  console.log(`\n▶ ${suiteName}`);

  for (const caseId of ids) {
    const caseDir = join(casesRoot, caseId);
    const meta = readCaseMeta(caseDir);
    const liveData = loadJsonFile(join(caseDir, 'live.json'));
    const reconcileOptions: ReconcileOptions = {
      ignoreFields: meta.ignoreFields,
      transformations:
        resolvePreset(meta.transformations, presets.transformations) ?? meta.transformations,
      dataMapping: resolvePreset(meta.dataMapping, presets.dataMapping) ?? meta.dataMapping,
    };

    const assertion = assertAgainstFile(liveData, join(caseDir, 'expected.json'), reconcileOptions);
    const casePassed = assertion.match === meta.expectMatch;

    if (meta.expectedDiffPath && !meta.expectMatch) {
      const diffPath = assertion.diff?.path ?? '';
      if (!diffPath.startsWith(meta.expectedDiffPath)) {
        passed = false;
        results.push({
          step: caseId,
          passed: false,
          message: `Expected diff at "${meta.expectedDiffPath}", got "${diffPath || '(none)'}"`,
          diff: assertion.diff,
        });
        logCaseResult(meta.name, false, meta.expectMatch, assertion.match, assertion.diff);
        continue;
      }
    }

    if (!casePassed) {
      passed = false;
    }

    results.push({
      step: caseId,
      passed: casePassed,
      diff: assertion.diff,
      processed: assertion.processed,
      message: meta.failureType,
    });

    logCaseResult(meta.name, casePassed, meta.expectMatch, assertion.match, casePassed ? null : assertion.diff);
  }

  const summary = passed ? 'PASSED' : 'FAILED';
  console.log(`\n${passed ? '✅' : '❌'} ${suiteName}: ${summary}\n`);

  return { name: suiteName, passed, results };
}
