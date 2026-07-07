import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadJsonFile } from '@vaagatech/snapline-engine';
import type { ApiExecuteContext, ApiExecuteResult, GraphqlApiConfig } from '../types.js';
import { resolveUrl } from '../resolve-url.js';
import { assertSafeUrl } from '../safe-url.js';
import { DEFAULT_TIMEOUT_MS, fetchWithTimeout } from '../fetch-with-timeout.js';

function loadQuery(config: GraphqlApiConfig): string {
  if (config.query) {
    return config.query;
  }
  if (!config.queryFile) {
    return '';
  }
  const filePath = resolve(config.queryFile);
  const raw = readFileSync(filePath, 'utf8').trim();
  if (raw.startsWith('{')) {
    const parsed = JSON.parse(raw) as { query?: string };
    return parsed.query ?? raw;
  }
  return raw;
}

function getByPath(obj: unknown, path?: string): unknown {
  if (!path) {
    return obj;
  }
  return path.split('.').reduce<unknown>((cursor, key) => {
    if (cursor && typeof cursor === 'object' && key in (cursor as Record<string, unknown>)) {
      return (cursor as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export async function executeGraphql(
  config: GraphqlApiConfig,
  context: ApiExecuteContext = {},
): Promise<ApiExecuteResult> {
  const {
    baseUrl,
    authHeaders = {},
    fetchImpl = globalThis.fetch,
    inputFromRow,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    blockPrivateNetworks = false,
    blockMetadataHosts = true,
  } = context;

  let query = loadQuery(config);

  let variables: Record<string, unknown> = config.variables ?? {};
  if (config.variablesFile) {
    variables = loadJsonFile(config.variablesFile);
  }
  if (config.inputFile) {
    variables = loadJsonFile(config.inputFile);
  }
  if (inputFromRow) {
    variables = { ...variables, ...inputFromRow };
  }

  const url = resolveUrl(config.endpoint, baseUrl);
  assertSafeUrl(url, { blockPrivateNetworks, blockMetadataHosts });
  const response = await fetchWithTimeout(fetchImpl, timeoutMs)(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders,
      ...config.headers,
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await response.text();
  const responseHeaders = Object.fromEntries(response.headers.entries());

  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  const gqlData =
    parsed && typeof parsed === 'object' && 'data' in parsed
      ? (parsed as { data: unknown }).data
      : parsed;

  const data = getByPath(gqlData, config.dataPath);

  return {
    status: response.status,
    data,
    headers: responseHeaders,
    raw: text,
  };
}
