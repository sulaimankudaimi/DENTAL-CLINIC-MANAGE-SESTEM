process.env.DATABASE_PATH = ':memory:';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDatabase, getSqlite } from '../../db/connection';
import { reportsRepo } from '../reports.repo';
import { performance } from 'node:perf_hooks';

describe('Reports SQL Group By & Filter Integrity Tests (Acceptance Criteria)', () => {
  before(() => {
    closeDatabase();
    const { sqlite } = initDatabase(':memory:');

    // 1. Fixtures: عيادة، فرع، أطباء، مرضى
    const now = '2026-09-01T10:00:00.000Z';
    sqlite.prepare(`
      INSERT INTO clinics (id, clinic_id, created_at, updated_at, name, phone, email, address, city, tax_number, cr_number, currency, timezone, working_hours, slot_duration_min)
      VALUES ('c-test-1', 'c-test-1', ?, ?, 'عيادة النخبة للأسنان', '0501234567', 'info@elite.com', 'الرياض', 'الرياض', '300000000000003', '1010000000', 'SAR', 'Asia/Riyadh', '[]', 30)
    `).run(now, now);

    sqlite.prepare(`
      INSERT INTO branches (id, clinic_id, created_at, updated_at, name, phone, address, is_active)
      VALUES ('b-test-1', 'c-test-1', ?, ?, 'الفرع الرئيسي', '0501234567', 'الرياض', 1)
    `).run(now, now);

    sqlite.prepare(`
      INSERT INTO users (id, clinic_id, created_at, updated_at, full_name, username, password_hash, role, specialty, phone, is_active)
      VALUES
        ('doc-1', 'c-test-1', ?, ?, 'د. طارق المنصور', 'dr_tariq', 'hash', 'dentist', 'زراعة وجراحة', '0501112233', 1),
        ('doc-2', 'c-test-1', ?, ?, 'د. ريم الفهد', 'dr_reem', 'hash', 'dentist', 'تقويم أسنان', '0502223344', 1)
    `).run(now, now, now, now);

    sqlite.prepare(`
      INSERT INTO patients (id, clinic_id, created_at, updated_at, code, first_name, father_name, family_name, gender, birth_date, national_id, phone, is_active, primary_dentist_id)
      VALUES
        ('p-1', 'c-test-1', ?, ?, 'P-001', 'سعود', 'فهد', 'الشمري', 'male', '1990-05-15', '1088888888', '0555555555', 1, 'doc-1'),
        ('p-2', 'c-test-1', ?, ?, 'P-002', 'نورة', 'سعد', 'القحطاني', 'female', '1995-08-20', '1099999999', '0566666666', 1, 'doc-2')
    `).run(now, now, now, now);

    // 2. فواتير ومقبوضات مباشرة محددة للاختبار
    sqlite.prepare(`
      INSERT INTO invoices (id, clinic_id, created_at, updated_at, number, patient_id, branch_id, issue_date, subtotal_halalas, total_halalas, paid_halalas, balance_halalas, status)
      VALUES
        ('inv-1', 'c-test-1', ?, ?, 'INV-001', 'p-1', 'b-test-1', '2026-09-10', 50000, 50000, 50000, 0, 'paid'),
        ('inv-2', 'c-test-1', ?, ?, 'INV-002', 'p-1', 'b-test-1', '2026-09-15', 70000, 70000, 70000, 0, 'paid'),
        ('inv-3', 'c-test-1', ?, ?, 'INV-003', 'p-2', 'b-test-1', '2026-09-20', 30000, 30000, 30000, 0, 'paid')
    `).run(now, now, now, now, now, now);

    sqlite.prepare(`
      INSERT INTO payments (id, clinic_id, created_at, updated_at, invoice_id, patient_id, amount_halalas, method, paid_at, received_by)
      VALUES
        ('pay-1', 'c-test-1', ?, ?, 'inv-1', 'p-1', 50000, 'cash', '2026-09-10T11:00:00.000Z', 'doc-1'),
        ('pay-2', 'c-test-1', ?, ?, 'inv-2', 'p-1', 70000, 'card', '2026-09-15T15:30:00.000Z', 'doc-1'),
        ('pay-3', 'c-test-1', ?, ?, 'inv-3', 'p-2', 30000, 'mada', '2026-09-20T17:00:00.000Z', 'doc-2')
    `).run(now, now, now, now, now, now);

    // 3. مواعيد لأطباء مختلفين
    sqlite.prepare(`
      INSERT INTO appointments (id, clinic_id, created_at, updated_at, patient_id, dentist_id, branch_id, start_at, end_at, procedure_ids, status, created_by)
      VALUES
        ('apt-1', 'c-test-1', ?, ?, 'p-1', 'doc-1', 'b-test-1', '2026-09-10T10:00:00.000Z', '2026-09-10T10:30:00.000Z', '[]', 'completed', 'doc-1'),
        ('apt-2', 'c-test-1', ?, ?, 'p-1', 'doc-1', 'b-test-1', '2026-09-15T14:00:00.000Z', '2026-09-15T14:30:00.000Z', '[]', 'completed', 'doc-1'),
        ('apt-3', 'c-test-1', ?, ?, 'p-2', 'doc-2', 'b-test-1', '2026-09-20T16:00:00.000Z', '2026-09-20T16:30:00.000Z', '[]', 'completed', 'doc-2')
    `).run(now, now, now, now, now, now);
  });

  after(() => {
    closeDatabase();
    delete process.env.DATABASE_PATH;
  });

  it('مجموع تقرير الإيرادات لفترة = مجموع payments.amount_halalas لنفس الفترة بالضبط', async () => {
    const res = await reportsRepo.getRevenueReport({
      period: 'custom',
      from: '2026-09-01',
      to: '2026-09-30',
    });

    assert.equal(res.ok, true);
    if (!res.ok) return;

    // مجموع الدفعات الثلاث (50000 + 70000 + 30000 = 150000 هللة)
    const expectedSumHalalas = 150000;
    assert.equal(res.data.totalRevenueHalalas, expectedSumHalalas);

    // التحقق عبر القناة الموحدة getReport
    const unifiedRes = await reportsRepo.getReport('revenue_report', {
      from: '2026-09-01',
      to: '2026-09-30',
    });
    assert.equal(unifiedRes.ok, true);
    if (unifiedRes.ok) {
      assert.equal(unifiedRes.data.totalRevenueHalalas, expectedSumHalalas);
    }
  });

  it('تغيير from/to يغيّر النتائج ويعطي صفراً لفترة لا بيانات فيها', async () => {
    // فترة فارغة مستقبلية لا توجد فيها أي دفعات
    const emptyRes = await reportsRepo.getRevenueReport({
      period: 'custom',
      from: '2028-01-01',
      to: '2028-01-31',
    });

    assert.equal(emptyRes.ok, true);
    if (!emptyRes.ok) return;
    assert.equal(emptyRes.data.totalRevenueHalalas, 0);

    const emptyUnified = await reportsRepo.getReport('revenue_report', {
      from: '2028-01-01',
      to: '2028-01-31',
    });
    assert.equal(emptyUnified.ok, true);
    if (emptyUnified.ok) {
      assert.equal(emptyUnified.data.totalRevenueHalalas, 0);
      assert.equal(emptyUnified.data.count, 0);
    }

    // فترة محددة تشمل دفعة واحدة فقط (2026-09-10)
    const singleRes = await reportsRepo.getRevenueReport({
      period: 'custom',
      from: '2026-09-10',
      to: '2026-09-10',
    });
    assert.equal(singleRes.ok, true);
    if (singleRes.ok) {
      assert.equal(singleRes.data.totalRevenueHalalas, 50000);
    }
  });

  it('فلتر dentist_id يحصر المواعيد والإيرادات بطبيب واحد', async () => {
    // 1. حصر الإيرادات بالطبيب doc-1 فقط (50000 + 70000 = 120000 هللة)
    const doc1Revenue = await reportsRepo.getReport('revenue_report', {
      from: '2026-09-01',
      to: '2026-09-30',
      dentist_id: 'doc-1',
    });
    assert.equal(doc1Revenue.ok, true);
    if (doc1Revenue.ok) {
      assert.equal(doc1Revenue.data.totalRevenueHalalas, 120000);
      assert.equal(doc1Revenue.data.count, 2);
    }

    // 2. حصر الإيرادات بالطبيب doc-2 فقط (30000 هللة)
    const doc2Revenue = await reportsRepo.getReport('revenue_report', {
      from: '2026-09-01',
      to: '2026-09-30',
      dentist_id: 'doc-2',
    });
    assert.equal(doc2Revenue.ok, true);
    if (doc2Revenue.ok) {
      assert.equal(doc2Revenue.data.totalRevenueHalalas, 30000);
      assert.equal(doc2Revenue.data.count, 1);
    }

    // 3. حصر المواعيد بالطبيب doc-1 فقط
    const doc1Appts = await reportsRepo.getReport('attendance_rate', {
      from: '2026-09-01',
      to: '2026-09-30',
      dentist_id: 'doc-1',
    });
    assert.equal(doc1Appts.ok, true);
    if (doc1Appts.ok) {
      assert.equal(doc1Appts.data.count, 2);
    }
  });

  it('حدّ اليوم الأخير شامل (دفعة 23:30 في to تُحتسب)', async () => {
    const sqlite = getSqlite();
    const now = new Date().toISOString();

    // إضافة فاتورة ودفعة في آخر دقيقة من اليوم الأخير (2026-09-30T23:30:00.000Z)
    sqlite.prepare(`
      INSERT INTO invoices (id, clinic_id, created_at, updated_at, number, patient_id, branch_id, issue_date, subtotal_halalas, total_halalas, paid_halalas, balance_halalas, status)
      VALUES ('inv-late', 'c-test-1', ?, ?, 'INV-LATE', 'p-1', 'b-test-1', '2026-09-30', 44000, 44000, 44000, 0, 'paid')
    `).run(now, now);

    sqlite.prepare(`
      INSERT INTO payments (id, clinic_id, created_at, updated_at, invoice_id, patient_id, amount_halalas, method, paid_at, received_by)
      VALUES ('pay-late', 'c-test-1', ?, ?, 'inv-late', 'p-1', 44000, 'cash', '2026-09-30T23:30:00.000Z', 'doc-1')
    `).run(now, now);

    // استعلام للفترة المنتهية في '2026-09-30'
    const res = await reportsRepo.getRevenueReport({
      period: 'custom',
      from: '2026-09-01',
      to: '2026-09-30',
    });

    assert.equal(res.ok, true);
    if (!res.ok) return;

    // المجموع السابق (150000) + دفعة 23:30 (44000) = 194000 هللة
    assert.equal(res.data.totalRevenueHalalas, 194000);

    const unifiedRes = await reportsRepo.getReport('revenue_report', {
      from: '2026-09-01',
      to: '2026-09-30',
    });
    assert.equal(unifiedRes.ok, true);
    if (unifiedRes.ok) {
      assert.equal(unifiedRes.data.totalRevenueHalalas, 194000);
    }
  });

  it('الاستعلام يعمل على 20,000 دفعة في أقل من 300ms (قس واطبع الزمن)', async () => {
    const sqlite = getSqlite();
    const now = new Date().toISOString();

    // 1. توليد دفعة من الفواتير والمدفوعات داخل معاملة واحدة فائقة السرعة
    const insertInvoice = sqlite.prepare(`
      INSERT INTO invoices (id, clinic_id, created_at, updated_at, number, patient_id, branch_id, issue_date, subtotal_halalas, total_halalas, paid_halalas, balance_halalas, status)
      VALUES (?, 'c-test-1', ?, ?, ?, 'p-1', 'b-test-1', '2026-09-15', 10000, 10000, 10000, 0, 'paid')
    `);

    const insertPayment = sqlite.prepare(`
      INSERT INTO payments (id, clinic_id, created_at, updated_at, invoice_id, patient_id, amount_halalas, method, paid_at, received_by)
      VALUES (?, 'c-test-1', ?, ?, ?, 'p-1', 10000, 'mada', '2026-09-15T12:00:00.000Z', 'doc-1')
    `);

    // إدراج 20,000 صف داخل معاملة SQLite
    const generateBulk = sqlite.transaction((count: number) => {
      for (let i = 0; i < count; i++) {
        const invId = `bulk-inv-${i}`;
        const payId = `bulk-pay-${i}`;
        insertInvoice.run(invId, now, now, `INV-B-${i}`);
        insertPayment.run(payId, now, now, invId);
      }
    });

    generateBulk(20000);

    // 2. قياس زمن تنفيذ استعلام التجميع والتصفية
    const startTime = performance.now();
    const res = await reportsRepo.getRevenueReport({
      period: 'custom',
      from: '2026-09-01',
      to: '2026-09-30',
    });
    const endTime = performance.now();
    const durationMs = endTime - startTime;

    console.log(`\n======================================================`);
    console.log(`⏱️ زمن تنفيذ استعلام تقرير الإيرادات على أكثر من 20,000 دفعة:`);
    console.log(`   ${durationMs.toFixed(2)} ms (الحد الأقصى المطلوب: 300 ms)`);
    console.log(`======================================================\n`);

    assert.equal(res.ok, true);
    assert.ok(
      durationMs < 300,
      `استغرق الاستعلام ${durationMs.toFixed(2)}ms وهو أكبر من الحد المطلوب (300ms)`
    );
  });
});
