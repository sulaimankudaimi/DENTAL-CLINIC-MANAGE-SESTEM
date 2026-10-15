import { getDb, getSqlite } from '../db/connection';
import { insuranceCompanies, insuranceClaims } from '../db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import type {
  InsuranceCompany,
  CreateInsuranceCompany,
  UpdateInsuranceCompany,
  InsuranceClaim,
  CreateInsuranceClaim,
  UpdateInsuranceClaim,
  InsuranceClaimStatus,
  Patient,
  AuditLog,
  ApiResult,
} from '@shared/contracts';
import { safeExecute, withTransaction } from './base';
import crypto from 'node:crypto';
import type Database from 'better-sqlite3';

export class InsuranceRepository {
  async getCompanies(): Promise<ApiResult<InsuranceCompany[]>> {
    return safeExecute(async () => {
      const db = getDb();
      const res = (await db
        .select()
        .from(insuranceCompanies)
        .where(isNull(insuranceCompanies.deleted_at))
        .orderBy(insuranceCompanies.name)) as unknown as InsuranceCompany[];
      return res;
    });
  }

  async createCompany(data: CreateInsuranceCompany): Promise<ApiResult<InsuranceCompany>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const newComp: typeof insuranceCompanies.$inferInsert = {
        id,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        name: data.name,
        contact: data.contact ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        coverage_percent_default: data.coverage_percent_default ?? 80,
        requires_preapproval: data.requires_preapproval ?? true,
        notes: data.notes ?? null,
      };

