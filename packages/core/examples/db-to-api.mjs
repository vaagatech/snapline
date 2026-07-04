import { api, db, seedDb, testSuite } from '@vaagatech/reconcile-core';

seedDb('postgresql://localhost:5432/app', [
  { email: 'alice@example.com', status: 'SYNCED', role: 'member' },
]);

await testSuite('Database matches API', {
  baseUrl: 'https://api.example.com',
  dbToApi: {
    db: {
      db: db.postgres('postgresql://localhost:5432/app'),
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
