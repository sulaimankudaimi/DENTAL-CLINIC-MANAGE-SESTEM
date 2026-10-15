import crypto from 'node:crypto';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import {
  evaluateLicense,
  formatDeviceCode,
  PLAN_DEFS,
  type LicenseStatus,
} from '../../shared/license';
import {
  verifyToken,
  getDeviceFingerprint,
} from './license.crypto';
import { LICENSE_PUBLIC_KEY_PEM } from './license.publicKey';
import { getSqlite } from '../db/connection';
import { logger } from './logger';

export interface StoredLicenseData {
  token: string;
  license_code?: string;
  saved_at: string;
  last_validated_at?: string;
  suspended_at?: string | null;
  server_status?: string;
}

export interface LicenseStatusResult extends LicenseStatus {
  license_code?: string;
  is_online_available: boolean;
  device_code: string;
}

const STORAGE_SALT = 'EYADATI-LIC-STORAGE-V1';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * الحصول على عنوان خادم التراخيص
 * يُقرأ من متغير البيئة وقت البناء (define) أو من process.env وقت التطوير
 */
export function getServerUrl(): string {
  if (typeof process !== 'undefined' && process.env?.LICENSE_SERVER_URL) {
    return process.env.LICENSE_SERVER_URL.trim();
  }
  return '';
}

export function isOnlineActivationAvailable(): boolean {
  return Boolean(getServerUrl());
}

export function getLicensePublicKey(): string {
  if (process.env.LICENSE_PUBLIC_KEY_PEM && process.env.LICENSE_PUBLIC_KEY_PEM.trim()) {
    return process.env.LICENSE_PUBLIC_KEY_PEM.trim();
  }
  return LICENSE_PUBLIC_KEY_PEM;
}

export function getLicenseFilePath(): string {
  if (process.env.LICENSE_DAT_PATH) {
    return process.env.LICENSE_DAT_PATH;
  }
  try {
    const electron = require('electron');
    const app = electron?.app;
    if (app && typeof app.getPath === 'function') {
      return path.join(app.getPath('userData'), 'license.dat');
    }
  } catch {}
  return path.join(process.cwd(), 'data', 'license.dat');
}

/**
 * اشتقاق مفتاح التشفير المتناظر AES-256-GCM بناءً على بصمة الجهاز
 */
async function deriveStorageKey(): Promise<Buffer> {
  const fp = await getDeviceFingerprint();
  return crypto.createHash('sha256').update(fp + STORAGE_SALT).digest();
}

/**
 * قراءة ملف الترخيص المشفر license.dat
 */
export async function readStoredLicense(): Promise<StoredLicenseData | null> {
  const filePath = getLicenseFilePath();
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath);
    if (raw.length < 28) return null; // 12 iv + 16 tag + ciphertext

    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);

    const key = await deriveStorageKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8')) as StoredLicenseData;
  } catch (err) {
    logger.warn('[الترخيص] فشل فك تشفير ملف license.dat المحلي:', err);
    return null;
  }
}

/**
 * حفظ ملف الترخيص المشفر license.dat
 */
export async function writeStoredLicense(data: StoredLicenseData): Promise<void> {
  const filePath = getLicenseFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const key = await deriveStorageKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const jsonStr = JSON.stringify(data);
  const ciphertext = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, tag, ciphertext]);
  fs.writeFileSync(filePath, combined);
}

/**
 * حذف ملف الترخيص المشفر محلياً
 */
export async function removeStoredLicense(): Promise<void> {
  const filePath = getLicenseFilePath();
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      logger.warn('[الترخيص] تعذر حذف ملف license.dat:', err);
    }
  }
}

/**
 * جلب كود الجهاز بصيغة العرض المقسمة
 */
export async function getFormattedDeviceCode(): Promise<string> {
  const fp = await getDeviceFingerprint();
  return formatDeviceCode(fp);
}

/**
 * تقييم حالة الترخيص الحالية مع دمج كود الترخيص وحالة الخادم
 */
