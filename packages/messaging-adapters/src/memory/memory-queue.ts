import { randomUUID } from 'node:crypto';
import type {
  MessageConsumerLike,
  MessagePublishInput,
  MessagePublishResult,
  MessagePublisherLike,
  MessageReceived,
  MessageWaitOptions,
} from '../types.js';

interface QueuedMessage {
  topic: string;
  payload: unknown;
  headers: Record<string, string>;
  correlationId: string;
  messageId: string;
  createdAt: number;
}

const brokers = new Map<string, Map<string, QueuedMessage[]>>();

function brokerFor(queueId: string): Map<string, QueuedMessage[]> {
  let broker = brokers.get(queueId);
  if (!broker) {
    broker = new Map();
    brokers.set(queueId, broker);
  }
  return broker;
}

export class InMemoryMessagePublisher implements MessagePublisherLike {
  constructor(private readonly queueId = 'default') {}

  async publish(topic: string, message: MessagePublishInput): Promise<MessagePublishResult> {
    const correlationId = message.correlationId ?? randomUUID();
    const messageId = randomUUID();
    const headers = { ...(message.headers ?? {}), 'x-correlation-id': correlationId };

    const entry: QueuedMessage = {
      topic,
      payload: message.payload,
      headers,
      correlationId,
      messageId,
      createdAt: Date.now(),
    };

    const topics = brokerFor(this.queueId);
    const queue = topics.get(topic) ?? [];
    queue.push(entry);
    topics.set(topic, queue);

    return { correlationId, messageId, topic };
  }
}

export class InMemoryMessageConsumer implements MessageConsumerLike {
  constructor(private readonly queueId = 'default') {}

  async waitForMessage(topic: string, options: MessageWaitOptions = {}): Promise<MessageReceived> {
    const timeoutMs = options.timeoutMs ?? 30_000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const topics = brokerFor(this.queueId);
      const queue = topics.get(topic) ?? [];
      const index = queue.findIndex((msg) =>
        options.correlationId ? msg.correlationId === options.correlationId : true,
      );

      if (index >= 0) {
        const msg = queue[index]!;
        queue.splice(index, 1);
        return {
          topic: msg.topic,
          payload: msg.payload,
          headers: msg.headers,
          correlationId: msg.correlationId,
          messageId: msg.messageId,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    throw new Error(
      `Timed out after ${timeoutMs}ms waiting for message on topic "${topic}"` +
        (options.correlationId ? ` (correlationId=${options.correlationId})` : ''),
    );
  }
}

/** Reset all in-memory brokers — for tests only. */
export function resetInMemoryBrokers(): void {
  brokers.clear();
}

export function createInMemoryMessaging(queueId = 'default'): {
  publisher: MessagePublisherLike;
  consumer: MessageConsumerLike;
} {
  return {
    publisher: new InMemoryMessagePublisher(queueId),
    consumer: new InMemoryMessageConsumer(queueId),
  };
}
