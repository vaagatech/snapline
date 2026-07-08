import { existsSync } from 'node:fs';
import { loadJsonFile } from '@vaagatech/snapline-engine';
import type { AsyncResultResolver, DbPollConfig, FilePollConfig, PollOptions } from '../types.js';
import { waitForResult } from './wait-for-result.js';

export function createDbAsyncResultResolver(config: DbPollConfig): AsyncResultResolver {
  const correlationParam = config.correlationParam ?? 'correlationId';

  return {
    async waitForResult(correlationId: string, options?: PollOptions): Promise<unknown> {
      return waitForResult(async () => {
        const rows = await config.db.query(config.query, {
          ...(config.params ?? {}),
          [correlationParam]: correlationId,
        });

        if (config.until) {
          return config.until(rows)
            ? (config.extract ? config.extract(rows) : (rows[0] ?? null))
            : null;
        }

        if (config.extract) {
          const value = config.extract(rows);
          return value ?? null;
        }

        return rows[0] ?? null;
      }, options);
    },
  };
}

export function createFileAsyncResultResolver(config: FilePollConfig): AsyncResultResolver {
  const fileNameFor = config.fileName ?? ((id: string) => `${id}.json`);
  const rootDir = config.directory;

  return {
    async waitForResult(correlationId: string, options?: PollOptions): Promise<unknown> {
      const relativePath = fileNameFor(correlationId);

      return waitForResult(async () => {
        const absolute = `${rootDir.replace(/\/$/, '')}/${relativePath}`;
        if (!existsSync(absolute)) {
          return null;
        }
        return loadJsonFile(absolute, { rootDir });
      }, options);
    },
  };
}
