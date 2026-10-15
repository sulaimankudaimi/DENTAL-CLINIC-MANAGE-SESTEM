// Safe dynamic electron import for both Electron runtime and Node test environments
let electronModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  electronModule = require('electron');
} catch {}
const dialog = electronModule?.dialog;
const BrowserWindow = electronModule?.BrowserWindow;
const shell = electronModule?.shell;
const app = electronModule?.app;
type BrowserWindow = any;
import fs from 'node:fs';
import path from 'node:path';
import { createBackup, restoreBackup, BackupOptions, BackupResult } from './backup.service';
import { logger } from './logger';
import { checkAppUpdatesManual, installUpdateNow } from './updater';

export interface OpenFileOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

export interface SaveFileOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  content?: string | Buffer;
}

export const systemService = {
  async openFile(browserWindow: BrowserWindow | null, options: OpenFileOptions = {}) {
    const window = browserWindow || BrowserWindow.getFocusedWindow();
    const result = window
      ? await dialog.showOpenDialog(window, {
          title: options.title || 'فتح ملف',
          defaultPath: options.defaultPath,
          buttonLabel: options.buttonLabel || 'اختيار',
          filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
          properties: ['openFile'],
        })
      : await dialog.showOpenDialog({
          title: options.title || 'فتح ملف',
          defaultPath: options.defaultPath,
          buttonLabel: options.buttonLabel || 'اختيار',
          filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
          properties: ['openFile'],
        });

    if (result.canceled || !result.filePaths[0]) {
      return { canceled: true };
    }

    const filePath = result.filePaths[0];
    const data = fs.readFileSync(filePath, 'utf8');
    return { canceled: false, filePath, data };
  },

  async saveFile(browserWindow: BrowserWindow | null, options: SaveFileOptions = {}) {
    const window = browserWindow || BrowserWindow.getFocusedWindow();
    const result = window
      ? await dialog.showSaveDialog(window, {
          title: options.title || 'حفظ الملف',
          defaultPath: options.defaultPath,
          buttonLabel: options.buttonLabel || 'حفظ',
          filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
        })
      : await dialog.showSaveDialog({
          title: options.title || 'حفظ الملف',
          defaultPath: options.defaultPath,
          buttonLabel: options.buttonLabel || 'حفظ',
          filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
        });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    if (options.content !== undefined) {
      fs.writeFileSync(result.filePath, options.content);
    }

    return { canceled: false, filePath: result.filePath };
  },

  async printDocument(browserWindow: BrowserWindow | null, options: Record<string, unknown> = {}) {
    const window = browserWindow || BrowserWindow.getFocusedWindow();
    if (!window) return { success: false, error: 'النافذة غير متاحة للطباعة' };

    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      window.webContents.print(
        {
          silent: false,
          printBackground: true,
          ...options,
        },
        (success: boolean, failureReason: string) => {
          if (!success) {
            resolve({ success: false, error: failureReason });
          } else {
            resolve({ success: true });
          }
        }
      );
    });
  },

  async exportPdf(browserWindow: BrowserWindow | null, targetPath?: string) {
    const window = browserWindow || BrowserWindow.getFocusedWindow();
    if (!window) return { success: false, error: 'النافذة غير متاحة لتصدير PDF' };

    try {
      const data = await window.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: {
          marginType: 'default',
        },
      });

      if (targetPath) {
        const resolvedPath = path.resolve(targetPath);
        const parentDir = path.dirname(resolvedPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(resolvedPath, data);
        return { success: true, filePath: resolvedPath };
      }

      // If no path specified, ask user
      const saveDialog = await dialog.showSaveDialog(window, {
        title: 'تصدير المستند كملف PDF',
        defaultPath: `eyadati_document_${Date.now()}.pdf`,
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      });

      if (saveDialog.canceled || !saveDialog.filePath) {
        return { success: false, canceled: true };
      }

      fs.writeFileSync(saveDialog.filePath, data);
      return { success: true, filePath: saveDialog.filePath };
    } catch (err: any) {
      logger.error('PDF Export Error:', err);
      return { success: false, error: err.message };
    }
  },

  getAppVersion(): string {
    return app.getVersion() || '2.4.0';
  },

  async checkForUpdates() {
    logger.info('فحص التحديثات البرمجية عبر خادم التحديثات...');
    return checkAppUpdatesManual();
  },

  installUpdateNow() {
    return installUpdateNow();
  },

  async backupNow(options: BackupOptions = {}): Promise<BackupResult> {
    return createBackup(options);
  },

  async restoreBackup(filePath: string, password?: string) {
    return restoreBackup(filePath, password);
  },

  showItemInFolder(fullPath: string) {
    if (fs.existsSync(fullPath)) {
      shell.showItemInFolder(fullPath);
      return true;
    }
    return false;
  },
};
