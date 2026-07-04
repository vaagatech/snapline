import { testSuite } from '@vaagatech/snapline-core';
import {
  DEMO_EMAIL,
  statusMappingLookup,
  warehouseCustomerJoinQuery,
  warehouseOrderJoinQuery,
  warehouseOrderStatusMapping,
  type ScenarioModule,
} from '@vaagatech/snapline-demo-shared';

const scenario: ScenarioModule = {
  name: 'DB vs DB (SQLite multi-table warehouse + dataMapping)',
  needsServer: false,
  needsDatabase: true,
  async run({ database }) {
    const { sourceDb, targetDb } = database;

    const customerResult = await testSuite('DB vs DB: customer domain (profiles + subscriptions)', {
      dbComparison: {
        sourceDb,
        targetDb,
        query: warehouseCustomerJoinQuery,
        params: { email: DEMO_EMAIL },
        dataMapping: statusMappingLookup,
      },
    });

    const ordersResult = await testSuite('DB vs DB: orders (fulfillment status codes)', {
      dbComparison: {
        sourceDb,
        targetDb,
        query: warehouseOrderJoinQuery,
        params: { email: DEMO_EMAIL },
        dataMapping: warehouseOrderStatusMapping,
      },
    });

    return {
      name: 'DB vs DB (SQLite multi-table warehouse + dataMapping)',
      passed: customerResult.passed && ordersResult.passed,
      results: [...customerResult.results, ...ordersResult.results],
    };
  },
};

export default scenario;
