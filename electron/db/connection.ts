import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'node:path';
import fs from 'node:fs';

let sqliteDbInstance: Database.Database | null = null;
let drizzleDbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    if (process.env.DATABASE_PATH !== ':memory:') {
      const customDir = path.dirname(process.env.DATABASE_PATH);
      if (customDir && customDir !== '.' && !fs.existsSync(customDir)) {
        fs.mkdirSync(customDir, { recursive: true });
      }
    }
    return process.env.DATABASE_PATH;
  }

  try {
    // Dynamic import/require check for electron app
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const electron = require('electron');
    const app = electron.app || electron.remote?.app;
    if (app && typeof app.getPath === 'function') {
      const userDataDir = app.getPath('userData');
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }
      return path.join(userDataDir, 'eyadati.db');
    }
  } catch {
    // Non-electron or fallback environment
  }

  const fallbackDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
  }
  return path.join(fallbackDir, 'eyadati.db');
}

export function runMigrations(sqlite: Database.Database): void {
  // Ensure migration tracking table exists
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  let appPath = '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const electron = require('electron');
    const app = electron.app || electron.remote?.app;
    if (app && typeof app.getAppPath === 'function') {
      appPath = app.getAppPath();
    }
  } catch {
    // Non-electron environment
  }

  const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

  const dirCandidates = [
    path.join(currentDir, 'migrations'),
    path.join(currentDir, 'db', 'migrations'),
    ...(appPath
      ? [
          path.join(appPath, 'dist-electron', 'migrations'),
          path.join(appPath, 'migrations'),
          path.join(appPath, 'electron', 'db', 'migrations'),
        ]
      : []),
    path.join(process.cwd(), 'dist-electron', 'migrations'),
    path.join(process.cwd(), 'electron', 'db', 'migrations'),
  ];

  let migrationsDir = '';
  for (const candidate of dirCandidates) {
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, '0000_init.sql'))) {
      migrationsDir = candidate;
      break;
    }
  }

  if (!migrationsDir) {
    throw new Error(
      `تعذر العثور على مجلد ملفات الهجرة وقاعدة البيانات:\n${dirCandidates.join('\n')}`
    );
  }

  // If clinics table exists but not recorded in _schema_migrations, mark 0000_init.sql as recorded
  const hasClinics = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='clinics'")
    .get();
  if (hasClinics) {
    sqlite
      .prepare('INSERT OR IGNORE INTO _schema_migrations (name, applied_at) VALUES (?, ?)')
      .run('0000_init.sql', new Date().toISOString());
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const getMigrationStmt = sqlite.prepare('SELECT name FROM _schema_migrations WHERE name = ?');
  const recordMigrationStmt = sqlite.prepare(
    'INSERT OR REPLACE INTO _schema_migrations (name, applied_at) VALUES (?, ?)'
  );

  for (const file of files) {
    const isApplied = getMigrationStmt.get(file);
    if (!isApplied) {
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      try {
        sqlite.exec(sqlContent);
      } catch (err: any) {
        // If error is about duplicate column name, it's safe to continue
        if (!err.message?.includes('duplicate column name')) {
          throw err;
        }
      }
      recordMigrationStmt.run(file, new Date().toISOString());
    }
  }
}

export function closeDatabase(): void {
  if (sqliteDbInstance) {
    try {
      sqliteDbInstance.close();
    } catch {
      // Ignore if already closed
    }
    sqliteDbInstance = null;
    drizzleDbInstance = null;
  }
}

export function initDatabase(customPath?: string): {
  sqlite: Database.Database;
  db: ReturnType<typeof drizzle<typeof schema>>;
} {
  if (sqliteDbInstance && drizzleDbInstance && !customPath) {
    return { sqlite: sqliteDbInstance, db: drizzleDbInstance };
  }

  if (customPath && sqliteDbInstance) {
    closeDatabase();
  }

  const dbPath = customPath || getDatabasePath();
  const sqlite = new Database(dbPath);

  // Mandatory PRAGMAs
  if (dbPath !== ':memory:') {
    sqlite.pragma('journal_mode = WAL');
  }
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');

  // Run initial migrations
  runMigrations(sqlite);

  const db = drizzle(sqlite, { schema });

  sqliteDbInstance = sqlite;
  drizzleDbInstance = db;

  return { sqlite, db };
}

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!drizzleDbInstance) {
    return initDatabase().db;
  }
  return drizzleDbInstance;
}

export function getSqlite(): Database.Database {
  if (!sqliteDbInstance) {
    return initDatabase().sqlite;
  }
  return sqliteDbInstance;
}

export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_target, prop) {
      return (getDb() as any)[prop];
    },
  }
);

export const sqlite: Database.Database = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const instance = getSqlite() as any;
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
