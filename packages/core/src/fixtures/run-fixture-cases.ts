import { readdirSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { AuthAdapter } from '@vaagatech/snapline-auth-adapters';
import { assertAgainstFile, loadJsonFile } from '@vaagatech/snapline-engine';
import { assertWithinRoot } from '@vaagatech/snapline-engine';
import { executeApi } from '@vaagatech/snapline-api-adapters';
import { api } from '../api/index.js';
import { toApiRequestConfig } from '../api/to-api-request-config.js';
import { createStreamReportWriter } from '../reporting/stream-report.js';
import type { TestStepResult, TestSuiteResult } from '../types.js';
import { caseFilePath, resolveFixtureLayout, type ResolvedFixtureLayout } from './fixture-layout.js';
import { resolveFixtureSnaplineOptions } from './resolve-fixture-snapline-options.js';
import type {
  FixtureCaseMeta,
  FixtureCasePresetMaps,
  RunApiFixtureCasesOptions,
  RunSnaplineFixtureCasesOptions,
} from './types.js';

function readCaseMeta(caseDir: string, layout: ResolvedFixtureLayout, fixturesRoot: string): FixtureCaseMeta {
  const metaPath = assertWithinRoot(fixturesRoot, caseFilePath(caseDir, layout.caseMetaFile));
  return loadJsonFile(metaPath) as FixtureCaseMeta;
}

function discoverCaseIds(casesRoot: string, fixturesRoot: string): string[] {
  const resolvedCasesRoot = assertWithinRoot(fixturesRoot, casesRoot);
  return readdirSync(resolvedCasesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function exists(path: string): boolean {
  return existsSync(path);
}

function safeCaseFile(caseDir: string, fileName: string, fixturesRoot: string): string {
  return assertWithinRoot(fixturesRoot, caseFilePath(caseDir, fileName));
}

function buildApiConfig(
  caseDir: string,
  meta: FixtureCaseMeta,
  defaults: RunApiFixtureCasesOptions['defaults'],
  layout: ResolvedFixtureLayout,
  fixturesRoot: string,
) {
  const protocol = meta.protocol ?? defaults?.protocol ?? 'graphql';
  const endpoint = meta.endpoint ?? defaults?.endpoint ?? '/graphql';
  const dataPath = meta.dataPath ?? defaults?.dataPath;

  if (protocol === 'graphql') {
    return {
      ...api.graphql({
        endpoint,
        queryFile: safeCaseFile(caseDir, layout.queryFile, fixturesRoot),
        variablesFile: safeCaseFile(caseDir, layout.variablesFile, fixturesRoot),
        dataPath,
      }),
    };
  }

  if (protocol === 'soap') {
    return {
      ...api.soap({
        endpoint,
        soapAction: meta.soapAction ?? 'GetUser',
        inputFile: safeCaseFile(caseDir, layout.soapInputFile, fixturesRoot),
      }),
    };
  }

  const restInputPath = safeCaseFile(caseDir, layout.restInputFile, fixturesRoot);
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
    streamReport,
  } = options;

  const writer = streamReport ? createStreamReportWriter(streamReport) : null;
  let casesPassed = 0;
  let casesFailed = 0;

  const resolvedFixturesRoot = resolve(fixturesRoot);
  const casesRoot = join(resolvedFixturesRoot, layout?.casesDir ?? 'cases');
  const ids = caseIds ?? discoverCaseIds(casesRoot, resolvedFixturesRoot);
  const results: TestStepResult[] = [];
  let passed = true;

  console.log(`\n▶ ${suiteName}`);

  let authHeaders = options.authHeaders ?? {};
  if (auth) {
    try {
      const authResult = await auth.initialize();
      authHeaders = authResult.headers;
      results.push({
        step: 'auth',
        passed: true,
        token: authResult.token ? '[redacted]' : null,
      });
      console.log('  ✓ auth initialized');
    } catch (error) {
      passed = false;
      const message = error instanceof Error ? error.message : String(error);
      results.push({ step: 'auth', passed: false, message });
      console.log(`  ✗ auth failed: ${message}`);
      return { name: suiteName, passed: false, results };
    }
  }

  for (const caseId of ids) {
    const caseDir = assertWithinRoot(resolvedFixturesRoot, join(casesRoot, caseId));
    const baseLayout = resolveFixtureLayout(layout, defaults);
    const meta = readCaseMeta(caseDir, baseLayout, resolvedFixturesRoot);
    const caseLayout = resolveFixtureLayout(layout, defaults, meta);
    const expectMatch = meta.expectMatch;
    const expectedStatus = meta.expectStatus ?? 200;
    const apiConfig = buildApiConfig(caseDir, meta, defaults, caseLayout, resolvedFixturesRoot);
    const request = toApiRequestConfig(apiConfig);
    const caseAuthHeaders = meta.skipAuth ? {} : authHeaders;
    const response = await executeApi(request, {
      baseUrl,
      authHeaders: caseAuthHeaders,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      blockPrivateNetworks: options.blockPrivateNetworks,
      blockMetadataHosts: options.blockMetadataHosts,
    });

    if (response.status !== expectedStatus) {
      passed = false;
      casesFailed += 1;
      const stepResult: TestStepResult = {
        step: caseId,
        passed: false,
        message: `Expected HTTP ${expectedStatus}, got ${response.status}`,
        data: response.data,
      };
      results.push(stepResult);
      writer?.write({
        type: 'case',
        suiteName,
        caseId,
        name: meta.name,
        passed: false,
        httpStatus: response.status,
        expectedStatus,
      });
      console.log(`  ✗ ${meta.name}`);
      console.log(`    HTTP ${response.status}`);
      continue;
    }

    const expectedPath = safeCaseFile(caseDir, caseLayout.expectedFile, resolvedFixturesRoot);
    const hasExpectedFile = exists(expectedPath);

    if (expectedStatus !== 200 && !hasExpectedFile) {
      casesPassed += 1;
      const stepResult: TestStepResult = {
        step: caseId,
        passed: true,
        message: meta.failureType ?? `HTTP ${expectedStatus}`,
        data: response.data,
      };
      results.push(stepResult);
      writer?.write({
        type: 'case',
        suiteName,
        caseId,
        name: meta.name,
        passed: true,
        httpStatus: expectedStatus,
        failureType: meta.failureType,
      });
      logCaseResult(meta.name, true, expectMatch, false, null, meta.failureType);
      continue;
    }

    if (expectedStatus !== 200 && hasExpectedFile) {
      const snaplineOptions = resolveFixtureSnaplineOptions(meta, defaults, presets);
      const assertion = assertAgainstFile(response.data, expectedPath, snaplineOptions);
      const casePassed = assertion.match === expectMatch;

      if (meta.expectedDiffPath && !expectMatch) {
        const diffPath = assertion.diff?.path ?? '';
        if (!diffPath.startsWith(meta.expectedDiffPath)) {
          passed = false;
          casesFailed += 1;
          results.push({
            step: caseId,
            passed: false,
            message: `Expected diff at "${meta.expectedDiffPath}", got "${diffPath || '(none)'}"`,
            diff: assertion.diff,
            processed: assertion.processed,
          });
          writer?.write({
            type: 'case',
            suiteName,
            caseId,
            name: meta.name,
            passed: false,
            httpStatus: expectedStatus,
          });
          logCaseResult(meta.name, false, expectMatch, assertion.match, assertion.diff);
          continue;
        }
      }

      if (!casePassed) {
        passed = false;
        casesFailed += 1;
      } else {
        casesPassed += 1;
      }

      results.push({
        step: caseId,
        passed: casePassed,
        diff: assertion.diff,
        processed: assertion.processed,
        message: meta.failureType,
        data: response.data,
      });
      writer?.write({
        type: 'case',
        suiteName,
        caseId,
        name: meta.name,
        passed: casePassed,
        httpStatus: expectedStatus,
        failureType: meta.failureType,
      });
      logCaseResult(
        meta.name,
        casePassed,
        expectMatch,
        assertion.match,
        casePassed ? null : assertion.diff,
        meta.failureType,
      );
      continue;
    }

    const snaplineOptions = resolveFixtureSnaplineOptions(meta, defaults, presets);

    const assertion = assertAgainstFile(
      response.data,
      safeCaseFile(caseDir, caseLayout.expectedFile, resolvedFixturesRoot),
      snaplineOptions,
    );
    const casePassed = assertion.match === expectMatch;

    if (meta.expectedDiffPath && !expectMatch) {
      const diffPath = assertion.diff?.path ?? '';
      if (!diffPath.startsWith(meta.expectedDiffPath)) {
        passed = false;
        casesFailed += 1;
        results.push({
          step: caseId,
          passed: false,
          message: `Expected diff at "${meta.expectedDiffPath}", got "${diffPath || '(none)'}"`,
          diff: assertion.diff,
          processed: assertion.processed,
        });
        writer?.write({
          type: 'case',
          suiteName,
          caseId,
          name: meta.name,
          passed: false,
          httpStatus: expectedStatus,
        });
        logCaseResult(meta.name, false, expectMatch, assertion.match, assertion.diff);
        continue;
      }
    }

    if (!casePassed) {
      passed = false;
      casesFailed += 1;
    } else {
      casesPassed += 1;
    }

    results.push({
      step: caseId,
      passed: casePassed,
      diff: assertion.diff,
      processed: assertion.processed,
      message: meta.failureType,
    });

    writer?.write({
      type: 'case',
      suiteName,
      caseId,
      name: meta.name,
      passed: casePassed,
      httpStatus: expectedStatus,
    });

    logCaseResult(meta.name, casePassed, expectMatch, assertion.match, casePassed ? null : assertion.diff);
  }

  if (writer) {
    const reportPath = writer.finalize({
      type: 'summary',
      suiteName,
      mode: 'api-fixture-cases',
      total: ids.length,
      passed: casesPassed,
      failed: casesFailed,
      suitePassed: passed,
      at: new Date().toISOString(),
    });
    console.log(`  Stream report: ${reportPath}`);
  }

  const summary = passed ? 'PASSED' : 'FAILED';
  console.log(`\n${passed ? '✅' : '❌'} ${suiteName}: ${summary}\n`);

  return { name: suiteName, passed, results };
}

export async function runSnaplineFixtureCases(
  options: RunSnaplineFixtureCasesOptions,
): Promise<TestSuiteResult> {
  const { suiteName, fixturesRoot, layout, defaults, presets = {}, caseIds, streamReport } = options;
  const resolvedFixturesRoot = resolve(fixturesRoot);
  const casesRoot = join(resolvedFixturesRoot, layout?.casesDir ?? 'cases');
  const ids = caseIds ?? discoverCaseIds(casesRoot, resolvedFixturesRoot);
  const results: TestStepResult[] = [];
  let passed = true;
  const writer = streamReport ? createStreamReportWriter(streamReport) : null;
  let casesPassed = 0;
  let casesFailed = 0;

  console.log(`\n▶ ${suiteName}`);

  for (const caseId of ids) {
    const caseDir = assertWithinRoot(resolvedFixturesRoot, join(casesRoot, caseId));
    const baseLayout = resolveFixtureLayout(layout, defaults);
    const meta = readCaseMeta(caseDir, baseLayout, resolvedFixturesRoot);
    const caseLayout = resolveFixtureLayout(layout, defaults, meta);
    const liveData = loadJsonFile(safeCaseFile(caseDir, caseLayout.liveFile, resolvedFixturesRoot));
    const snaplineOptions = resolveFixtureSnaplineOptions(meta, defaults, presets);

    const assertion = assertAgainstFile(
      liveData,
      safeCaseFile(caseDir, caseLayout.expectedFile, resolvedFixturesRoot),
      snaplineOptions,
    );
    const casePassed = assertion.match === meta.expectMatch;

    if (meta.expectedDiffPath && !meta.expectMatch) {
      const diffPath = assertion.diff?.path ?? '';
      if (!diffPath.startsWith(meta.expectedDiffPath)) {
        passed = false;
        casesFailed += 1;
        results.push({
          step: caseId,
          passed: false,
          message: `Expected diff at "${meta.expectedDiffPath}", got "${diffPath || '(none)'}"`,
          diff: assertion.diff,
        });
        writer?.write({ type: 'case', suiteName, caseId, name: meta.name, passed: false, mode: 'offline' });
        logCaseResult(meta.name, false, meta.expectMatch, assertion.match, assertion.diff);
        continue;
      }
    }

    if (!casePassed) {
      passed = false;
      casesFailed += 1;
    } else {
      casesPassed += 1;
    }

    results.push({
      step: caseId,
      passed: casePassed,
      diff: assertion.diff,
      processed: assertion.processed,
      message: meta.failureType,
    });

    writer?.write({
      type: 'case',
      suiteName,
      caseId,
      name: meta.name,
      passed: casePassed,
      mode: 'offline',
    });

    logCaseResult(meta.name, casePassed, meta.expectMatch, assertion.match, casePassed ? null : assertion.diff);
  }

  if (writer) {
    const reportPath = writer.finalize({
      type: 'summary',
      suiteName,
      mode: 'snapline-fixture-cases',
      total: ids.length,
      passed: casesPassed,
      failed: casesFailed,
      suitePassed: passed,
      at: new Date().toISOString(),
    });
    console.log(`  Stream report: ${reportPath}`);
  }

  const summary = passed ? 'PASSED' : 'FAILED';
  console.log(`\n${passed ? '✅' : '❌'} ${suiteName}: ${summary}\n`);

  return { name: suiteName, passed, results };
}
