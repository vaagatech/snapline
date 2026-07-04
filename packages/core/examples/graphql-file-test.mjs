import { api, testSuite } from '@vaagatech/snapline-core';

await testSuite('GraphQL snapshot', {
  baseUrl: 'https://api.example.com',
  api: {
    ...api.graphql({
      endpoint: '/graphql',
      query: 'query($email: String!) { user(email: $email) { email status } }',
      variables: { email: 'alice@example.com' },
      dataPath: 'user',
    }),
    expectedFile: './fixtures/user-expected.json',
  },
});
