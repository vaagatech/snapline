import { db, type SqliteConnection } from '@vaagatech/reconcile-core';
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

export interface DemoDatabase {
  sourceDb: SqliteConnection;
  targetDb: SqliteConnection;
  appDb: SqliteConnection;
  auditSourceDb: SqliteConnection;
  auditTargetDb: SqliteConnection;
}

export function createDemoDatabase(): DemoDatabase {
  const sourceDb = db.sqlite(':memory:');
  seedWarehouseTables(sourceDb, 'source');

  const targetDb = db.sqlite(':memory:');
  seedWarehouseTables(targetDb, 'target');

  const appDb = db.sqlite(':memory:');
  seedAppDatabase(appDb);

  const auditSourceDb = db.sqlite(':memory:');
  createAuditTable(auditSourceDb, demoDomain.auditLoggedAt);

  const auditTargetDb = db.sqlite(':memory:');
  createAuditTable(auditTargetDb, 'VALID_DATE');

  return { sourceDb, targetDb, appDb, auditSourceDb, auditTargetDb };
}

export function closeDemoDatabase(database: DemoDatabase): void {
  database.sourceDb.close();
  database.targetDb.close();
  database.appDb.close();
  database.auditSourceDb.close();
  database.auditTargetDb.close();
}
