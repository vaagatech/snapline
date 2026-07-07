import { reconcile } from '@vaagatech/snapline-engine';
import type { TestStepResult, TestSuiteResult } from '../types.js';
import { fetchTargetRow, isDocumentStore } from './fetch-store-data.js';
import { iterateSourceChunks } from './iterate-source-chunks.js';
import { iterateSourceDocuments } from './iterate-source-documents.js';
import type {
  RunWarehouseComparisonOptions,
  WarehouseRowResult,
  WarehouseStreamEvent,
  WarehouseSummaryEvent,
  WarehouseTableSpec,
} from './warehouse-types.js';
import { createStreamReportWriter } from '../reporting/stream-report.js';
import type { DbComparisonConfig, DbRow } from '../types.js';

function assertTableSpec(table: WarehouseTableSpec, sourceIsDoc: boolean, targetIsDoc: boolean): void {
  const hasSqlSource = Boolean(table.sourceQuery);
  const hasDocSource = Boolean(table.sourceCollection);
  const hasSqlTarget = Boolean(table.targetQuery);
  const hasDocTarget = Boolean(table.targetCollection);

  if (sourceIsDoc && !hasDocSource) {
    throw new Error(`Table "${table.id}" requires sourceCollection for a document source store`);
  }
  if (!sourceIsDoc && !hasSqlSource) {
    throw new Error(`Table "${table.id}" requires sourceQuery for a SQL source store`);
  }
  if (targetIsDoc && !hasDocTarget) {
    throw new Error(`Table "${table.id}" requires targetCollection for a document target store`);
  }
  if (!targetIsDoc && !hasSqlTarget) {
    throw new Error(`Table "${table.id}" requires targetQuery for a SQL target store`);
  }
}

function rowComparisonConfig(
  options: RunWarehouseComparisonOptions,
  table: WarehouseTableSpec,
): DbComparisonConfig {
  return {
    sourceDb: options.sourceDb,
    targetDb: options.targetDb,
    sourceQuery: table.sourceQuery,
    sourceParams: table.sourceParams,
    sourceCollection: table.sourceCollection,
    sourceFilter: table.sourceFilter,
    targetQuery: table.targetQuery,
    targetParams: table.targetParams,
    targetCollection: table.targetCollection,
    linkKeys: table.linkKeys,
    ignoreFields: table.ignoreFields,
    transformations: table.transformations,
    dataMapping: table.dataMapping,
  };
}

async function compareWarehouseRow(
  options: RunWarehouseComparisonOptions,
  table: WarehouseTableSpec,
  sourceRow: DbRow,
): Promise<WarehouseRowResult> {
  const config = rowComparisonConfig(options, table);
  const targetRow = await fetchTargetRow(config, sourceRow);
  const sourceKey = Object.values(table.linkKeys).map((field) => sourceRow[field])[0];

  if (!targetRow) {
    return {
      tableId: table.id,
      rowIndex: 0,
      passed: false,
      sourceKey,
      message: `No target row for source keys ${JSON.stringify(table.linkKeys)}`,
    };
  }

  const result = reconcile(sourceRow, targetRow, {
    ignoreFields: table.ignoreFields ?? [],
    transformations: table.transformations ?? {},
    dataMapping: table.dataMapping ?? {},
  });

  return {
    tableId: table.id,
    rowIndex: 0,
    passed: result.match,
    sourceKey,
    diff: result.diff,
  };
}

async function* iterateTableSourceRows(
  options: RunWarehouseComparisonOptions,
  table: WarehouseTableSpec,
  tableLimit: number | undefined,
  chunkSize: number,
): AsyncGenerator<DbRow[]> {
  const { sourceDb } = options;

  if (isDocumentStore(sourceDb)) {
    yield* iterateSourceDocuments(
      sourceDb,
      table.sourceCollection!,
      table.sourceFilter ?? {},
      { chunkSize, maxRows: tableLimit },
    );
    return;
  }

  yield* iterateSourceChunks(
    sourceDb,
    table.sourceQuery!,
    table.sourceParams ?? {},
    { chunkSize, maxRows: tableLimit },
  );
}

