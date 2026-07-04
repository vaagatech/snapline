import { executeApi } from '@vaagatech/snapline-api-adapters';
import type { ApiRequestConfig } from '@vaagatech/snapline-api-adapters';
import { reconcile } from '@vaagatech/snapline-engine';
import type { CrossSystemResult, DbToApiConfig, FetchImpl } from '../types.js';

export async function runDbToApi(
  config: DbToApiConfig,
  authHeaders: Record<string, string> = {},
  baseUrl?: string,
  fetchImpl?: FetchImpl,
): Promise<CrossSystemResult> {
  const {
    db: dbConfig,
    api,
    inputFromDb = true,
    ignoreFields = [],
    transformations = {},
    dataMapping = {},
  } = config;

  const rows = await dbConfig.db.query(dbConfig.query, dbConfig.params ?? {});
  const dbData = rows[0] ?? null;

  const { expectedStatus = 200, ...apiRequest } = api;

  const response = await executeApi(apiRequest as ApiRequestConfig, {
    baseUrl,
    authHeaders,
    fetchImpl,
    inputFromRow: inputFromDb && dbData ? dbData : undefined,
  });

  if (response.status !== expectedStatus) {
    return {
      match: false,
      source: dbData,
      target: response.data,
      diff: {
        path: '(http)',
        actual: response.status,
        expected: expectedStatus,
        message: `Expected status ${expectedStatus}, got ${response.status}`,
      },
    };
  }

  const result = reconcile(dbData, response.data, {
    ignoreFields,
    transformations,
    dataMapping,
  });

  return {
    match: result.match,
    source: result.processed,
    target: result.expected,
    diff: result.diff,
  };
}
