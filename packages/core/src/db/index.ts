import type { DbRow } from '../types.js';
import { DbConnection } from './db-connection.js';

const dbRegistry = new Map<string, DbRow[]>();

export function seedDb(connectionString: string, rows: DbRow[]): void {
  dbRegistry.set(connectionString, rows);
}

export function createDbConnection(
  dialect: 'postgres' | 'mysql',
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
  seed: seedDb,
};
