import { db, type SqliteConnection } from '@vaagatech/core';
import { DEMO_EMAIL } from './constants.js';

function createUsersTable(connection: SqliteConnection): void {
  connection.exec(`
    CREATE TABLE users (
      email TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      pincode TEXT
    );
  `);
}

function createAppTable(connection: SqliteConnection): void {
  connection.exec(`
    CREATE TABLE users_app (
      email TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      role TEXT NOT NULL
    );

    INSERT INTO users_app (email, status, role) VALUES
      ('${DEMO_EMAIL}', 'SYNCED', 'member');
  `);
}

export interface DemoDatabase {
  sourceDb: SqliteConnection;
  targetDb: SqliteConnection;
  appDb: SqliteConnection;
}

export function createDemoDatabase(): DemoDatabase {
  const sourceDb = db.sqlite(':memory:');
  createUsersTable(sourceDb);
  sourceDb.exec(`
    INSERT INTO users (email, status, pincode) VALUES
      ('${DEMO_EMAIL}', 'ABC', '111111');
  `);

  const targetDb = db.sqlite(':memory:');
  createUsersTable(targetDb);
  targetDb.exec(`
    INSERT INTO users (email, status, pincode) VALUES
      ('${DEMO_EMAIL}', 'CBA', '999999');
  `);

  const appDb = db.sqlite(':memory:');
  createAppTable(appDb);

  return { sourceDb, targetDb, appDb };
}

export function closeDemoDatabase(database: DemoDatabase): void {
  database.sourceDb.close();
  database.targetDb.close();
  database.appDb.close();
}
