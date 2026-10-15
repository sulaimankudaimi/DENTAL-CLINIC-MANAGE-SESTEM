let autoUpdater: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const updaterPkg = require('electron-updater');
  autoUpdater = updaterPkg?.autoUpdater || updaterPkg;
} catch {}
type UpdateInfo = any;
// Safe dynamic electron import for both Electron runtime and Node test environments
let electronModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  electronModule = require('electron');
} catch {}
const dialog = electronModule?.dialog;
const BrowserWindow = electronModule?.BrowserWindow;
const app = electronModule?.app;
type BrowserWindow = any;
import { logger } from './logger';

export interface UpdateStatus {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  info?: UpdateInfo;
  progress?: number;
  error?: string;
}

let currentStatus: UpdateStatus = { status: 'idle' };
let checkIntervalTimer: NodeJS.Timeout | null = null;
let targetWindow: BrowserWindow | null = null;

/**
 * تهيئة خدمة التحديث التلقائي
 * - فحص التحديثات عند بدء التشغيل
 * - جدولة الفحص الدوري كل 6 ساعات
 * - تنزيل التحديث في الخلفية بدون مقاطعة العمل
 * - إشعار المستخدم فور اكتمال التنزيل مع زر "إعادة التشغيل والتثبيت"
 */
export function initAutoUpdater(window?: BrowserWindow | null): void {
  targetWindow = window || null;

  // تجاوز الفحص في بيئة الاختبار
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // إذا لم يكن رابط التحديثات معرّفاً وقت البناء أو التشغيل، نتوقف بهدوء دون مؤقتات أو أخطاء
  if (!process.env.UPDATE_URL) {
    logger.info('[التحديثات] لم يتم تكوين رابط خادم التحديثات (UPDATE_URL). تم تعطيل خدمة التحديث التلقائي والمؤقتات.');
    return;
  }

  if (!autoUpdater) {
    logger.warn('[التحديثات] تعذر تهيئة مكتبة electron-updater.');
    return;
  }

  // ربط مسجل الأحداث
  autoUpdater.logger = {
    info: (msg: string) => logger.info(`[التحديثات] ${msg}`),
    warn: (msg: string) => logger.warn(`[التحديثات] ${msg}`),
    error: (msg: string) => logger.error(`[التحديثات] ${msg}`),
  };

  // الإعدادات: التنزيل التلقائي في الخلفية
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // 1. بدء فحص التحديث
  autoUpdater.on('checking-for-update', () => {
    logger.info('[التحديثات] جاري فحص توفر إصدارات جديدة من خادم التحديثات...');
    currentStatus = { status: 'checking' };
    sendStatusToWindow();
  });

  // 2. توفر تحديث جديد
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    logger.info(`[التحديثات] يتوفر تحديث جديد (الإصدار ${info.version}). الإصدار الحالي: ${app?.getVersion?.() || '1.0.0'}`);
    currentStatus = { status: 'available', info };
    sendStatusToWindow();

    if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.webContents.send('updater:notification', {
        type: 'info',
        title: 'يتوفر تحديث جديد',
        message: `يتوفر تحديث جديد لنظام عيادتي (الإصدار ${info.version}). جاري تنزيل التحديث في الخلفية...`,
      });
    }
  });

  // 3. لا يوجد تحديث
  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    logger.info(`[التحديثات] النظام محدّث إلى أحدث إصدار (${info.version}).`);
    currentStatus = { status: 'not-available', info };
    sendStatusToWindow();
  });

  // 4. تقدم تنزيل التحديث في الخلفية
  autoUpdater.on('download-progress', (progressObj: any) => {
    const percent = Math.round(progressObj.percent);
    logger.info(`[التحديثات] نسبة تنزيل التحديث: ${percent}%`);
    currentStatus = { status: 'downloading', progress: percent };
    sendStatusToWindow();
  });

  // 5. اكتمال التنزيل في الخلفية
  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    logger.info(`[التحديثات] تم تنزيل التحديث بنجاح: الإصدار ${info.version}`);
    currentStatus = { status: 'downloaded', info };
    sendStatusToWindow();

    // عرض صندوق حوار للمستخدم يتيح إعادة التشغيل والتثبيت الفوري
    promptRestartAndInstall(info);
  });

  // 6. حدوث خطأ أثناء الفحص أو التنزيل
  autoUpdater.on('error', (err: Error) => {
    logger.error(`[التحديثات] خطأ في خدمة التحديثات: ${err.message}`);
    currentStatus = { status: 'error', error: err.message };
    sendStatusToWindow();
  });

  // فحص أولي بعد إقلاع التطبيق بـ 5 ثوانٍ
  setTimeout(() => {
    logger.info('[التحديثات] إجراء فحص التحديثات عند بدء التشغيل...');
    checkForUpdatesSilently();
  }, 5000);

  // فحص دوري مجدول كل 6 ساعات (6 * 60 * 60 * 1000 مللي ثانية)
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  if (checkIntervalTimer) clearInterval(checkIntervalTimer);
  checkIntervalTimer = setInterval(() => {
    logger.info('[التحديثات] الفحص الدوري المجدول للتحديثات (كل 6 ساعات)...');
    checkForUpdatesSilently();
  }, SIX_HOURS_MS);
}

