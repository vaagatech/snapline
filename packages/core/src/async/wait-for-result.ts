export interface PollOptions {
  timeoutMs?: number;
  intervalMs?: number;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll until `check` returns a non-null value, or throw on timeout.
 */
export async function waitForResult(
  check: () => Promise<unknown | null | undefined>,
  options: PollOptions = {},
): Promise<unknown> {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const intervalMs = options.intervalMs ?? 250;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await check();
    if (result !== null && result !== undefined) {
      return result;
    }
    await sleep(intervalMs);
  }

  throw new Error(`Timed out after ${timeoutMs}ms waiting for async result`);
}
