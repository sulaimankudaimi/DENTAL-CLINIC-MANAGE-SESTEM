#!/usr/bin/env node
/**
 * أداة توليد وإدارة تراخيص نظام عيادتي (License Keygen Tool)
 * سكربت Node.js مستقل ومحمي، يُشغّل خارج حزمة التطبيق لأغراض إصدار المفاتيح والتراخيص.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const DEFAULT_PLANS = {
  basic: {
    features: [
      'patients',
      'appointments',
      'treatments',
      'billing',
      'odontogram',
      'prescriptions',
      'reports_basic',
    ],
    max_doctors: 1,
    max_devices: 1,
  },
  pro: {
    features: [
      'patients',
      'appointments',
      'treatments',
      'billing',
      'odontogram',
      'imaging',
      'prescriptions',
      'inventory',
      'insurance',
      'lab_orders',
      'reports_basic',
      'reports_advanced',
      'audit_log',
      'multi_doctor',
      'data_export',
      'zatca_einvoice',
    ],
    max_doctors: 5,
    max_devices: 5,
  },
  enterprise: {
    features: [
      'patients',
      'appointments',
      'treatments',
      'billing',
      'odontogram',
      'imaging',
      'prescriptions',
      'inventory',
      'insurance',
      'lab_orders',
      'reports_basic',
      'reports_advanced',
      'audit_log',
      'multi_doctor',
      'data_export',
      'zatca_einvoice',
    ],
    max_doctors: null,
    max_devices: null,
  },
};

function parseArgs(args) {
  const result = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const keyVal = arg.slice(2);
      if (keyVal.includes('=')) {
        const [k, ...rest] = keyVal.split('=');
        result[k] = rest.join('=');
      } else {
        const next = args[i + 1];
        if (next && !next.startsWith('--')) {
          result[keyVal] = next;
          i++;
        } else {
          result[keyVal] = true;
        }
      }
    } else {
      result._.push(arg);
    }
  }
  return result;
}

function resolveTilde(filePath) {
  if (filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

async function handleGenKeys(parsed) {
  const outDir = parsed.out || parsed.o;
  if (!outDir) {
    console.error('خطأ: يجب تحديد مجلد الإخراج عبر --out <المسار>');
    process.exit(1);
  }

  const resolvedOut = path.resolve(resolveTilde(outDir));
  const resolvedCwd = path.resolve(process.cwd());

  // التحقق الأمني الإلزامي: رفض الكتابة داخل مجلد المشروع
  if (resolvedOut === resolvedCwd || resolvedOut.startsWith(resolvedCwd + path.sep)) {
    console.error('خطأ أمني: ممنوع حفظ المفاتيح داخل مجلد المشروع لتجنب تسريب المفتاح الخاص.');
    process.exit(1);
  }

  fs.mkdirSync(resolvedOut, { recursive: true });

  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const publicPem = publicKey.export({ type: 'spki', format: 'pem' });

  const privateKeyPath = path.join(resolvedOut, 'private.pem');
  const publicKeyPath = path.join(resolvedOut, 'public.pem');

  fs.writeFileSync(privateKeyPath, privatePem, { mode: 0o600 });
  fs.writeFileSync(publicKeyPath, publicPem, { mode: 0o644 });

  console.log('=== تم توليد زوج مفاتيح التوقيع الرقمي (Ed25519) بنجاح ===');
  console.log(`تم حفظ المفتاح الخاص في: ${privateKeyPath} (محمي)`);
  console.log(`تم حفظ المفتاح العام في: ${publicKeyPath}\n`);
  console.log('--- المفتاح العام (Public Key PEM) ---');
  console.log(publicPem.trim());
  console.log('------------------------------------');
}

async function handleIssue(parsed) {
  const keyPath = parsed.key;
  const customer = parsed.customer;
  const plan = parsed.plan;
  const days = parsed.days;
  const fingerprint = parsed.fingerprint;

  if (!keyPath || !customer || !plan || !days || !fingerprint) {
    console.error('خطأ: المعلمات الإلزامية ناقصة:');
    console.error('المطلوب: --key <private.pem> --customer <اسم> --plan <basic|pro|enterprise> --days <عدد> --fingerprint <hex>');
    process.exit(1);
  }

  const resolvedKeyPath = path.resolve(resolveTilde(keyPath));
  if (!fs.existsSync(resolvedKeyPath)) {
    console.error(`خطأ: لم يتم العثور على ملف المفتاح الخاص: ${resolvedKeyPath}`);
    process.exit(1);
  }

  if (!DEFAULT_PLANS[plan]) {
    console.error(`خطأ: الباقة غير مدعومة (${plan}). الباقات المدعومة: basic, pro, enterprise`);
    process.exit(1);
  }

  const planDefaults = DEFAULT_PLANS[plan];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);

  let features = planDefaults.features;
  if (parsed.features) {
    features = parsed.features.split(',').map((f) => f.trim());
  }

  const payload = {
    version: 1,
    customer,
    plan,
    fingerprint,
    issued_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    max_doctors: parsed['max-doctors'] !== undefined ? Number(parsed['max-doctors']) : planDefaults.max_doctors,
    max_devices: parsed['max-devices'] !== undefined ? Number(parsed['max-devices']) : planDefaults.max_devices,
    features,
  };

  const payloadBytes = Buffer.from(JSON.stringify(payload), 'utf8');
  const privateKeyPem = fs.readFileSync(resolvedKeyPath, 'utf8');
  const signature = crypto.sign(null, payloadBytes, privateKeyPem);

  const token = `EYD1.${payloadBytes.toString('base64url')}.${signature.toString('base64url')}`;

  console.log('=== تم إصدار رمز الترخيص بنجاح ===');
  console.log(`العميل: ${customer}`);
  console.log(`الباقة: ${plan}`);
  console.log(`بصمة الجهاز: ${fingerprint}`);
  console.log(`تاريخ الإصدار: ${now.toLocaleDateString('ar-SA')} (${now.toISOString()})`);
  console.log(`تاريخ الانتهاء: ${expiresAt.toLocaleDateString('ar-SA')} (${expiresAt.toISOString()})`);
  console.log(`الأطباء: ${payload.max_doctors === null ? 'غير محدود' : payload.max_doctors}`);
  console.log(`الأجهزة: ${payload.max_devices === null ? 'غير محدود' : payload.max_devices}\n`);
  console.log('--- رمز الترخيص (License Token) ---');
  console.log(token);
  console.log('-----------------------------------');

  if (parsed.out) {
    const outLicPath = path.resolve(resolveTilde(parsed.out));
    fs.writeFileSync(outLicPath, token, 'utf8');
    console.log(`تم حفظ الرمز في الملف: ${outLicPath}`);
  }
}

async function handleInspect(parsed) {
  const token = parsed._[1] || parsed.token;
  if (!token) {
    console.error('خطأ: يجب تمرير رمز الترخيص المراد فحصه: inspect <token>');
    process.exit(1);
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    console.error('خطأ: بنية رمز الترخيص غير مكتملة.');
    process.exit(1);
  }

  const [version, payloadB64] = parts;
  if (version !== 'EYD1') {
    console.error(`تحذير: إصدار الرمز (${version}) قد لا يكون مدعوماً.`);
  }

  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const parsedPayload = JSON.parse(payloadJson);
    console.log('=== فحص محتوى ترخيص عيادتي (Inspect) ===');
    console.log(JSON.stringify(parsedPayload, null, 2));
  } catch (err) {
    console.error('خطأ في فك تشفير محتوى الترخيص:', err.message);
    process.exit(1);
  }
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const parsed = parseArgs(rawArgs);
  const command = parsed._[0];

  switch (command) {
    case 'gen-keys':
      await handleGenKeys(parsed);
      break;
    case 'issue':
      await handleIssue(parsed);
      break;
    case 'inspect':
      await handleInspect(parsed);
      break;
    default:
      console.log(`
أداة إدارة تراخيص عيادتي (Eyadati License Keygen)
الاستخدام:
  node tools/license-keygen.mjs gen-keys --out <المجلد>
  node tools/license-keygen.mjs issue --key <private.pem> --customer <اسم> --plan <basic|pro|enterprise> --days <عدد> --fingerprint <hex> [--max-doctors n] [--max-devices n] [--features a,b] [--out file.lic]
  node tools/license-keygen.mjs inspect <token>
`);
      break;
  }
}

main().catch((err) => {
  console.error('حدث خطأ غير متوقع:', err);
  process.exit(1);
});
