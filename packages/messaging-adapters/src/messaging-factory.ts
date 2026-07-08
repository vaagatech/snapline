import type {
  CustomConsumerConfig,
  CustomPublisherConfig,
  KafkaConsumerConfig,
  KafkaPublisherConfig,
  MemoryQueueConfig,
  MessageConsumerConfig,
  MessageConsumerLike,
  MessagePublisherConfig,
  MessagePublisherLike,
} from './types.js';
import { createInMemoryMessaging } from './memory/memory-queue.js';
import { createKafkaConsumer, createKafkaPublisher } from './kafka/kafka-adapters.js';

export const messaging = {
  memory(config: Omit<MemoryQueueConfig, 'protocol'> = {}): {
    publisher: MessagePublisherLike;
    consumer: MessageConsumerLike;
  } {
    return createInMemoryMessaging(config.queueId);
  },

  kafkaPublisher(config: Omit<KafkaPublisherConfig, 'protocol'>): MessagePublisherLike {
    return createKafkaPublisher(config);
  },

  kafkaConsumer(config: Omit<KafkaConsumerConfig, 'protocol'>): MessageConsumerLike {
    return createKafkaConsumer(config);
  },

  customPublisher(publisher: MessagePublisherLike): MessagePublisherLike {
    return publisher;
  },

  customConsumer(consumer: MessageConsumerLike): MessageConsumerLike {
    return consumer;
  },
};

export function createMessagePublisher(config: MessagePublisherConfig): MessagePublisherLike {
  if (config.protocol === 'memory') {
    return createInMemoryMessaging(config.queueId).publisher;
  }
  if (config.protocol === 'kafka') {
    return createKafkaPublisher(config);
  }
  return config.publisher;
}

export function createMessageConsumer(config: MessageConsumerConfig): MessageConsumerLike {
  if (config.protocol === 'memory') {
    return createInMemoryMessaging(config.queueId).consumer;
  }
  if (config.protocol === 'kafka') {
    return createKafkaConsumer(config);
  }
  return config.consumer;
}
