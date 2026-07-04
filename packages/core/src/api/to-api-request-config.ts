import type { ApiFileTestConfig, ApiRequestConfig } from '../types.js';

/** Normalize flat REST config or explicit api.rest()/soap()/graphql() objects. */
export function toApiRequestConfig(config: ApiFileTestConfig): ApiRequestConfig {
  if (config.protocol === 'soap') {
    return {
      protocol: 'soap',
      endpoint: config.endpoint ?? '/',
      soapAction: config.soapAction,
      envelope: config.envelope,
      inputFile: config.inputFile,
      headers: config.headers,
    };
  }

  if (config.protocol === 'graphql') {
    return {
      protocol: 'graphql',
      endpoint: config.endpoint ?? '/graphql',
      query: config.query,
      queryFile: config.queryFile,
      variables: config.variables,
      variablesFile: config.variablesFile,
      inputFile: config.inputFile,
      dataPath: config.dataPath,
      headers: config.headers,
    };
  }

  return {
    protocol: 'rest',
    endpoint: config.endpoint ?? '/',
    method: config.method,
    inputFile: config.inputFile,
    body: config.body,
    headers: config.headers,
  };
}

export function isExplicitApiConfig(
  config: ApiRequestConfig | ApiFileTestConfig,
): config is ApiRequestConfig {
  return (
    config.protocol === 'soap' ||
    config.protocol === 'graphql' ||
    (config.protocol === 'rest' && 'endpoint' in config && config.endpoint !== undefined)
  );
}
