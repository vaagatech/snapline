# @vaagatech/snapline-messaging-adapters

Messaging queue adapters for Snapline — publish to Kafka, in-memory queues, or custom brokers, then poll async results via `publishAndPoll` in core.

## Install

```bash
npm install @vaagatech/snapline-messaging-adapters
# Optional Kafka peer:
npm install kafkajs
```

## Quick start

```javascript
import { messaging } from '@vaagatech/snapline-messaging-adapters';
import { runPublishAndPoll } from '@vaagatech/snapline-core';

const { publisher } = messaging.memory();

await runPublishAndPoll({
  publish: {
    publisher,
    topic: 'orders.request',
    payload: { orderId: 'ORD-100' },
  },
  poll: {
    db: {
      db: myPostgresClient,
      query: 'SELECT * FROM orders WHERE correlationId = :correlationId',
      until: (rows) => rows.some((r) => r.status === 'PROCESSED'),
    },
  },
  expected: { orderId: 'ORD-100', status: 'PROCESSED' },
});
```

## Adapters

| Factory | Use case |
|---------|----------|
| `messaging.memory()` | Tests and local dev |
| `messaging.kafkaPublisher({ brokers })` | Kafka produce (requires `kafkajs`) |
| `messaging.kafkaConsumer({ brokers, groupId })` | Kafka consume by correlation id |
| `messaging.customPublisher(publisher)` | SQS, RabbitMQ, or your MX bus |

See [Snapline docs — Queue → poll](https://vaagatech.github.io/snapline/guide.html) for filesystem polling and `testSuite` integration.
