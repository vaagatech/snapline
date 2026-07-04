import type { TestRunReport } from './types.js';

export function renderJsonReport(report: TestRunReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
