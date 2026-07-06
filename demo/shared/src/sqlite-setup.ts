import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { db, type SqliteConnection } from '@vaagatech/snapline-core';
import { demoDomain } from './demo-domain.js';

function seedWarehouseTables(connection: SqliteConnection, variant: 'source' | 'target'): void {
  connection.exec(`
    CREATE TABLE customers (
      email TEXT PRIMARY KEY,
      status_code TEXT NOT NULL,
      tier TEXT NOT NULL
    );

    CREATE TABLE customer_profiles (
      email TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      department TEXT NOT NULL
    );

    CREATE TABLE customer_subscriptions (
      email TEXT PRIMARY KEY,
      plan_code TEXT NOT NULL,
      renews_at TEXT NOT NULL
    );

    CREATE TABLE orders (
      order_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      status TEXT NOT NULL,
      amount REAL NOT NULL,
      shipped_at TEXT NOT NULL
    );
  `);

  const statusCode =
    variant === 'source' ? demoDomain.warehouseSourceStatus : demoDomain.warehouseTargetStatus;
  const planCode =
    variant === 'source' ? demoDomain.warehouseSourcePlan : demoDomain.warehouseTargetPlan;
  const orderStatus =
    variant === 'source'
      ? demoDomain.warehouseSourceOrderStatus
      : demoDomain.warehouseTargetOrderStatus;

  connection.exec(`
    INSERT INTO customers (email, status_code, tier) VALUES
      ('${demoDomain.email}', '${statusCode}', '${demoDomain.tier}');

    INSERT INTO customer_profiles (email, role, department) VALUES
      ('${demoDomain.email}', '${demoDomain.role}', '${demoDomain.department}');

    INSERT INTO customer_subscriptions (email, plan_code, renews_at) VALUES
      ('${demoDomain.email}', '${planCode}', '${demoDomain.renewsAt}');

    INSERT INTO orders (order_id, email, status, amount, shipped_at) VALUES
      ('ord_1001', '${demoDomain.email}', '${orderStatus}', ${demoDomain.orderTotal}, '${demoDomain.orderShippedAt}');
  `);
}

function seedAppDatabase(connection: SqliteConnection): void {
  connection.exec(`
    CREATE TABLE customers (
      email TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      tier TEXT NOT NULL,
      last_login TEXT NOT NULL
    );

    CREATE TABLE customer_profiles (
      email TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      department TEXT NOT NULL
    );

    CREATE TABLE customer_subscriptions (
      email TEXT PRIMARY KEY,
      plan_code TEXT NOT NULL,
      renews_at TEXT NOT NULL
    );

    CREATE TABLE orders (
      order_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      status TEXT NOT NULL,
      amount REAL NOT NULL,
      shipped_at TEXT NOT NULL
    );

    INSERT INTO customers (email, status, tier, last_login) VALUES
      ('${demoDomain.email}', '${demoDomain.appDbStatus}', '${demoDomain.tier}', '${demoDomain.lastLogin}');

    INSERT INTO customer_profiles (email, role, department) VALUES
      ('${demoDomain.email}', '${demoDomain.role}', '${demoDomain.department}');

    INSERT INTO customer_subscriptions (email, plan_code, renews_at) VALUES
      ('${demoDomain.email}', '${demoDomain.warehouseTargetPlan}', '${demoDomain.renewsAt}');

    INSERT INTO orders (order_id, email, status, amount, shipped_at) VALUES
      ('ord_1001', '${demoDomain.email}', '${demoDomain.warehouseTargetOrderStatus}', ${demoDomain.orderTotal}, '${demoDomain.orderShippedAt}');
  `);
}

function createAuditTable(connection: SqliteConnection, loggedAt: string): void {
  connection.exec(`
    CREATE TABLE users_audit (
      email TEXT PRIMARY KEY,
      logged_at TEXT NOT NULL,
      status TEXT NOT NULL
    );

    INSERT INTO users_audit (email, logged_at, status) VALUES
      ('${demoDomain.email}', '${loggedAt}', 'ACTIVE');
  `);
}

function seedFile(path: string, seed: (connection: SqliteConnection) => void): void {
  const connection = db.sqlite(path);
  try {
    seed(connection);
  } finally {
    connection.close();
  }
}

/** Env vars for scenario `db.ts` modules — used only by monorepo `run-all`. */
export interface DemoDatabaseEnv {
  SOURCE_DATABASE_URL: string;
  TARGET_DATABASE_URL: string;
  APP_DATABASE_URL: string;
  AUDIT_SOURCE_DATABASE_URL: string;
  AUDIT_TARGET_DATABASE_URL: string;
  cleanup: () => void;
}

/** Seeds SQLite files under a temp directory for local `npm run demo`. */
export function createDemoDatabaseEnv(): DemoDatabaseEnv {
  const dir = mkdtempSync(join(tmpdir(), 'snapline-demo-'));
  const paths = {
    source: join(dir, 'warehouse-source.db'),
    target: join(dir, 'warehouse-target.db'),
    app: join(dir, 'app.db'),
    auditSource: join(dir, 'audit-source.db'),
    auditTarget: join(dir, 'audit-target.db'),
  };

  seedFile(paths.source, (c) => seedWarehouseTables(c, 'source'));
  seedFile(paths.target, (c) => seedWarehouseTables(c, 'target'));
  seedFile(paths.app, seedAppDatabase);
  seedFile(paths.auditSource, (c) => createAuditTable(c, demoDomain.auditLoggedAt));
  seedFile(paths.auditTarget, (c) => createAuditTable(c, 'VALID_DATE'));

  return {
    SOURCE_DATABASE_URL: paths.source,
    TARGET_DATABASE_URL: paths.target,
    APP_DATABASE_URL: paths.app,
    AUDIT_SOURCE_DATABASE_URL: paths.auditSource,
    AUDIT_TARGET_DATABASE_URL: paths.auditTarget,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
