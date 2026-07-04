import { loadJsonFile } from '@vaagatech/reconcile';
import type { ApiExecuteContext, ApiExecuteResult, RestApiConfig } from '../types.js';
import { resolveUrl } from '../resolve-url.js';

export async function executeRest(
  config: RestApiConfig,
  context: ApiExecuteContext = {},
): Promise<ApiExecuteResult> {
  const {
    baseUrl,
    authHeaders = {},
    fetchImpl = globalThis.fetch,
    inputFromRow,
  } = context;

  const {
    endpoint,
    method = 'GET',
    inputFile,
    body,
    headers = {},
  } = config;

  let url = resolveUrl(endpoint, baseUrl);
  let payload: unknown = body;

  if (inputFile) {
    payload = loadJsonFile(inputFile);
  }

  if (inputFromRow) {
    payload =
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? { ...(payload as Record<string, unknown>), ...inputFromRow }
        : { ...inputFromRow };
  }

  const httpMethod = method.toUpperCase();
  if (inputFromRow && (httpMethod === 'GET' || httpMethod === 'HEAD')) {
    const urlObj = new URL(url);
    for (const [key, value] of Object.entries(inputFromRow)) {
      urlObj.searchParams.set(key, String(value));
    }
    url = urlObj.toString();
  }

  const requestInit: RequestInit = {
    method: httpMethod,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders,
      ...headers,
    },
  };

  if (payload !== undefined && httpMethod !== 'GET' && httpMethod !== 'HEAD') {
    requestInit.body = JSON.stringify(payload);
  }

  const response = await fetchImpl(url, requestInit);
  const responseHeaders = Object.fromEntries(response.headers.entries());
  const text = await response.text();

  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { status: response.status, data, headers: responseHeaders, raw: text };
}
