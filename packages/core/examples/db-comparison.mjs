import { testSuite, auth, db, seedDb } from '@vaagatech/reconcile-core';

seedDb('postgresql://localhost:5432/src_db', [
  { status: 'ABC', email: 'alice@example.com' },
]);

seedDb('mysql://root@localhost:3306/target_db', [
  { status: 'CBA', email: 'alice@example.com' },
]);

const result = await testSuite('DB Sync Check', {
  dbComparison: {
    sourceDb: db.postgres('postgresql://localhost:5432/src_db'),
    targetDb: db.mysql('mysql://root@localhost:3306/target_db'),
    query: 'SELECT status, email FROM users WHERE email = :email',
    params: { email: 'alice@example.com' },
    dataMapping: {
      status: { ABC: 'CBA' },
    },
  },
});

process.exit(result.passed ? 0 : 1);
