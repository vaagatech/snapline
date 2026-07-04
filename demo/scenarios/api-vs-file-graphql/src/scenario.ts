import { join } from 'node:path';
import { api, testSuite } from '@vaagatech/core';
import { dateTransform, fixturesDir, type ScenarioModule } from '@vaagatech/demo-shared';

const scenario: ScenarioModule = {
  name: '5. API vs file (GraphQL)',
  needsServer: true,
  needsDatabase: false,
  async run({ baseUrl }) {
    const fixtures = fixturesDir(import.meta.url);

    return testSuite('5. API vs file (GraphQL)', {
      baseUrl,
      api: {
        ...api.graphql({
          endpoint: '/graphql',
          queryFile: join(fixtures, 'graphql-query.graphql'),
          variablesFile: join(fixtures, 'graphql-variables.json'),
          dataPath: 'user',
        }),
        expectedFile: join(fixtures, 'graphql-expected.json'),
        transformations: dateTransform,
      },
    });
  },
};

export default scenario;
