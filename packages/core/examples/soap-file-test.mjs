import { api, testSuite } from '@vaagatech/core';

await testSuite('SOAP snapshot', {
  baseUrl: 'https://api.example.com',
  api: {
    ...api.soap({
      endpoint: '/soap/user',
      soapAction: 'GetUser',
      inputFile: './fixtures/get-user.xml',
    }),
    expectedFile: './fixtures/user-expected.json',
  },
});
