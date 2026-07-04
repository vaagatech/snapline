import type { CompareResult } from './types.js';
import { diffValues } from './diff-values.js';

export function compareObjects(actual: unknown, expected: unknown): CompareResult {
  const diff = diffValues(actual, expected);
  return { match: diff === null, diff };
}
