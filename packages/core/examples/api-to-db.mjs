import { api, db, seedDb, testSuite } from '@vaagatech/core';

seedDb('postgresql://localhost:5432/app', [
  { email: 'alice@example.com', status: 'SYNCED' },
]);

await testSuite('API matches database', {
  baseUrl: 'https://api.example.com',
  apiToDb: {
    api: api.rest({
      endpoint: '/users/profile?email=alice@example.com',
      method: 'GET',
    }),
    db: {
      db: db.postgres('postgresql://localhost:5432/app'),
      query: 'SELECT email, status FROM users WHERE email = :email',
      params: { email: 'alice@example.com' },
    },
  },
});
