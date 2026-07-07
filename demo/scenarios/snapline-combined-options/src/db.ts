import { db, type SqliteConnection } from '@vaagatech/snapline-demo-shared';
import { requireEnv } from './env.js';

export function openAppDb(): SqliteConnection {
  return db.sqlite(requireEnv('APP_DATABASE_URL'));
}
