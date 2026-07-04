import { writeTestReport } from '@vaagatech/snapline-core';
import snaplineIgnoreFields from '@vaagatech/snapline-demo-scenario-snapline-ignore-fields';
import snaplineTransformations from '@vaagatech/snapline-demo-scenario-snapline-transformations';
import dbVsDbSqlite from '@vaagatech/snapline-demo-scenario-db-vs-db-sqlite';
import snaplineDataMappingFunction from '@vaagatech/snapline-demo-scenario-snapline-data-mapping-function';
import dbComparisonTransformations from '@vaagatech/snapline-demo-scenario-db-comparison-transformations';
import snaplineCombinedOptions from '@vaagatech/snapline-demo-scenario-snapline-combined-options';
import apiVsFileRest from '@vaagatech/snapline-demo-scenario-api-vs-file-rest';
import apiVsFileGraphql from '@vaagatech/snapline-demo-scenario-api-vs-file-graphql';
import apiVsFileSoap from '@vaagatech/snapline-demo-scenario-api-vs-file-soap';
import apiVsDbRest from '@vaagatech/snapline-demo-scenario-api-vs-db-rest';
import apiVsDbGraphql from '@vaagatech/snapline-demo-scenario-api-vs-db-graphql';
import apiVsDbSoap from '@vaagatech/snapline-demo-scenario-api-vs-db-soap';
import dbVsApiRest from '@vaagatech/snapline-demo-scenario-db-vs-api-rest';
import dbVsApiGraphql from '@vaagatech/snapline-demo-scenario-db-vs-api-graphql';
import dbVsApiSoap from '@vaagatech/snapline-demo-scenario-db-vs-api-soap';
import {
  closeDemoDatabase,
  createDemoDatabase,
  createMockServer,
  resolveReportConfig,
  type ScenarioModule,
} from '@vaagatech/snapline-demo-shared';

const scenarios: ScenarioModule[] = [
  snaplineIgnoreFields,
  snaplineTransformations,
  dbVsDbSqlite,
  snaplineDataMappingFunction,
  dbComparisonTransformations,
  snaplineCombinedOptions,
  apiVsFileRest,
  apiVsFileGraphql,
  apiVsFileSoap,
  apiVsDbRest,
  apiVsDbGraphql,
  apiVsDbSoap,
  dbVsApiRest,
  dbVsApiGraphql,
  dbVsApiSoap,
];

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  @vaagatech/snapline-engine — Full Integration Demo');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Projects: 15 scenario workspaces under demo/scenarios/');
  console.log('  Modes: API↔file · DB↔DB · API↔DB · DB↔API');
  console.log('  Protocols: REST · GraphQL · SOAP · SQLite · OAuth2');
  console.log('  Snapline: ignoreFields · transformations · dataMapping');
  console.log('  Reports: json · html · text (via REPORT_FORMAT env or CLI flags)');
  console.log('  Built by VaagaTech — https://www.vaagatech.com');
  console.log('═══════════════════════════════════════════════════════');

  const { server, baseUrl } = await createMockServer();
  console.log(`\nMock API + GraphQL server listening at ${baseUrl}`);

  const database = createDemoDatabase();
  const reportConfig = resolveReportConfig();
  const startedAt = Date.now();
  const context = { baseUrl, database };

  try {
    const results = [];
    for (const scenario of scenarios) {
      results.push(await scenario.run(context));
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
      console.log('Upload this artifact to your CI dashboard or reporting system.');
    }

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    closeDemoDatabase(database);
    server.close();
  }
}

main().catch((err: unknown) => {
  console.error('Demo failed:', err);
  process.exitCode = 1;
});
