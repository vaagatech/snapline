import { pathToFileURL } from 'node:url';
import type { TestSuiteResult } from '@vaagatech/snapline-core';
import { resolveReportConfig, writeTestReport } from '@vaagatech/snapline-core';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name} (see .env.example)`);
  }
  return value;
}

export function finalizeRun(result: TestSuiteResult, suiteName: string): TestSuiteResult {
  const reportConfig = resolveReportConfig();
  if (reportConfig) {
    writeTestReport([result], reportConfig, {
      environment: { suite: suiteName, reportFormat: reportConfig.format },
    });
  }
  return result;
}

export function isMainModule(metaUrl: string): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return import.meta.url === pathToFileURL(entry).href || metaUrl.endsWith(entry);
}
