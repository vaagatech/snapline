import type { DataMappingMap, FieldMapping } from './types.js';
import { deepClone } from './utils/deep-clone.js';
import { isPlainObject } from './utils/is-plain-object.js';

export function mapFieldValue(value: unknown, mapping: FieldMapping): unknown {
  if (typeof mapping === 'function') {
    return mapping(value);
  }

  if (isPlainObject(mapping)) {
    const key = String(value);
    if (Object.prototype.hasOwnProperty.call(mapping, key)) {
      return mapping[key];
    }
  }

  return value;
}

export function applyDataMapping(
  data: unknown,
  dataMapping: DataMappingMap = {},
): unknown {
  if (!Object.keys(dataMapping).length) {
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
      const mapping = dataMapping[key];
      if (mapping) {
        result[key] = mapFieldValue(child, mapping);
      } else {
        result[key] = walk(child);
      }
    }
    return result;
  }

  return walk(deepClone(data));
}
