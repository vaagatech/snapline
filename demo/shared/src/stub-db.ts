import type { DbDialect, DbRow } from '@vaagatech/snapline-core';

import { createSqliteConnection, type SqliteConnection } from './sqlite-connection.js';

/** Demo-only in-memory DB stub — not part of @vaagatech/snapline-core. */
export class DbConnection {
  constructor(
    readonly dialect: DbDialect,
    readonly connectionString: string,
    private readonly rows: DbRow[] = [],
  ) {}

  async query(query: string, params: Record<string, unknown> = {}): Promise<DbRow[]> {
    const normalized = query.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!normalized.startsWith('select')) {
      throw new Error(`Unsupported query: ${query}`);
    }

    let results = [...this.rows];

    for (const [key, value] of Object.entries(params)) {
      results = results.filter((row) => row[key] === value);
    }

    const columnsMatch = query.match(/select\s+(.+?)\s+from/i);
    if (columnsMatch?.[1]?.trim() !== '*') {
      const columns = columnsMatch?.[1]?.split(',').map((c) => c.trim()) ?? [];
      results = results.map((row) => {
        const projected: DbRow = {};
        for (const col of columns) {
          if (col in row) {
            projected[col] = row[col];
          }
        }
        return projected;
      });
    }

    return results;
  }
}

const dbRegistry = new Map<string, DbRow[]>();

export function seedDb(connectionString: string, rows: DbRow[]): void {
  dbRegistry.set(connectionString, rows);
}

export function clearDbSeeds(connectionString?: string): void {
  if (connectionString) {
    dbRegistry.delete(connectionString);
    return;
  }
  dbRegistry.clear();
}

export function createDbConnection(
  dialect: DbDialect,
  connectionString: string,
): DbConnection {
  const seed = dbRegistry.get(connectionString) ?? [];
  return new DbConnection(dialect, connectionString, seed);
}

export const db = {
  postgres(connectionString: string) {
    return createDbConnection('postgres', connectionString);
  },
  mysql(connectionString: string) {
    return createDbConnection('mysql', connectionString);
  },
  sqlite(path: string | ':memory:' = ':memory:') {
    return createSqliteConnection(path);
  },
  seed: seedDb,
};