/**
 * فحص صامت للتحديثات دون إزعاج المستخدم إن لم يتوفر تحديث
 */
async function checkForUpdatesSilently(): Promise<void> {
  // تخطي الفحص في وضع التطوير غير المجمع أو عند غياب رابط التحديثات
  if (!process.env.UPDATE_URL) {
    return;
  }

  if (!app?.isPackaged && process.env.NODE_ENV !== 'production') {
    logger.info('[التحديثات] وضع التطوير المحلي: تم تخطي الاتصال بالخادم البعيد.');
    return;
  }

  try {
    await autoUpdater?.checkForUpdates();
  } catch (err: any) {
    logger.warn(`[التحديثات] تعذر الوصول لخادم التحديثات أثناء الفحص الصامت: ${err.message}`);
  }
}

/**
 * عرض نافذة تأكيد باللغة العربية مع زر "إعادة التشغيل والتثبيت"
 */
export async function promptRestartAndInstall(info: UpdateInfo): Promise<void> {
  const win = targetWindow && !targetWindow.isDestroyed() ? targetWindow : BrowserWindow?.getFocusedWindow?.();

  const dialogOptions = {
    type: 'info' as const,
    title: 'تحديث جديد جاهز للتثبيت',
    message: `يتوفر تحديث جديد لنظام عيادتي (الإصدار ${info.version})`,
    detail:
      'تم تنزيل حزمة التحديث بالكامل في الخلفية بنجاح.\n\n' +
      'يمكنك إعادة تشغيل البرنامج الآن لتثبيت التحديث فوراً دون فقدان أي بيانات، أو تأجيل التثبيت حتى الإغلاق القادم.',
    buttons: ['إعادة التشغيل والتثبيت', 'التذكير لاحقاً'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  };

  const dialogResult = win
    ? await dialog?.showMessageBox(win, dialogOptions)
    : await dialog?.showMessageBox(dialogOptions);

  if (dialogResult?.response === 0) {
    logger.info('[التحديثات] استجابة المستخدم: الموافقة على إعادة التشغيل والتثبيت الفوري.');
    installUpdateNow();
  } else {
    logger.info('[التحديثات] استجابة المستخدم: تأجيل التثبيت إلى وقت لاحق.');
  }
}

/**
 * تنفيذ إعادة التشغيل وتثبيت النسخة الجديدة فوراً
 */
export function installUpdateNow(): void {
  logger.info('[التحديثات] جاري إنهاء التطبيق وبدء مثبت التحديث...');
  if (app) {
    (app as any).isQuitting = true;
  }
  autoUpdater?.quitAndInstall(false, true);
}

/**
 * فحص يدوي للتحديثات عند طلب المستخدم من واجهة الإعدادات أو المساعدة
 */
export async function checkAppUpdatesManual(): Promise<{
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  message: string;
}> {
  const currentVersion = app?.getVersion?.() || '1.0.0';

  if (!process.env.UPDATE_URL) {
    logger.info('[التحديثات] الفحص اليدوي: رابط خادم التحديثات (UPDATE_URL) غير معرّف.');
    return {
      updateAvailable: false,
      currentVersion,
      latestVersion: currentVersion,
      message: 'خدمة التحديث التلقائي غير مفعلة (لم يتم تحديد خادم التحديثات).',
    };
  }

  if (!app?.isPackaged && process.env.NODE_ENV !== 'production') {
    return {
      updateAvailable: false,
      currentVersion,
      latestVersion: currentVersion,
      message: 'أنت في بيئة التطوير المحلية (Local Development). تم تجاوز خادم التحديثات.',
    };
  }

  try {
    const result = await autoUpdater?.checkForUpdates();
    const latestVersion = result?.updateInfo?.version || currentVersion;
    const isNewer = latestVersion !== currentVersion;

    return {
      updateAvailable: isNewer,
      currentVersion,
      latestVersion,
      message: isNewer
        ? `يتوفر تحديث جديد (الإصدار ${latestVersion})! جاري تنزيله تلقائياً في الخلفية.`
        : `نظام عيادتي محدث إلى أحدث إصدار معتمد (الإصدار ${currentVersion}).`,
    };
  } catch (err: any) {
    logger.warn(`[التحديثات] خطأ في الفحص اليدوي: ${err.message}`);
    return {
      updateAvailable: false,
      currentVersion,
      latestVersion: currentVersion,
      message: 'تعذر الاتصال بخادم التحديثات في الوقت الحالي. يرجى التحقق من اتصال الشبكة.',
    };
  }
}

function sendStatusToWindow(): void {
  if (targetWindow && !targetWindow.isDestroyed()) {
    targetWindow.webContents.send('updater:status', currentStatus);
  }
}
