import { getSqlite } from './connection';
import { runDevSeed } from './seed';
import { logger } from '../services/logger';

export function decideBootstrap(customSqlite?: any): boolean {
  try {
    const sqlite = customSqlite || getSqlite();
    const row = sqlite
      .prepare('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL')
      .get() as { count: number } | undefined;
    const userCount = row?.count || 0;

    // 1. قاعدة موجودة فيها مستخدمون: لا تفعل شيئاً (توافق مع النسخ السابقة)
    if (userCount > 0) {
      logger.info('[الإقلاع] قاعدة البيانات تحتوي على مستخدمين مسبقاً، تم تجاوز مرحلة البذر.');
      return false;
    }

    // 2. إذا كان app.isPackaged === false أو process.env.EYADATI_DEMO === '1'
    let isPackaged = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const electron = require('electron');
      const app = electron.app || electron.remote?.app;
      if (app) {
        isPackaged = app.isPackaged;
      }
    } catch {
      // Non-electron environment
    }

    if (process.env.TEST_PACKAGED === '1') {
      isPackaged = true;
    }

    const isDevelopment = !isPackaged;
    const isDemoExplicit = process.env.EYADATI_DEMO === '1';

    if (isDevelopment || isDemoExplicit) {
      logger.info('[الإقلاع] بيئة تطوير/تجريبية وقاعدة بيانات جديدة: جاري بذر بيانات التطوير (runDevSeed)...');
      runDevSeed(sqlite);
      return true;
    }

    // 3. في الحالة المغلَّفة العادية: لا تزرع شيئاً. القاعدة تبقى بلا عيادة ولا مستخدمين حتى يُكمل المالك المعالج.
    logger.info('[الإقلاع] بيئة إنتاج مغلّفة وقاعدة بيانات جديدة: لم يتم بذر أي بيانات (في انتظار الإعداد الأولي).');
    return false;
  } catch (err) {
    logger.error('[الإقلاع] خطأ في اتخاذ قرار البذر:', err);
    return false;
  }
}
