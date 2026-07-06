import type { DocumentStoreLike } from '../nosql/types.js';
import type { DbComparisonConfig, DbConnectionLike, DbRow } from '../types.js';
import { resolveTargetFilterFromSource, resolveTargetParamsFromSource } from './resolve-link-params.js';

export function isDocumentStore(store: DbConnectionLike | DocumentStoreLike): store is DocumentStoreLike {
  return typeof (store as DocumentStoreLike).find === 'function';
}

function assertSqlQuery(query: string | undefined, label: string): string {
  if (!query) {
    throw new Error(`dbComparison requires ${label} when using SQL databases`);
  }
  return query;
}

function assertCollection(collection: string | undefined, label: string): string {
  if (!collection) {
    throw new Error(`dbComparison requires ${label} when using document stores`);
  }
  return collection;
}

export async function fetchSourceRow(config: DbComparisonConfig): Promise<DbRow | null> {
  const {
    sourceDb,
    query,
    sourceQuery,
    params = {},
    sourceParams,
    sourceCollection,
    sourceFilter = {},
  } = config;

  if (isDocumentStore(sourceDb)) {
    const collection = assertCollection(sourceCollection, 'sourceCollection');
    const rows = await sourceDb.find(collection, sourceFilter);
    return rows[0] ?? null;
  }

  const sql = assertSqlQuery(sourceQuery ?? query, 'sourceQuery or query');
  const rows = await sourceDb.query(sql, sourceParams ?? params);
  return rows[0] ?? null;
}

export async function fetchTargetRow(
  config: DbComparisonConfig,
  sourceRow: DbRow | null,
): Promise<DbRow | null> {
  const {
    targetDb,
    query,
    sourceQuery,
    targetQuery,
    params = {},
    sourceParams,
    targetParams,
    linkKeys,
    targetParamsFromSource,
    targetCollection,
    targetFilter,
    targetFilterFromSource,
  } = config;

  if (isDocumentStore(targetDb)) {
    const collection = assertCollection(targetCollection, 'targetCollection');
    const filter = sourceRow
      ? resolveTargetFilterFromSource(sourceRow, {
          targetFilter,
          linkKeys,
          targetFilterFromSource,
          fallbackFilter: config.sourceFilter,
        })
      : (targetFilter ?? config.sourceFilter ?? {});
    const rows = await targetDb.find(collection, filter);
    return rows[0] ?? null;
  }

  const sql = assertSqlQuery(targetQuery ?? query ?? sourceQuery, 'targetQuery, query, or sourceQuery');
  const resolvedParams = sourceRow
    ? resolveTargetParamsFromSource(sourceRow, {
        targetParams,
        linkKeys,
        targetParamsFromSource,
        fallbackParams: params,
      })
    : (targetParams ?? sourceParams ?? params);

  const rows = await targetDb.query(sql, resolvedParams);
  return rows[0] ?? null;
}
