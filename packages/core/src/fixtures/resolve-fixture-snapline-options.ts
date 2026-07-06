import type { SnaplineOptions } from '@vaagatech/snapline-engine';
import type { FixtureCaseDefaults, FixtureCaseMeta, FixtureCasePresetMaps } from './types.js';

function resolvePreset<T extends Record<string, unknown> | undefined>(
  value: unknown,
  presets: Record<string, T> | undefined,
): T | undefined {
  if (typeof value === 'string') {
    return presets?.[value];
  }

  if (value && typeof value === 'object') {
    return value as T;
  }

  return undefined;
}

function resolveSnaplineField<T extends Record<string, unknown> | undefined>(
  caseValue: unknown,
  defaultValue: unknown,
  presets: Record<string, T> | undefined,
): T | undefined {
  if (caseValue !== undefined && caseValue !== null) {
    return resolvePreset(caseValue, presets);
  }

  if (defaultValue !== undefined && defaultValue !== null) {
    return resolvePreset(defaultValue, presets);
  }

  return undefined;
}

/** Merge scenario defaults with per-case overrides (case wins when set). */
export function resolveFixtureSnaplineOptions(
  meta: FixtureCaseMeta,
  defaults: FixtureCaseDefaults | undefined,
  presets: FixtureCasePresetMaps,
): SnaplineOptions {
  return {
    ignoreFields: meta.ignoreFields ?? defaults?.ignoreFields,
    transformations: resolveSnaplineField(
      meta.transformations,
      defaults?.transformations,
      presets.transformations,
    ),
    dataMapping: resolveSnaplineField(meta.dataMapping, defaults?.dataMapping, presets.dataMapping),
  };
}
