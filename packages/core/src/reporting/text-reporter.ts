import type { TestRunReport } from './types.js';

function formatDiff(diff: unknown): string {
  if (!diff) {
    return 'none';
  }
  return JSON.stringify(diff, null, 2).split('\n').join('\n      ');
}

export function renderTextReport(report: TestRunReport): string {
  const lines: string[] = [
    '@vaagatech/reconcile-engine — Test Run Report',
    '=====================================',
    `Generated: ${report.generatedAt}`,
    `Duration:  ${report.summary.durationMs ?? 0}ms`,
    '',
    `Total:  ${report.summary.total}`,
    `Passed: ${report.summary.passed}`,
    `Failed: ${report.summary.failed}`,
    '',
  ];

  for (const suite of report.suites) {
    lines.push(`${suite.passed ? 'PASS' : 'FAIL'}  ${suite.name}`);
    for (const step of suite.results) {
      lines.push(`  ${step.passed ? '✓' : '✗'} ${step.step}`);
      if (!step.passed && step.message) {
        lines.push(`      message: ${step.message}`);
      }
      if (!step.passed && step.diff) {
        lines.push(`      diff:\n      ${formatDiff(step.diff)}`);
      }
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}