export async function getStatus(): Promise<LicenseStatusResult> {
  const fp = await getDeviceFingerprint();
  const stored = await readStoredLicense();
  const onlineAvail = isOnlineActivationAvailable();
  const deviceCode = formatDeviceCode(fp);

  if (!stored || !stored.token) {
    // فحص قاعدة البيانات المحلية كخطة احتياطية
    let dbRow: any = null;
    try {
      const sqlite = getSqlite();
      dbRow = sqlite.prepare('SELECT * FROM license LIMIT 1').get();
    } catch {}

    const evalInput = {
      payload: null,
      trial_started_at: dbRow?.trial_started_at || null,
      last_seen_at: dbRow?.last_seen_at || null,
      fingerprint_matches: null,
      signature_valid: null,
    };
    const evaluated = evaluateLicense(evalInput);
    return {
      ...evaluated,
      is_online_available: onlineAvail,
      device_code: deviceCode,
    };
  }

  // تحقق محلي من الرمز المخزن
  const pubKey = getLicensePublicKey();
  const verifyRes = verifyToken(stored.token, pubKey);

  const evalInput = {
    payload: verifyRes.payload || null,
    trial_started_at: null,
    last_seen_at: stored.saved_at || null,
    fingerprint_matches: verifyRes.payload ? verifyRes.payload.fingerprint === fp : false,
    signature_valid: verifyRes.valid,
  };

  const evaluated = evaluateLicense(evalInput);

  // إذا كانت الحالة موقفة من الخادم (suspended / cancelled / revoked):
  if (stored.suspended_at) {
    const suspendedMs = new Date(stored.suspended_at).getTime();
    const elapsedMs = Date.now() - suspendedMs;
    const graceEndMs = 7 * MS_PER_DAY;

    if (elapsedMs <= graceEndMs) {
      const daysLeft = Math.max(1, Math.ceil((graceEndMs - elapsedMs) / MS_PER_DAY));
      return {
        ...evaluated,
        state: 'grace',
        can_write: true,
        message_ar: `تم إيقاف هذا الترخيص من قبل إدارة الخادم. أنت حالياً في فترة السماح المؤقتة (متبقي ${daysLeft} يوم) لتسوية الحساب.`,
        license_code: stored.license_code,
        is_online_available: onlineAvail,
        device_code: deviceCode,
      };
    } else {
      return {
        ...evaluated,
        state: 'read_only',
        can_write: false,
        message_ar: 'تم إيقاف هذا الترخيص من قبل إدارة النظام وانتهت فترة السماح. النظام في وضع القراءة فقط.',
        license_code: stored.license_code,
        is_online_available: onlineAvail,
        device_code: deviceCode,
      };
    }
  }

  return {
    ...evaluated,
    license_code: stored.license_code,
    is_online_available: onlineAvail,
    device_code: deviceCode,
  };
}

/**
 * التفعيل اليدوي بالرمز (دون اتصال أو بعد استلام الرمز)
 * التحقق بالمفتاح العام إلزامي
 */
