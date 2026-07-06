import { db, type SqliteConnection } from '@vaagatech/snapline-core';
import { requireEnv } from './env.js';

export function openWarehouseDbs(): {
  sourceDb: SqliteConnection;
  targetDb: SqliteConnection;
} {
  return {
    sourceDb: db.sqlite(requireEnv('SOURCE_DATABASE_URL')),
    targetDb: db.sqlite(requireEnv('TARGET_DATABASE_URL')),
  };
}
