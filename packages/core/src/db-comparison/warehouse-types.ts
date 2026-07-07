import type { DataMappingMap, DiffResult, TransformationMap } from '@vaagatech/snapline-engine';
import type { DocumentStoreLike } from '../nosql/index.js';
import type { DbConnectionLike } from '../types.js';
import type { StreamReportOptions } from '../reporting/stream-report-options.js';

/** One source→target mapping in a chunked multi-table comparison. */
export interface WarehouseTableSpec {
  /** Step id / table name used in reports */
  id: string;
  /** SQL on the source side (SQL source stores) */
  sourceQuery?: string;
  sourceParams?: Record<string, unknown>;
  /** NoSQL collection on the source side (document source stores) */
  sourceCollection?: string;
  sourceFilter?: Record<string, unknown>;
  /** SQL on the target side (SQL target stores) */
  targetQuery?: string;
  targetParams?: Record<string, unknown>;
  /** NoSQL collection on the target side (document target stores) */
  targetCollection?: string;
  /** Source row field → target query param or document filter field */
  linkKeys: Record<string, string>;
  ignoreFields?: string[];
  transformations?: TransformationMap;
  dataMapping?: DataMappingMap;
}

export interface WarehouseComparisonLimits {
  /** Rows fetched per chunk (default 100) */
  chunkSize?: number;
  /** Cap rows per table (optional) */
  maxRowsPerTable?: number;
  /** Cap total rows across all tables (optional) */
  maxTotalRows?: number;
}

export interface WarehouseStreamReportOptions extends StreamReportOptions {
  /** Newline-delimited JSON events (memory-safe for large runs) */
  format?: 'jsonl';
}

export interface RunWarehouseComparisonOptions extends WarehouseComparisonLimits {
  suiteName: string;
  /** SQL or document source — DbConnectionLike or DocumentStoreLike */
  sourceDb: DbConnectionLike | DocumentStoreLike;
  /** SQL or document target — DbConnectionLike or DocumentStoreLike */
  targetDb: DbConnectionLike | DocumentStoreLike;
  tables: WarehouseTableSpec[];
  report?: WarehouseStreamReportOptions;
}

export interface WarehouseRowResult {
  tableId: string;
  rowIndex: number;
  passed: boolean;
  sourceKey?: unknown;
  diff?: DiffResult | null;
  message?: string;
}

export interface WarehouseChunkEvent {
  type: 'chunk';
  tableId: string;
  chunkIndex: number;
  rowCount: number;
  passed: number;
  failed: number;
  at: string;
}

export interface WarehouseSummaryEvent {
  type: 'summary';
  suiteName: string;
  tables: number;
  rowsCompared: number;
  passed: number;
  failed: number;
  at: string;
}

export type WarehouseStreamEvent =
  | WarehouseChunkEvent
  | WarehouseSummaryEvent
  | (WarehouseRowResult & { type: 'row' });
