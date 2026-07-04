import { executeApi } from '@vaagatech/reconcile-api-adapters';
import type { ApiRequestConfig } from '@vaagatech/reconcile-api-adapters';
import { reconcile } from '@vaagatech/reconcile-engine';
import type { ApiToDbConfig, CrossSystemResult, FetchImpl } from '../types.js';

export async function runApiToDb(
  config: ApiToDbConfig,
  authHeaders: Record<string, string> = {},
  baseUrl?: string,
  fetchImpl?: FetchImpl,
): Promise<CrossSystemResult> {
  const {
    api,
    db: dbConfig,
    ignoreFields = [],
    transformations = {},
    dataMapping = {},
  } = config;

  const { expectedStatus = 200, ...apiRequest } = api;

  const response = await executeApi(apiRequest as ApiRequestConfig, {
    baseUrl,
    authHeaders,
    fetchImpl,
  });

  if (response.status !== expectedStatus) {
    return {
      match: false,
      source: response.data,
      target: null,
      diff: {
        path: '(http)',
        actual: response.status,
        expected: expectedStatus,
        message: `Expected status ${expectedStatus}, got ${response.status}`,
      },
    };
  }

  const rows = await dbConfig.db.query(dbConfig.query, dbConfig.params ?? {});
  const dbData = rows[0] ?? null;

  const result = reconcile(response.data, dbData, {
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
