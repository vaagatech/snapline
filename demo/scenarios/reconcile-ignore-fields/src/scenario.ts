import { join } from 'node:path';
import { api, testSuite } from '@vaagatech/core';
import { fixturesDir, type ScenarioModule } from '@vaagatech/demo-shared';

const scenario: ScenarioModule = {
  name: 'Reconcile: ignoreFields (nested paths)',
  needsServer: true,
  needsDatabase: false,
  async run({ baseUrl }) {
    const fixtures = fixturesDir(import.meta.url);

    return testSuite('Reconcile: ignoreFields (nested paths)', {
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
