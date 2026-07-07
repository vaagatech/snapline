import type { SqliteConnection } from '@vaagatech/snapline-core';

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
