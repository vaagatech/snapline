import { api, testSuite } from '@vaagatech/snapline-core';

import { createInMemoryDb } from './in-memory-db.mjs';

const appDb = createInMemoryDb([{ email: 'alice@example.com', status: 'SYNCED' }]);

await testSuite('API matches database', {
  baseUrl: 'https://api.example.com',
  apiToDb: {
    api: api.rest({
      endpoint: '/users/profile?email=alice@example.com',
      method: 'GET',
    }),
    db: {
      db: appDb,
      query: 'SELECT email, status FROM users WHERE email = :email',
      params: { email: 'alice@example.com' },
    },
  },
});
