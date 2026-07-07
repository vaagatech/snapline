import type { DocumentStoreLike } from '../nosql/types.js';
import type { DbRow } from '../types.js';

export async function* iterateSourceDocuments(
  store: DocumentStoreLike,
  collection: string,
  filter: Record<string, unknown>,
  options: { chunkSize: number; maxRows?: number },
): AsyncGenerator<DbRow[]> {
  const chunkSize = Math.max(1, options.chunkSize);
  const rows = await store.find(collection, filter);
  const limited =
    options.maxRows !== undefined ? rows.slice(0, options.maxRows) : rows;

  for (let offset = 0; offset < limited.length; offset += chunkSize) {
    yield limited.slice(offset, offset + chunkSize);
  }
}
