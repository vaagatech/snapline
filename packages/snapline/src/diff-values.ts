import type { DiffResult } from './types.js';
import { isPlainObject } from './utils/is-plain-object.js';
import { stableStringify } from './utils/stable-stringify.js';

export function diffValues(
  actual: unknown,
  expected: unknown,
  pathPrefix = '',
): DiffResult | null {
  if (actual === expected) {
    return null;
  }

  const actualType = Array.isArray(actual) ? 'array' : typeof actual;
  const expectedType = Array.isArray(expected) ? 'array' : typeof expected;

  if (actualType !== expectedType) {
    return {
      path: pathPrefix || '(root)',
      actual,
      expected,
      message: `Type mismatch: ${actualType} !== ${expectedType}`,
    };
  }

  if (!isPlainObject(actual) && !Array.isArray(actual)) {
    return {
      path: pathPrefix || '(root)',
      actual,
      expected,
      message: 'Value mismatch',
    };
  }

  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) {
      return {
        path: pathPrefix || '(root)',
        actual: actual.length,
        expected: expected.length,
        message: 'Array length mismatch',
      };
    }

    for (let i = 0; i < actual.length; i += 1) {
      const childPath = pathPrefix ? `${pathPrefix}[${i}]` : `[${i}]`;
      const childDiff = diffValues(actual[i], expected[i], childPath);
      if (childDiff) {
        return childDiff;
      }
    }
    return null;
  }

  if (!isPlainObject(actual) || !isPlainObject(expected)) {
    return {
      path: pathPrefix || '(root)',
      actual,
      expected,
      message: 'Value mismatch',
    };
  }

  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();

  if (stableStringify(actualKeys) !== stableStringify(expectedKeys)) {
    return {
      path: pathPrefix || '(root)',
      actual: actualKeys,
      expected: expectedKeys,
      message: 'Object key mismatch',
    };
  }

  for (const key of actualKeys) {
    const childPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    const childDiff = diffValues(actual[key], expected[key], childPath);
    if (childDiff) {
      return childDiff;
    }
  }

  return null;
}
