import { api, executeApi } from '@vaagatech/snapline-api-adapters';

const result = await executeApi(
  api.graphql({
    endpoint: 'https://countries.trevorblades.com/graphql',
    query: 'query { country(code: "US") { name capital } }',
    dataPath: 'country',
  }),
);

console.log('GraphQL data:', result.data);
