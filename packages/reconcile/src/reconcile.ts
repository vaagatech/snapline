import type { ReconcileOptions, ReconcileResult } from './types.js';
import { applyDataMapping } from './apply-data-mapping.js';
import { applyTransformations } from './apply-transformations.js';
import { compareObjects } from './compare-objects.js';
import { stripFields } from './strip-fields.js';
import { deepClone } from './utils/deep-clone.js';

export function reconcile(
  liveData: unknown,
  expectedData: unknown,
  options: ReconcileOptions = {},
): ReconcileResult {
  const { ignoreFields = [], transformations = {}, dataMapping = {} } = options;

  let processed = deepClone(liveData);
  processed = stripFields(processed, ignoreFields);
  processed = applyTransformations(processed, transformations);
  processed = applyDataMapping(processed, dataMapping);

  // Expected fixtures are pre-normalized; only strip ignored fields for parity.
  let expected = deepClone(expectedData);
  expected = stripFields(expected, ignoreFields);

  const { match, diff } = compareObjects(processed, expected);

  return { match, processed, expected, diff };
}
