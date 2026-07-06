import type { DbRow } from '../types.js';
import { InMemoryDocumentStore } from './in-memory-document-store.js';

export { InMemoryDocumentStore } from './in-memory-document-store.js';
export type { DocumentStoreLike } from './types.js';

export const nosql = {
  memory(): InMemoryDocumentStore {
    return new InMemoryDocumentStore();
  },

  seed(store: InMemoryDocumentStore, collection: string, documents: DbRow[]): void {
    store.seed(collection, documents);
  },
};
