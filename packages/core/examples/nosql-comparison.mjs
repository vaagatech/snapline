import { nosql, testSuite } from '@vaagatech/snapline-core';

const sourceStore = nosql.memory();
const targetStore = nosql.memory();

nosql.seed(sourceStore, 'customers', [
  {
    customerId: 'cust_1',
    email: 'alice@example.com',
    status: 'ACTIVE',
    tier: 'gold',
    profile: { role: 'admin', department: 'engineering' },
  },
]);

nosql.seed(targetStore, 'customer_snapshots', [
  {
    customerId: 'cust_1',
    email: 'alice@example.com',
    status: 'ACTIVE',
    tier: 'gold',
    profile: { role: 'admin', department: 'engineering' },
  },
]);

const result = await testSuite('NoSQL document sync', {
  dbComparison: {
    sourceDb: sourceStore,
    targetDb: targetStore,
    sourceCollection: 'customers',
    targetCollection: 'customer_snapshots',
    sourceFilter: { email: 'alice@example.com' },
    linkKeys: { customerId: 'customerId' },
  },
});

process.exit(result.passed ? 0 : 1);
