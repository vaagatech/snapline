import type { TestSuiteResult } from '../types.js';

export type ReportFormat = 'json' | 'html' | 'text';

export interface ReportConfig {
  /** Output format — json, html, or plain text. */
  format: ReportFormat;
  /** Destination file path. Parent directories are created automatically. */
  outputPath: string;
  /** Dot-path fields in step results replaced with [REDACTED] before writing. */
  redactFields?: string[];
}

export interface TestRunReportMeta {
  durationMs?: number;
  environment?: Record<string, string>;
}

export interface TestRunReport {
  generatedAt: string;
  framework: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    durationMs?: number;
  };
  environment?: Record<string, string>;
  suites: TestSuiteResult[];
}
