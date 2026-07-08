/**
 * Publish to queue, worker writes JSON file, poll filesystem for result.
 *
 * Run: node packages/core/examples/publish-and-poll-file.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { messaging } from '@vaagatech/snapline-messaging-adapters';
import { runPublishAndPoll } from '@vaagatech/snapline-core';

const outDir = mkdtempSync(join(tmpdir(), 'snapline-results-'));
mkdirSync(outDir, { recursive: true });

const { publisher, consumer } = messaging.memory();

void (async () => {
  const request = await consumer.waitForMessage('jobs.submit');
  const filePath = join(outDir, `${request.correlationId}.json`);
  writeFileSync(
    filePath,
    JSON.stringify({
      jobId: request.payload.jobId,
      status: 'COMPLETE',
      output: { rows: 128 },
    }),
  );
})();

const result = await runPublishAndPoll({
  publish: {
    publisher,
    topic: 'jobs.submit',
    payload: { jobId: 'JOB-42' },
  },
  poll: {
    file: { directory: outDir },
  },
  expected: {
    jobId: 'JOB-42',
    status: 'COMPLETE',
    output: { rows: 128 },
  },
  pollOptions: { timeoutMs: 5000 },
});

console.log(result.match ? 'PASSED' : 'FAILED');
console.log('Results directory:', outDir);
