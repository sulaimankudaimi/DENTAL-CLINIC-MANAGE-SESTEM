import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { getSqlite, initDatabase, closeDatabase } from '../../db/connection';
import { runSeed } from '../../db/seed';
import {
  registerIpcHandlers,
  setCurrentSessionUser,
  invokeIpc,
} from '../../ipc';

describe('Security, RBAC & Audit Log Integration Tests (Acceptance Criteria)', () => {
  let sqlite: ReturnType<typeof getSqlite>;
  let tempDir: string;
  let tempDbPath: string;
  const CLINIC_ID = 'c1000000-0000-0000-0000-000000000001';
  let testPatientId: string;
  let testInvoiceId: string;

  // Real seeded users
  const OWNER_USER = {
    id: 'u1000000-0000-0000-0000-000000000001',
    username: 'dr.ahmed',
    role: 'owner',
    clinic_id: CLINIC_ID,
    full_name: 'د. أحمد خالد الراشد',
  };

  const DENTIST_USER = {
    id: 'u1000000-0000-0000-0000-000000000002',
    username: 'dr.layla',
    role: 'dentist',
    clinic_id: CLINIC_ID,
    full_name: 'د. ليلى ناصر القحطاني',
  };

  const RECEPTIONIST_USER = {
    id: 'u1000000-0000-0000-0000-000000000003',
    username: 'sara.rec',
    role: 'receptionist',
    clinic_id: CLINIC_ID,
    full_name: 'سارة عبد الله العمري',
  };

  const ACCOUNTANT_USER = {
    id: 'u1000000-0000-0000-0000-000000000004',
    username: 'khaled.acc',
    role: 'accountant',
    clinic_id: CLINIC_ID,
    full_name: 'خالد منصور الدوسري',
  };

  before(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eyadati-test-rbac-'));
    tempDbPath = path.join(tempDir, 'eyadati_test.db');
    process.env.DATABASE_PATH = tempDbPath;

    initDatabase(tempDbPath);
    runSeed();
    sqlite = getSqlite();
    registerIpcHandlers();

    // Ensure test patient exists
    const pat = sqlite.prepare('SELECT id FROM patients WHERE clinic_id = ? LIMIT 1').get(CLINIC_ID) as { id: string } | undefined;
    if (pat) {
      testPatientId = pat.id;
    } else {
      testPatientId = 'p1000000-0000-0000-0000-000000000001';
      sqlite.prepare(`
        INSERT INTO patients (id, clinic_id, created_at, updated_at, code, first_name, family_name, gender, birth_date, phone, is_active)
        VALUES (?, ?, ?, ?, 'P-TEST', 'أحمد', 'الغامدي', 'male', '1990-01-01', '0500000001', 1)
      `).run(testPatientId, CLINIC_ID, new Date().toISOString(), new Date().toISOString());
    }

    // Ensure test invoice exists
    const inv = sqlite.prepare('SELECT id FROM invoices WHERE clinic_id = ? LIMIT 1').get(CLINIC_ID) as { id: string } | undefined;
    if (inv) {
      testInvoiceId = inv.id;
    } else {
      testInvoiceId = 'inv10000-0000-0000-0000-000000000001';
      sqlite.prepare(`
        INSERT INTO invoices (id, clinic_id, created_at, updated_at, invoice_number, patient_id, issue_date, due_date, subtotal_halalas, discount_halalas, vat_rate, vat_halalas, total_halalas, paid_halalas, balance_halalas, status)
        VALUES (?, ?, ?, ?, 'INV-TEST-1', ?, '2025-01-01', '2025-01-01', 10000, 0, 15, 1500, 11500, 0, 11500, 'issued')
      `).run(testInvoiceId, CLINIC_ID, new Date().toISOString(), new Date().toISOString(), testPatientId);
    }
  });

  // =========================================================================
  // معيار القبول 1: مستخدم receptionist يستدعي invoices:void مباشرة فيُرفض
  // =========================================================================
  it('القبول 1: مستخدم receptionist يستدعي invoices:void مباشرة عبر IPC فيُرفض ويسجل الرفض في audit_log', async () => {
    setCurrentSessionUser(RECEPTIONIST_USER);

    const result = await invokeIpc('invoices:void', testInvoiceId, 'محاولة إلغاء غير مصرحة');

    // يجب أن يُرفض الطلب
    assert.equal(result.ok, false, 'يجب رفض إلغاء الفاتورة لموظف الاستقبال');
    assert.match(
      result.error,
      /(غير مصرّح لموظف الاستقبال بإلغاء الفواتير|ليست لديك صلاحية)/,
      'يجب إرجاع رسالة خطأ الصلاحية الواضحة'
    );

    // التحقق من تدوين المحاولة المرفوضة في سجل التدقيق audit_log
    const deniedLog = sqlite
      .prepare(`
        SELECT * FROM audit_log
        WHERE user_id = ? AND action LIKE '%DENIED%'
        ORDER BY created_at DESC LIMIT 1
      `)
      .get(RECEPTIONIST_USER.id) as any;

    assert.ok(deniedLog, 'يجب تدوين محاولة الوصول المرفوضة في audit_log');
    assert.equal(deniedLog.user_id, RECEPTIONIST_USER.id);
  });

  // =========================================================================
  // معيار القبول 2: تعديل مريض يُنتج سطراً في audit_log فيه user_id الحقيقي وbefore وafter مختلفان
  // =========================================================================
  it('القبول 2: تعديل مريض يُنتج سطراً في audit_log فيه user_id الحقيقي وbefore وafter مختلفان', async () => {
    setCurrentSessionUser(DENTIST_USER);

    // قراءة المريض الحالية
    const beforePatient = sqlite
      .prepare('SELECT * FROM patients WHERE id = ?')
      .get(testPatientId) as any;
    assert.ok(beforePatient, 'المريض يجب أن يكون موجوداً');

    const newNote = 'ملاحظة سريرية جديدة ومحدثة - ' + Date.now();
    const updateRes = await invokeIpc('patients:update', testPatientId, {
      notes: newNote,
      phone: '0555999888',
    });

    assert.equal(updateRes.ok, true, 'تعديل المريض يجب أن ينجح');

    // قراءة أحدث سجل تدقيق لعملية تعديل المريض
    const auditRow = sqlite
      .prepare(`
        SELECT * FROM audit_log
        WHERE entity_type = 'patients' AND entity_id = ? AND action = 'UPDATE'
        ORDER BY created_at DESC LIMIT 1
      `)
      .get(testPatientId) as any;

    assert.ok(auditRow, 'يجب وجود سطر في audit_log لعملية التعديل');
    assert.equal(auditRow.user_id, DENTIST_USER.id, 'يجب أن يكون user_id هو معرف المستخدم الحقيقي من الجلسة وليس system');

    assert.ok(auditRow.before, 'يجب أن يحتوي السجل على before غير فارغ');
    assert.ok(auditRow.after, 'يجب أن يحتوي السجل على after غير فارغ');

    const beforeObj = typeof auditRow.before === 'string' ? JSON.parse(auditRow.before) : auditRow.before;
    const afterObj = typeof auditRow.after === 'string' ? JSON.parse(auditRow.after) : auditRow.after;

    assert.notDeepEqual(beforeObj, afterObj, 'يجب أن يكون before و after مختلفين تماماً');
    assert.equal(afterObj.notes, newNote, 'after يجب أن يعكس التحديث الجديد');
  });

  // =========================================================================
  // معيار القبول 3: محاولة UPDATE/DELETE على audit_log تفشل بتريغر SQLite
  // =========================================================================
  it('القبول 3: محاولة UPDATE على audit_log تفشل بواسطة SQLite Trigger', () => {
    // جلب أو إنشاء سجل تدقيق للتجربة
    let log = sqlite.prepare('SELECT id FROM audit_log LIMIT 1').get() as { id: string } | undefined;
    if (!log) {
      const newId = crypto.randomUUID();
      sqlite.prepare(`
        INSERT INTO audit_log (id, clinic_id, created_at, updated_at, user_id, action, entity_type, entity_id, before, after)
        VALUES (?, ?, ?, ?, ?, 'TEST_ACTION', 'test', '1', null, null)
      `).run(newId, CLINIC_ID, new Date().toISOString(), new Date().toISOString(), OWNER_USER.id);
      log = { id: newId };
    }

    assert.throws(
      () => {
        sqlite.prepare("UPDATE audit_log SET action = 'HACKED_ACTION' WHERE id = ?").run(log.id);
      },
      /(سجلات التدقيق غير قابلة للتعديل|Audit logs are immutable)/,
      'تريغر منع التعديل يجب أن يفشل محاولة UPDATE ويرمي استثناء RAISE(ABORT)'
    );
  });

  it('القبول 3: محاولة DELETE على audit_log تفشل بواسطة SQLite Trigger', () => {
    let log = sqlite.prepare('SELECT id FROM audit_log LIMIT 1').get() as { id: string } | undefined;
    if (!log) {
      const newId = crypto.randomUUID();
      sqlite.prepare(`
        INSERT INTO audit_log (id, clinic_id, created_at, updated_at, user_id, action, entity_type, entity_id, before, after)
        VALUES (?, ?, ?, ?, ?, 'TEST_ACTION', 'test', '1', null, null)
      `).run(newId, CLINIC_ID, new Date().toISOString(), new Date().toISOString(), OWNER_USER.id);
      log = { id: newId };
    }

    assert.throws(
      () => {
        sqlite.prepare('DELETE FROM audit_log WHERE id = ?').run(log.id);
      },
      /(سجلات التدقيق غير قابلة للحذف|Audit logs are append-only)/,
      'تريغر منع الحذف يجب أن يفشل محاولة DELETE ويرمي استثناء RAISE(ABORT)'
    );
  });

  // =========================================================================
  // فحوصات تكميلية للقواعد الإلزامية في المطلوب
  // =========================================================================
  it('المطلوب 4 و 5: patients:getById يسجل قراءة ملف المريض بإجراء VIEW', async () => {
    setCurrentSessionUser(OWNER_USER);

    const res = await invokeIpc('patients:getById', testPatientId);
    assert.equal(res.ok, true);

    const viewAudit = sqlite
      .prepare(`
        SELECT * FROM audit_log
        WHERE entity_type = 'patients' AND entity_id = ? AND action = 'VIEW' AND user_id = ?
        ORDER BY created_at DESC LIMIT 1
      `)
      .get(testPatientId, OWNER_USER.id) as any;

    assert.ok(viewAudit, 'يجب تسجيل قراءة ملف المريض getById كـ VIEW في audit_log');
    assert.equal(viewAudit.user_id, OWNER_USER.id);
  });

  it('المطلوب 4: الدور accountant لا يقرأ الملاحظات السريرية ولا التاريخ الطبي ولا سجلات الأسنان', async () => {
    setCurrentSessionUser(ACCOUNTANT_USER);

    const medRes = await invokeIpc('patients:getMedicalHistory', testPatientId);
    assert.equal(medRes.ok, false, 'المحاسب ممنوع من قراءة التاريخ الطبي');

    const toothRes = await invokeIpc('toothRecords:getByPatient', testPatientId);
    assert.equal(toothRes.ok, false, 'المحاسب ممنوع من قراءة سجلات الأسنان tooth_records');

    const allergyRes = await invokeIpc('patients:getAllergies', testPatientId);
    assert.equal(allergyRes.ok, false, 'المحاسب ممنوع من قراءة سجل الحساسية');

    const imagesRes = await invokeIpc('images:list', { patient_id: testPatientId });
    assert.equal(imagesRes.ok, false, 'المحاسب ممنوع من قراءة صور الأشعة السريرية');
  });

  it('المطلوب 4: موظف الاستقبال receptionist لا يحذف ولا يعدل الأسعار', async () => {
    setCurrentSessionUser(RECEPTIONIST_USER);

    // محاولة الحذف
    const delRes = await invokeIpc('patients:delete', testPatientId);
    assert.equal(delRes.ok, false, 'الاستقبال ممنوع من الحذف');

    // محاولة تعديل الأسعار والإجراءات
    const procRes = await invokeIpc('treatments:createProcedure', {
      name_ar: 'إجراء تجريبي',
      category: 'restorative',
      default_price_halalas: 20000,
      code: 'PR-TEST',
    });
    assert.equal(procRes.ok, false, 'الاستقبال ممنوع من إضافة أو تعديل الأسعار');

    // محاولة تعديل الفواتير الصادرة
    const invUpdateRes = await invokeIpc('invoices:update', 'inv-dummy-1', { discount_halalas: 5000 });
    assert.equal(invUpdateRes.ok, false, 'الاستقبال ممنوع من تعديل الفواتير');
  });

  it('المطلوب 5: auditLogs:list تدعم الفلاتر والترقيم الصفحي و auditLogs:export تصدّر البيانات', async () => {
    setCurrentSessionUser(OWNER_USER);

    // فحص list مع ترقيم وفلاتر
    const listRes = await invokeIpc('auditLogs:list', { page: 1, limit: 10 });
    assert.equal(listRes.ok, true);
    assert.ok(Array.isArray(listRes.data.items));
    assert.ok(typeof listRes.data.total === 'number');
    assert.equal(listRes.data.limit, 10);

    // فحص export
    const exportRes = await invokeIpc('auditLogs:export', {});
    assert.equal(exportRes.ok, true);
    assert.ok(typeof exportRes.data === 'string');
    assert.ok(exportRes.data.includes('التاريخ'), 'تصدير السجل يجب أن يحتوي على ترويسة CSV');
  });

  after(() => {
    try {
      closeDatabase();
    } catch {
      // Ignore
    }
    delete process.env.DATABASE_PATH;
    try {
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore
    }
  });
});
