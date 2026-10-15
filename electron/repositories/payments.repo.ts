import { getDb } from '../db/connection';
import { payments } from '../db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import type {
  Payment,
  CreatePayment,
  PaginationParams,
  Paginated,
  ApiResult,
} from '@shared/contracts';
import { safeExecute, withTransaction } from './base';
import crypto from 'node:crypto';
import type Database from 'better-sqlite3';

export class PaymentsRepository {
  async list(params?: PaginationParams): Promise<ApiResult<Paginated<Payment>>> {
    return safeExecute(async () => {
      const db = getDb();
      const page = Math.max(1, params?.page || 1);
      const limit = Math.min(100, Math.max(1, params?.limit || 20));
      const offset = (page - 1) * limit;

      const whereClause = isNull(payments.deleted_at);

      const items = (await db
        .select()
        .from(payments)
        .where(whereClause)
        .orderBy(desc(payments.paid_at))
        .limit(limit)
        .offset(offset)) as unknown as Payment[];

      const countResult = await db.select({ count: sql<number>`count(*)` }).from(payments).where(whereClause);
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

  async getByInvoice(invoiceId: string): Promise<ApiResult<Payment[]>> {
    return safeExecute(async () => {
      const db = getDb();
      const res = (await db
        .select()
        .from(payments)
        .where(and(eq(payments.invoice_id, invoiceId), isNull(payments.deleted_at)))
        .orderBy(desc(payments.paid_at))) as unknown as Payment[];
      return res;
    });
  }

  async create(data: CreatePayment, customSqlite?: Database.Database): Promise<ApiResult<Payment>> {
    const res = withTransaction((sqlite) => {
      const amount = Math.floor(Number(data.amount_halalas));
      if (isNaN(amount) || amount <= 0) {
        throw new Error('مبلغ الدفعة غير صالح؛ يجب أن يكون أكبر من الصفر بالهللات.');
      }

      // Read current invoice within transaction to avoid race condition
      const inv = sqlite
        .prepare('SELECT id, clinic_id, total_halalas, paid_halalas, balance_halalas, status FROM invoices WHERE id = ? AND deleted_at IS NULL')
        .get(data.invoice_id) as any;

      if (!inv) {
        throw new Error(`الفاتورة المحددة غير موجودة (المعرف: ${data.invoice_id})`);
      }

      if (inv.status === 'void') {
        throw new Error('لا يمكن تسجيل دفعات على فاتورة ملغاة (Voided Invoice).');
      }

      const currentBalance = Math.floor(Number(inv.balance_halalas) || 0);
      if (amount > currentBalance) {
        const balanceSAR = (currentBalance / 100).toFixed(2);
        const amountSAR = (amount / 100).toFixed(2);
        throw new Error(`مبلغ الدفعة (${amountSAR} ر.س) يتجاوز الرصيد المتبقي على الفاتورة (${balanceSAR} ر.س).`);
      }

      const now = new Date().toISOString();
      const paymentId = crypto.randomUUID();

      sqlite.prepare(`
        INSERT INTO payments (
          id, clinic_id, created_at, updated_at, deleted_at,
          invoice_id, patient_id, amount_halalas, method, reference,
          paid_at, received_by, notes
        ) VALUES (
          ?, ?, ?, ?, NULL,
          ?, ?, ?, ?, ?,
          ?, ?, ?
        )
      `).run(
        paymentId,
        data.clinic_id,
        now,
        now,
        data.invoice_id,
        data.patient_id,
        amount,
        data.method ?? 'cash',
        data.reference ?? null,
        data.paid_at ?? now,
        data.received_by,
        data.notes ?? null
      );

      // Recalculate invoice paid amount and balance atomically from SQLite payments
      const sumRow = sqlite.prepare(`
        SELECT COALESCE(SUM(amount_halalas), 0) as total
        FROM payments
        WHERE invoice_id = ? AND deleted_at IS NULL
      `).get(data.invoice_id) as { total: number };

      const totalPaid = Math.floor(Number(sumRow.total) || 0);
      const totalHalalas = Math.floor(Number(inv.total_halalas) || 0);
      const newBalance = Math.max(0, totalHalalas - totalPaid);
      const newStatus = newBalance === 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';

      sqlite.prepare(`
        UPDATE invoices
        SET paid_halalas = ?, balance_halalas = ?, status = ?, updated_at = ?
        WHERE id = ?
      `).run(totalPaid, newBalance, newStatus, now, data.invoice_id);

      const created = sqlite.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as any;
      return created as Payment;
    }, customSqlite);

    return res;
  }
}

export const paymentsRepo = new PaymentsRepository();