export async function activate(token: string, licenseCode?: string): Promise<LicenseStatus> {
  if (!token || typeof token !== 'string') {
    throw new Error('رمز الترخيص فارغ أو غير صالح.');
  }

  const pubKey = getLicensePublicKey();
  const verifyRes = verifyToken(token, pubKey);
  if (!verifyRes.valid || !verifyRes.payload) {
    if (verifyRes.error === 'PUBLIC_KEY_NOT_CONFIGURED') {
      throw new Error('المفتاح العام لنظام التراخيص غير مهيأ في هذا الإصدار.');
    }
    if (verifyRes.error === 'INVALID_SIGNATURE') {
      throw new Error('التوقيع الرقمي لرمز الترخيص غير صالح أو مزوّر.');
    }
    throw new Error('رمز الترخيص تالف أو غير متوافق.');
  }

  const fp = await getDeviceFingerprint();
  if (verifyRes.payload.fingerprint !== fp) {
    throw new Error('رمز الترخيص هذا صادر لجهاز آخر ولا يتطابق مع بصمة هذا الجهاز.');
  }

  const payload = verifyRes.payload;
  const now = new Date();
  if (new Date(payload.expires_at).getTime() < now.getTime()) {
    throw new Error('رمز الترخيص منتهي الصلاحية مسبقاً.');
  }

  // حفظ في license.dat
  const storedData: StoredLicenseData = {
    token: token.trim(),
    license_code: licenseCode ? licenseCode.trim() : undefined,
    saved_at: now.toISOString(),
    last_validated_at: now.toISOString(),
    suspended_at: null,
    server_status: 'ok',
  };
  await writeStoredLicense(storedData);

  // مزامنة مع جدول SQLite license إن وجد
  try {
    const sqlite = getSqlite();
    const clinicRow = sqlite.prepare('SELECT id FROM clinics LIMIT 1').get() as { id: string } | undefined;
    if (clinicRow?.id) {
      sqlite.prepare('DELETE FROM license WHERE clinic_id = ?').run(clinicRow.id);
      const cols = sqlite.prepare('PRAGMA table_info(license)').all() as Array<{ name: string }>;
      const hasTokenHint = cols.some((c) => c.name === 'token_hint');
      if (hasTokenHint) {
        sqlite.prepare(`
          INSERT INTO license (
            id, clinic_id, created_at, updated_at, deleted_at,
            key, plan, seats, activated_at, expires_at, device_fingerprint,
            last_check_at, signature, token_hint, customer, features,
            max_doctors, max_devices, state_cache, last_seen_at
          ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          crypto.randomUUID(),
          clinicRow.id,
          now.toISOString(),
          now.toISOString(),
          licenseCode || 'MANUAL-TOKEN',
          payload.plan,
          1,
          payload.issued_at,
          payload.expires_at,
          fp,
          now.toISOString(),
          'VERIFIED',
          token.slice(0, 16) + '...',
          payload.customer,
          JSON.stringify(payload.features || PLAN_DEFS[payload.plan]?.default_features || []),
          payload.max_doctors || null,
          payload.max_devices || null,
          'active',
          now.toISOString()
        );
      } else {
        sqlite.prepare(`
          INSERT INTO license (
            id, clinic_id, created_at, updated_at, deleted_at,
            key, plan, seats, activated_at, expires_at, device_fingerprint,
            last_check_at, signature
          ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          crypto.randomUUID(),
          clinicRow.id,
          now.toISOString(),
          now.toISOString(),
          licenseCode || 'MANUAL-TOKEN',
          payload.plan,
          1,
          payload.issued_at,
          payload.expires_at,
          fp,
          now.toISOString(),
          'VERIFIED'
        );
      }
    }
  } catch (err) {
    logger.warn('[الترخيص] تحذير أثناء مزامنة جدول license:', err);
  }

  const evaluated = evaluateLicense({
    payload,
    trial_started_at: null,
    last_seen_at: now.toISOString(),
    fingerprint_matches: true,
    signature_valid: true,
  });

  return evaluated;
}

/**
 * التفعيل عبر الإنترنت بالكود
 */
export async function activateOnline(code: string): Promise<LicenseStatus> {
  const cleanCode = (code || '').trim();
  if (!cleanCode) {
    throw new Error('يرجى إدخال كود الترخيص.');
  }

  const serverUrl = getServerUrl();
  if (!serverUrl) {
    throw new Error('خدمة التفعيل عبر الإنترنت غير مهيأة في هذه النسخة لعدم توفر عنوان الخادم.');
  }

  let urlObj: URL;
  try {
    urlObj = new URL('/v1/activate', serverUrl);
  } catch {
    throw new Error('عنوان خادم التراخيص غير صالح.');
  }

  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  if (!isDev && urlObj.protocol !== 'https:') {
    throw new Error('اتصال غير آمن: يجب أن يكون خادم التراخيص عبر بروتوكول HTTPS خارج بيئة التطوير.');
  }

  const fingerprint = await getDeviceFingerprint();
  const device_name = (os.hostname() || 'Unknown-Device').slice(0, 50);
  const app_version = '2.4.0';

  // الحقول المسموحة حصراً: لا يُرسل أي بيان مريض أو عيادة
  const requestBody = JSON.stringify({
    license_code: cleanCode,
    fingerprint,
    device_name,
    app_version,
  });

  let response: Response;
  try {
    response = await fetch(urlObj.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: requestBody,
      signal: AbortSignal.timeout(15000),
    });
  } catch (fetchErr: any) {
    if (fetchErr.name === 'TimeoutError' || fetchErr.code === 23) {
      throw new Error('انتهت مهلة الاتصال بخادم التراخيص (15 ثانية). يرجى التحقق من اتصال الإنترنت.');
    }
    throw new Error('تعذر الاتصال بخادم التراخيص. يرجى التحقق من اتصال الإنترنت.');
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error('استجابة غير صالحة من خادم التراخيص.');
  }

  if (!response.ok || data.error) {
    const errCode = (data.error || data.code || '').toUpperCase();
    const serverMsg = data.message;
    switch (errCode) {
      case 'INVALID_CODE':
        throw new Error('كود الترخيص المدخل غير صحيح أو غير مسجل.');
      case 'SUSPENDED':
        throw new Error('تم تعليق هذا الترخيص من قبل إدارة النظام.');
      case 'EXPIRED':
        throw new Error('انتهت صلاحية هذا الترخيص.');
      case 'DEVICE_LIMIT':
        throw new Error('تم تجاوز الحد الأقصى لعدد الأجهزة المسموح بتفعيلها لهذا الترخيص.');
      default:
        throw new Error(serverMsg || `فشل التفعيل عبر الخادم: ${errCode || response.statusText}`);
    }
  }

  const receivedToken = data.token || data.license_token;
  if (!receivedToken || typeof receivedToken !== 'string') {
    throw new Error('لم يرجع خادم التراخيص رمز ترخيص صالحاً.');
  }

  // تمرير الرمز المستلم عبر المسار نفسه لـ activate(token) للتحقق المحلي الإلزامي بالمفتاح العام
  return activate(receivedToken, cleanCode);
}

/**
 * التجديد والتحقق الدوري التلقائي (/v1/validate)
 * فشل الشبكة لا يؤثر على الاستخدام: يستمر العمل بالرمز الحالي حتى expires_at
 */
