import { deepClone } from './utils/deep-clone.js';
import { isPlainObject } from './utils/is-plain-object.js';

function removeNested(target: unknown, fieldPath: string): void {
  const parts = fieldPath.split('.');
  let cursor: Record<string, unknown> | unknown[] | null = isPlainObject(target)
    ? target
    : null;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (!part || !isPlainObject(cursor) || !(part in cursor)) {
      return;
    }
    cursor = cursor[part] as Record<string, unknown> | unknown[];
  }

  const lastKey = parts[parts.length - 1];
  if (!lastKey || cursor === null) {
    return;
  }

  if (isPlainObject(cursor)) {
    delete cursor[lastKey];
  }
}

export function stripFields(data: unknown, ignoreFields: string[] = []): unknown {
  if (!ignoreFields.length) {
    return data;
  }

  const topLevelKeys = new Set(
    ignoreFields.filter((field) => !field.includes('.')).map(String),
  );
  const nestedPaths = ignoreFields
    .filter((field) => field.includes('.'))
    .map(String);

  function walk(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(walk);
    }

    if (!isPlainObject(value)) {
      return value;
    }

    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (topLevelKeys.has(key)) {
        continue;
      }
      result[key] = walk(child);
    }

    for (const fieldPath of nestedPaths) {
      removeNested(result, fieldPath);
    }

    return result;
  }

  return walk(deepClone(data));
}
