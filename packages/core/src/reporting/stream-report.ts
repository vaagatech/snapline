import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Writable } from 'node:stream';
import { redactFields } from './redact-fields.js';
import type { StreamReportOptions } from './stream-report-options.js';

export type { StreamReportOptions };

export interface StreamReportWriter {
  write(event: Record<string, unknown>): void;
  finalize(summary: Record<string, unknown>): string;
}

export function createStreamReportWriter(
  outputPath: string,
  redactFieldsList?: string[],
): StreamReportWriter;
export function createStreamReportWriter(
  options: StreamReportOptions,
): StreamReportWriter;
export function createStreamReportWriter(
  outputPathOrOptions: string | StreamReportOptions,
  redactFieldsList: string[] = [],
): StreamReportWriter {
  const outputPath =
    typeof outputPathOrOptions === 'string'
      ? outputPathOrOptions
      : outputPathOrOptions.outputPath;
  const redact =
    typeof outputPathOrOptions === 'string'
      ? redactFieldsList
      : (outputPathOrOptions.redactFields ?? []);

  mkdirSync(dirname(outputPath), { recursive: true });
  const stream: Writable = createWriteStream(outputPath, { encoding: 'utf8', flags: 'w' });

  const writeLine = (payload: Record<string, unknown>): void => {
    const sanitized = redactFields(payload, redact);
    stream.write(`${JSON.stringify(sanitized)}\n`);
  };

  return {
    write(event: Record<string, unknown>) {
      writeLine(event);
    },
    finalize(summary: Record<string, unknown>) {
      writeLine(summary);
      stream.end();
      return outputPath;
    },
  };
}
