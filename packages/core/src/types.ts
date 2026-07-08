import type { AuthAdapter } from '@vaagatech/snapline-auth-adapters';
import type { ApiRequestConfig } from '@vaagatech/snapline-api-adapters';
import type {
  DataMappingMap,
  DiffResult,
  SnaplineOptions,
  SnaplineResult,
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
  /** Poll until rows are available (used by async DB resolvers). */
  poll?: PollOptions;
}

export interface PollOptions {
  timeoutMs?: number;
  intervalMs?: number;
}

/** Wait for an async side-effect (DB row, file, message) after publishing to a queue. */
export interface AsyncResultResolver {
  waitForResult(correlationId: string, options?: PollOptions): Promise<unknown>;
}

export interface DbPollConfig {
  db: DbConnectionLike;
  query: string;
  params?: Record<string, unknown>;
  /** Query parameter name bound to the correlation id (default: correlationId). */
  correlationParam?: string;
  /** Return true when polled rows are ready (e.g. status = COMPLETE). */
  until?: (rows: DbRow[]) => boolean;
  /** Map rows to the value compared against expected (default: first row). */
  extract?: (rows: DbRow[]) => unknown;
}

export interface FilePollConfig {
  directory: string;
  fileName?: (correlationId: string) => string;
}

export interface MessagePublishInput {
  payload: unknown;
  headers?: Record<string, string>;
  correlationId?: string;
  key?: string;
}

export interface MessagePublishResult {
  correlationId: string;
  messageId?: string;
  topic: string;
}

/** Publish to Kafka, SQS, RabbitMQ, or an in-memory queue. */
export interface MessagePublisherLike {
  publish(topic: string, message: MessagePublishInput): Promise<MessagePublishResult>;
}

export interface MessageReceived {
  topic: string;
  payload: unknown;
  headers: Record<string, string>;
  correlationId?: string;
  messageId?: string;
}

export interface MessageWaitOptions {
  correlationId?: string;
  timeoutMs?: number;
}

export interface MessageConsumerLike {
  waitForMessage(topic: string, options?: MessageWaitOptions): Promise<MessageReceived>;
}

export interface MessagePollConfig {
  consumer: MessageConsumerLike;
  topic: string;
  timeoutMs?: number;
  extract?: (message: MessageReceived) => unknown;
}

export interface PublishConfig {
  publisher: MessagePublisherLike;
  topic: string;
  payload: unknown;
  headers?: Record<string, string>;
  correlationId?: string;
  key?: string;
}

export type PollTarget =
  | { resolver: AsyncResultResolver }
  | { db: DbPollConfig }
  | { file: FilePollConfig }
  | { message: MessagePollConfig };

/** Publish to a queue, then poll DB / filesystem / response topic for the result. */
export interface PublishAndPollConfig extends SnaplineOptions {
  publish: PublishConfig;
  poll: PollTarget;
  pollOptions?: PollOptions;
  expectedFile?: string;
  expected?: unknown;
}

/** API tested against a JSON fixture file (REST, SOAP, or GraphQL). */
export interface ApiFileTestConfig extends SnaplineOptions {
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

export interface DbComparisonConfig extends SnaplineOptions {
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

/** Call API → compare response with a DB row. */
export interface ApiToDbConfig extends SnaplineOptions {
  api: ApiRequestConfig & { expectedStatus?: number };
  db: DbQueryConfig;
}

/** Read DB → call API → compare DB row with API response. */
export interface DbToApiConfig extends SnaplineOptions {
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
  /** Queue / messaging → poll DB, file, or response topic */
  publishAndPoll?: PublishAndPollConfig;
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
  SnaplineOptions,
  SnaplineResult,
  TransformationMap,
};
