import type { ReconcileOptions, ReconcileResult } from './types.js';
import { loadJsonFile } from './io/load-json-file.js';
import { reconcile } from './reconcile.js';

export function assertAgainstFile(
  liveData: unknown,
  expectedFilePath: string,
  options: ReconcileOptions = {},
): ReconcileResult {
  const expectedData = loadJsonFile(expectedFilePath);
  return reconcile(liveData, expectedData, options);
}
