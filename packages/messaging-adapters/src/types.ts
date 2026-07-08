/** Aligns with MessagePublisherLike in @vaagatech/snapline-core. */
export interface MessagePublishInput {
  payload: unknown;
  headers?: Record<string, string>;
  correlationId?: string;
  key?: string;
}

export interface MessagePublishResult {
  correlationId: string;
  messageId?: string;
  topic: string;
}

export interface MessagePublisherLike {
  publish(topic: string, message: MessagePublishInput): Promise<MessagePublishResult>;
}

export interface MessageReceived {
  topic: string;
  payload: unknown;
  headers: Record<string, string>;
  correlationId?: string;
  messageId?: string;
}

export interface MessageWaitOptions {
  correlationId?: string;
  timeoutMs?: number;
}

export interface MessageConsumerLike {
  waitForMessage(topic: string, options?: MessageWaitOptions): Promise<MessageReceived>;
}

export type MessagingProtocol = 'memory' | 'kafka' | 'custom';

export interface MemoryQueueConfig {
  protocol: 'memory';
  /** Shared queue id when multiple publishers/consumers should use the same broker */
  queueId?: string;
}

export interface KafkaPublisherConfig {
  protocol: 'kafka';
  brokers: string[];
  clientId?: string;
  /** Optional pre-connected KafkaJS producer (for tests or custom TLS) */
  producer?: KafkaProducerLike;
}

export interface KafkaConsumerConfig {
  protocol: 'kafka';
  brokers: string[];
  groupId: string;
  clientId?: string;
  /** Optional pre-connected KafkaJS consumer */
  consumer?: KafkaConsumerLikeInternal;
}

export interface CustomPublisherConfig {
  protocol: 'custom';
  publisher: MessagePublisherLike;
}

export interface CustomConsumerConfig {
  protocol: 'custom';
  consumer: MessageConsumerLike;
}

export type MessagePublisherConfig =
  | MemoryQueueConfig
  | KafkaPublisherConfig
  | CustomPublisherConfig;

export type MessageConsumerConfig =
  | MemoryQueueConfig
  | KafkaConsumerConfig
  | CustomConsumerConfig;

/** Minimal KafkaJS producer surface — inject your own client in tests. */
export interface KafkaProducerLike {
  connect(): Promise<void>;
  send(record: {
    topic: string;
    messages: Array<{
      key?: string;
      value: string;
      headers?: Record<string, string>;
    }>;
  }): Promise<unknown>;
  disconnect(): Promise<void>;
}

/** Minimal KafkaJS consumer surface. */
export interface KafkaConsumerLikeInternal {
  connect(): Promise<void>;
  subscribe(options: { topic: string; fromBeginning?: boolean }): Promise<void>;
  run(handler: {
    eachMessage: (payload: {
      topic: string;
      message: {
        key?: Buffer | null;
        value?: Buffer | null;
        headers?: Record<string, Buffer | string | undefined>;
      };
    }) => Promise<void>;
  }): Promise<void>;
  disconnect(): Promise<void>;
}
