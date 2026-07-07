import { snapline } from '@vaagatech/snapline-engine';
import type { CrossSystemResult, DbComparisonConfig } from '../types.js';
import { fetchSourceRow, fetchTargetRow } from './fetch-store-data.js';

export async function runDbComparison(
  dbComparison: DbComparisonConfig,
): Promise<CrossSystemResult> {
  const {
    dataMapping = {},
    ignoreFields = [],
    transformations = {},
  } = dbComparison;

  const sourceData = await fetchSourceRow(dbComparison);
  const targetData = await fetchTargetRow(dbComparison, sourceData);

  const result = snapline(sourceData, targetData, {
    ignoreFields,
    transformations,
    dataMapping,
  });

  return {
    match: result.match,
    source: result.processed,
    target: result.expected,
    diff: result.diff,
  };
}
