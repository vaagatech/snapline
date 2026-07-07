import type { DataMappingMap, DiffResult, TransformationMap } from '@vaagatech/snapline-engine';
import type { DocumentStoreLike } from '../nosql/index.js';
import type { DbConnectionLike } from '../types.js';

/** One SQL table → NoSQL collection mapping in a warehouse pipeline. */
export interface WarehouseTableSpec {
  /** Step id / table name used in reports */
  id: string;
  /** SQL run against the source warehouse (Postgres in prod; SQLite in demo) */
  sourceQuery: string;
  sourceParams?: Record<string, unknown>;
  /** NoSQL collection on the target (MongoDB in prod; in-memory in demo) */
  targetCollection: string;
  /** Source row field → target document filter field */
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

export interface WarehouseStreamReportOptions {
  outputPath: string;
  /** Newline-delimited JSON events (memory-safe for large runs) */
  format?: 'jsonl';
  redactFields?: string[];
}

export interface RunWarehouseComparisonOptions extends WarehouseComparisonLimits {
  suiteName: string;
  /** SQL source — implement DbConnectionLike with your Postgres/MySQL driver */
  sourceDb: DbConnectionLike;
  /** Document target — use MongoDB adapter in prod, nosql.memory() in demo */
  targetDb: DocumentStoreLike;
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
