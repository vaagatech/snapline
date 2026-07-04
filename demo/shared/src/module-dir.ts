import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

declare const __dirname: string | undefined;

export function moduleDir(metaUrl?: string): string {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }

  if (!metaUrl) {
    throw new Error('moduleDir requires import.meta.url in ESM contexts');
  }

  return dirname(fileURLToPath(metaUrl));
}

export function fixturesDir(metaUrl: string): string {
  return `${moduleDir(metaUrl)}/../fixtures`;
}
