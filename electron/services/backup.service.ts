import path from 'node:path';
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import cron from 'node-cron';
// Safe dynamic electron import for both Electron runtime and Node test environments
let appInstance: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const electron = require('electron');
  appInstance = electron.app || electron.remote?.app;
} catch {}
import { getSqlite, getDatabasePath } from '../db/connection';
import { logger } from './logger';

export interface BackupOptions {
  destinationPath?: string;
  encrypt?: boolean;
  password?: string;
  compress?: boolean;
  isAuto?: boolean;
}

export interface BackupResult {
  ok: boolean;
  filePath?: string;
  fileName?: string;
  sizeBytes?: number;
  isEncrypted?: boolean;
  error?: string;
}

let activeCronTask: any = null;

// Determine default backups directory
export function getDefaultBackupsDirectory(): string {
  try {
    if (appInstance && typeof appInstance.getPath === 'function') {
      const userData = appInstance.getPath('userData');
      const backupsDir = path.join(userData, 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }
      return backupsDir;
    }
  } catch {}
  const fallbackDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
  }
  return fallbackDir;
}

// AES-256-GCM encryption with PBKDF2
function encryptBuffer(buffer: Buffer, password: string): Buffer {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Structure: [salt:16][iv:12][tag:16][ciphertext]
  return Buffer.concat([salt, iv, tag, encrypted]);
}

