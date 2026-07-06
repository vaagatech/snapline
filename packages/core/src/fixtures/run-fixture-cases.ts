import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AuthAdapter } from '@vaagatech/snapline-auth-adapters';
import { assertAgainstFile, loadJsonFile } from '@vaagatech/snapline-engine';
import { executeApi } from '@vaagatech/snapline-api-adapters';
import { api } from '../api/index.js';
import { toApiRequestConfig } from '../api/to-api-request-config.js';
import type { TestStepResult, TestSuiteResult } from '../types.js';
import { caseFilePath, resolveFixtureLayout, type ResolvedFixtureLayout } from './fixture-layout.js';
import { resolveFixtureSnaplineOptions } from './resolve-fixture-snapline-options.js';
import type {
  FixtureCaseMeta,
  FixtureCasePresetMaps,
  RunApiFixtureCasesOptions,
  RunSnaplineFixtureCasesOptions,
} from './types.js';

function readCaseMeta(caseDir: string, layout: ResolvedFixtureLayout): FixtureCaseMeta {
  return loadJsonFile(caseFilePath(caseDir, layout.caseMetaFile)) as FixtureCaseMeta;
}

function discoverCaseIds(casesRoot: string): string[] {
  return readdirSync(casesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function exists(path: string): boolean {
  try {
    readFileSync(path);
    return true;
  } catch {
    return false;
  }
}

function buildApiConfig(
  caseDir: string,
  meta: FixtureCaseMeta,
  defaults: RunApiFixtureCasesOptions['defaults'],
  layout: ResolvedFixtureLayout,
) {
  const protocol = meta.protocol ?? defaults?.protocol ?? 'graphql';
  const endpoint = meta.endpoint ?? defaults?.endpoint ?? '/graphql';
  const dataPath = meta.dataPath ?? defaults?.dataPath;

  if (protocol === 'graphql') {
    return {
      ...api.graphql({
        endpoint,
        queryFile: caseFilePath(caseDir, layout.queryFile),
        variablesFile: caseFilePath(caseDir, layout.variablesFile),
        dataPath,
      }),
    };
  }

  if (protocol === 'soap') {
    return {
      ...api.soap({
        endpoint,
        soapAction: meta.soapAction ?? 'GetUser',
        inputFile: caseFilePath(caseDir, layout.soapInputFile),
      }),
    };
  }

  const restInputPath = caseFilePath(caseDir, layout.restInputFile);
  return {
    endpoint,
    method: meta.method ?? 'GET',
    protocol: 'rest' as const,
    inputFile: exists(restInputPath) ? restInputPath : undefined,
  };
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
    layout,
    defaults = {},
    presets = {},
    caseIds,
  } = options;

  const casesRoot = join(fixturesRoot, layout?.casesDir ?? 'cases');
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
    const baseLayout = resolveFixtureLayout(layout, defaults);
    const meta = readCaseMeta(caseDir, baseLayout);
    const caseLayout = resolveFixtureLayout(layout, defaults, meta);
    const expectMatch = meta.expectMatch;
    const expectedStatus = meta.expectStatus ?? 200;
    const apiConfig = buildApiConfig(caseDir, meta, defaults, caseLayout);
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

    const snaplineOptions = resolveFixtureSnaplineOptions(meta, defaults, presets);

    const assertion = assertAgainstFile(
      response.data,
      caseFilePath(caseDir, caseLayout.expectedFile),
      snaplineOptions,
    );
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

export async function runSnaplineFixtureCases(
  options: RunSnaplineFixtureCasesOptions,
): Promise<TestSuiteResult> {
  const { suiteName, fixturesRoot, layout, defaults, presets = {}, caseIds } = options;
  const casesRoot = join(fixturesRoot, layout?.casesDir ?? 'cases');
  const ids = caseIds ?? discoverCaseIds(casesRoot);
  const results: TestStepResult[] = [];
  let passed = true;

  console.log(`\n▶ ${suiteName}`);

  for (const caseId of ids) {
    const caseDir = join(casesRoot, caseId);
    const baseLayout = resolveFixtureLayout(layout, defaults);
    const meta = readCaseMeta(caseDir, baseLayout);
    const caseLayout = resolveFixtureLayout(layout, defaults, meta);
    const liveData = loadJsonFile(caseFilePath(caseDir, caseLayout.liveFile));
    const snaplineOptions = resolveFixtureSnaplineOptions(meta, defaults, presets);

    const assertion = assertAgainstFile(
      liveData,
      caseFilePath(caseDir, caseLayout.expectedFile),
      snaplineOptions,
    );
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
