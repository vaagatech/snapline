import { resolveReportConfig, writeTestReport } from '@vaagatech/snapline-core';
import snaplineIgnoreFields from '@vaagatech/snapline-demo-scenario-snapline-ignore-fields';
import snaplineTransformations from '@vaagatech/snapline-demo-scenario-snapline-transformations';
import snaplineDataMappingLookup from '@vaagatech/snapline-demo-scenario-snapline-data-mapping-lookup';
import dbVsDbSqlite from '@vaagatech/snapline-demo-scenario-db-vs-db-sqlite';
import dbVsDbCrossDialect from '@vaagatech/snapline-demo-scenario-db-vs-db-cross-dialect';
import nosqlVsNosql from '@vaagatech/snapline-demo-scenario-nosql-vs-nosql';
import snaplineDataMappingFunction from '@vaagatech/snapline-demo-scenario-snapline-data-mapping-function';
import dbComparisonTransformations from '@vaagatech/snapline-demo-scenario-db-comparison-transformations';
import snaplineCombinedOptions from '@vaagatech/snapline-demo-scenario-snapline-combined-options';
import apiVsFileRest from '@vaagatech/snapline-demo-scenario-api-vs-file-rest';
import apiVsFileRestCases from '@vaagatech/snapline-demo-scenario-api-vs-file-rest-cases';
import apiVsFileGraphql from '@vaagatech/snapline-demo-scenario-api-vs-file-graphql';
import apiVsFileSoap from '@vaagatech/snapline-demo-scenario-api-vs-file-soap';
import apiVsDbRest from '@vaagatech/snapline-demo-scenario-api-vs-db-rest';
import apiVsDbGraphql from '@vaagatech/snapline-demo-scenario-api-vs-db-graphql';
import apiVsDbSoap from '@vaagatech/snapline-demo-scenario-api-vs-db-soap';
import dbVsApiRest from '@vaagatech/snapline-demo-scenario-db-vs-api-rest';
import dbVsApiGraphql from '@vaagatech/snapline-demo-scenario-db-vs-api-graphql';
import dbVsApiSoap from '@vaagatech/snapline-demo-scenario-db-vs-api-soap';
import projectGraphql from '@vaagatech/snapline-demo-scenario-project-graphql';
import projectDb from '@vaagatech/snapline-demo-scenario-project-db';
import { createDemoDatabaseEnv, createMockServer } from '@vaagatech/snapline-demo-shared';

const runners = [
  snaplineIgnoreFields,
  snaplineTransformations,
  snaplineDataMappingLookup,
  dbVsDbSqlite,
  dbVsDbCrossDialect,
  nosqlVsNosql,
  snaplineDataMappingFunction,
  dbComparisonTransformations,
  snaplineCombinedOptions,
  apiVsFileRest,
  apiVsFileRestCases,
  apiVsFileGraphql,
  apiVsFileSoap,
  apiVsDbRest,
  apiVsDbGraphql,
  apiVsDbSoap,
  dbVsApiRest,
  dbVsApiGraphql,
  dbVsApiSoap,
  projectGraphql,
  projectDb,
];

function applyDemoEnv(baseUrl: string, databaseEnv: ReturnType<typeof createDemoDatabaseEnv>): void {
  process.env.API_BASE_URL = baseUrl;
  process.env.CLIENT_ID = process.env.CLIENT_ID ?? 'demo-client';
  process.env.CLIENT_SECRET = process.env.CLIENT_SECRET ?? 'demo-secret';
  process.env.SOURCE_DATABASE_URL = databaseEnv.SOURCE_DATABASE_URL;
  process.env.TARGET_DATABASE_URL = databaseEnv.TARGET_DATABASE_URL;
  process.env.APP_DATABASE_URL = databaseEnv.APP_DATABASE_URL;
  process.env.AUDIT_SOURCE_DATABASE_URL = databaseEnv.AUDIT_SOURCE_DATABASE_URL;
  process.env.AUDIT_TARGET_DATABASE_URL = databaseEnv.AUDIT_TARGET_DATABASE_URL;
}

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Snapline — Full Integration Demo (monorepo)');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  21 scenarios · npm run demo:list to browse');
  console.log('  npm run demo:run -- <id> to run one scenario from root');
  console.log('═══════════════════════════════════════════════════════');

  const { server, baseUrl } = await createMockServer();
  console.log(`\nMock API + GraphQL server listening at ${baseUrl}`);

  const databaseEnv = createDemoDatabaseEnv();
  applyDemoEnv(baseUrl, databaseEnv);

  const reportConfig = resolveReportConfig();
  const startedAt = Date.now();

  try {
    const results = [];
    for (const run of runners) {
      results.push(await run());
    }

    const durationMs = Date.now() - startedAt;
    const passed = results.filter((result) => result.passed).length;
    const failed = results.length - passed;

    console.log('───────────────────────────────────────────────────────');
    console.log(`  Summary: ${passed} passed, ${failed} failed (${durationMs}ms)`);
    console.log('───────────────────────────────────────────────────────');

    if (reportConfig) {
      const reportPath = writeTestReport(results, reportConfig, {
        durationMs,
        environment: {
          baseUrl,
          reportFormat: reportConfig.format,
        },
      });
      console.log(`\nReport written to ${reportPath}`);
    }

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    databaseEnv.cleanup();
    server.close();
  }
}

main().catch((err: unknown) => {
  console.error('Demo failed:', err);
  process.exitCode = 1;
});