// AES-256-GCM decryption with PBKDF2
function decryptBuffer(encryptedBuffer: Buffer, password: string): Buffer {
  if (encryptedBuffer.length < 44) {
    throw new Error('الملف المشفر تالف أو غير صالح.');
  }

  const salt = encryptedBuffer.subarray(0, 16);
  const iv = encryptedBuffer.subarray(16, 28);
  const tag = encryptedBuffer.subarray(28, 44);
  const ciphertext = encryptedBuffer.subarray(44);

  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// Prune old backups
export function pruneOldBackups(directory: string, maxCopies: number = 14): void {
  try {
    if (!fs.existsSync(directory)) return;
    const files = fs
      .readdirSync(directory)
      .filter((f) => f.startsWith('eyadati_') && (f.endsWith('.db') || f.endsWith('.ebak') || f.endsWith('.gz')))
      .map((f) => ({
        name: f,
        fullPath: path.join(directory, f),
        mtime: fs.statSync(path.join(directory, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length > maxCopies) {
      const filesToDelete = files.slice(maxCopies);
      for (const item of filesToDelete) {
        fs.unlinkSync(item.fullPath);
        logger.info(`[نسخ احتياطي] حذف النسخة القديمة لتجاوز حد الاحتفاظ: ${item.name}`);
      }
    }
  } catch (err: any) {
    logger.warn(`[نسخ احتياطي] تحذير أثناء تطبيق سياسة الاحتفاظ بالنسخ: ${err.message}`);
  }
}

/**
 * Creates a safe backup of SQLite database using better-sqlite3 backup API
 */
export async function createBackup(options: BackupOptions = {}): Promise<BackupResult> {
  const sqlite = getSqlite();
  const baseDir = options.destinationPath && fs.existsSync(options.destinationPath)
    ? options.destinationPath
    : getDefaultBackupsDirectory();

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const prefix = options.isAuto ? 'eyadati_auto' : 'eyadati_manual';
  const tempDbBackupPath = path.join(baseDir, `temp_backup_${Date.now()}.db`);

  try {
    logger.info(`[نسخ احتياطي] بدء أخذ نسخة احتياطية آمنة عبر SQLite Backup API...`);

    // 1. Safe SQLite Backup API (Online, transactionally consistent snapshot)
    await sqlite.backup(tempDbBackupPath);

    // Read the safe snapshot
    let finalBuffer: any = fs.readFileSync(tempDbBackupPath);

    // Clean up temporary sqlite file
    if (fs.existsSync(tempDbBackupPath)) {
      fs.unlinkSync(tempDbBackupPath);
    }

    // 2. Compress with GZIP if requested (default true)
    const shouldCompress = options.compress !== false;
    if (shouldCompress) {
      finalBuffer = zlib.gzipSync(finalBuffer as any);
    }

    // 3. Encrypt with AES-256-GCM if password provided
    const shouldEncrypt = !!(options.encrypt && options.password);
    if (shouldEncrypt && options.password) {
      finalBuffer = encryptBuffer(finalBuffer as any, options.password);
    }

    const extension = shouldEncrypt ? 'ebak' : shouldCompress ? 'db.gz' : 'db';
    const finalFileName = `${prefix}_${dateStr}_${timeStr}.${extension}`;
    const finalFilePath = path.join(baseDir, finalFileName);

    fs.writeFileSync(finalFilePath, finalBuffer);

    // Prune old copies
    pruneOldBackups(baseDir, 14);

    const stats = fs.statSync(finalFilePath);
    logger.info(
      `[نسخ احتياطي] اكتملت النسخة الاحتياطية بنجاح: ${finalFileName} (${(stats.size / 1024).toFixed(1)} KB)`
    );

    return {
      ok: true,
      filePath: finalFilePath,
      fileName: finalFileName,
      sizeBytes: stats.size,
      isEncrypted: shouldEncrypt,
    };
  } catch (err: any) {
    if (fs.existsSync(tempDbBackupPath)) {
      try { fs.unlinkSync(tempDbBackupPath); } catch {}
    }
    logger.error(`[نسخ احتياطي] فشل إنشاء النسخة الاحتياطية: ${err.message}`, err);
    return {
      ok: false,
      error: err.message || 'فشل إنشاء النسخة الاحتياطية',
    };
  }
}

/**
 * Restores database from a backup file (.db, .db.gz, or .ebak)
 */
export async function restoreBackup(
  filePath: string,
  password?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!fs.existsSync(filePath)) {
      return { ok: false, error: 'ملف النسخة الاحتياطية غير موجود.' };
    }

    logger.info(`[استعادة] بدء استرجاع البيانات من: ${filePath}`);
    let fileBuffer: any = fs.readFileSync(filePath);

    // If file is encrypted (.ebak or starts with encrypted header)
    if (filePath.endsWith('.ebak') || (password && password.length > 0)) {
      if (!password) {
        return { ok: false, error: 'الملف مشفر. يرجى إدخال كلمة المرور الصحيحة لفك التشفير.' };
      }
      try {
        fileBuffer = decryptBuffer(fileBuffer as any, password);
      } catch (err: any) {
        logger.error(`[استعادة] فشل فك التشفير: ${err.message}`);
        return { ok: false, error: 'فشل فك التشفير. تأكد من صحة كلمة المرور المدخلة.' };
      }
    }

    // If gzipped, decompress
    try {
      if (fileBuffer[0] === 0x1f && fileBuffer[1] === 0x8b) {
        fileBuffer = zlib.gunzipSync(fileBuffer as any);
      }
    } catch {
      // Not gzipped or already decompressed
    }

    // Verify SQLite Header ("SQLite format 3\0")
    const header = fileBuffer.subarray(0, 16).toString('utf8');
    if (!header.startsWith('SQLite format 3')) {
      return { ok: false, error: 'الملف المسترجع تالف أو ليس قاعدة بيانات SQLite صالحة.' };
    }

    // Safely write to target database path
    const targetDbPath = getDatabasePath();
    const backupExistingPath = `${targetDbPath}.pre_restore_bak`;

    // Make safety copy of current db
    if (fs.existsSync(targetDbPath)) {
      fs.copyFileSync(targetDbPath, backupExistingPath);
    }

    try {
      fs.writeFileSync(targetDbPath, fileBuffer);
      // Remove stale WAL/SHM files
      const walPath = `${targetDbPath}-wal`;
      const shmPath = `${targetDbPath}-shm`;
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

      logger.info(`[استعادة] تم استرجاع قاعدة البيانات بنجاح.`);
      return { ok: true };
    } catch (writeErr: any) {
      // Rollback
      if (fs.existsSync(backupExistingPath)) {
        fs.copyFileSync(backupExistingPath, targetDbPath);
      }
      throw writeErr;
    }
  } catch (err: any) {
    logger.error(`[استعادة] فشل استعادة النسخة: ${err.message}`, err);
    return { ok: false, error: err.message || 'فشلت عملية الاستعادة' };
  }
}

/**
 * Configure automated scheduled backups via node-cron
 */
export function setupScheduledBackups(
  cronExpression: string = '30 23 * * *', // Daily at 23:30
  options: BackupOptions = { isAuto: true, compress: true }
): void {
  if (activeCronTask) {
    activeCronTask.stop();
    activeCronTask = null;
  }

  if (!cron.validate(cronExpression)) {
    logger.warn(`[نسخ مجدول] صيغة Cron غير صالحة: ${cronExpression}`);
    return;
  }

  activeCronTask = cron.schedule(cronExpression, async () => {
    logger.info(`[نسخ مجدول] تنفيذ النسخ الاحتياطي التلقائي المجدول...`);
    await createBackup(options);
  });

  logger.info(`[نسخ مجدول] تم تفعيل النسخ الاحتياطي الآلي بجدولة: ${cronExpression}`);
}

export default {
  createBackup,
  restoreBackup,
  setupScheduledBackups,
  getDefaultBackupsDirectory,
};
