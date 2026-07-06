import type { DbRow } from '../types.js';

export function resolveTargetParamsFromSource(
  sourceRow: DbRow,
  options: {
    targetParams?: Record<string, unknown>;
    linkKeys?: Record<string, string>;
    targetParamsFromSource?: (sourceRow: DbRow) => Record<string, unknown>;
    fallbackParams?: Record<string, unknown>;
  },
): Record<string, unknown> {
  if (options.targetParamsFromSource) {
    return options.targetParamsFromSource(sourceRow);
  }

  if (options.targetParams) {
    return options.targetParams;
  }

  if (options.linkKeys) {
    const linked: Record<string, unknown> = {};
    for (const [paramName, sourceField] of Object.entries(options.linkKeys)) {
      linked[paramName] = sourceRow[sourceField];
    }
    return linked;
  }

  return options.fallbackParams ?? {};
}

export function resolveTargetFilterFromSource(
  sourceRow: DbRow,
  options: {
    targetFilter?: Record<string, unknown>;
    linkKeys?: Record<string, string>;
    targetFilterFromSource?: (sourceRow: DbRow) => Record<string, unknown>;
    fallbackFilter?: Record<string, unknown>;
  },
): Record<string, unknown> {
  if (options.targetFilterFromSource) {
    return options.targetFilterFromSource(sourceRow);
  }

  if (options.targetFilter) {
    return options.targetFilter;
  }

  if (options.linkKeys) {
    const linked: Record<string, unknown> = {};
    for (const [filterField, sourceField] of Object.entries(options.linkKeys)) {
      linked[filterField] = sourceRow[sourceField];
    }
    return linked;
  }

  return options.fallbackFilter ?? {};
}
