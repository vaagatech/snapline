import { reconcile } from '@vaagatech/reconcile';
import type { CrossSystemResult, DbComparisonConfig } from '../types.js';

export async function runDbComparison(
  dbComparison: DbComparisonConfig,
): Promise<CrossSystemResult> {
  const {
    sourceDb,
    targetDb,
    query,
    params = {},
    dataMapping = {},
    ignoreFields = [],
    transformations = {},
  } = dbComparison;

  const sourceRows = await sourceDb.query(query, params);
  const targetRows = await targetDb.query(query, params);

  const sourceData = sourceRows[0] ?? null;
  const targetData = targetRows[0] ?? null;

  const result = reconcile(sourceData, targetData, {
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
