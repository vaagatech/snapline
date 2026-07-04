import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadJsonFile<T = unknown>(filePath: string): T {
  const resolved = resolve(filePath);
  const raw = readFileSync(resolved, 'utf8');
  return JSON.parse(raw) as T;
}
