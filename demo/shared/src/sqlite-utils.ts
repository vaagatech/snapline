import type { SqliteConnection } from './sqlite-connection.js';

export function closeSqliteConnections(
  ...connections: Array<SqliteConnection | null | undefined>
): void {
  for (const connection of connections) {
    try {
      connection?.close();
    } catch {
      // ignore close errors during demo teardown
    }
  }
}
