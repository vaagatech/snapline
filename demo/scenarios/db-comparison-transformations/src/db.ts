import { db, type SqliteConnection } from '@vaagatech/snapline-core';
import { requireEnv } from './env.js';

export function openAuditDbs(): {
  auditSourceDb: SqliteConnection;
  auditTargetDb: SqliteConnection;
} {
  return {
    auditSourceDb: db.sqlite(requireEnv('AUDIT_SOURCE_DATABASE_URL')),
    auditTargetDb: db.sqlite(requireEnv('AUDIT_TARGET_DATABASE_URL')),
  };
}
