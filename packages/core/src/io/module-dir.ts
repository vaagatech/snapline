import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

declare const __dirname: string | undefined;

export interface FixturesDirOptions {
  /** Path relative to the scenario module directory. Default: `../fixtures` */
  relativePath?: string;
}

/** Resolve the directory of the current module (CJS or ESM). */
export function moduleDir(metaUrl?: string): string {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }

  if (!metaUrl) {
    throw new Error('moduleDir requires import.meta.url in ESM contexts');
  }

  return dirname(fileURLToPath(metaUrl));
}

/** Resolve the fixtures directory for a scenario module. */
export function fixturesDir(metaUrl: string, options?: FixturesDirOptions): string {
  return join(moduleDir(metaUrl), options?.relativePath ?? '../fixtures');
}
