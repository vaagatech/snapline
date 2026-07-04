import { join } from 'node:path';
import { createMockServer } from './mock-server.js';
import { runAllDemos } from './run-all-demos.js';
import { moduleDir } from './utils/module-dir.js';

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  @vaagatech/reconcile — Full Integration Demo');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Modes: API↔file · DB↔DB · API↔DB · DB↔API · REST · SOAP · GraphQL');
  console.log('  Built by VaagaTech — https://www.vaagatech.com');
  console.log('═══════════════════════════════════════════════════════');

  const { server, baseUrl } = await createMockServer();
  console.log(`\nMock API listening at ${baseUrl}`);

  const fixturesDir = join(moduleDir(import.meta.url), 'fixtures');

  try {
    const { passed, failed } = await runAllDemos(baseUrl, fixturesDir);

    console.log('───────────────────────────────────────────────────────');
    console.log(`  Summary: ${passed} passed, ${failed} failed`);
    console.log('───────────────────────────────────────────────────────');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    server.close();
  }
}

main().catch((err: unknown) => {
  console.error('Demo failed:', err);
  process.exitCode = 1;
});
