import type { AsyncResultResolver, MessagePollConfig, PollOptions } from '../types.js';

export function createMessageAsyncResultResolver(config: MessagePollConfig): AsyncResultResolver {
  return {
    async waitForResult(correlationId: string, options?: PollOptions): Promise<unknown> {
      const message = await config.consumer.waitForMessage(config.topic, {
        correlationId,
        timeoutMs: options?.timeoutMs ?? config.timeoutMs,
      });
      return config.extract ? config.extract(message) : message.payload;
    },
  };
}
