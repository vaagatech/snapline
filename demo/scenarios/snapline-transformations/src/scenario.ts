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
} from '@vaagatech/snapline-demo-shared';

const scenario: ScenarioModule = {
  name: 'Snapline: transformations (fixture cases: pass + expected failures)',
  needsServer: false,
  needsDatabase: false,
  async run() {
    return runReconcileFixtureCases({
      suiteName: 'Snapline: transformations (fixture cases: pass + expected failures)',
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
