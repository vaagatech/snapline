import type { DbRow } from '../types.js';
import type { DocumentStoreLike } from './types.js';

export class InMemoryDocumentStore implements DocumentStoreLike {
  private readonly collections = new Map<string, DbRow[]>();

  seed(collection: string, documents: DbRow[]): void {
    this.collections.set(collection, documents.map((doc) => ({ ...doc })));
  }

  async find(collection: string, filter: Record<string, unknown> = {}): Promise<DbRow[]> {
    const docs = this.collections.get(collection) ?? [];
    const filterEntries = Object.entries(filter);

    if (filterEntries.length === 0) {
      return docs.map((doc) => ({ ...doc }));
    }

    return docs
      .filter((doc) => filterEntries.every(([key, value]) => doc[key] === value))
      .map((doc) => ({ ...doc }));
  }

  async findOne(collection: string, filter: Record<string, unknown> = {}): Promise<DbRow | null> {
    const rows = await this.find(collection, filter);
    return rows[0] ?? null;
  }
}
