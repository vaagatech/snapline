/** Append JSONL events during a run — memory-safe for large suites. */
export interface StreamReportOptions {
  outputPath: string;
  redactFields?: string[];
}
