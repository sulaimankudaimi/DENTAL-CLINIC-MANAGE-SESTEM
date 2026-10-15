import type { ApiResult } from '@shared/contracts';
import { getSqlite } from '../db/connection';
import type Database from 'better-sqlite3';

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

export function err<T>(error: string, code = 'INTERNAL_ERROR'): ApiResult<T> {
  return {
    ok: false,
    error,
    code,
  };
}

export async function safeExecute<T>(fn: () => T | Promise<T>): Promise<ApiResult<T>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'حدث خطأ في قاعدة البيانات';
    return err(message);
  }
}

/**
 * Synchronous transaction wrapper for better-sqlite3.
 * Automatically initiates BEGIN/COMMIT and executes ROLLBACK upon any error.
 * Returns ApiResult<T> without throwing exceptions.
 */
export function withTransaction<T>(
  fn: (sqlite: Database.Database) => T,
  customSqlite?: Database.Database
): ApiResult<T> {
  let sqlite: Database.Database;
  try {
    sqlite = customSqlite || getSqlite();
  } catch (e: any) {
    return err(e instanceof Error ? e.message : String(e));
  }

  try {
    const runTx = sqlite.transaction(() => fn(sqlite));
    const result = runTx();
    return ok(result);
  } catch (e: any) {
    const message = e instanceof Error ? e.message : String(e);
    return err(message);
  }
}
