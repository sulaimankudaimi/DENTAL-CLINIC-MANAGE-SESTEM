import { getDb } from '../db/connection';
import { invoices, invoiceItems, payments } from '../db/schema';
import { eq, and, isNull, gte, lte, desc, sql } from 'drizzle-orm';
import type {
  Invoice,
  CreateInvoice,
  UpdateInvoice,
  InvoiceFilters,
  InvoiceItem,
  Payment,
  FinancialStats,
  Paginated,
  ApiResult,
} from '@shared/contracts';
import { safeExecute, withTransaction } from './base';
import crypto from 'node:crypto';
import type Database from 'better-sqlite3';

export class InvoicesRepository {
  async list(filters: InvoiceFilters): Promise<ApiResult<Paginated<Invoice>>> {
    return safeExecute(async () => {
      const db = getDb();
      const page = Math.max(1, filters.page || 1);
      const limit = Math.min(100, Math.max(1, filters.limit || 20));
      const offset = (page - 1) * limit;

      const conditions = [isNull(invoices.deleted_at)];

      if (filters.patient_id) {
        conditions.push(eq(invoices.patient_id, filters.patient_id));
      }
      if (filters.status) {
        conditions.push(eq(invoices.status, filters.status));
      }
      if (filters.date_from) {
        conditions.push(gte(invoices.issue_date, filters.date_from));
      }
      if (filters.date_to) {
        conditions.push(lte(invoices.issue_date, filters.date_to));
      }

      const whereClause = and(...conditions);

      const items = (await db
        .select()
        .from(invoices)
        .where(whereClause)
        .orderBy(desc(invoices.created_at))
        .limit(limit)
        .offset(offset)) as unknown as Invoice[];

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(whereClause);

      const total = Number(countResult[0]?.count || 0);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    });
  }

  async getById(id: string): Promise<ApiResult<Invoice & { items: InvoiceItem[]; payments: Payment[] }>> {
    return safeExecute(async () => {
      const db = getDb();
      const result = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, id), isNull(invoices.deleted_at)))
        .limit(1);

      if (!result.length) {
        throw new Error(`الفاتورة غير موجودة (المعرف: ${id})`);
      }

      const invoice = result[0] as unknown as Invoice;

      const items = (await db
        .select()
        .from(invoiceItems)
        .where(and(eq(invoiceItems.invoice_id, id), isNull(invoiceItems.deleted_at)))) as unknown as InvoiceItem[];

      const pmts = (await db
        .select()
        .from(payments)
        .where(and(eq(payments.invoice_id, id), isNull(payments.deleted_at)))) as unknown as Payment[];

