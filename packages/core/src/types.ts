import type { AuthAdapter } from '@vaagatech/snapline-auth-adapters';
import type { ApiRequestConfig } from '@vaagatech/snapline-api-adapters';
import type {
  DataMappingMap,
  DiffResult,
  ReconcileOptions,
  TransformationMap,
} from '@vaagatech/snapline-engine';
import type { StreamReportOptions } from './reporting/stream-report-options.js';

export type { ApiRequestConfig } from '@vaagatech/snapline-api-adapters';

export type FetchImpl = typeof fetch;

export interface DbRow {
  [column: string]: unknown;
}

export interface DbConnectionLike {
  query(query: string, params?: Record<string, unknown>): Promise<DbRow[]>;
}

export interface DocumentStoreLike {
  find(collection: string, filter?: Record<string, unknown>): Promise<DbRow[]>;
  findOne?(collection: string, filter?: Record<string, unknown>): Promise<DbRow | null>;
}

export interface DbQueryConfig {
  db: DbConnectionLike;
  query: string;
  params?: Record<string, unknown>;
}

/** API tested against a JSON fixture file (REST, SOAP, or GraphQL). */
export interface ApiFileTestConfig extends ReconcileOptions {
  /** REST shorthand — omit when using api.rest(), api.soap(), or api.graphql() */
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
  inputFile?: string;
  expectedFile?: string;
  body?: unknown;
  headers?: Record<string, string>;
  expectedStatus?: number;
  /** Explicit protocol config from api.rest() | api.soap() | api.graphql() */
  protocol?: 'rest' | 'soap' | 'graphql';
  soapAction?: string;
  envelope?: string;
  query?: string;
  queryFile?: string;
  variables?: Record<string, unknown>;
  variablesFile?: string;
  dataPath?: string;
}

export interface DbComparisonConfig extends ReconcileOptions {
  sourceDb: DbConnectionLike | DocumentStoreLike;
  targetDb: DbConnectionLike | DocumentStoreLike;
  /**
   * Run the same SQL on both sides. Shorthand when `sourceQuery` / `targetQuery` are omitted.
   * For document stores, use `sourceCollection` / `targetCollection` instead.
   */
  query?: string;
  /** SQL run only against the source database */
  sourceQuery?: string;
  /** SQL run only against the target database */
  targetQuery?: string;
  params?: Record<string, unknown>;
  sourceParams?: Record<string, unknown>;
  targetParams?: Record<string, unknown>;
  /**
   * Map target query parameter (or document filter field) names to source row fields.
   * Example: `{ orderId: 'orderId' }` uses the source row's `orderId` as `:orderId` in `targetQuery`.
   */
  linkKeys?: Record<string, string>;
  targetParamsFromSource?: (sourceRow: DbRow) => Record<string, unknown>;
  /** NoSQL: collection queried on the source store */
  sourceCollection?: string;
  /** NoSQL: collection queried on the target store */
  targetCollection?: string;
  sourceFilter?: Record<string, unknown>;
  targetFilter?: Record<string, unknown>;
  targetFilterFromSource?: (sourceRow: DbRow) => Record<string, unknown>;
}

/** Call API → reconcile response with a DB row. */
export interface ApiToDbConfig extends ReconcileOptions {
  api: ApiRequestConfig & { expectedStatus?: number };
  db: DbQueryConfig;
}

/** Read DB → call API → reconcile DB row with API response. */
export interface DbToApiConfig extends ReconcileOptions {
  db: DbQueryConfig;
  api: ApiRequestConfig & { expectedStatus?: number };
  /** Merge first DB row into API body / GraphQL variables */
  inputFromDb?: boolean;
}

export interface TestSuiteConfig {
  auth?: AuthAdapter;
  /** API vs JSON fixture file */
  api?: ApiFileTestConfig;
  /** DB vs DB */
  dbComparison?: DbComparisonConfig;
  /** API vs DB */
  apiToDb?: ApiToDbConfig;
  /** DB vs API */
  dbToApi?: DbToApiConfig;
  baseUrl?: string;
  fetchImpl?: FetchImpl;
  /** Append JSONL events per step (memory-safe for long runs) */
  streamReport?: StreamReportOptions;
}

export interface ApiResponse {
  status: number;
  data: unknown;
  headers: Record<string, string>;
}

export interface TestStepResult {
  step: string;
  passed: boolean;
  message?: string;
  data?: unknown;
  diff?: DiffResult | null;
  processed?: unknown;
  token?: string | null;
  source?: unknown;
  target?: unknown;
  match?: boolean;
}

export interface TestSuiteResult {
  name: string;
  passed: boolean;
  results: TestStepResult[];
}

export interface CrossSystemResult {
  match: boolean;
  source: unknown;
  target: unknown;
  diff: DiffResult | null;
}

/** @deprecated Use CrossSystemResult */
export type DbComparisonResult = CrossSystemResult;

export type DbDialect = 'postgres' | 'mysql';

export type {
  DataMappingMap,
  DiffResult,
  ReconcileOptions,
  TransformationMap,
};
