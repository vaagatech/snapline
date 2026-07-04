import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { TestSuiteResult } from '../types.js';
import { renderHtmlReport } from './html-reporter.js';
import { renderJsonReport } from './json-reporter.js';
import { renderTextReport } from './text-reporter.js';
import type { ReportConfig, TestRunReport, TestRunReportMeta } from './types.js';

const FRAMEWORK_NAME = '@vaagatech/reconcile-engine';

function buildReport(
  suites: TestSuiteResult[],
  meta: TestRunReportMeta = {},
): TestRunReport {
  const passed = suites.filter((suite) => suite.passed).length;
  const failed = suites.length - passed;

  return {
    generatedAt: new Date().toISOString(),
    framework: FRAMEWORK_NAME,
    summary: {
      total: suites.length,
      passed,
      failed,
      durationMs: meta.durationMs,
    },
    environment: meta.environment,
    suites,
  };
}

function renderReport(report: TestRunReport, format: ReportConfig['format']): string {
  switch (format) {
    case 'json':
      return renderJsonReport(report);
    case 'html':
      return renderHtmlReport(report);
    case 'text':
      return renderTextReport(report);
    default: {
      const exhaustive: never = format;
      throw new Error(`Unsupported report format: ${exhaustive}`);
    }
  }
}

export function writeTestReport(
  suites: TestSuiteResult[],
  config: ReportConfig,
  meta: TestRunReportMeta = {},
): string {
  const report = buildReport(suites, meta);
  const content = renderReport(report, config.format);
  mkdirSync(dirname(config.outputPath), { recursive: true });
  writeFileSync(config.outputPath, content, 'utf8');
  return config.outputPath;
}

export { buildReport, renderReport };
