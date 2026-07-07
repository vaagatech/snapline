import type { FetchImpl } from './types.js';

const DEFAULT_TIMEOUT_MS = 30_000;

export function fetchWithTimeout(
  fetchImpl: FetchImpl,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): FetchImpl {
  return (input, init) => {
    const signal =
      init?.signal ??
      (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
        ? AbortSignal.timeout(timeoutMs)
        : undefined);

    return fetchImpl(input, signal ? { ...init, signal } : init);
  };
}

export { DEFAULT_TIMEOUT_MS };
