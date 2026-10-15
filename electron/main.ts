import {
  app,
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  dialog,
} from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { initDatabase } from './db/connection';
import { decideBootstrap } from './bootstrap';
import { registerIpcHandlers } from './ipc';
import { logger } from './services/logger';
import { setupScheduledBackups, createBackup } from './services/backup.service';
import { initAutoUpdater } from './services/updater';
import { startLicenseRenewalScheduler } from './services/license.service';

// Extend app type for quitting state
(app as any).isQuitting = false;

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

// Determine preload path for dev and prod
function getPreloadPath(): string {
  const candidates = [
    path.join(__dirname, 'preload.cjs'),
    path.join(process.cwd(), 'dist-electron', 'preload.cjs'),
    path.join(__dirname, 'preload.js'),
    path.join(process.cwd(), 'dist-electron', 'preload.js'),
    path.join(process.cwd(), 'electron', 'preload.ts'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, 'preload.cjs');
}

// Determine custom application icon path
function getAppIconPath(): string | undefined {
  const candidates = [
    path.join(__dirname, '../public/icon.png'),
    path.join(__dirname, 'assets/icon.png'),
    path.join(process.cwd(), 'electron', 'assets', 'icon.png'),
    path.join(process.cwd(), 'public', 'icon.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

// 1. Single Instance Lock
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  logger.warn('[التطبيق] تم اكتشاف تشغيل نسخة سابقة من التطبيق، جاري الخروج.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// 2. Unhandled Exception & Error Handlers
process.on('uncaughtException', (error) => {
  logger.error('[خطأ غير ملتقط]', error);
  try {
    dialog.showErrorBox(
      'تنبيه نظام عيادتي',
      `حدث خطأ غير متوقع أثناء معالجة البيانات:\n${error.message}\n\nتم تسجيل تفاصيل الخطأ بأمان لضمان سلامة واستقرار سجلات المرضى.`
    );
  } catch {}
});

process.on('unhandledRejection', (reason) => {
  logger.error('[استثناء مرفوض]', reason);
});

// 3. Splash Screen Creation
function createSplashScreen(): BrowserWindow {
  const iconPath = getAppIconPath();
  const splash = new BrowserWindow({
    width: 520,
    height: 360,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    show: true,
    icon: iconPath,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const splashHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          margin: 0;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: transparent;
          user-select: none;
        }
        .card {
          width: 480px;
          padding: 36px 30px;
          background: linear-gradient(145deg, #0A192F, #1E3A8A);
          border-radius: 28px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
          color: white;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .glow {
          position: absolute;
          width: 150px;
          height: 150px;
          background: #2563EB;
          filter: blur(70px);
          border-radius: 50%;
          top: -30px;
          right: -30px;
          opacity: 0.6;
        }
        .logo-box {
          width: 72px;
          height: 72px;
          margin: 0 auto 16px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          font-weight: 900;
          color: #60A5FA;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        h1 {
          margin: 0 0 6px;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        p {
          margin: 0 0 24px;
          font-size: 13px;
          color: #93C5FD;
        }
        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 99px;
          overflow: hidden;
          position: relative;
        }
        .progress-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 45%;
          background: linear-gradient(90deg, #38BDF8, #60A5FA);
          border-radius: 99px;
          animation: move 1.6s infinite ease-in-out;
        }
        @keyframes move {
          0% { left: -45%; }
          100% { left: 100%; }
        }
        .status {
          margin-top: 14px;
          font-size: 11px;
          color: #BFDBFE;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="glow"></div>
        <div class="logo-box">ع</div>
        <h1>عيادتي | Eyadati Dental OS</h1>
        <p>نظام إدارة عيادة الأسنان المتكامل • بدون اتصال بالإنترنت</p>
        <div class="progress-bar"></div>
        <div class="status">جاري تشغيل قاعدة البيانات SQLite والتحقق من التراخيص...</div>
      </div>
    </body>
    </html>
  `;

  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);
  return splash;
}

// 4. Custom Arabic Application Menu
function buildApplicationMenu(targetWindow: BrowserWindow): Menu {
  const isDev = !app.isPackaged;

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'ملف',
      submenu: [
        {
          label: 'مريض جديد',
          accelerator: 'CmdOrCtrl+N',
          click: () => targetWindow.webContents.send('menu:navigate', '/patients?action=new'),
        },
        {
          label: 'موعد جديد',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => targetWindow.webContents.send('menu:navigate', '/appointments?action=new'),
        },
        { type: 'separator' },
        {
          label: 'أخذ نسخة احتياطية فورية الآن',
          accelerator: 'CmdOrCtrl+B',
          click: async () => {
            const res = await createBackup();
            if (res.ok) {
              dialog.showMessageBox(targetWindow, {
                type: 'info',
                title: 'النسخ الاحتياطي',
                message: `تم أخذ نسخة احتياطية مشفرة بنجاح (${res.fileName})`,
              });
            } else {
              dialog.showErrorBox('خطأ في النسخ الاحتياطي', res.error || 'فشلت العملية');
            }
          },
        },
        {
          label: 'طباعة الصفحة الحالية',
          accelerator: 'CmdOrCtrl+P',
          click: () => targetWindow.webContents.print(),
        },
        { type: 'separator' },
        {
          label: 'إعدادات النظام والعيادة',
          accelerator: 'CmdOrCtrl+,',
          click: () => targetWindow.webContents.send('menu:navigate', '/settings'),
        },
        { type: 'separator' },
        {
          label: 'خروج من النظام',
          accelerator: 'Alt+F4',
          click: () => {
            (app as any).isQuitting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: 'تحرير',
      submenu: [
        { label: 'تراجع', role: 'undo' },
        { label: 'إعادة', role: 'redo' },
        { type: 'separator' },
        { label: 'قص', role: 'cut' },
        { label: 'نسخ', role: 'copy' },
        { label: 'لصق', role: 'paste' },
        { label: 'تحديد الكل', role: 'selectAll' },
      ],
    },
    {
      label: 'عرض',
      submenu: [
        { label: 'إعادة التحميل', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'إعادة تحميل قسرية', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: 'تكبير الواجهة', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'تصغير الواجهة', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'الحجم الطبيعي 100%', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'ملء الشاشة', accelerator: 'F11', role: 'togglefullscreen' },
        ...(isDev
          ? [
              { type: 'separator' as const },
              {
                label: 'أدوات المطور (DevTools)',
                accelerator: 'CmdOrCtrl+Shift+I',
                role: 'toggleDevTools' as const,
              },
            ]
          : []),
      ],
    },
    {
      label: 'نافذة',
      submenu: [
        { label: 'تصغير النافذة', role: 'minimize' },
        { label: 'تكبير النافذة', role: 'zoom' },
        { label: 'إغلاق', role: 'close' },
      ],
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'مركز التقارير الطبية (20+ تقرير)',
          click: () => targetWindow.webContents.send('menu:navigate', '/reports'),
        },
        {
          label: 'التحقق من التحديثات البرمجية',
          click: () => {
            dialog.showMessageBox(targetWindow, {
              type: 'info',
              title: 'تحديثات البرنامج',
              message: 'نظام عيادتي محدث بالكامل بأحدث إصدار معتمد v2.4.0 (Enterprise Desktop Edition).',
            });
          },
        },
        { type: 'separator' },
        {
          label: 'حول نظام عيادتي لطب الأسنان',
          click: () => {
            dialog.showMessageBox(targetWindow, {
              type: 'info',
              title: 'حول عيادتي',
              message: 'عيادتي - نظام إدارة عيادة الأسنان المتكامل (Eyadati Dental OS v2.4.0)\nيعمل بنسبة 100% دون اتصال بالإنترنت (Offline First).',
              detail: 'قاعدة بيانات SQLite محلية مشفرة • نظام الفاتورة الإلكترونية ZATCA المرحلة الثانية • مصفوفة صلاحيات الطاقم الطبي RBAC.',
            });
          },
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

export { decideBootstrap };

// 5. Main Window Initialization
async function createMainWindow() {
  logger.info('[التطبيق] بدء تشغيل عيادتي على سطح المكتب...');

  // Show splash window first
  splashWindow = createSplashScreen();

  // 1. Initialize SQLite Database & Migrations
  try {
    initDatabase();
    decideBootstrap();
    logger.info('[قاعدة البيانات] تم تجهيز SQLite وتطبيق الجداول الأولية بنجاح.');
  } catch (err: any) {
    logger.error('[قاعدة البيانات] خطأ فادح أثناء إعداد قاعدة البيانات:', err);
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.destroy();
    dialog.showErrorBox(
      'فشل بدء تشغيل قاعدة البيانات - عيادتي',
      `تعذر إعداد قاعدة بيانات عيادتي (SQLite):\n${err?.message || err}\n\nسيتم إغلاق التطبيق فوراً لمنع حدوث تلف في البيانات.`
    );
    (app as any).isQuitting = true;
    app.quit();
    return;
  }

  // 2. Register all IPC Handlers
  try {
    registerIpcHandlers();
    logger.info('[IPC] تم تسجيل كافة مسارات المعالجة بنجاح.');
  } catch (err: any) {
    logger.error('[IPC] خطأ فادح أثناء تسجيل المعالجات:', err);
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.destroy();
    dialog.showErrorBox(
      'فشل تسجيل قنوات الاتصال IPC - عيادتي',
      `تعذر تسجيل معالجات العمليات الداخلية للنظام:\n${err?.message || err}\n\nسيتم إغلاق التطبيق فوراً.`
    );
    (app as any).isQuitting = true;
    app.quit();
    return;
  }

  // 3. Setup Automated Scheduled Backups (Daily at 23:30)
  try {
    setupScheduledBackups('30 23 * * *');
  } catch (err: any) {
    logger.warn('[النسخ الآلي] تحذير أثناء ضبط الجدولة:', err);
  }

  // 4. Start License Renewal Scheduler (Daily check)
  try {
    startLicenseRenewalScheduler();
  } catch (err: any) {
    logger.warn('[الترخيص] تحذير أثناء بدء جدولة التحقق من التراخيص:', err);
  }

  const preloadPath = getPreloadPath();
  logger.info(`[Preload] مسار ملف الربط: ${preloadPath}`);

  const iconPath = getAppIconPath();

  // Create main window (1440x900, min 1280x720, show: false until ready-to-show)
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    title: 'عيادتي - نظام إدارة عيادة الأسنان',
    show: false,
    icon: iconPath,
    backgroundColor: '#0F172A',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for preload file access
    },
  });

  // Set Arabic Application Menu
  const appMenu = buildApplicationMenu(mainWindow);
  Menu.setApplicationMenu(appMenu);

  // Close confirmation if unsaved work
  mainWindow.on('close', (e) => {
    if ((app as any).isQuitting) return;

    const choice = dialog.showMessageBoxSync(mainWindow!, {
      type: 'question',
      buttons: ['إلغاء والتراجع', 'نعم، إغلاق البرنامج'],
      defaultId: 1,
      cancelId: 0,
      title: 'تأكيد الخروج من عيادتي',
      message: 'هل أنت متأكد من رغبتك في إغلاق نظام عيادتي؟',
      detail: 'يرجى التأكد من حفظ كافة السجلات الطبية والمواعيد قبل الخروج.',
    });

    if (choice === 0) {
      e.preventDefault();
    }
  });

  // Ready to show transition from splash
  mainWindow.once('ready-to-show', () => {
    logger.info('[النافذة الرئيسية] النافذة جاهزة للعرض.');
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
    mainWindow?.show();
    mainWindow?.focus();

    // تشغيل خدمة التحديث التلقائي
    initAutoUpdater(mainWindow);
  });

  // Load URL or File
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
  const prodFile = path.join(__dirname, '../dist/index.html');
  const fallbackProdFile = path.join(process.cwd(), 'dist', 'index.html');

  if (isDev) {
    const urls = [
      process.env.VITE_DEV_SERVER_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean) as string[];

    let loaded = false;
    for (const url of urls) {
      try {
        logger.info(`[التطوير] محاولة تحميل الرابط: ${url}`);
        await mainWindow.loadURL(url);
        loaded = true;
        break;
      } catch {
        logger.warn(`[التطوير] تعذر التحميل من ${url}`);
      }
    }

    if (!loaded) {
      if (fs.existsSync(prodFile)) {
        await mainWindow.loadFile(prodFile);
      } else if (fs.existsSync(fallbackProdFile)) {
        await mainWindow.loadFile(fallbackProdFile);
      }
    }
  } else {
    // In production: load file://dist/index.html
    if (fs.existsSync(prodFile)) {
      await mainWindow.loadFile(prodFile);
    } else if (fs.existsSync(fallbackProdFile)) {
      await mainWindow.loadFile(fallbackProdFile);
    } else {
      await mainWindow.loadURL(`file://${path.resolve(process.cwd(), 'dist', 'index.html')}`);
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
