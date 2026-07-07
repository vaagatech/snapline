import { api, testSuite } from '@vaagatech/snapline-core';

import { createInMemoryDb } from './in-memory-db.mjs';

const appDb = createInMemoryDb([
  { email: 'alice@example.com', status: 'SYNCED', role: 'member' },
]);

await testSuite('Database matches API', {
  baseUrl: 'https://api.example.com',
  dbToApi: {
    db: {
      db: appDb,
      query: 'SELECT email, status, role FROM users WHERE email = :email',
      params: { email: 'alice@example.com' },
    },
    api: api.rest({
      endpoint: '/users/profile',
      method: 'GET',
    }),
    inputFromDb: true,
  },
});
