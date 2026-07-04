import { join } from 'node:path';
import { api, testSuite } from '@vaagatech/snapline-core';
import { fixturesDir, type ScenarioModule } from '@vaagatech/snapline-demo-shared';

const scenario: ScenarioModule = {
  name: 'Snapline: ignoreFields (nested paths)',
  needsServer: true,
  needsDatabase: false,
  async run({ baseUrl }) {
    const fixtures = fixturesDir(import.meta.url);

    return testSuite('Snapline: ignoreFields (nested paths)', {
      baseUrl,
      api: {
        ...api.rest({
          endpoint: '/api/v1/events/tracked',
          method: 'GET',
        }),
        expectedFile: join(fixtures, 'tracked-expected.json'),
        ignoreFields: ['metadata.trackedAt', 'metadata.requestId'],
      },
    });
  },
};

export default scenario;