export async function runWarehouseComparison(
  options: RunWarehouseComparisonOptions,
): Promise<TestSuiteResult> {
  const {
    suiteName,
    sourceDb,
    targetDb,
    tables,
    chunkSize = 100,
    maxRowsPerTable,
    maxTotalRows,
    report,
  } = options;

  const sourceIsDoc = isDocumentStore(sourceDb);
  const targetIsDoc = isDocumentStore(targetDb);

  for (const table of tables) {
    assertTableSpec(table, sourceIsDoc, targetIsDoc);
  }

  const writer = report?.outputPath
    ? createStreamReportWriter(report)
    : null;

  const emit = (event: WarehouseStreamEvent): void => {
    writer?.write(event as unknown as Record<string, unknown>);
  };

  const results: TestStepResult[] = [];
  let suitePassed = true;
  let rowsCompared = 0;
  let passedRows = 0;
  let failedRows = 0;
  let remainingTotal = maxTotalRows;

  console.log(`\n▶ ${suiteName}`);
  console.log(
    `  chunkSize=${chunkSize}${maxRowsPerTable ? ` maxRowsPerTable=${maxRowsPerTable}` : ''}${maxTotalRows ? ` maxTotalRows=${maxTotalRows}` : ''}`,
  );
  console.log(
    `  source=${sourceIsDoc ? 'document' : 'sql'} → target=${targetIsDoc ? 'document' : 'sql'}`,
  );

  for (const table of tables) {
    let tablePassed = true;
    let tableRows = 0;
    let tableFailed = 0;
    let chunkIndex = 0;

    const tableLimit =
      maxRowsPerTable !== undefined && remainingTotal !== undefined
        ? Math.min(maxRowsPerTable, remainingTotal)
        : (maxRowsPerTable ?? remainingTotal);

    for await (const chunk of iterateTableSourceRows(options, table, tableLimit, chunkSize)) {
      if (typeof remainingTotal === 'number') {
        if (remainingTotal < 1) {
          break;
        }
        if (chunk.length > remainingTotal) {
          chunk.splice(remainingTotal);
        }
      }

      let chunkPassed = 0;
      let chunkFailed = 0;

      for (const sourceRow of chunk) {
        const rowResult = await compareWarehouseRow(options, table, sourceRow);
        rowResult.rowIndex = tableRows;
        tableRows += 1;
        rowsCompared += 1;

        if (rowResult.passed) {
          chunkPassed += 1;
          passedRows += 1;
        } else {
          chunkFailed += 1;
          failedRows += 1;
          tableFailed += 1;
          tablePassed = false;
          suitePassed = false;
        }

        emit({ type: 'row', ...rowResult });
      }

      emit({
        type: 'chunk',
        tableId: table.id,
        chunkIndex,
        rowCount: chunk.length,
        passed: chunkPassed,
        failed: chunkFailed,
        at: new Date().toISOString(),
      });

      chunkIndex += 1;
      if (typeof remainingTotal === 'number') {
        remainingTotal -= chunk.length;
      }
    }

    results.push({
      step: table.id,
      passed: tablePassed,
      message: tablePassed
        ? `Compared ${tableRows} rows`
        : `${tableFailed} of ${tableRows} rows failed`,
    });

    console.log(`  ${tablePassed ? '✓' : '✗'} ${table.id} (${tableRows} rows)`);
  }

  const summary: WarehouseSummaryEvent = {
    type: 'summary',
    suiteName,
    tables: tables.length,
    rowsCompared,
    passed: passedRows,
    failed: failedRows,
    at: new Date().toISOString(),
  };

  const reportPath = writer?.finalize(summary as unknown as Record<string, unknown>);
  if (reportPath) {
    console.log(`  Stream report: ${reportPath}`);
  }

  const summaryLabel = suitePassed ? 'PASSED' : 'FAILED';
  console.log(`\n${suitePassed ? '✅' : '❌'} ${suiteName}: ${summaryLabel}\n`);

  return { name: suiteName, passed: suitePassed, results };
}
