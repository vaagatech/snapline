import { reconcile } from '@vaagatech/snapline-engine';
import type { TestStepResult, TestSuiteResult } from '../types.js';
import { isDocumentStore } from './fetch-store-data.js';
import { iterateSourceChunks } from './iterate-source-chunks.js';
import type {
  RunWarehouseComparisonOptions,
  WarehouseRowResult,
  WarehouseStreamEvent,
  WarehouseSummaryEvent,
  WarehouseTableSpec,
} from './warehouse-types.js';
import { createStreamReportWriter } from '../reporting/stream-report.js';

function resolveTargetFilter(
  sourceRow: Record<string, unknown>,
  linkKeys: Record<string, string>,
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  for (const [targetField, sourceField] of Object.entries(linkKeys)) {
    filter[targetField] = sourceRow[sourceField];
  }
  return filter;
}

async function compareWarehouseRow(
  table: WarehouseTableSpec,
  sourceRow: Record<string, unknown>,
  targetDb: NonNullable<RunWarehouseComparisonOptions['targetDb']>,
): Promise<WarehouseRowResult> {
  const filter = resolveTargetFilter(sourceRow, table.linkKeys);
  const matches = await targetDb.find(table.targetCollection, filter);
  const targetRow = matches[0] ?? null;

  if (!targetRow) {
    return {
      tableId: table.id,
      rowIndex: 0,
      passed: false,
      sourceKey: Object.values(filter)[0],
      message: `No target document in ${table.targetCollection} for ${JSON.stringify(filter)}`,
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
    sourceKey: Object.values(filter)[0],
    diff: result.diff,
  };
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

  if (!isDocumentStore(targetDb)) {
    throw new Error('runWarehouseComparison requires a document store target (e.g. nosql.memory() or MongoDB)');
  }

  const writer = report
    ? createStreamReportWriter(report.outputPath, report.redactFields)
    : null;

  const emit = (event: WarehouseStreamEvent): void => {
    writer?.write(event);
  };

  const results: TestStepResult[] = [];
  let suitePassed = true;
  let rowsCompared = 0;
  let passedRows = 0;
  let failedRows = 0;
  let remainingTotal = maxTotalRows;

  console.log(`\n▶ ${suiteName}`);
  console.log(`  chunkSize=${chunkSize}${maxRowsPerTable ? ` maxRowsPerTable=${maxRowsPerTable}` : ''}${maxTotalRows ? ` maxTotalRows=${maxTotalRows}` : ''}`);

  for (const table of tables) {
    let tablePassed = true;
    let tableRows = 0;
    let tableFailed = 0;
    let chunkIndex = 0;

    const tableLimit =
      maxRowsPerTable !== undefined && remainingTotal !== undefined
        ? Math.min(maxRowsPerTable, remainingTotal)
        : (maxRowsPerTable ?? remainingTotal);

    for await (const chunk of iterateSourceChunks(
      sourceDb,
      table.sourceQuery,
      table.sourceParams ?? {},
      { chunkSize, maxRows: tableLimit },
    )) {
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
        const rowResult = await compareWarehouseRow(table, sourceRow, targetDb);
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

  const reportPath = writer?.finalize(summary);
  if (reportPath) {
    console.log(`  Stream report: ${reportPath}`);
  }

  const summaryLabel = suitePassed ? 'PASSED' : 'FAILED';
  console.log(`\n${suitePassed ? '✅' : '❌'} ${suiteName}: ${summaryLabel}\n`);

  return { name: suiteName, passed: suitePassed, results };
}
