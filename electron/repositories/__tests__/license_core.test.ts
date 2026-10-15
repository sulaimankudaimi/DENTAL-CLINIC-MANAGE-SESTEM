import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import {
  evaluateLicense,
  isActionAllowed,
  formatDeviceCode,
  PLAN_DEFS,
  type LicensePayload,
  type LicenseStatus,
} from '../../../shared/license';

import http from 'node:http';
import {
  parseToken,
  verifyToken,
  getDeviceFingerprint,
} from '../../services/license.crypto';
import {
  activateOnline,
  validateRenewal,
  getStatus,
  deactivate,
  activate,
} from '../../services/license.service';

const execFileAsync = promisify(execFile);

describe('License Core & Cryptography Tests', () => {
  // توليد زوج مفاتيح مخصص للاختبار داخل الذاكرة
  const testKeyPair = crypto.generateKeyPairSync('ed25519');
  const testPrivatePem = testKeyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
  const testPublicPem = testKeyPair.publicKey.export({ type: 'spki', format: 'pem' }) as string;

  // زوج مفاتيح آخر للاختبار السلبي (مفتاح مختلف)
  const otherKeyPair = crypto.generateKeyPairSync('ed25519');
  const otherPrivatePem = otherKeyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

  const validPayload: LicensePayload = {
    version: 1,
    customer: 'عيادة د. أحمد الراشد لطب الأسنان',
    plan: 'pro',
    fingerprint: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    issued_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    max_doctors: 5,
    max_devices: 5,
    features: PLAN_DEFS.pro.default_features,
  };

  function signPayload(payload: LicensePayload, privPem: string, version = 'EYD1'): string {
    const payloadBytes = Buffer.from(JSON.stringify(payload), 'utf8');
    const signature = crypto.sign(null, payloadBytes, privPem);
    return `${version}.${payloadBytes.toString('base64url')}.${signature.toString('base64url')}`;
  }

  describe('1. Token Parsing & Cryptographic Verification', () => {
    it('رمز صالح بمفتاح اختبار مولّد داخل الاختبار يمر بنجاح (valid = true)', () => {
      const token = signPayload(validPayload, testPrivatePem);
      const res = verifyToken(token, testPublicPem);

      assert.equal(res.valid, true);
      assert.ok(res.payload);
      assert.equal(res.payload.customer, validPayload.customer);
      assert.equal(res.payload.plan, 'pro');
    });

    it('تعديل حرف واحد في الـ payload يُبطل التوقيع فوراً (valid = false)', () => {
      const token = signPayload(validPayload, testPrivatePem);
      const parts = token.split('.');
      // تغيير أول حرف في البايلود المشفر
      const tamperedB64 = (parts[1][0] === 'a' ? 'b' : 'a') + parts[1].slice(1);
      const tamperedToken = `${parts[0]}.${tamperedB64}.${parts[2]}`;

      const res = verifyToken(tamperedToken, testPublicPem);
      assert.equal(res.valid, false);
      assert.ok(res.error);
    });

    it('توقيع قادم من مفتاح خاص آخر يُرفض فوراً', () => {
      const tokenFromOther = signPayload(validPayload, otherPrivatePem);
      const res = verifyToken(tokenFromOther, testPublicPem);

      assert.equal(res.valid, false);
      assert.equal(res.error, 'INVALID_SIGNATURE');
    });

    it('رمز مقطوع أو غير مكتمل يرمي خطأ MALFORMED', () => {
      assert.throws(
        () => parseToken('EYD1.only-two-parts'),
        (err: any) => err.code === 'MALFORMED'
      );

      const res = verifyToken('invalid.token', testPublicPem);
      assert.equal(res.valid, false);
      assert.equal(res.error, 'MALFORMED');
    });

    it('إصدار رمز غير مدعوم يرمي خطأ UNSUPPORTED_VERSION', () => {
      const tokenV2 = signPayload(validPayload, testPrivatePem, 'EYD2');
      assert.throws(
        () => parseToken(tokenV2),
        (err: any) => err.code === 'UNSUPPORTED_VERSION'
      );

      const res = verifyToken(tokenV2, testPublicPem);
      assert.equal(res.valid, false);
      assert.equal(res.error, 'UNSUPPORTED_VERSION');
    });

    it('مفتاح عام فارغ يُرجع خطأ PUBLIC_KEY_NOT_CONFIGURED دون انهيار', () => {
      const token = signPayload(validPayload, testPrivatePem);
      const res = verifyToken(token, '');

      assert.equal(res.valid, false);
      assert.equal(res.error, 'PUBLIC_KEY_NOT_CONFIGURED');
    });
  });

  describe('2. evaluateLicense Rules & Lifecycle States', () => {
    const baseNow = new Date('2026-10-08T12:00:00.000Z');

    it('اليوم 13 و 14 من التجربة يكون state: trial مع can_write: true', () => {
      // التجربة بدأت قبل 13 يوماً
      const started13DaysAgo = new Date(baseNow.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString();
      const status13 = evaluateLicense(
        {
          payload: null,
          trial_started_at: started13DaysAgo,
          last_seen_at: baseNow.toISOString(),
          fingerprint_matches: null,
          signature_valid: null,
        },
        baseNow
      );

      assert.equal(status13.state, 'trial');
      assert.equal(status13.can_write, true);
      assert.ok(status13.days_left >= 1);

      // اليوم 14 (بالضبط 14 يوماً)
      const started14DaysAgo = new Date(baseNow.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const status14 = evaluateLicense(
        {
          payload: null,
          trial_started_at: started14DaysAgo,
          last_seen_at: baseNow.toISOString(),
          fingerprint_matches: null,
          signature_valid: null,
        },
        baseNow
      );

      assert.equal(status14.state, 'trial');
      assert.equal(status14.can_write, true);
    });

    it('اليوم 15 من التجربة يتحول إلى state: read_only مع can_write: false', () => {
      const started15DaysAgo = new Date(baseNow.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
      const status15 = evaluateLicense(
        {
          payload: null,
          trial_started_at: started15DaysAgo,
          last_seen_at: baseNow.toISOString(),
          fingerprint_matches: null,
          signature_valid: null,
        },
        baseNow
      );

      assert.equal(status15.state, 'read_only');
      assert.equal(status15.can_write, false);
      assert.ok(status15.message_ar.includes('انتهت الفترة التجريبية'));
    });

    it('اليوم 7 من فترة السماح بعد انتهاء الترخيص يكون grace مع can_write: true', () => {
      // انتهى الترخيص قبل 6 أيام (أي في اليوم السابع من فترة السماح)
      const expired6DaysAgo = new Date(baseNow.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
      const expiredPayload: LicensePayload = {
        ...validPayload,
        expires_at: expired6DaysAgo,
      };

      const statusGrace = evaluateLicense(
        {
          payload: expiredPayload,
          trial_started_at: null,
          last_seen_at: baseNow.toISOString(),
          fingerprint_matches: true,
          signature_valid: true,
        },
        baseNow
      );

      assert.equal(statusGrace.state, 'grace');
      assert.equal(statusGrace.can_write, true);
      assert.ok(statusGrace.grace_days_left >= 1);
      assert.ok(statusGrace.message_ar.includes('فترة السماح'));
    });

    it('اليوم 8 بعد انتهاء الترخيص (تجاوز فترة السماح) يتحول إلى read_only مع can_write: false', () => {
      // انتهى الترخيص قبل 8 أيام
      const expired8DaysAgo = new Date(baseNow.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
      const expiredPayload: LicensePayload = {
        ...validPayload,
        expires_at: expired8DaysAgo,
      };

      const statusReadOnly = evaluateLicense(
        {
          payload: expiredPayload,
          trial_started_at: null,
          last_seen_at: baseNow.toISOString(),
          fingerprint_matches: true,
          signature_valid: true,
        },
        baseNow
      );

      assert.equal(statusReadOnly.state, 'read_only');
      assert.equal(statusReadOnly.can_write, false);
      assert.equal(statusReadOnly.grace_days_left, 0);
      assert.ok(statusReadOnly.message_ar.includes('انتهت صلاحية الترخيص وفترة السماح'));
    });

    it('الرجوع في الساعة 25 ساعة للوراء يكشف التلاعب (clock_tampered) ويمنع الكتابة', () => {
      const lastSeen = new Date(baseNow.getTime() + 25 * 60 * 60 * 1000).toISOString();
      const statusTampered = evaluateLicense(
        {
          payload: validPayload,
          trial_started_at: null,
          last_seen_at: lastSeen,
          fingerprint_matches: true,
          signature_valid: true,
        },
        baseNow
      );

      assert.equal(statusTampered.state, 'clock_tampered');
      assert.equal(statusTampered.can_write, false);
      assert.ok(statusTampered.message_ar.includes('تلاعب'));
    });

    it('عدم تطابق البصمة أو تزوير التوقيع ينتج حالة invalid ويمنع الكتابة', () => {
      const statusInvalid = evaluateLicense(
        {
          payload: validPayload,
          trial_started_at: null,
          last_seen_at: baseNow.toISOString(),
          fingerprint_matches: false,
          signature_valid: true,
        },
        baseNow
      );

      assert.equal(statusInvalid.state, 'invalid');
      assert.equal(statusInvalid.can_write, false);
      assert.ok(statusInvalid.message_ar.includes('بصمة الجهاز'));
    });

    it('غياب الرمز وغياب التجربة ينتج حالة read_only مع رسالة "لم يبدأ الترخيص"', () => {
      const statusNoLicense = evaluateLicense(
        {
          payload: null,
          trial_started_at: null,
          last_seen_at: null,
          fingerprint_matches: null,
          signature_valid: null,
        },
        baseNow
      );

      assert.equal(statusNoLicense.state, 'read_only');
      assert.equal(statusNoLicense.can_write, false);
      assert.equal(statusNoLicense.message_ar, 'لم يبدأ الترخيص');
    });
  });

  describe('3. isActionAllowed Restrictions', () => {
    const activeStatus: LicenseStatus = {
      state: 'active',
      plan: 'basic',
      customer: 'عيادة تجريبية',
      expires_at: '2026-12-31T00:00:00.000Z',
      days_left: 60,
      grace_days_left: 7,
      features: ['patients', 'appointments', 'billing', 'reports_basic'],
      limits: { max_doctors: 1, max_patients: 1000 },
      message_ar: 'نشط',
      can_write: true,
    };

    const readOnlyStatus: LicenseStatus = {
      ...activeStatus,
      state: 'read_only',
      can_write: false,
      message_ar: 'وضع القراءة فقط',
    };

    const graceStatus: LicenseStatus = {
      ...activeStatus,
      state: 'grace',
      can_write: true,
      message_ar: 'فترة سماح',
    };

    it('في وضع read_only: منع الإنشاء والتعديل والحذف والسماح بالعرض والتصدير والنسخ الاحتياطي والترخيص', () => {
      // منع العمليات الكتابية
      assert.equal(isActionAllowed(readOnlyStatus, 'patients', 'create').allowed, false);
      assert.equal(isActionAllowed(readOnlyStatus, 'invoices', 'update').allowed, false);
      assert.equal(isActionAllowed(readOnlyStatus, 'appointments', 'delete').allowed, false);

      // السماح بالقراءة والتصدير
      assert.equal(isActionAllowed(readOnlyStatus, 'patients', 'view').allowed, true);
      assert.equal(isActionAllowed(readOnlyStatus, 'invoices', 'export').allowed, true);

      // السماح بموارد التحكم والترخيص والنسخ الاحتياطي
      assert.equal(isActionAllowed(readOnlyStatus, 'auth', 'login').allowed, true);
      assert.equal(isActionAllowed(readOnlyStatus, 'license', 'activate').allowed, true);
      assert.equal(isActionAllowed(readOnlyStatus, 'backup', 'create').allowed, true);
    });

    it('الميزة غير المتضمنة في الباقة تُرفض برسالة دقيقة', () => {
      // الباقة Basic لا تشمل 'imaging' أو 'audit_log'
      const check1 = isActionAllowed(activeStatus, 'imaging', 'view', 'imaging');
      assert.equal(check1.allowed, false);
      assert.equal(check1.reason, 'هذه الميزة غير متضمنة في باقتك الحالية');

      // الميزة المتضمنة تمر بنجاح
      const check2 = isActionAllowed(activeStatus, 'patients', 'create', 'patients');
      assert.equal(check2.allowed, true);
    });

    it('في فترة السماح (grace): يُسمح بالعمليات الكتابية', () => {
      assert.equal(isActionAllowed(graceStatus, 'patients', 'create', 'patients').allowed, true);
      assert.equal(isActionAllowed(graceStatus, 'invoices', 'create', 'billing').allowed, true);
    });
  });

  describe('4. getDeviceFingerprint & formatDeviceCode', () => {
    it('بصمة الجهاز ثابتة عبر استدعاءين متتاليين وطولها 64 حرف hex', async () => {
      const fp1 = await getDeviceFingerprint();
      const fp2 = await getDeviceFingerprint();

      assert.equal(fp1, fp2, 'بصمة الجهاز يجب أن تكون مطابقة عبر الاستدعاءات');
      assert.equal(fp1.length, 64, 'طول بصمة SHA-256 يجب أن يكون 64 حرفاً');
      assert.match(fp1, /^[0-9a-f]{64}$/i);
    });

    it('تنسيق كود الجهاز يعرض أول 20 حرفاً مقسمة بمجموعات رباعية تفصلها شرطات', () => {
      const code = formatDeviceCode('a1b2c3d4e5f60718293a4b5c6d7e8f90');
      assert.equal(code, 'A1B2-C3D4-E5F6-0718-293A');
    });
  });

  describe('5. tools/license-keygen.mjs Integration & Security Boundaries', () => {
    const keygenScript = path.resolve(process.cwd(), 'tools', 'license-keygen.mjs');

    it('يرفض السكربت إنشاء المفاتيح داخل مجلد المشروع (حماية المفتاح الخاص)', async () => {
      const insideProjectPath = path.join(process.cwd(), 'temp-keys');

      let failedAsExpected = false;
      try {
        await execFileAsync('node', [keygenScript, 'gen-keys', '--out', insideProjectPath]);
      } catch (err: any) {
        failedAsExpected = true;
        assert.ok(
          err.stderr.includes('خطأ أمني') || err.stdout.includes('خطأ أمني'),
          'يجب أن يرفض السكربت المسار ويطبع خطأ أمنياً'
        );
      }
      assert.equal(failedAsExpected, true, 'يجب أن يفشل التوليد داخل مسار المشروع');
    });

    it('يولّد المفاتيح خارج مجلد المشروع ويُصدر رمزاً ويتحقق منه بنجاح عبر verifyToken', async () => {
      const tempKeyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eyadati-keygen-test-'));
      try {
        // 1. توليد المفاتيح
        const genRes = await execFileAsync('node', [keygenScript, 'gen-keys', '--out', tempKeyDir]);
        assert.ok(genRes.stdout.includes('المفتاح العام (Public Key PEM)'));

        const privPath = path.join(tempKeyDir, 'private.pem');
        const pubPath = path.join(tempKeyDir, 'public.pem');
        assert.ok(fs.existsSync(privPath), 'يجب إنشاء private.pem');
        assert.ok(fs.existsSync(pubPath), 'يجب إنشاء public.pem');

        const generatedPublicPem = fs.readFileSync(pubPath, 'utf8');

        // 2. إصدار ترخيص
        const fp = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        const outLicPath = path.join(tempKeyDir, 'license.lic');

        const issueRes = await execFileAsync('node', [
          keygenScript,
          'issue',
          '--key',
          privPath,
          '--customer',
          'عيادة الاختبار المؤتمت',
          '--plan',
          'enterprise',
          '--days',
          '90',
          '--fingerprint',
          fp,
          '--out',
          outLicPath,
        ]);

        assert.ok(issueRes.stdout.includes('تم إصدار رمز الترخيص بنجاح'));
        assert.ok(fs.existsSync(outLicPath));
        const tokenIssued = fs.readFileSync(outLicPath, 'utf8').trim();

        // 3. التحقق من الرمز الصادر باستخدام المفتاح العام المولد
        const verifyRes = verifyToken(tokenIssued, generatedPublicPem);
        assert.equal(verifyRes.valid, true);
        assert.ok(verifyRes.payload);
        assert.equal(verifyRes.payload.customer, 'عيادة الاختبار المؤتمت');
        assert.equal(verifyRes.payload.plan, 'enterprise');
        assert.equal(verifyRes.payload.fingerprint, fp);

        // 4. فحص الرمز عبر inspect
        const inspectRes = await execFileAsync('node', [keygenScript, 'inspect', tokenIssued]);
        assert.ok(inspectRes.stdout.includes('عيادة الاختبار المؤتمت'));
      } finally {
        fs.rmSync(tempKeyDir, { recursive: true, force: true });
      }
    });
  });

  describe('6. Mock HTTP Server, Online Activation & Server Integration Tests', () => {
    let mockServer: http.Server;
    let serverPort: number;
    let mockHandler: (req: http.IncomingMessage, res: http.ServerResponse, body: any) => void;
    let testDataDir: string;
    let originalServerUrl: string | undefined;
    let originalPubKey: string | undefined;
    let originalLicDat: string | undefined;

    before(async () => {
      originalServerUrl = process.env.LICENSE_SERVER_URL;
      originalPubKey = process.env.LICENSE_PUBLIC_KEY_PEM;
      originalLicDat = process.env.LICENSE_DAT_PATH;

      testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eyadati-lic-test-'));
      process.env.LICENSE_DAT_PATH = path.join(testDataDir, 'license.dat');
      process.env.LICENSE_PUBLIC_KEY_PEM = testPublicPem;

      await new Promise<void>((resolve) => {
        mockServer = http.createServer((req, res) => {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', () => {
            let body: any = {};
            try {
              if (bodyStr) body = JSON.parse(bodyStr);
            } catch {}
            if (mockHandler) {
              mockHandler(req, res, body);
            } else {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'NOT_FOUND' }));
            }
          });
        });

        mockServer.listen(0, '127.0.0.1', () => {
          const addr = mockServer.address() as any;
          serverPort = addr.port;
          process.env.LICENSE_SERVER_URL = `http://127.0.0.1:${serverPort}`;
          resolve();
        });
      });
    });

    after(async () => {
      if (mockServer) {
        await new Promise<void>((resolve) => mockServer.close(() => resolve()));
      }
      if (testDataDir && fs.existsSync(testDataDir)) {
        fs.rmSync(testDataDir, { recursive: true, force: true });
      }
      process.env.LICENSE_SERVER_URL = originalServerUrl;
      process.env.LICENSE_PUBLIC_KEY_PEM = originalPubKey;
      process.env.LICENSE_DAT_PATH = originalLicDat;
    });

    it('تفعيل ناجح عبر الخادم ← active والتحقق من الحقول المسموحة فقط', async () => {
      let receivedPath = '';
      let receivedBody: any = null;

      mockHandler = (req, res, body) => {
        receivedPath = req.url || '';
        receivedBody = body;

        // التحقق من الحقول المسموحة فقط
        assert.ok(body.license_code, 'يجب إرسال license_code');
        assert.ok(body.fingerprint, 'يجب إرسال fingerprint');
        assert.ok(body.device_name, 'يجب إرسال device_name');
        assert.ok(body.app_version, 'يجب إرسال app_version');
        assert.equal(body.patient_data, undefined, 'ممنوع إرسال أي بيانات مرضى');
        assert.equal(body.clinic_data, undefined, 'ممنوع إرسال أي بيانات عيادة');

        const deviceFp = body.fingerprint;
        const payloadToSign: LicensePayload = {
          ...validPayload,
          fingerprint: deviceFp,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        };
        const token = signPayload(payloadToSign, testPrivatePem);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ token }));
      };

      const result = await activateOnline('EYD-ABC12-DEF34-GHI56');

      assert.equal(receivedPath, '/v1/activate');
      assert.equal(receivedBody.license_code, 'EYD-ABC12-DEF34-GHI56');
      assert.equal(result.state, 'active');
      assert.equal(result.can_write, true);

      const status = await getStatus();
      assert.equal(status.state, 'active');
      assert.equal(status.license_code, 'EYD-ABC12-DEF34-GHI56');
    });

    it('كود غير صالح INVALID_CODE ← يُرفض برسالة عربية مترجمة دقيقة', async () => {
      mockHandler = (_req, res) => {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'INVALID_CODE', message: 'الكود غير مسجل' }));
      };

      await assert.rejects(
        async () => {
          await activateOnline('EYD-WRONG-00000-00000');
        },
        (err: any) => {
          assert.match(err.message, /كود الترخيص المدخل غير صحيح أو غير مسجل/);
          return true;
        }
      );
    });

    it('تجاوز حد الأجهزة DEVICE_LIMIT ← يُرفض برسالة عربية مترجمة دقيقة', async () => {
      mockHandler = (_req, res) => {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'DEVICE_LIMIT' }));
      };

      await assert.rejects(
        async () => {
          await activateOnline('EYD-LIMIT-00000-00000');
        },
        (err: any) => {
          assert.match(err.message, /تم تجاوز الحد الأقصى لعدد الأجهزة/);
          return true;
        }
      );
    });

    it('خادم يُرجع رمزاً بتوقيع مزوّر ← يُرفض محلياً ولا يتم تفعيله', async () => {
      mockHandler = (_req, res, body) => {
        const payloadToSign: LicensePayload = {
          ...validPayload,
          fingerprint: body.fingerprint,
        };
        // توقيع بمفتاح مزور/مختلف عن المفتاح العام المهيأ في التطبيق
        const forgedToken = signPayload(payloadToSign, otherPrivatePem);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ token: forgedToken }));
      };

      await assert.rejects(
        async () => {
          await activateOnline('EYD-FORGE-00000-00000');
        },
        (err: any) => {
          assert.match(err.message, /التوقيع الرقمي لرمز الترخيص غير صالح أو مزوّر/);
          return true;
        }
      );
    });

    it('انقطاع الشبكة أثناء validate ← لا تتغير الحالة ويستمر التطبيق بالعمل حتى expires_at', async () => {
      // توفير ترخيص صالح مسجل مسبقاً
      const fp = await getDeviceFingerprint();
      const payload: LicensePayload = {
        ...validPayload,
        fingerprint: fp,
        expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const token = signPayload(payload, testPrivatePem);
      await activate(token, 'EYD-NETFAIL-12345-67890');

      const initialStatus = await getStatus();
      assert.equal(initialStatus.state, 'active');

      // توجيه الخادم إلى منفذ مغلق لمحاكاة انقطاع الشبكة
      process.env.LICENSE_SERVER_URL = 'http://127.0.0.1:54321';

      const renewalRes = await validateRenewal();
      assert.equal(renewalRes.status, 'skipped');

      // الحالة تظل نشطة ومتاحة للكتابة
      const currentStatus = await getStatus();
      assert.equal(currentStatus.state, 'active');
      assert.equal(currentStatus.can_write, true);

      // إعادة عنوان الخادم الصحيح
      process.env.LICENSE_SERVER_URL = `http://127.0.0.1:${serverPort}`;
    });

    it('validate الدوري يُجدّد الرمز ويمدد الصلاحية', async () => {
      let validateCalled = false;

      mockHandler = (req, res, body) => {
        if (req.url === '/v1/validate') {
          validateCalled = true;
          assert.equal(body.license_code, 'EYD-NETFAIL-12345-67890');
          assert.ok(body.token);

          // إرجاع رمز جديد ممدد لـ 90 يوماً
          const newPayload: LicensePayload = {
            ...validPayload,
            fingerprint: body.fingerprint,
            expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          };
          const newToken = signPayload(newPayload, testPrivatePem);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', token: newToken }));
        }
      };

      const renewalRes = await validateRenewal();
      assert.equal(validateCalled, true);
      assert.equal(renewalRes.status, 'ok');

      const status = await getStatus();
      assert.equal(status.state, 'active');
      assert.ok(status.days_left > 80, 'يجب تمديد الصلاحية لأكثر من 80 يوماً');
    });

    it('deactivate يستدعي /v1/deactivate إن أمكن ويتجاهل الفشل ثم يحذف الترخيص محلياً', async () => {
      let deactivateCalled = false;

      mockHandler = (req, res, body) => {
        if (req.url === '/v1/deactivate') {
          deactivateCalled = true;
          assert.equal(body.license_code, 'EYD-NETFAIL-12345-67890');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        }
      };

      const deactRes = await deactivate();
      assert.equal(deactivateCalled, true);
      assert.equal(deactRes.ok, true);

      // التأكد من الحذف المحلي
      assert.equal(fs.existsSync(process.env.LICENSE_DAT_PATH!), false);
      const afterStatus = await getStatus();
      assert.notEqual(afterStatus.state, 'active');
    });
  });
});

