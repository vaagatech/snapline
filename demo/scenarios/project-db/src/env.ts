import { resolveReportConfig, writeTestReport, type TestSuiteResult } from '@vaagatech/snapline-core';

export function isMainModule(_metaUrl: string): boolean {
  return import.meta.url === new URL(process.argv[1] ?? '', 'file:').href;
}

export function finalizeRun(result: TestSuiteResult, suiteName: string): TestSuiteResult {
  const reportConfig = resolveReportConfig({ defaultOutputPath: './reports/project-db-suite.json' });
  if (reportConfig) {
    writeTestReport([result], reportConfig, { environment: { suiteName } });
  }
  return result;
}
