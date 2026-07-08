import {
  buildReport,
  pushTestReportToHub,
  resolveHubConfig,
  resolveReportConfig,
  writeTestReport,
  type HubConfig,
  type ReportConfig,
  type TestSuiteResult,
} from '@vaagatech/snapline-core';
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

const scenarios: Array<{ id: string; run: () => Promise<TestSuiteResult> }> = [
  { id: 'snapline-ignore-fields', run: snaplineIgnoreFields },
  { id: 'snapline-transformations', run: snaplineTransformations },
  { id: 'snapline-data-mapping-lookup', run: snaplineDataMappingLookup },
  { id: 'db-vs-db-sqlite', run: dbVsDbSqlite },
  { id: 'db-vs-db-cross-dialect', run: dbVsDbCrossDialect },
  { id: 'nosql-vs-nosql', run: nosqlVsNosql },
  { id: 'snapline-data-mapping-function', run: snaplineDataMappingFunction },
  { id: 'db-comparison-transformations', run: dbComparisonTransformations },
  { id: 'snapline-combined-options', run: snaplineCombinedOptions },
  { id: 'api-vs-file-rest', run: apiVsFileRest },
  { id: 'api-vs-file-rest-cases', run: apiVsFileRestCases },
  { id: 'api-vs-file-graphql', run: apiVsFileGraphql },
  { id: 'api-vs-file-soap', run: apiVsFileSoap },
  { id: 'api-vs-db-rest', run: apiVsDbRest },
  { id: 'api-vs-db-graphql', run: apiVsDbGraphql },
  { id: 'api-vs-db-soap', run: apiVsDbSoap },
  { id: 'db-vs-api-rest', run: dbVsApiRest },
  { id: 'db-vs-api-graphql', run: dbVsApiGraphql },
  { id: 'db-vs-api-soap', run: dbVsApiSoap },
  { id: 'project-graphql', run: projectGraphql },
  { id: 'project-db', run: projectDb },
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

function scenarioReportPath(scenarioId: string, format: ReportConfig['format']): string {
  const extension = format === 'text' ? 'txt' : format;
  return `./reports/scenarios/${scenarioId}.${extension}`;
}

async function publishScenarioReports(
  scenarioId: string,
  result: TestSuiteResult,
  opts: {
    durationMs: number;
    baseUrl: string;
    reportConfig?: ReportConfig;
    hubConfig?: HubConfig;
  },
): Promise<void> {
  if (opts.reportConfig) {
    try {
      const reportPath = writeTestReport(
        [result],
        { ...opts.reportConfig, outputPath: scenarioReportPath(scenarioId, opts.reportConfig.format) },
        {
          durationMs: opts.durationMs,
          environment: { baseUrl: opts.baseUrl, scenarioId },
        },
      );
      console.log(`  [file] ${scenarioId} → ${reportPath}`);
    } catch (err) {
      console.warn(`  [file] ${scenarioId} failed:`, err instanceof Error ? err.message : err);
    }
  }

  if (opts.hubConfig) {
    try {
      const report = buildReport([result], {
        durationMs: opts.durationMs,
        environment: { baseUrl: opts.baseUrl, scenarioId },
      });
      const hubResult = await pushTestReportToHub(report, {
        ...opts.hubConfig,
        label: result.name,
        project: scenarioId,
        tags: [...new Set([...(opts.hubConfig.tags ?? []), 'node', 'demo', scenarioId])],
      });
      console.log(`  [hub]  ${scenarioId} → ${hubResult.url}`);
    } catch (err) {
      console.warn(`  [hub]  ${scenarioId} push failed:`, err instanceof Error ? err.message : err);
    }
  }
}

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Snapline — Full Integration Demo (monorepo)');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  ${scenarios.length} scenarios · npm run demo:list to browse`);
  console.log('  npm run demo:run -- <id> to run one scenario from root');
  console.log('═══════════════════════════════════════════════════════');

  const { server, baseUrl } = await createMockServer();
  console.log(`\nMock API + GraphQL server listening at ${baseUrl}`);

  const databaseEnv = createDemoDatabaseEnv();
  applyDemoEnv(baseUrl, databaseEnv);

  const reportConfig = resolveReportConfig();
  const hubConfig = resolveHubConfig();
  const startedAt = Date.now();

  try {
    const results: TestSuiteResult[] = [];
    for (const { id, run } of scenarios) {
      const scenarioStart = Date.now();
      console.log(`\n▶ ${id}`);
      const result = await run();
      results.push(result);
      await publishScenarioReports(id, result, {
        durationMs: Date.now() - scenarioStart,
        baseUrl,
        reportConfig,
        hubConfig,
      });
    }

    const durationMs = Date.now() - startedAt;
    const passed = results.filter((result) => result.passed).length;
    const failed = results.length - passed;

    console.log('\n───────────────────────────────────────────────────────');
    console.log(`  Summary: ${passed} passed, ${failed} failed (${durationMs}ms)`);
    console.log('───────────────────────────────────────────────────────');

    if (reportConfig) {
      try {
        const reportPath = writeTestReport(results, reportConfig, {
          durationMs,
          environment: {
            baseUrl,
            reportFormat: reportConfig.format,
            suiteName: 'full-demo',
          },
        });
        console.log(`\n[file] Full demo summary → ${reportPath}`);
      } catch (err) {
        console.warn('[file] Full demo summary failed:', err instanceof Error ? err.message : err);
      }
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