export async function validateRenewal(): Promise<{ status: 'ok' | 'skipped' | 'suspended' | 'error'; message?: string }> {
  const serverUrl = getServerUrl();
  if (!serverUrl) return { status: 'skipped', message: 'خادم التراخيص غير مهيأ' };

  const stored = await readStoredLicense();
  if (!stored || !stored.token || !stored.license_code) {
    return { status: 'skipped', message: 'لا يوجد ترخيص برمز تفعيل أونلاين مسجل' };
  }

  const fingerprint = await getDeviceFingerprint();
  const urlObj = new URL('/v1/validate', serverUrl);
  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  if (!isDev && urlObj.protocol !== 'https:') {
    return { status: 'error', message: 'بروتوكول غير آمن' };
  }

  let res: Response;
  try {
    res = await fetch(urlObj.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        license_code: stored.license_code,
        token: stored.token,
        fingerprint,
        app_version: '2.4.0',
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    // فشل الشبكة لا يؤثر على الاستخدام
    return { status: 'skipped', message: 'تعذر الاتصال بالشبكة؛ استمرار العمل بالترخيص الحالي دون تغيير' };
  }

  try {
    const data = await res.json();
    const errCode = (data.error || data.status || '').toUpperCase();

    if (!res.ok || data.error) {
      if (errCode === 'SUSPENDED' || errCode === 'CANCELLED' || errCode === 'REVOKED') {
        if (!stored.suspended_at) {
          stored.suspended_at = new Date().toISOString();
        }
        stored.server_status = errCode;
        stored.last_validated_at = new Date().toISOString();
        await writeStoredLicense(stored);
        return { status: 'suspended', message: 'تم إيقاف الترخيص من قبل الخادم' };
      }
      return { status: 'error', message: data.message || errCode };
    }

    const statusVal = (data.status || '').toLowerCase();
    if (statusVal === 'suspended' || statusVal === 'cancelled' || statusVal === 'revoked') {
      if (!stored.suspended_at) {
        stored.suspended_at = new Date().toISOString();
      }
      stored.server_status = statusVal;
      stored.last_validated_at = new Date().toISOString();
      await writeStoredLicense(stored);
      return { status: 'suspended', message: 'تم إيقاف الترخيص من قبل الخادم' };
    }

    const newToken = data.token || data.license_token;
    if (newToken && typeof newToken === 'string') {
      const verifyRes = verifyToken(newToken, getLicensePublicKey());
      if (verifyRes.valid) {
        stored.token = newToken;
        stored.suspended_at = null;
        stored.server_status = 'ok';
        stored.last_validated_at = new Date().toISOString();
        await writeStoredLicense(stored);
        return { status: 'ok', message: 'تم تجديد رمز الترخيص بنجاح' };
      }
    } else {
      stored.suspended_at = null;
      stored.server_status = 'ok';
      stored.last_validated_at = new Date().toISOString();
      await writeStoredLicense(stored);
      return { status: 'ok', message: 'الترخيص سارٍ ومعتمد' };
    }
  } catch {
    return { status: 'skipped', message: 'فشل تحليل رد خادم التراخيص' };
  }

  return { status: 'ok' };
}

/**
 * إلغاء التفعيل: يستدعي /v1/deactivate إن أمكن (تجاهل فشله) ثم يحذف محلياً
 */
export async function deactivate(): Promise<{ ok: boolean; message: string }> {
  const stored = await readStoredLicense();
  const serverUrl = getServerUrl();

  if (serverUrl && stored?.license_code) {
    try {
      const fingerprint = await getDeviceFingerprint();
      const urlObj = new URL('/v1/deactivate', serverUrl);
      const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
      if (isDev || urlObj.protocol === 'https:') {
        await fetch(urlObj.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            license_code: stored.license_code,
            token: stored.token,
            fingerprint,
          }),
          signal: AbortSignal.timeout(10000),
        });
      }
    } catch {
      // تجاهل فشله
    }
  }

  await removeStoredLicense();

  try {
    const sqlite = getSqlite();
    sqlite.prepare('DELETE FROM license').run();
  } catch {}

  return { ok: true, message: 'تم إلغاء تفعيل الترخيص وحذفه محلياً بنجاح.' };
}

let renewalInterval: NodeJS.Timeout | null = null;

export function startLicenseRenewalScheduler(): void {
  if (renewalInterval) return;

  // فحص أولي بعد 15 ثانية من إقلاع التطبيق
  setTimeout(() => {
    validateRenewal().catch(() => {});
  }, 15000);

  // تكرار كل 24 ساعة
  renewalInterval = setInterval(() => {
    validateRenewal().catch(() => {});
  }, 24 * 60 * 60 * 1000);
}

export function stopLicenseRenewalScheduler(): void {
  if (renewalInterval) {
    clearInterval(renewalInterval);
    renewalInterval = null;
  }
}
