process.env.DATABASE_PATH = ':memory:';
import { describe, it, beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { withTransaction } from '../base';
import { closeDatabase } from '../../db/connection';
import { paymentsRepo } from '../payments.repo';
import { invoicesRepo } from '../invoices.repo';
import { insuranceRepo } from '../insurance.repo';
import { treatmentsRepo } from '../treatments.repo';
import { inventoryRepo } from '../inventory.repo';

function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const migrationPath = path.join(process.cwd(), 'electron', 'db', 'migrations', '0000_init.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  db.exec(sql);

  // Base fixtures
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO clinics (id, clinic_id, created_at, updated_at, name, phone, email, address, city, tax_number, cr_number, currency, timezone, working_hours, slot_duration_min)
    VALUES ('c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', ?, ?, 'عيادة النخبة للأسنان', '0501234567', 'info@elite.com', 'الرياض', 'الرياض', '300000000000003', '1010000000', 'SAR', 'Asia/Riyadh', '[]', 30)
  `).run(now, now);

  db.prepare(`
    INSERT INTO branches (id, clinic_id, created_at, updated_at, name, phone, address, is_active)
    VALUES ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', ?, ?, 'الفرع الرئيسي', '0501234567', 'الرياض', 1)
  `).run(now, now);

  db.prepare(`
    INSERT INTO users (id, clinic_id, created_at, updated_at, full_name, username, password_hash, role, specialty, phone, is_active)
    VALUES ('u1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', ?, ?, 'د. أحمد السالم', 'dr_ahmad', 'hash', 'dentist', 'جراحة وتجميل أسنان', '0501112233', 1)
  `).run(now, now);

  db.prepare(`
    INSERT INTO patients (id, clinic_id, created_at, updated_at, code, first_name, father_name, family_name, gender, birth_date, national_id, phone, is_active)
    VALUES ('p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', ?, ?, 'P-0001', 'سعود', 'عبدالعزيز', 'الشمري', 'male', '1990-05-15', '1088888888', '0555555555', 1)
  `).run(now, now);

  db.prepare(`
    INSERT INTO procedures (id, clinic_id, created_at, updated_at, code, name_ar, name_en, category, default_price_halalas, default_duration_min, requires_tooth, requires_surface, is_active)
    VALUES ('pr100000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', ?, ?, 'PROC-001', 'حشوة ضوئية مركبة', 'Composite Filling', 'restorative', 35000, 30, 1, 1, 1)
  `).run(now, now);

  db.prepare(`
    INSERT INTO insurance_companies (id, clinic_id, created_at, updated_at, name, phone, coverage_percent_default, requires_preapproval)
    VALUES ('ins-comp-001', 'c1000000-0000-0000-0000-000000000001', ?, ?, 'شركة بوبا العربية', '800123', 80, 1)
  `).run(now, now);

  db.prepare(`
    INSERT INTO inventory_items (id, clinic_id, created_at, updated_at, name, sku, category, unit, quantity, min_quantity, cost_halalas)
    VALUES ('item-001', 'c1000000-0000-0000-0000-000000000001', ?, ?, 'مادة حشو كمبوزيت A2', 'COMP-A2', 'مستهلكات', 'أمبولة', 50, 5, 4500)
  `).run(now, now);

  return db;
}

describe('Transaction Atomicity & Financial Integrity Tests', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    try {
      db.close();
    } catch {
      // Ignore if closed
    }
  });

  after(() => {
    try {
      closeDatabase();
    } catch {
      // Ignore
    }
    delete process.env.DATABASE_PATH;
  });

  // ==========================================================================
  // 1. withTransaction helper
  // ==========================================================================
  it('withTransaction executes successfully and commits', () => {
    const res = withTransaction((sqlite) => {
      sqlite.prepare(`
        INSERT INTO inventory_items (id, clinic_id, created_at, updated_at, name, sku, category, unit, quantity, min_quantity, cost_halalas)
        VALUES ('item-tx-1', 'c1000000-0000-0000-0000-000000000001', 'now', 'now', 'قفازات طبية', 'GLV-M', 'وقاية', 'علبة', 100, 10, 2000)
      `).run();
      return 42;
    }, db);

    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.data, 42);

    const count = (db.prepare("SELECT COUNT(*) as c FROM inventory_items WHERE id = 'item-tx-1'").get() as any).c;
    assert.equal(count, 1);
  });

  it('withTransaction catches error and rolls back completely (all or nothing)', () => {
    const initialCount = (db.prepare('SELECT COUNT(*) as c FROM inventory_items').get() as any).c;

    const res = withTransaction((sqlite) => {
      sqlite.prepare(`
        INSERT INTO inventory_items (id, clinic_id, created_at, updated_at, name, sku, category, unit, quantity, min_quantity, cost_halalas)
        VALUES ('item-fail-1', 'c1000000-0000-0000-0000-000000000001', 'now', 'now', 'مادة اختبار', 'TST-1', 'اختبار', 'قطعة', 10, 2, 500)
      `).run();

      // Injected deliberate failure in last step
      throw new Error('خطأ متعمد لاختبار التراجع الكامل (Rollback)');
    }, db);

    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.match(res.error, /خطأ متعمد لاختبار التراجع/);
    }

    // Verify item was NOT persisted
    const afterCount = (db.prepare('SELECT COUNT(*) as c FROM inventory_items').get() as any).c;
    assert.equal(afterCount, initialCount);

    const inserted = db.prepare("SELECT * FROM inventory_items WHERE id = 'item-fail-1'").get();
    assert.equal(inserted, undefined);
  });

  // ==========================================================================
  // 2. payments.create
  // ==========================================================================
  describe('payments.create', () => {
    it('successfully processes valid payment and updates invoice paid/balance/status', async () => {
      // Create invoice of 1000.00 SAR (100000 halalas)
      const invRes = await invoicesRepo.create(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          patient_id: 'p1000000-0000-0000-0000-000000000001',
          branch_id: 'b1000000-0000-0000-0000-000000000001',
          items: [
            {
              description: 'علاج سن',
              quantity: 1,
              unit_price_halalas: 100000,
              discount_halalas: 0,
              total_halalas: 100000,
            },
          ],
          discount_halalas: 0,
          vat_percent: 0,
          vat_halalas: 0,
          total_halalas: 100000,
        } as any,
        db
      );

      assert.equal(invRes.ok, true);
      if (!invRes.ok) return;
      const invoiceId = invRes.data.id;

      // Make partial payment of 400.00 SAR (40000 halalas)
      const pay1 = await paymentsRepo.create(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          invoice_id: invoiceId,
          patient_id: 'p1000000-0000-0000-0000-000000000001',
          amount_halalas: 40000,
          method: 'cash',
          received_by: 'u1000000-0000-0000-0000-000000000001',
        } as any,
        db
      );

      assert.equal(pay1.ok, true);
      const invAfterPay1 = db.prepare('SELECT paid_halalas, balance_halalas, status FROM invoices WHERE id = ?').get(invoiceId) as any;
      assert.equal(invAfterPay1.paid_halalas, 40000);
      assert.equal(invAfterPay1.balance_halalas, 60000);
      assert.equal(invAfterPay1.status, 'partial');

      // Pay remaining 600.00 SAR (60000 halalas)
      const pay2 = await paymentsRepo.create(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          invoice_id: invoiceId,
          patient_id: 'p1000000-0000-0000-0000-000000000001',
          amount_halalas: 60000,
          method: 'mada',
          received_by: 'u1000000-0000-0000-0000-000000000001',
        } as any,
        db
      );

      assert.equal(pay2.ok, true);
      const invAfterPay2 = db.prepare('SELECT paid_halalas, balance_halalas, status FROM invoices WHERE id = ?').get(invoiceId) as any;
      assert.equal(invAfterPay2.paid_halalas, 100000);
      assert.equal(invAfterPay2.balance_halalas, 0);
      assert.equal(invAfterPay2.status, 'paid');
    });

    it('rejects payment exceeding remaining balance with exact Arabic error', async () => {
      const invRes = await invoicesRepo.create(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          patient_id: 'p1000000-0000-0000-0000-000000000001',
          branch_id: 'b1000000-0000-0000-0000-000000000001',
          items: [
            {
              description: 'كشفية',
              quantity: 1,
              unit_price_halalas: 20000,
              total_halalas: 20000,
            },
          ],
          total_halalas: 20000,
        } as any,
        db
      );

      assert.equal(invRes.ok, true);
      if (!invRes.ok) return;

      // Try paying 250.00 SAR when remaining balance is 200.00 SAR
      const payRes = await paymentsRepo.create(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          invoice_id: invRes.data.id,
          patient_id: 'p1000000-0000-0000-0000-000000000001',
          amount_halalas: 25000,
          method: 'cash',
          received_by: 'u1000000-0000-0000-0000-000000000001',
        } as any,
        db
      );

      assert.equal(payRes.ok, false);
      if (!payRes.ok) {
        assert.match(payRes.error, /يتجاوز الرصيد المتبقي على الفاتورة/);
      }

      // Verify no payment was created and invoice balance is untouched
      const paymentsCount = (db.prepare('SELECT COUNT(*) as c FROM payments WHERE invoice_id = ?').get(invRes.data.id) as any).c;
      assert.equal(paymentsCount, 0);

      const inv = db.prepare('SELECT balance_halalas, paid_halalas FROM invoices WHERE id = ?').get(invRes.data.id) as any;
      assert.equal(inv.balance_halalas, 20000);
      assert.equal(inv.paid_halalas, 0);
    });

    it('rejects zero or negative payments', async () => {
      const invRes = await invoicesRepo.create(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          patient_id: 'p1000000-0000-0000-0000-000000000001',
          branch_id: 'b1000000-0000-0000-0000-000000000001',
          items: [{ description: 'إجراء', quantity: 1, unit_price_halalas: 5000, total_halalas: 5000 }],
          total_halalas: 5000,
        } as any,
        db
      );
      assert.equal(invRes.ok, true);
      if (!invRes.ok) return;

      // Zero payment
      const zeroPay = await paymentsRepo.create(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          invoice_id: invRes.data.id,
          patient_id: 'p1000000-0000-0000-0000-000000000001',
          amount_halalas: 0,
          method: 'cash',
          reference: null,
          paid_at: new Date().toISOString(),
          received_by: 'u1000000-0000-0000-0000-000000000001',
          notes: null,
        },
        db
      );
      assert.equal(zeroPay.ok, false);

      // Negative payment
      const negPay = await paymentsRepo.create(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          invoice_id: invRes.data.id,
          patient_id: 'p1000000-0000-0000-0000-000000000001',
          amount_halalas: -1500,
          method: 'cash',
          reference: null,
          paid_at: new Date().toISOString(),
          received_by: 'u1000000-0000-0000-0000-000000000001',
          notes: null,
        },
        db
      );
      assert.equal(negPay.ok, false);
    });

    it('rolls back payment insertion if invoice balance update fails', () => {
      // Injected fault test: insert payment then fail before updating invoice
      const invoiceId = 'inv-test-atomic';
      db.prepare(`
        INSERT INTO invoices (id, clinic_id, branch_id, created_at, updated_at, patient_id, number, issue_date, subtotal_halalas, discount_halalas, vat_percent, vat_halalas, total_halalas, paid_halalas, balance_halalas, status)
        VALUES (?, 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'now', 'now', 'p1000000-0000-0000-0000-000000000001', 'INV-ATOMIC-1', '2026-10-01', 50000, 0, 0, 0, 50000, 0, 50000, 'unpaid')
      `).run(invoiceId);

      const res = withTransaction((sqlite) => {
        // Step 1: Insert payment
        sqlite.prepare(`
          INSERT INTO payments (id, clinic_id, created_at, updated_at, invoice_id, patient_id, amount_halalas, method, paid_at, received_by)
          VALUES ('pay-fail-step', 'c1000000-0000-0000-0000-000000000001', 'now', 'now', ?, 'p1000000-0000-0000-0000-000000000001', 25000, 'cash', 'now', 'u1000000-0000-0000-0000-000000000001')
        `).run(invoiceId);

        // Deliberate injected crash at step 2
        throw new Error('فشل مقصود في الخطوة الأخيرة لتحديث رصيد الفاتورة');
      }, db);

      assert.equal(res.ok, false);

      // Verify payment was rolled back completely
      const payRow = db.prepare("SELECT * FROM payments WHERE id = 'pay-fail-step'").get();
      assert.equal(payRow, undefined);

      const invRow = db.prepare('SELECT paid_halalas, balance_halalas, status FROM invoices WHERE id = ?').get(invoiceId) as any;
      assert.equal(invRow.paid_halalas, 0);
      assert.equal(invRow.balance_halalas, 50000);
      assert.equal(invRow.status, 'unpaid');
    });
  });

  // ==========================================================================
  // 3. invoices: create, zero-amount, and void
  // ==========================================================================
  describe('invoices (create, zero-amount, void)', () => {
    it('creates zero-amount invoice marked as paid with zero balance', async () => {
      const invRes = await invoicesRepo.create(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          patient_id: 'p1000000-0000-0000-0000-000000000001',
          branch_id: 'b1000000-0000-0000-0000-000000000001',
          items: [
            {
              clinic_id: 'c1000000-0000-0000-0000-000000000001',
              description: 'استشارة سنية مجانية',
              tooth_number: null,
              treatment_id: null,
              quantity: 1,
              unit_price_halalas: 15000,
              discount_halalas: 15000,
              total_halalas: 0,
            },
          ],
          discount_halalas: 15000,
          vat_percent: 0,
          vat_halalas: 0,
          total_halalas: 0,
        } as any,
        db
      );

      assert.equal(invRes.ok, true);
      if (!invRes.ok) return;

      assert.equal(invRes.data.total_halalas, 0);
      assert.equal(invRes.data.balance_halalas, 0);
      assert.equal(invRes.data.paid_halalas, 0);
      assert.equal(invRes.data.status, 'paid');
    });

    it('voids invoice, records mandatory reason, and reverses existing payments', async () => {
      // Create invoice and make a payment
      const invRes = await invoicesRepo.create(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          patient_id: 'p1000000-0000-0000-0000-000000000001',
          branch_id: 'b1000000-0000-0000-0000-000000000001',
          items: [
            {
              clinic_id: 'c1000000-0000-0000-0000-000000000001',
              description: 'إجراء طبي',
              tooth_number: null,
              treatment_id: null,
              quantity: 1,
              unit_price_halalas: 50000,
              discount_halalas: 0,
              total_halalas: 50000,
            },
          ],
          total_halalas: 50000,
        } as any,
        db
      );
      assert.equal(invRes.ok, true);
      if (!invRes.ok) return;
      const invoiceId = invRes.data.id;

      await paymentsRepo.create(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          invoice_id: invoiceId,
          patient_id: 'p1000000-0000-0000-0000-000000000001',
          amount_halalas: 25000,
          method: 'cash',
          reference: null,
          paid_at: new Date().toISOString(),
          received_by: 'u1000000-0000-0000-0000-000000000001',
          notes: null,
        },
        db
      );

      // Attempt to void without reason -> must fail
      const noReasonVoid = await invoicesRepo.voidInvoice(invoiceId, '', db);
      assert.equal(noReasonVoid.ok, false);
      if (!noReasonVoid.ok) {
        assert.match(noReasonVoid.error, /سبب إلغاء الفاتورة إلزامي/);
      }

      // Valid void with reason
      const voidRes = await invoicesRepo.voidInvoice(invoiceId, 'خطأ في إدخال بيانات المريض وتكرار الفاتورة', db);
      assert.equal(voidRes.ok, true);
      if (!voidRes.ok) return;

      assert.equal(voidRes.data.status, 'void');
      assert.equal(voidRes.data.balance_halalas, 0);
      assert.equal(voidRes.data.paid_halalas, 0);
      assert.match(voidRes.data.notes || '', /خطأ في إدخال بيانات المريض/);

      // Verify payments are reversed (soft-deleted)
      const activePayments = (db.prepare('SELECT COUNT(*) as c FROM payments WHERE invoice_id = ? AND deleted_at IS NULL').get(invoiceId) as any).c;
      assert.equal(activePayments, 0);

      const allPayments = (db.prepare('SELECT COUNT(*) as c FROM payments WHERE invoice_id = ?').get(invoiceId) as any).c;
      assert.equal(allPayments, 1);
    });

    it('rolls back void operation completely if error occurs in final step', () => {
      const invoiceId = 'inv-void-rollback';
      db.prepare(`
        INSERT INTO invoices (id, clinic_id, branch_id, created_at, updated_at, patient_id, number, issue_date, subtotal_halalas, discount_halalas, vat_percent, vat_halalas, total_halalas, paid_halalas, balance_halalas, status)
        VALUES (?, 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'now', 'now', 'p1000000-0000-0000-0000-000000000001', 'INV-VOID-ROLL', '2026-10-01', 30000, 0, 0, 0, 30000, 10000, 20000, 'partial')
      `).run(invoiceId);

      db.prepare(`
        INSERT INTO payments (id, clinic_id, created_at, updated_at, invoice_id, patient_id, amount_halalas, method, paid_at, received_by)
        VALUES ('pay-void-keep', 'c1000000-0000-0000-0000-000000000001', 'now', 'now', ?, 'p1000000-0000-0000-0000-000000000001', 10000, 'cash', 'now', 'u1000000-0000-0000-0000-000000000001')
      `).run(invoiceId);

      const res = withTransaction((sqlite) => {
        // Step 1: reverse payments
        sqlite.prepare('UPDATE payments SET deleted_at = ? WHERE invoice_id = ?').run('now', invoiceId);
        // Step 2: Injected failure before committing invoice void
        throw new Error('خطأ في إرسال إشعار الإلغاء');
      }, db);

      assert.equal(res.ok, false);

      // Verify payment was NOT deleted
      const pay = db.prepare("SELECT deleted_at FROM payments WHERE id = 'pay-void-keep'").get() as any;
      assert.equal(pay.deleted_at, null);

      // Verify invoice remains partial
      const inv = db.prepare('SELECT status, balance_halalas FROM invoices WHERE id = ?').get(invoiceId) as any;
      assert.equal(inv.status, 'partial');
      assert.equal(inv.balance_halalas, 20000);
    });
  });

  // ==========================================================================
  // 4. insurance.transitionClaimStatus
  // ==========================================================================
  describe('insurance.transitionClaimStatus', () => {
    it('approving claim creates automatic insurance payment and updates invoice', async () => {
      // 1. Create invoice
      const invRes = await invoicesRepo.create(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          patient_id: 'p1000000-0000-0000-0000-000000000001',
          branch_id: 'b1000000-0000-0000-0000-000000000001',
          items: [
            {
              clinic_id: 'c1000000-0000-0000-0000-000000000001',
              description: 'علاج لثة',
              tooth_number: null,
              treatment_id: null,
              quantity: 1,
              unit_price_halalas: 80000,
              discount_halalas: 0,
              total_halalas: 80000,
            },
          ],
          total_halalas: 80000,
        } as any,
        db
      );
      assert.equal(invRes.ok, true);
      if (!invRes.ok) return;
      const invoiceId = invRes.data.id;

      // 2. Create insurance claim
      const claimId = 'claim-test-1';
      db.prepare(`
        INSERT INTO insurance_claims (id, clinic_id, created_at, updated_at, patient_id, invoice_id, company_id, claim_number, submitted_at, claimed_halalas, approved_halalas, rejected_halalas, status, attachments)
        VALUES (?, 'c1000000-0000-0000-0000-000000000001', 'now', 'now', 'p1000000-0000-0000-0000-000000000001', ?, 'ins-comp-001', 'CLM-2026-999', 'now', 80000, 0, 0, 'submitted', '[]')
      `).run(claimId, invoiceId);

      // 3. Transition claim to approved with approved_halalas = 64000 (80%)
      const transRes = await insuranceRepo.transitionClaimStatus(
        claimId,
        'approved',
        {
          approved_halalas: 64000,
          rejected_halalas: 16000,
          userId: 'u1000000-0000-0000-0000-000000000001',
        },
        db
      );

      assert.equal(transRes.ok, true);
      if (!transRes.ok) return;

      assert.equal(transRes.data.status, 'approved');
      assert.equal(transRes.data.approved_halalas, 64000);

      // Verify automatic payment created
      const pmt = db.prepare("SELECT * FROM payments WHERE invoice_id = ? AND method = 'insurance'").get(invoiceId) as any;
      assert.ok(pmt);
      assert.equal(pmt.amount_halalas, 64000);

      // Verify invoice updated
      const inv = db.prepare('SELECT paid_halalas, balance_halalas, status FROM invoices WHERE id = ?').get(invoiceId) as any;
      assert.equal(inv.paid_halalas, 64000);
      assert.equal(inv.balance_halalas, 16000);
      assert.equal(inv.status, 'partial');
    });

    it('rolls back claim approval and automatic payment on error', () => {
      const claimId = 'claim-rollback-test';
      const invoiceId = 'inv-claim-roll';

      db.prepare(`
        INSERT INTO invoices (id, clinic_id, branch_id, created_at, updated_at, patient_id, number, issue_date, subtotal_halalas, discount_halalas, vat_percent, vat_halalas, total_halalas, paid_halalas, balance_halalas, status)
        VALUES (?, 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'now', 'now', 'p1000000-0000-0000-0000-000000000001', 'INV-CLM-ROLL', '2026-10-01', 50000, 0, 0, 0, 50000, 0, 50000, 'unpaid')
      `).run(invoiceId);

      db.prepare(`
        INSERT INTO insurance_claims (id, clinic_id, created_at, updated_at, patient_id, invoice_id, company_id, claim_number, submitted_at, claimed_halalas, approved_halalas, rejected_halalas, status, attachments)
        VALUES (?, 'c1000000-0000-0000-0000-000000000001', 'now', 'now', 'p1000000-0000-0000-0000-000000000001', ?, 'ins-comp-001', 'CLM-ROLL-1', 'now', 50000, 0, 0, 'submitted', '[]')
      `).run(claimId, invoiceId);

      const res = withTransaction((sqlite) => {
        sqlite.prepare("UPDATE insurance_claims SET status = 'approved', approved_halalas = 50000 WHERE id = ?").run(claimId);
        sqlite.prepare(`
          INSERT INTO payments (id, clinic_id, created_at, updated_at, invoice_id, patient_id, amount_halalas, method, paid_at, received_by)
          VALUES ('pay-ins-fail', 'c1000000-0000-0000-0000-000000000001', 'now', 'now', ?, 'p1000000-0000-0000-0000-000000000001', 50000, 'insurance', 'now', 'system')
        `).run(invoiceId);

        throw new Error('خطأ في مزامنة المطالبة مع بوابة التأمين');
      }, db);

      assert.equal(res.ok, false);

      // Verify claim remains submitted
      const claim = db.prepare('SELECT status, approved_halalas FROM insurance_claims WHERE id = ?').get(claimId) as any;
      assert.equal(claim.status, 'submitted');
      assert.equal(claim.approved_halalas, 0);

      // Verify no payment was persisted
      const pay = db.prepare("SELECT * FROM payments WHERE id = 'pay-ins-fail'").get();
      assert.equal(pay, undefined);
    });
  });

  // ==========================================================================
  // 5. treatments.acceptPlanTransaction
  // ==========================================================================
  describe('treatments.acceptPlanTransaction', () => {
    it('accepts plan, creates treatments, invoice, invoice_items, and updates tooth_records', async () => {
      // Create plan
      const planRes = await treatmentsRepo.createPlan(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          patient_id: 'p1000000-0000-0000-0000-000000000001',
          dentist_id: 'u1000000-0000-0000-0000-000000000001',
          title: 'خطة علاج شاملة للفك العلوي',
          status: 'draft',
          total_halalas: 35000,
          discount_halalas: 5000,
          items: [
            {
              clinic_id: 'c1000000-0000-0000-0000-000000000001',
              procedure_id: 'pr100000-0000-0000-0000-000000000001',
              tooth_number: 16,
              surface: 'O',
              quantity: 1,
              unit_price_halalas: 35000,
              discount_halalas: 5000,
              priority: 1,
              phase: 1,
              status: 'planned',
              scheduled_date: null,
            },
          ],
        } as any,
        db
      );

      assert.equal(planRes.ok, true);
      if (!planRes.ok) return;
      const planId = planRes.data.id;

      // Accept plan transaction
      const acceptRes = await treatmentsRepo.acceptPlanTransaction(
        {
          planId,
          patientId: 'p1000000-0000-0000-0000-000000000001',
          dentistId: 'u1000000-0000-0000-0000-000000000001',
          items: [
            {
              procedureId: 'pr100000-0000-0000-0000-000000000001',
              toothNumber: 16,
              surface: 'O',
              quantity: 1,
              unitPriceHalalas: 35000,
              discountHalalas: 5000,
            },
          ],
        },
        db
      );

      assert.equal(acceptRes.ok, true);
      if (!acceptRes.ok) return;

      assert.equal(acceptRes.data.treatmentsCount, 1);
      assert.ok(acceptRes.data.invoiceId);

      // Verify plan is accepted
      const plan = db.prepare('SELECT status, patient_consent_at FROM treatment_plans WHERE id = ?').get(planId) as any;
      assert.equal(plan.status, 'accepted');
      assert.ok(plan.patient_consent_at);

      // Verify invoice created
      const inv = db.prepare('SELECT total_halalas, status FROM invoices WHERE id = ?').get(acceptRes.data.invoiceId) as any;
      assert.equal(inv.total_halalas, 30000);
      assert.equal(inv.status, 'draft');

      // Verify treatments created
      const trCount = (db.prepare('SELECT COUNT(*) as c FROM treatments WHERE plan_item_id IN (SELECT id FROM treatment_plan_items WHERE plan_id = ?)').get(planId) as any).c;
      assert.equal(trCount, 1);

      // Verify tooth_records updated / inserted
      const tooth = db.prepare("SELECT * FROM tooth_records WHERE patient_id = 'p1000000-0000-0000-0000-000000000001' AND tooth_number = 16").get() as any;
      assert.ok(tooth);
      assert.equal(tooth.status, 'planned');
    });

    it('rolls back completely if error injected during plan acceptance', () => {
      const planId = 'plan-roll-test';
      db.prepare(`
        INSERT INTO treatment_plans (id, clinic_id, created_at, updated_at, patient_id, dentist_id, title, status, total_halalas, discount_halalas)
        VALUES (?, 'c1000000-0000-0000-0000-000000000001', 'now', 'now', 'p1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000001', 'خطة قيد التراجع', 'draft', 50000, 0)
      `).run(planId);

      const res = withTransaction((sqlite) => {
        // 1. Update plan
        sqlite.prepare("UPDATE treatment_plans SET status = 'accepted' WHERE id = ?").run(planId);
        // 2. Insert treatment
        sqlite.prepare(`
          INSERT INTO treatments (id, clinic_id, created_at, updated_at, patient_id, procedure_id, dentist_id, performed_at, status, price_halalas)
          VALUES ('tr-fail-test', 'c1000000-0000-0000-0000-000000000001', 'now', 'now', 'p1000000-0000-0000-0000-000000000001', 'pr100000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000001', 'now', 'scheduled', 50000)
        `).run();
        // Deliberate injected crash at invoice step
        throw new Error('فشل غير متوقع في توليد الفاتورة الضريبية');
      }, db);

      assert.equal(res.ok, false);

      // Verify plan is still draft
      const plan = db.prepare('SELECT status FROM treatment_plans WHERE id = ?').get(planId) as any;
      assert.equal(plan.status, 'draft');

      // Verify treatment was rolled back
      const tr = db.prepare("SELECT * FROM treatments WHERE id = 'tr-fail-test'").get();
      assert.equal(tr, undefined);
    });
  });

  // ==========================================================================
  // 6. treatments.executeTreatmentTransaction
  // ==========================================================================
  describe('treatments.executeTreatmentTransaction', () => {
    it('executes treatment, deducts inventory materials, records inventory transaction, and updates tooth record', async () => {
      const initialStock = (db.prepare("SELECT quantity FROM inventory_items WHERE id = 'item-001'").get() as any).quantity;
      assert.equal(initialStock, 50);

      const execRes = await treatmentsRepo.executeTreatmentTransaction(
        {
          patientId: 'p1000000-0000-0000-0000-000000000001',
          dentistId: 'u1000000-0000-0000-0000-000000000001',
          procedureId: 'pr100000-0000-0000-0000-000000000001',
          toothNumber: 21,
          surface: 'B',
          priceHalalas: 35000,
          newToothCondition: 'filled',
          materialsUsed: [
            {
              item_id: 'item-001',
              name: 'مادة حشو كمبوزيت A2',
              quantity_used: 2,
              unit: 'أمبولة',
            },
          ],
          clinicalNotes: 'تم حشو السن بنجاح',
        },
        db
      );

      assert.equal(execRes.ok, true);
      if (!execRes.ok) return;

      // Verify treatment inserted
      const tr = db.prepare('SELECT status, tooth_number, price_halalas FROM treatments WHERE id = ?').get(execRes.data.id) as any;
      assert.equal(tr.status, 'completed');
      assert.equal(tr.tooth_number, 21);
      assert.equal(tr.price_halalas, 35000);

      // Verify inventory deducted (50 - 2 = 48)
      const afterStock = (db.prepare("SELECT quantity FROM inventory_items WHERE id = 'item-001'").get() as any).quantity;
      assert.equal(afterStock, 48);

      // Verify inventory_transactions audit record created
      const invTx = db.prepare("SELECT * FROM inventory_transactions WHERE item_id = 'item-001' AND type = 'out'").get() as any;
      assert.ok(invTx);
      assert.equal(invTx.quantity, 2);
      assert.equal(invTx.treatment_id, execRes.data.id);

      // Verify tooth record updated/created
      const tooth = db.prepare("SELECT * FROM tooth_records WHERE patient_id = 'p1000000-0000-0000-0000-000000000001' AND tooth_number = 21").get() as any;
      assert.ok(tooth);
      assert.equal(tooth.status, 'completed');
      assert.equal(tooth.condition, 'filled');
    });

    it('rejects clinical error when operating on a missing tooth without implant or crown', async () => {
      // Record tooth 14 as missing
      db.prepare(`
        INSERT INTO tooth_records (id, clinic_id, created_at, updated_at, patient_id, tooth_number, condition, surface, status, recorded_at, recorded_by)
        VALUES ('tr-missing-14', 'c1000000-0000-0000-0000-000000000001', 'now', 'now', 'p1000000-0000-0000-0000-000000000001', 14, 'missing', 'whole', 'completed', 'now', 'u1000000-0000-0000-0000-000000000001')
      `).run();

      // Attempt to place a composite filling ('filled') on the missing tooth
      const execRes = await treatmentsRepo.executeTreatmentTransaction(
        {
          patientId: 'p1000000-0000-0000-0000-000000000001',
          dentistId: 'u1000000-0000-0000-0000-000000000001',
          procedureId: 'pr100000-0000-0000-0000-000000000001',
          toothNumber: 14,
          surface: 'O',
          priceHalalas: 35000,
          newToothCondition: 'filled',
        },
        db
      );

      assert.equal(execRes.ok, false);
      if (!execRes.ok) {
        assert.match(execRes.error, /خطأ سريري مانع/);
      }
    });

    it('rolls back treatment, inventory deduction, and tooth record if error injected', () => {
      const initialStock = (db.prepare("SELECT quantity FROM inventory_items WHERE id = 'item-001'").get() as any).quantity;

      const res = withTransaction((sqlite) => {
        // Step 1: deduct inventory
        sqlite.prepare('UPDATE inventory_items SET quantity = quantity - 5 WHERE id = ?').run('item-001');

        // Step 2: insert treatment
        sqlite.prepare(`
          INSERT INTO treatments (id, clinic_id, created_at, updated_at, patient_id, procedure_id, dentist_id, performed_at, status, price_halalas)
          VALUES ('tr-roll-exec', 'c1000000-0000-0000-0000-000000000001', 'now', 'now', 'p1000000-0000-0000-0000-000000000001', 'pr100000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000001', 'now', 'completed', 35000)
        `).run();

        // Injected error
        throw new Error('فشل تحديث سجل الأسنان الميكانيكي');
      }, db);

      assert.equal(res.ok, false);

      // Verify inventory stock was NOT deducted
      const stock = (db.prepare("SELECT quantity FROM inventory_items WHERE id = 'item-001'").get() as any).quantity;
      assert.equal(stock, initialStock);

      // Verify treatment was NOT created
      const tr = db.prepare("SELECT * FROM treatments WHERE id = 'tr-roll-exec'").get();
      assert.equal(tr, undefined);
    });
  });

  // ==========================================================================
  // 7. inventory.recordTransaction
  // ==========================================================================
  describe('inventory.recordTransaction', () => {
    it('records transaction and updates inventory stock atomically', async () => {
      const res = await inventoryRepo.recordTransaction(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          item_id: 'item-001',
          type: 'in',
          quantity: 20,
          reason: 'توريد دفعة جديدة من المورد',
          treatment_id: null,
          created_by: 'u1000000-0000-0000-0000-000000000001',
        },
        db
      );

      assert.equal(res.ok, true);
      const stock = (db.prepare("SELECT quantity FROM inventory_items WHERE id = 'item-001'").get() as any).quantity;
      assert.equal(stock, 70); // 50 + 20
    });

    it('rejects dispensing quantity greater than current stock', async () => {
      const res = await inventoryRepo.recordTransaction(
        {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          item_id: 'item-001',
          type: 'out',
          quantity: 9999, // More than stock (50)
          reason: 'طلب زائد',
          treatment_id: null,
          created_by: 'u1000000-0000-0000-0000-000000000001',
        },
        db
      );

      assert.equal(res.ok, false);
      if (!res.ok) {
        assert.match(res.error, /تتجاوز الرصيد المتوفر في المستودع/);
      }

      const stock = (db.prepare("SELECT quantity FROM inventory_items WHERE id = 'item-001'").get() as any).quantity;
      assert.equal(stock, 50); // Unchanged
    });
  });
});
