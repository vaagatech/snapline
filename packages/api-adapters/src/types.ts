export type FetchImpl = typeof fetch;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export type ApiProtocol = 'rest' | 'soap' | 'graphql';

export interface ApiExecuteContext {
  baseUrl?: string;
  authHeaders?: Record<string, string>;
  fetchImpl?: FetchImpl;
  /** Optional DB row merged into REST body or GraphQL variables */
  inputFromRow?: Record<string, unknown>;
}

export interface ApiExecuteResult {
  status: number;
  data: unknown;
  headers: Record<string, string>;
  raw?: string;
}

interface ApiConfigBase {
  endpoint: string;
  headers?: Record<string, string>;
  inputFile?: string;
}

export interface RestApiConfig extends ApiConfigBase {
  protocol?: 'rest';
  method?: HttpMethod;
  body?: unknown;
}

export interface SoapApiConfig extends ApiConfigBase {
  protocol: 'soap';
  soapAction?: string;
  envelope?: string;
}

export interface GraphqlApiConfig extends ApiConfigBase {
  protocol: 'graphql';
  query?: string;
  queryFile?: string;
  variables?: Record<string, unknown>;
  variablesFile?: string;
  /** Dot-path to extract from GraphQL `data` (e.g. "user") */
  dataPath?: string;
}

export type ApiRequestConfig = RestApiConfig | SoapApiConfig | GraphqlApiConfig;

export function isRestConfig(config: ApiRequestConfig): config is RestApiConfig {
  return config.protocol === undefined || config.protocol === 'rest';
}

export function isSoapConfig(config: ApiRequestConfig): config is SoapApiConfig {
  return config.protocol === 'soap';
}

export function isGraphqlConfig(config: ApiRequestConfig): config is GraphqlApiConfig {
  return config.protocol === 'graphql';
}
