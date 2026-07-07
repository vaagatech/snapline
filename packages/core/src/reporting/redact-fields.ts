import { deepClone } from '@vaagatech/snapline-engine';
import type { TestStepResult, TestSuiteResult } from '../types.js';

const REDACTED = '[REDACTED]';

function setNested(target: Record<string, unknown>, fieldPath: string, value: unknown): void {
  const parts = fieldPath.split('.');
  let cursor: Record<string, unknown> = target;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (!part) return;
    const next = cursor[part];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      return;
    }
    cursor = next as Record<string, unknown>;
  }

  const lastKey = parts[parts.length - 1];
  if (lastKey) {
    cursor[lastKey] = value;
  }
}

export function redactFields(data: unknown, fields: string[] = []): unknown {
  if (!fields.length || data === null || data === undefined) {
    return data;
  }

  const cloned = deepClone(data);
  if (typeof cloned !== 'object' || cloned === null) {
    return cloned;
  }

  const topLevelKeys = new Set(fields.filter((field) => !field.includes('.')));
  const nestedPaths = fields.filter((field) => field.includes('.'));

  if (Array.isArray(cloned)) {
    return cloned.map((item) => redactFields(item, fields));
  }

  const record = cloned as Record<string, unknown>;
  for (const key of topLevelKeys) {
    if (key in record) {
      record[key] = REDACTED;
    }
  }

  for (const path of nestedPaths) {
    setNested(record, path, REDACTED);
  }

  return record;
}

export function redactSuiteResults(
  suites: TestSuiteResult[],
  fields: string[] = [],
): TestSuiteResult[] {
  if (!fields.length) {
    return suites;
  }

  return suites.map((suite) => ({
    ...suite,
    results: suite.results.map((step) => redactFields(step, fields) as TestStepResult),
  }));
}
