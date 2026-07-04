import { api, executeApi } from '@vaagatech/snapline-api-adapters';

const result = await executeApi(
  api.rest({
    endpoint: 'https://jsonplaceholder.typicode.com/users/1',
    method: 'GET',
  }),
);

console.log('REST status:', result.status);
console.log('REST data:', result.data);
