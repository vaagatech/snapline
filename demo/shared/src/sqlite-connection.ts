import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import type { DbConnectionLike, DbRow } from '@vaagatech/snapline-core';

function normalizeNamedParams(query: string): string {
  return query.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '@$1');
}

/** Demo-only SQLite adapter — not part of @vaagatech/snapline-core. */
export class SqliteConnection implements DbConnectionLike {
  constructor(private readonly database: Database.Database) {}

  exec(sql: string): void {
    this.database.exec(sql);
  }

  async query(query: string, params: Record<string, unknown> = {}): Promise<DbRow[]> {
    const normalized = normalizeNamedParams(query);
    const statement = this.database.prepare(normalized);
    const rows = statement.all(params) as DbRow[];
    return rows;
  }

  close(): void {
    this.database.close();
  }
}

export function createSqliteConnection(path: string | ':memory:' = ':memory:'): SqliteConnection {
  const database = new Database(path);
  database.pragma('foreign_keys = ON');
  return new SqliteConnection(database);
}

export function execSqliteSql(connection: SqliteConnection, sql: string): void {
  connection.exec(sql);
}

export function execSqliteFile(connection: SqliteConnection, filePath: string): void {
  const sql = readFileSync(filePath, 'utf8');
  connection.exec(sql);
}
