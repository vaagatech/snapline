declare module 'kafkajs' {
  export class Kafka {
    constructor(config: { clientId?: string; brokers: string[] });
    producer(): import('../types.js').KafkaProducerLike;
    consumer(config: { groupId: string }): import('../types.js').KafkaConsumerLikeInternal;
  }
}
