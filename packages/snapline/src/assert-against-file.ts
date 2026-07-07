import type { SnaplineOptions, SnaplineResult } from './types.js';
import { loadJsonFile } from './io/load-json-file.js';
import { snapline } from './snapline.js';

export function assertAgainstFile(
  liveData: unknown,
  expectedFilePath: string,
  options: SnaplineOptions = {},
): SnaplineResult {
  const expectedData = loadJsonFile(expectedFilePath);
  return snapline(liveData, expectedData, options);
}