      await db.insert(insuranceCompanies).values(newComp);
      const res = await db.select().from(insuranceCompanies).where(eq(insuranceCompanies.id, id)).limit(1);
      return res[0] as unknown as InsuranceCompany;
    });
  }

  async updateCompany(id: string, data: UpdateInsuranceCompany): Promise<ApiResult<InsuranceCompany>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();

      await db
        .update(insuranceCompanies)
        .set({
          ...data,
          updated_at: now,
        })
        .where(eq(insuranceCompanies.id, id));

      const res = await db.select().from(insuranceCompanies).where(eq(insuranceCompanies.id, id)).limit(1);
      return res[0] as unknown as InsuranceCompany;
    });
  }

  async getClaims(filters?: { patientId?: string; status?: InsuranceClaimStatus }): Promise<ApiResult<InsuranceClaim[]>> {
    return safeExecute(async () => {
      const db = getDb();
      const conditions = [isNull(insuranceClaims.deleted_at)];

      if (filters?.patientId) conditions.push(eq(insuranceClaims.patient_id, filters.patientId));
      if (filters?.status) conditions.push(eq(insuranceClaims.status, filters.status));

      const res = (await db
        .select()
        .from(insuranceClaims)
        .where(and(...conditions))
        .orderBy(desc(insuranceClaims.submitted_at))) as unknown as InsuranceClaim[];

      return res;
    });
  }

  async createClaim(data: CreateInsuranceClaim): Promise<ApiResult<InsuranceClaim>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const newClaim: typeof insuranceClaims.$inferInsert = {
        id,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        invoice_id: data.invoice_id,
        company_id: data.company_id,
        claim_number: data.claim_number,
        submitted_at: data.submitted_at ?? now,
        claimed_halalas: data.claimed_halalas,
        approved_halalas: data.approved_halalas ?? 0,
        rejected_halalas: data.rejected_halalas ?? 0,
        status: data.status ?? 'submitted',
        response_at: data.response_at ?? null,
        rejection_reason: data.rejection_reason ?? null,
        attachments: data.attachments ?? [],
      };

      await db.insert(insuranceClaims).values(newClaim);
      const res = await db.select().from(insuranceClaims).where(eq(insuranceClaims.id, id)).limit(1);
      return res[0] as unknown as InsuranceClaim;
    });
  }

  async updateClaim(id: string, data: UpdateInsuranceClaim): Promise<ApiResult<InsuranceClaim>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();

      const patch: Record<string, unknown> = {
        ...data,
        updated_at: now,
      };

      if (data.attachments) {
        patch.attachments = data.attachments;
      }

      await db
        .update(insuranceClaims)
        .set(patch)
        .where(eq(insuranceClaims.id, id));

      const res = await db.select().from(insuranceClaims).where(eq(insuranceClaims.id, id)).limit(1);
      return res[0] as unknown as InsuranceClaim;
    });
  }

  async transitionClaimStatus(
    id: string,
    status: InsuranceClaimStatus,
    payload?: {
      approved_halalas?: number;
      rejected_halalas?: number;
      rejection_reason?: string;
      userId?: string;
    },
    customSqlite?: Database.Database
  ): Promise<ApiResult<InsuranceClaim>> {
    return withTransaction((sqlite) => {
      const claim = sqlite
        .prepare('SELECT * FROM insurance_claims WHERE id = ? AND deleted_at IS NULL')
        .get(id) as any;

      if (!claim) {
        throw new Error(`مطالبة التأمين غير موجودة (المعرف: ${id})`);
      }

      const now = new Date().toISOString();
      const approvedHalalas =
        status === 'approved' || status === 'partially_approved'
          ? Math.max(0, Math.floor(Number(payload?.approved_halalas ?? claim.claimed_halalas)))
          : 0;

      const rejectedHalalas = Math.max(
        0,
        Math.floor(Number(payload?.rejected_halalas ?? (status === 'rejected' ? claim.claimed_halalas : 0)))
      );

      sqlite.prepare(`
        UPDATE insurance_claims
        SET status = ?, approved_halalas = ?, rejected_halalas = ?, rejection_reason = ?, response_at = ?, updated_at = ?
        WHERE id = ?
      `).run(
        status,
        approvedHalalas,
        rejectedHalalas,
        payload?.rejection_reason ?? null,
        now,
        now,
        id
      );

      // If approved and has an invoice, create automatic payment and update invoice
      if (approvedHalalas > 0 && claim.invoice_id) {
        const inv = sqlite
          .prepare('SELECT id, clinic_id, total_halalas, paid_halalas, balance_halalas, status FROM invoices WHERE id = ? AND deleted_at IS NULL')
          .get(claim.invoice_id) as any;

        if (inv && inv.status !== 'void') {
          const paymentId = crypto.randomUUID();
          sqlite.prepare(`
            INSERT INTO payments (
              id, clinic_id, created_at, updated_at, deleted_at,
              invoice_id, patient_id, amount_halalas, method, reference,
              paid_at, received_by, notes
            ) VALUES (
              ?, ?, ?, ?, NULL,
              ?, ?, ?, 'insurance', ?,
              ?, ?, ?
            )
          `).run(
            paymentId,
            claim.clinic_id,
            now,
            now,
            claim.invoice_id,
            claim.patient_id,
            approvedHalalas,
            claim.claim_number,
            now,
            payload?.userId || 'system',
            `دفعة تأمين تلقائية للمطالبة رقم ${claim.claim_number}`
          );

          // Recalculate invoice paid amount and balance
          const sumRow = sqlite.prepare(`
            SELECT COALESCE(SUM(amount_halalas), 0) as total
            FROM payments
            WHERE invoice_id = ? AND deleted_at IS NULL
          `).get(claim.invoice_id) as { total: number };

          const totalPaid = Math.floor(Number(sumRow.total) || 0);
          const totalHalalas = Math.floor(Number(inv.total_halalas) || 0);
          const newBalance = Math.max(0, totalHalalas - totalPaid);
          const newStatus = newBalance === 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';

          sqlite.prepare(`
            UPDATE invoices
            SET paid_halalas = ?, balance_halalas = ?, status = ?, updated_at = ?
            WHERE id = ?
          `).run(totalPaid, newBalance, newStatus, now, claim.invoice_id);
        }
      }

      const updatedClaim = sqlite.prepare('SELECT * FROM insurance_claims WHERE id = ?').get(id) as any;
      if (updatedClaim.attachments && typeof updatedClaim.attachments === 'string') {
        try {
          updatedClaim.attachments = JSON.parse(updatedClaim.attachments);
        } catch {
          updatedClaim.attachments = [];
        }
      }
      return updatedClaim as InsuranceClaim;
    }, customSqlite);
  }

  async deleteCompany(id: string): Promise<ApiResult<boolean>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      const now = new Date().toISOString();
      sqlite.prepare('UPDATE insurance_companies SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, id);
      return true;
    });
  }

  async getClaimById(id: string): Promise<ApiResult<InsuranceClaim>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      const claim = sqlite.prepare('SELECT * FROM insurance_claims WHERE id = ? AND deleted_at IS NULL').get(id) as any;
      if (!claim) throw new Error(`مطالبة التأمين غير موجودة: ${id}`);
      if (claim.attachments && typeof claim.attachments === 'string') {
        try {
          claim.attachments = JSON.parse(claim.attachments);
        } catch {
          claim.attachments = [];
        }
      }
      return claim as InsuranceClaim;
    });
  }

  async getExpiringPolicies(daysThreshold: number = 30): Promise<ApiResult<Array<Patient & { daysRemaining: number }>>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      const patients = sqlite
        .prepare('SELECT * FROM patients WHERE deleted_at IS NULL AND insurance_expiry IS NOT NULL')
        .all() as any[];

      const now = Date.now();
      const results: Array<Patient & { daysRemaining: number }> = [];

      for (const p of patients) {
        const expTime = new Date(p.insurance_expiry).getTime();
        const diffDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= daysThreshold) {
          results.push({
            ...p,
            daysRemaining: diffDays,
          });
        }
      }

      results.sort((a, b) => a.daysRemaining - b.daysRemaining);
      return results;
    });
  }

  async getAuditLogs(entityType = 'insurance_claim', entityId?: string): Promise<ApiResult<AuditLog[]>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      let query = 'SELECT * FROM audit_log WHERE entity_type = ?';
      const params: any[] = [entityType];
      if (entityId) {
        query += ' AND entity_id = ?';
        params.push(entityId);
      }
      query += ' ORDER BY created_at DESC LIMIT 50';
      const rows = sqlite.prepare(query).all(...params) as any[];
      return rows;
    });
  }
}

export const insuranceRepo = new InsuranceRepository();
