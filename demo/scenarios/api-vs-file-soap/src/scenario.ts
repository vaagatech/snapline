import { join } from 'node:path';
import { api, testSuite } from '@vaagatech/core';
import { fixturesDir, type ScenarioModule } from '@vaagatech/demo-shared';

const scenario: ScenarioModule = {
  name: 'API vs file (SOAP)',
  needsServer: true,
  needsDatabase: false,
  async run({ baseUrl }) {
    const fixtures = fixturesDir(import.meta.url);

    return testSuite('8. API vs file (SOAP)', {
      baseUrl,
      api: {
        ...api.soap({
          endpoint: '/soap/user',
          soapAction: 'GetUser',
          inputFile: join(fixtures, 'soap-request.xml'),
        }),
        expectedFile: join(fixtures, 'soap-expected.json'),
      },
    });
  },
};

export default scenario;
