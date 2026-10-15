import { logger } from './services/logger';
import { runDevSeed } from './db/seed';
import { getSqlite } from './db/connection';
import type Database from 'better-sqlite3';

/**
 * قرار التشغيل والتهيئة الأولية لقاعدة البيانات عند إقلاع عيادتي
 * - إذا كان هناك مستخدمون مسبقاً: لا يفعل شيئاً
 * - إذا كان التطبيق غير مغلّف (بيئة تطوير) أو EYADATI_DEMO='1': يزرع بيانات التطوير runDevSeed
 * - في الإنتاج المغلّف العادي: يترك القاعدة فارغة لتنتظر معالج الإعداد الأول auth:setupFirstRun
 */
export function decideBootstrap(customSqlite?: Database.Database): boolean {
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

    // 2. التحقق من حالة التغليف
    let isPackaged = false;
    if (process.env.TEST_PACKAGED === '1') {
      isPackaged = true;
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const electron = require('electron');
        if (electron?.app && typeof electron.app.isPackaged === 'boolean') {
          isPackaged = electron.app.isPackaged;
        }
      } catch {
        isPackaged = false;
      }
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
