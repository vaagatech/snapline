import type { TransformationMap } from './types.js';
import { deepClone } from './utils/deep-clone.js';
import { isPlainObject } from './utils/is-plain-object.js';

export function applyTransformations(
  data: unknown,
  transformations: TransformationMap = {},
): unknown {
  if (!Object.keys(transformations).length) {
    return data;
  }

  function walk(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(walk);
    }

    if (!isPlainObject(value)) {
      return value;
    }

    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      const transform = transformations[key];
      if (transform) {
        result[key] = transform(child, key, value);
      } else {
        result[key] = walk(child);
      }
    }
    return result;
  }

  return walk(deepClone(data));
}
