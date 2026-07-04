import { join } from 'node:path';
import { testSuite } from '@vaagatech/core';
import {
  createDemoAuth,
  dateTransform,
  fixturesDir,
  type ScenarioModule,
} from '@vaagatech/demo-shared';

const scenario: ScenarioModule = {
  name: '1. API vs file (REST)',
  needsServer: true,
  needsDatabase: false,
  async run({ baseUrl }) {
    const fixtures = fixturesDir(import.meta.url);

    return testSuite('1. API vs file (REST)', {
      auth: createDemoAuth(baseUrl),
      baseUrl,
      api: {
        endpoint: '/api/v1/user/sync',
        method: 'POST',
        inputFile: join(fixtures, 'rest-input.json'),
        expectedFile: join(fixtures, 'rest-expected.json'),
        ignoreFields: ['pincode'],
        transformations: dateTransform,
      },
    });
  },
};

export default scenario;
