import { api, executeApi } from '@vaagatech/reconcile-api-adapters';

const result = await executeApi(
  api.rest({
    endpoint: 'https://jsonplaceholder.typicode.com/users/1',
    method: 'GET',
  }),
);

console.log('REST status:', result.status);
console.log('REST data:', result.data);
