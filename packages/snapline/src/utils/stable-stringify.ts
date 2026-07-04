import { isPlainObject } from './is-plain-object.js';

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (isPlainObject(value)) {
    return JSON.stringify(value, Object.keys(value).sort());
  }

  return JSON.stringify(value);
}
