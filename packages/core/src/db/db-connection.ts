import type { DbDialect, DbRow } from '../types.js';

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
