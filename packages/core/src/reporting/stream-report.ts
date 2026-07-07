import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Writable } from 'node:stream';
import { redactFields } from './redact-fields.js';
import type { WarehouseStreamEvent, WarehouseSummaryEvent } from '../db-comparison/warehouse-types.js';

export interface StreamReportWriter {
  write(event: WarehouseStreamEvent): void;
  finalize(summary: WarehouseSummaryEvent): string;
}

export function createStreamReportWriter(
  outputPath: string,
  redactFieldsList: string[] = [],
): StreamReportWriter {
  mkdirSync(dirname(outputPath), { recursive: true });
  const stream: Writable = createWriteStream(outputPath, { encoding: 'utf8', flags: 'w' });

  const writeLine = (payload: unknown): void => {
    const sanitized = redactFields(payload, redactFieldsList);
    stream.write(`${JSON.stringify(sanitized)}\n`);
  };

  return {
    write(event: WarehouseStreamEvent) {
      writeLine(event);
    },
    finalize(summary: WarehouseSummaryEvent) {
      writeLine(summary);
      stream.end();
      return outputPath;
    },
  };
}
