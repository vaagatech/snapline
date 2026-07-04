import {
  apiStatusMapping,
  dateFieldTransforms,
  enrichmentTransforms,
  fixturesDir,
  roleTierOnlyTransforms,
  runReconcileFixtureCases,
  statusMappingFunction,
  warehousePlanMapping,
  type ScenarioModule,
} from '@vaagatech/reconcile-demo-shared';

const scenario: ScenarioModule = {
  name: 'Reconcile: transformations (fixture cases: pass + expected failures)',
  needsServer: false,
  needsDatabase: false,
  async run() {
    return runReconcileFixtureCases({
      suiteName: 'Reconcile: transformations (fixture cases: pass + expected failures)',
      fixturesRoot: fixturesDir(import.meta.url),
      presets: {
        transformations: {
          enrichment: enrichmentTransforms,
          roleTierOnly: roleTierOnlyTransforms,
          datesOnly: dateFieldTransforms,
        },
      },
    });
  },
};

export default scenario;
