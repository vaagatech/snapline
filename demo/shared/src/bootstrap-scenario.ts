import { auth, writeTestReport } from '@vaagatech/snapline-core';
import { createMockServer } from './mock-server.js';
import { resolveReportConfig } from './report-config.js';
import { closeDemoDatabase, createDemoDatabase } from './sqlite-setup.js';
import type { ScenarioModule } from './types.js';

export function createDemoAuth(baseUrl: string) {
  return auth.oauth2({
    tokenUrl: `${baseUrl}/oauth/token`,
    clientId: process.env.CLIENT_ID ?? 'demo-client',
    clientSecret: process.env.CLIENT_SECRET ?? 'demo-secret',
  });
}

export async function bootstrapScenario(scenario: ScenarioModule): Promise<number> {
  const reportConfig = resolveReportConfig();
  const startedAt = Date.now();

  let serverHandle: Awaited<ReturnType<typeof createMockServer>> | undefined;
  let database: ReturnType<typeof createDemoDatabase> | undefined;

  try {
    if (scenario.needsServer) {
      serverHandle = await createMockServer();
      console.log(`Mock API + GraphQL server listening at ${serverHandle.baseUrl}`);
    }

    if (scenario.needsDatabase) {
      database = createDemoDatabase();
    }

    const result = await scenario.run({
      baseUrl: serverHandle?.baseUrl ?? 'http://127.0.0.1:0',
      database: database ?? createDemoDatabase(),
    });

    const durationMs = Date.now() - startedAt;

    if (reportConfig) {
      const reportPath = writeTestReport([result], reportConfig, {
        durationMs,
        environment: {
          scenario: scenario.name,
          reportFormat: reportConfig.format,
        },
      });
      console.log(`Report written to ${reportPath}`);
    }

    return result.passed ? 0 : 1;
  } finally {
    if (database) {
      closeDemoDatabase(database);
    }
    serverHandle?.server.close();
  }
}
