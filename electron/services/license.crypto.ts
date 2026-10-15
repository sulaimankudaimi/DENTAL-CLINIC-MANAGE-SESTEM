import crypto from 'node:crypto';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { LicensePayload } from '../../shared/license';

const execFileAsync = promisify(execFile);
const DEVICE_SALT = 'EYADATI-DEVICE-V1';

export class LicenseError extends Error {
  code: 'MALFORMED' | 'UNSUPPORTED_VERSION' | 'PUBLIC_KEY_NOT_CONFIGURED' | 'INVALID_SIGNATURE' | 'EXPIRED';

  constructor(message: string, code: 'MALFORMED' | 'UNSUPPORTED_VERSION' | 'PUBLIC_KEY_NOT_CONFIGURED' | 'INVALID_SIGNATURE' | 'EXPIRED') {
    super(message);
    this.name = 'LicenseError';
    this.code = code;
  }
}

export interface ParsedToken {
  payload: LicensePayload;
  payloadBytes: Buffer;
  signature: Buffer;
}

export interface VerifyTokenResult {
  valid: boolean;
  payload?: LicensePayload;
  error?: string;
}

/**
 * فك رمز الترخيص وتحليله إلى البيانات، البايتات الأصلية، والتوقيع الرقمي
 */
export function parseToken(token: string): ParsedToken {
  if (!token || typeof token !== 'string') {
    throw new LicenseError('رمز الترخيص فارغ أو غير صالح', 'MALFORMED');
  }

  const clean = token.trim();
  const parts = clean.split('.');

  if (parts.length !== 3) {
    throw new LicenseError('بنية رمز الترخيص غير مكتملة', 'MALFORMED');
  }

  const [version, payloadB64, sigB64] = parts;

  if (version !== 'EYD1') {
    throw new LicenseError(`إصدار رمز الترخيص غير مدعوم: ${version}`, 'UNSUPPORTED_VERSION');
  }

  let payloadBytes: Buffer;
  try {
    payloadBytes = Buffer.from(payloadB64, 'base64url');
    if (payloadBytes.length === 0) {
      throw new Error('Empty payload');
    }
  } catch {
    throw new LicenseError('فشل فك تشفير محتوى الترخيص', 'MALFORMED');
  }

  let payload: LicensePayload;
  try {
    payload = JSON.parse(payloadBytes.toString('utf8'));
  } catch {
    throw new LicenseError('صيغة بيانات الترخيص JSON غير صالحة', 'MALFORMED');
  }

  let signature: Buffer;
  try {
    signature = Buffer.from(sigB64, 'base64url');
    if (signature.length === 0) {
      throw new Error('Empty signature');
    }
  } catch {
    throw new LicenseError('التوقيع الرقمي للترخيص غير صالح أو فارغ', 'MALFORMED');
  }

  return { payload, payloadBytes, signature };
}

/**
 * التحقق من صحة التوقيع الرقمي للرمز باستخدام المفتاح العام (Ed25519)
 */
export function verifyToken(token: string, publicKeyPem: string): VerifyTokenResult {
  if (!publicKeyPem || publicKeyPem.trim() === '') {
    return {
      valid: false,
      error: 'PUBLIC_KEY_NOT_CONFIGURED',
    };
  }

  let parsed: ParsedToken;
  try {
    parsed = parseToken(token);
  } catch (err: any) {
    return {
      valid: false,
      error: err.code || 'MALFORMED',
    };
  }

  try {
    const isVerified = crypto.verify(
      null,
      parsed.payloadBytes,
      publicKeyPem,
      parsed.signature
    );

    if (!isVerified) {
      return {
        valid: false,
        payload: parsed.payload,
        error: 'INVALID_SIGNATURE',
      };
    }

    return {
      valid: true,
      payload: parsed.payload,
    };
  } catch (err: any) {
    return {
      valid: false,
      payload: parsed.payload,
      error: err.code || 'INVALID_SIGNATURE',
    };
  }
}

/**
 * استخراج بصمة الجهاز الثابتة بطريقة آمنة
 * على Windows: استعلام MachineGuid عبر reg query
 * عند الفشل أو في بيئات أخرى: دمج معرّفات الجهاز الأساسية مع ملح ثابت
 */
export async function getDeviceFingerprint(): Promise<string> {
  let rawIdentifier = '';

  if (process.platform === 'win32') {
    try {
      const { stdout } = await execFileAsync('reg', [
        'query',
        'HKLM\\SOFTWARE\\Microsoft\\Cryptography',
        '/v',
        'MachineGuid',
      ], { timeout: 3000 });

      const match = stdout.match(/MachineGuid\s+REG_SZ\s+([a-zA-Z0-9-]+)/i);
      if (match && match[1]) {
        rawIdentifier = match[1].trim();
      }
    } catch {
      // التراجع إلى البديل الآمن عند فشل الاستعلام
    }
  }

  if (!rawIdentifier) {
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'unknown_cpu';
    rawIdentifier = `${os.hostname()}::${cpuModel}::${os.totalmem()}::${os.platform()}`;
  }

  return crypto
    .createHash('sha256')
    .update(rawIdentifier + DEVICE_SALT)
    .digest('hex');
}
