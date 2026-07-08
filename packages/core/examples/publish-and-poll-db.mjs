/**
 * Publish to an in-memory queue, simulate async DB write, poll SQL for the result.
 *
 * Run: node packages/core/examples/publish-and-poll-db.mjs
 */
import { messaging } from '@vaagatech/snapline-messaging-adapters';
import { runPublishAndPoll } from '@vaagatech/snapline-core';
import { createInMemoryDb } from './in-memory-db.mjs';

const { publisher, consumer } = messaging.memory({ queueId: 'demo' });

const rows = [];
const db = createInMemoryDb(rows);

// Simulate downstream worker: consume request, write result row
void (async () => {
  const request = await consumer.waitForMessage('orders.request');
  const payload = request.payload;
  rows.push({
    correlationId: request.correlationId,
    orderId: payload.orderId,
    status: 'PROCESSED',
    total: payload.total,
  });
})();

const result = await runPublishAndPoll({
  publish: {
    publisher,
    topic: 'orders.request',
    payload: { orderId: 'ORD-100', total: 42.5 },
  },
  poll: {
    db: {
      db,
      query: 'SELECT orderId, status, total FROM results WHERE correlationId = :correlationId',
      until: (polled) => polled.some((r) => r.status === 'PROCESSED'),
    },
  },
  expected: { orderId: 'ORD-100', status: 'PROCESSED', total: 42.5 },
  pollOptions: { timeoutMs: 5000 },
});

console.log(result.match ? 'PASSED' : 'FAILED');
