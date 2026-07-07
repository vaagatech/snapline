import { testSuite } from '@vaagatech/snapline-core';

import { createInMemoryDb } from './in-memory-db.mjs';

const sourceDb = createInMemoryDb([{ status: 'ABC', email: 'alice@example.com' }]);
const targetDb = createInMemoryDb([{ status: 'CBA', email: 'alice@example.com' }]);

const result = await testSuite('DB Sync Check', {
  dbComparison: {
    sourceDb,
    targetDb,
    query: 'SELECT status, email FROM users WHERE email = :email',
    params: { email: 'alice@example.com' },
    dataMapping: {
      status: { ABC: 'CBA' },
    },
  },
});

process.exit(result.passed ? 0 : 1);
