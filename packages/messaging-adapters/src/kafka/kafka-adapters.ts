import { randomUUID } from 'node:crypto';
import type {
  KafkaConsumerConfig,
  KafkaConsumerLikeInternal,
  KafkaProducerLike,
  KafkaPublisherConfig,
  MessageConsumerLike,
  MessagePublishInput,
  MessagePublishResult,
  MessagePublisherLike,
  MessageReceived,
  MessageWaitOptions,
} from '../types.js';

type KafkaModule = {
  Kafka: new (config: { clientId?: string; brokers: string[] }) => {
    producer(): KafkaProducerLike;
    consumer(config: { groupId: string }): KafkaConsumerLikeInternal;
  };
};

async function loadKafka(): Promise<KafkaModule> {
  try {
    return (await import('kafkajs')) as KafkaModule;
  } catch {
    throw new Error(
      'Kafka support requires the optional peer dependency "kafkajs". Install it with: npm install kafkajs',
    );
  }
}

function normalizeHeaders(
  headers?: Record<string, Buffer | string | undefined>,
): Record<string, string> {
  if (!headers) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    out[key] = Buffer.isBuffer(value) ? value.toString('utf8') : value;
  }
  return out;
}

export class KafkaMessagePublisher implements MessagePublisherLike {
  private producer: KafkaProducerLike | null = null;
  private ownsProducer = false;

  constructor(private readonly config: KafkaPublisherConfig) {}

  private async getProducer(): Promise<KafkaProducerLike> {
    if (this.config.producer) {
      return this.config.producer;
    }
    if (!this.producer) {
      const { Kafka } = await loadKafka();
      const kafka = new Kafka({
        clientId: this.config.clientId ?? 'snapline-publisher',
        brokers: this.config.brokers,
      });
      this.producer = kafka.producer();
      this.ownsProducer = true;
      await this.producer.connect();
    }
    return this.producer;
  }

  async publish(topic: string, message: MessagePublishInput): Promise<MessagePublishResult> {
    const correlationId = message.correlationId ?? randomUUID();
    const producer = await this.getProducer();
    const headers: Record<string, string> = {
      ...(message.headers ?? {}),
      'x-correlation-id': correlationId,
    };

    await producer.send({
      topic,
      messages: [
        {
          key: message.key ?? correlationId,
          value: JSON.stringify(message.payload),
          headers,
        },
      ],
    });

    return { correlationId, topic };
  }

  async disconnect(): Promise<void> {
    if (this.ownsProducer && this.producer) {
      await this.producer.disconnect();
      this.producer = null;
    }
  }
}

export class KafkaMessageConsumer implements MessageConsumerLike {
  private consumer: KafkaConsumerLikeInternal | null = null;
  private ownsConsumer = false;

  constructor(private readonly config: KafkaConsumerConfig) {}

  private async getConsumer(): Promise<KafkaConsumerLikeInternal> {
    if (this.config.consumer) {
      return this.config.consumer;
    }
    if (!this.consumer) {
      const { Kafka } = await loadKafka();
      const kafka = new Kafka({
        clientId: this.config.clientId ?? 'snapline-consumer',
        brokers: this.config.brokers,
      });
      this.consumer = kafka.consumer({ groupId: this.config.groupId });
      this.ownsConsumer = true;
      await this.consumer.connect();
    }
    return this.consumer;
  }

  async waitForMessage(topic: string, options: MessageWaitOptions = {}): Promise<MessageReceived> {
    const timeoutMs = options.timeoutMs ?? 30_000;
    const consumer = await this.getConsumer();
    await consumer.subscribe({ topic, fromBeginning: false });

    return new Promise<MessageReceived>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Timed out after ${timeoutMs}ms waiting for Kafka message on "${topic}"` +
              (options.correlationId ? ` (correlationId=${options.correlationId})` : ''),
          ),
        );
      }, timeoutMs);

      void consumer
        .run({
          eachMessage: async ({ topic: msgTopic, message }) => {
            const headers = normalizeHeaders(message.headers);
            const correlationId =
              headers['x-correlation-id'] ?? (message.key ? message.key.toString('utf8') : undefined);

            if (options.correlationId && correlationId !== options.correlationId) {
              return;
            }

            clearTimeout(timer);
            let payload: unknown = null;
            if (message.value) {
              const raw = message.value.toString('utf8');
              try {
                payload = JSON.parse(raw) as unknown;
              } catch {
                payload = raw;
              }
            }

            resolve({
              topic: msgTopic,
              payload,
              headers,
              correlationId,
            });
          },
        })
        .catch(reject);
    });
  }

  async disconnect(): Promise<void> {
    if (this.ownsConsumer && this.consumer) {
      await this.consumer.disconnect();
      this.consumer = null;
    }
  }
}

export function createKafkaPublisher(config: Omit<KafkaPublisherConfig, 'protocol'>): KafkaMessagePublisher {
  return new KafkaMessagePublisher({ protocol: 'kafka', ...config });
}

export function createKafkaConsumer(config: Omit<KafkaConsumerConfig, 'protocol'>): KafkaMessageConsumer {
  return new KafkaMessageConsumer({ protocol: 'kafka', ...config });
}
