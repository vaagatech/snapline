import {
  createDemoAuth,
  dateFieldTransforms,
  fixturesDir,
  graphqlAccountTransforms,
  graphqlPlanMapping,
  graphqlSnapshotTransforms,
  graphqlStatusMapping,
  roleTierOnlyTransforms,
  runApiFixtureCases,
  type ScenarioModule,
} from '@vaagatech/reconcile-demo-shared';

const scenario: ScenarioModule = {
  name: 'API vs file (GraphQL + OAuth2 fixture cases: pass + expected failures)',
  needsServer: true,
  needsDatabase: false,
  async run({ baseUrl }) {
    return runApiFixtureCases({
      suiteName: 'API vs file (GraphQL + OAuth2 fixture cases: pass + expected failures)',
      fixturesRoot: fixturesDir(import.meta.url),
      baseUrl,
      auth: createDemoAuth(baseUrl),
      defaults: {
        endpoint: '/graphql',
        protocol: 'graphql',
      },
      presets: {
        transformations: {
          graphqlAccount: graphqlAccountTransforms,
          graphqlSnapshot: graphqlSnapshotTransforms,
          roleTierOnly: roleTierOnlyTransforms,
          datesOnly: dateFieldTransforms,
        },
        dataMapping: {
          graphqlAccount: {
            ...graphqlStatusMapping,
            ...graphqlPlanMapping,
          },
          planOnly: graphqlPlanMapping,
          statusOnly: graphqlStatusMapping,
        },
      },
    });
  },
};

export default scenario;