      return {
        ...invoice,
        items,
        payments: pmts,
      };
    });
  }

  async create(data: CreateInvoice, customSqlite?: Database.Database): Promise<ApiResult<Invoice>> {
    return withTransaction((sqlite) => {
      const now = new Date().toISOString();
      const invoiceId = crypto.randomUUID();

      let number = data.number;
      if (!number) {
        const row = sqlite.prepare('SELECT COUNT(*) as count FROM invoices').get() as { count: number };
        const num = (row?.count || 0) + 1001;
        number = `INV-2026-${String(num).padStart(5, '0')}`;
      }

      if (!data.items || data.items.length === 0) {
        throw new Error('لا يمكن إنشاء فاتورة بدون إضافة بند علاجي واحد على الأقل.');
      }

      const subtotal = data.items.reduce((acc, it) => acc + Math.floor(Number(it.total_halalas) || 0), 0);
      const discount = Math.min(subtotal, Math.max(0, Math.floor(Number(data.discount_halalas) || 0)));
      const vatPercent = data.vat_percent ?? 15;
      const taxable = Math.max(0, subtotal - discount);
      const vatHalalas = data.vat_halalas ?? Math.round((taxable * vatPercent) / 100);
      const totalHalalas = data.total_halalas ?? (taxable + vatHalalas);

      // If total is 0 (e.g. 100% discount or complimentary), invoice is automatically marked as paid with 0 balance
      const autoStatus = totalHalalas === 0 ? 'paid' : (data.status ?? 'unpaid');
      const initialBalance = totalHalalas === 0 ? 0 : totalHalalas;

      sqlite.prepare(`
        INSERT INTO invoices (
          id, clinic_id, branch_id, created_at, updated_at, deleted_at,
          patient_id, number, issue_date, due_date,
          subtotal_halalas, discount_halalas, vat_percent, vat_halalas,
          total_halalas, paid_halalas, balance_halalas, status,
          insurance_claim_id, zatca_qr, notes
        ) VALUES (
          ?, ?, ?, ?, ?, NULL,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, 0, ?, ?,
          ?, ?, ?
        )
      `).run(
        invoiceId,
        data.clinic_id,
        data.branch_id,
        now,
        now,
        data.patient_id,
        number,
        data.issue_date ?? now.split('T')[0],
        data.due_date ?? null,
        subtotal,
        discount,
        vatPercent,
        vatHalalas,
        totalHalalas,
        initialBalance,
        autoStatus,
        data.insurance_claim_id ?? null,
        data.zatca_qr ?? null,
        data.notes ?? null
      );

      const insertItemStmt = sqlite.prepare(`
        INSERT INTO invoice_items (
          id, clinic_id, created_at, updated_at, deleted_at,
          invoice_id, treatment_id, description, tooth_number,
          quantity, unit_price_halalas, discount_halalas, total_halalas
        ) VALUES (
          ?, ?, ?, ?, NULL,
          ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `);

      for (const item of data.items) {
        insertItemStmt.run(
          crypto.randomUUID(),
          data.clinic_id,
          now,
          now,
          invoiceId,
          item.treatment_id ?? null,
          item.description,
          item.tooth_number ?? null,
          item.quantity ?? 1,
          item.unit_price_halalas,
          item.discount_halalas ?? 0,
          item.total_halalas
        );
      }

      const created = sqlite.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as any;
      return created as Invoice;
    }, customSqlite);
  }

  async voidInvoice(id: string, reason: string, customSqlite?: Database.Database): Promise<ApiResult<Invoice>> {
    return withTransaction((sqlite) => {
      if (!reason || !reason.trim()) {
        throw new Error('سبب إلغاء الفاتورة إلزامي، يرجى تقديم سبب واضح للإلغاء.');
      }

      const inv = sqlite
        .prepare('SELECT * FROM invoices WHERE id = ? AND deleted_at IS NULL')
        .get(id) as any;

      if (!inv) {
        throw new Error(`الفاتورة المحددة غير موجودة (المعرف: ${id})`);
      }

      if (inv.status === 'void') {
        throw new Error('الفاتورة ملغاة مسبقاً.');
      }

      const now = new Date().toISOString();
      const trimmedReason = reason.trim();

      // Reverse / soft-delete any existing payments
      sqlite.prepare(`
        UPDATE payments
        SET deleted_at = ?, notes = COALESCE(notes || ' | ', '') || 'تم عكس الدفعة بسبب إلغاء الفاتورة: ' || ?
        WHERE invoice_id = ? AND deleted_at IS NULL
      `).run(now, trimmedReason, id);

      // Void the invoice
      const updatedNotes = inv.notes
        ? `${inv.notes}\n[ملغاة بتاريخ ${now.split('T')[0]} - سبب الإلغاء: ${trimmedReason}]`
        : `[ملغاة بتاريخ ${now.split('T')[0]} - سبب الإلغاء: ${trimmedReason}]`;

      sqlite.prepare(`
        UPDATE invoices
        SET status = 'void', paid_halalas = 0, balance_halalas = 0, notes = ?, updated_at = ?
        WHERE id = ?
      `).run(updatedNotes, now, id);

      const updatedInv = sqlite.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as any;
      return updatedInv as Invoice;
    }, customSqlite);
  }

  async update(id: string, data: UpdateInvoice): Promise<ApiResult<Invoice>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();

      await db
        .update(invoices)
        .set({
          ...data,
          updated_at: now,
        })
        .where(and(eq(invoices.id, id), isNull(invoices.deleted_at)));

      const updated = await this.getById(id);
      if (!updated.ok) throw new Error(updated.error);
      return updated.data;
    });
  }

  async getStats(range?: { from?: string; to?: string }): Promise<ApiResult<FinancialStats>> {
    return safeExecute(async () => {
      const db = getDb();
      const conditions = [isNull(invoices.deleted_at)];

      if (range?.from) conditions.push(gte(invoices.issue_date, range.from));
      if (range?.to) conditions.push(lte(invoices.issue_date, range.to));

      const rows = await db
        .select({
          totalBilled: sql<number>`COALESCE(SUM(${invoices.total_halalas}), 0)`,
          totalPaid: sql<number>`COALESCE(SUM(${invoices.paid_halalas}), 0)`,
          totalUnpaid: sql<number>`COALESCE(SUM(${invoices.balance_halalas}), 0)`,
          totalVat: sql<number>`COALESCE(SUM(${invoices.vat_halalas}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(invoices)
        .where(and(...conditions));

      const stat = rows[0] || { totalBilled: 0, totalPaid: 0, totalUnpaid: 0, totalVat: 0, count: 0 };

      return {
        totalBilledHalalas: Number(stat.totalBilled),
        totalPaidHalalas: Number(stat.totalPaid),
        totalUnpaidHalalas: Number(stat.totalUnpaid),
        totalVatHalalas: Number(stat.totalVat),
        invoicesCount: Number(stat.count),
      };
    });
  }
}

export const invoicesRepo = new InvoicesRepository();
