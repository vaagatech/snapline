import type { DbConnectionLike, DbRow } from '../types.js';

const LIMIT_OFFSET_PATTERN = /\blimit\s+\d+/i;

export async function* iterateSourceChunks(
  sourceDb: DbConnectionLike,
  baseQuery: string,
  params: Record<string, unknown>,
  options: { chunkSize: number; maxRows?: number },
): AsyncGenerator<DbRow[]> {
  const chunkSize = Math.max(1, options.chunkSize);
  let offset = 0;
  let totalFetched = 0;

  while (true) {
    if (options.maxRows !== undefined && totalFetched >= options.maxRows) {
      return;
    }

    const remaining =
      options.maxRows !== undefined ? options.maxRows - totalFetched : chunkSize;
    const limit = Math.min(chunkSize, remaining);

    const paginatedQuery = LIMIT_OFFSET_PATTERN.test(baseQuery)
      ? baseQuery
      : `${baseQuery.trim()} LIMIT ${limit} OFFSET ${offset}`;

    const rows = await sourceDb.query(paginatedQuery, params);
    if (rows.length === 0) {
      return;
    }

    yield rows;
    totalFetched += rows.length;
    offset += rows.length;

    if (rows.length < limit) {
      return;
    }
  }
}
