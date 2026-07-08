import { randomUUID } from 'node:crypto';
import type { MessagePublishInput, MessagePublisherLike } from './types.js';

export async function publishMessage(
  publisher: MessagePublisherLike,
  topic: string,
  message: MessagePublishInput,
): Promise<{ correlationId: string; messageId?: string; topic: string }> {
  const correlationId = message.correlationId ?? randomUUID();
  return publisher.publish(topic, { ...message, correlationId });
}
