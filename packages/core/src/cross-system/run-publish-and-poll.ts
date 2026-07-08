import { randomUUID } from 'node:crypto';
import { assertAgainstFile, snapline } from '@vaagatech/snapline-engine';
import { createDbAsyncResultResolver, createFileAsyncResultResolver } from '../async/create-resolvers.js';
import { createMessageAsyncResultResolver } from '../async/message-async-resolver.js';
import type { AsyncResultResolver, CrossSystemResult, PublishAndPollConfig } from '../types.js';

function resolvePollTarget(config: PublishAndPollConfig): AsyncResultResolver {
  if ('resolver' in config.poll) {
    return config.poll.resolver;
  }
  if ('db' in config.poll) {
    return createDbAsyncResultResolver(config.poll.db);
  }
  if ('file' in config.poll) {
    return createFileAsyncResultResolver(config.poll.file);
  }
  return createMessageAsyncResultResolver(config.poll.message);
}

export async function runPublishAndPoll(config: PublishAndPollConfig): Promise<CrossSystemResult> {
  const {
    publish,
    pollOptions,
    expectedFile,
    expected,
    ignoreFields = [],
    transformations = {},
    dataMapping = {},
  } = config;

  const correlationId = publish.correlationId ?? randomUUID();
  await publish.publisher.publish(publish.topic, {
    payload: publish.payload,
    headers: publish.headers,
    correlationId,
    key: publish.key,
  });

  const resolver = resolvePollTarget(config);
  const actual = await resolver.waitForResult(correlationId, pollOptions);

  if (expectedFile) {
    const assertion = assertAgainstFile(actual, expectedFile, {
      ignoreFields,
      transformations,
      dataMapping,
    });
    return {
      match: assertion.match,
      source: assertion.processed,
      target: assertion.expected,
      diff: assertion.diff,
    };
  }

  const result = snapline(actual, expected ?? null, {
    ignoreFields,
    transformations,
    dataMapping,
  });

  return {
    match: result.match,
    source: result.processed,
    target: result.expected,
    diff: result.diff,
  };
}
