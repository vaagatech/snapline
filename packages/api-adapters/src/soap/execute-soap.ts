import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ApiExecuteContext, ApiExecuteResult, SoapApiConfig } from '../types.js';
import { resolveUrl } from '../resolve-url.js';
import { assertSafeUrl } from '../safe-url.js';
import { DEFAULT_TIMEOUT_MS, fetchWithTimeout } from '../fetch-with-timeout.js';
import { buildSoapEnvelope, escapeXml, parseSoapBody } from '../soap/xml-utils.js';

function loadEnvelope(config: SoapApiConfig): string {
  if (config.envelope) {
    return config.envelope;
  }
  if (config.inputFile) {
    return readFileSync(resolve(config.inputFile), 'utf8');
  }
  return buildSoapEnvelope('<GetUserRequest><email>unknown@example.com</email></GetUserRequest>');
}

export async function executeSoap(
  config: SoapApiConfig,
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

  let envelope = loadEnvelope(config);

  if (inputFromRow?.email) {
    const safeEmail = escapeXml(String(inputFromRow.email));
    envelope = envelope.replace(/<email>[^<]*<\/email>/i, `<email>${safeEmail}</email>`);
  }

  const url = resolveUrl(config.endpoint, baseUrl);
  assertSafeUrl(url, { blockPrivateNetworks, blockMetadataHosts });
  const headers: Record<string, string> = {
    'Content-Type': 'text/xml; charset=utf-8',
    Accept: 'text/xml',
    ...authHeaders,
    ...config.headers,
  };

  if (config.soapAction) {
    headers.SOAPAction = config.soapAction;
  }

  const response = await fetchWithTimeout(fetchImpl, timeoutMs)(url, {
    method: 'POST',
    headers,
    body: envelope,
  });

  const text = await response.text();
  const responseHeaders = Object.fromEntries(response.headers.entries());
  const data = parseSoapBody(text);

  return {
    status: response.status,
    data,
    headers: responseHeaders,
    raw: text,
  };
}
