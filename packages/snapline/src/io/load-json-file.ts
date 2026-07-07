import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertWithinRoot } from './safe-path.js';

export interface LoadJsonFileOptions {
  /** When set, resolved path must stay within this directory. */
  rootDir?: string;
}

export function loadJsonFile<T = unknown>(filePath: string, options: LoadJsonFileOptions = {}): T {
  const resolved = options.rootDir
    ? assertWithinRoot(options.rootDir, resolve(options.rootDir, filePath))
    : resolve(filePath);

  let raw: string;
  try {
    raw = readFileSync(resolved, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read JSON file ${resolved}: ${message}`);
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in ${resolved}: ${message}`);
  }
}
