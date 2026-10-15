import { getDb } from '../db/connection';
import {
  treatments,
  treatmentPlans,
  treatmentPlanItems,
  procedures,
} from '../db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import type {
  Treatment,
  CreateTreatment,
  UpdateTreatment,
  TreatmentFilters,
  TreatmentPlan,
  TreatmentPlanItem,
  CreateTreatmentPlan,
  UpdateTreatmentPlan,
  Procedure,
  CreateProcedure,
  UpdateProcedure,
  ProcedureFilters,
  AcceptPlanPayload,
  ExecuteTreatmentPayload,
  Paginated,
  ApiResult,
} from '@shared/contracts';
import { safeExecute, withTransaction } from './base';
import crypto from 'node:crypto';
import type Database from 'better-sqlite3';

export class TreatmentsRepository {
  async list(filters: TreatmentFilters): Promise<ApiResult<Paginated<Treatment>>> {
    return safeExecute(async () => {
      const db = getDb();
      const page = Math.max(1, filters.page || 1);
      const limit = Math.min(100, Math.max(1, filters.limit || 20));
      const offset = (page - 1) * limit;

      const conditions = [isNull(treatments.deleted_at)];
      if (filters.patient_id) conditions.push(eq(treatments.patient_id, filters.patient_id));
      if (filters.dentist_id) conditions.push(eq(treatments.dentist_id, filters.dentist_id));
      if (filters.status) conditions.push(eq(treatments.status, filters.status));

      const whereClause = and(...conditions);

      const items = (await db
        .select()
        .from(treatments)
        .where(whereClause)
        .orderBy(desc(treatments.performed_at))
        .limit(limit)
        .offset(offset)) as unknown as Treatment[];

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(treatments)
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

  async getById(id: string): Promise<ApiResult<Treatment>> {
    return safeExecute(async () => {
      const db = getDb();
      const result = await db
        .select()
        .from(treatments)
        .where(and(eq(treatments.id, id), isNull(treatments.deleted_at)))
        .limit(1);

      if (!result.length) {
        throw new Error(`العلاج غير موجود (المعرف: ${id})`);
      }

      return result[0] as unknown as Treatment;
    });
  }

  async create(data: CreateTreatment): Promise<ApiResult<Treatment>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const newTreatment: typeof treatments.$inferInsert = {
        id,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        appointment_id: data.appointment_id ?? null,
        plan_item_id: data.plan_item_id ?? null,
        procedure_id: data.procedure_id,
        dentist_id: data.dentist_id,
        tooth_number: data.tooth_number ?? null,
        surface: data.surface ?? null,
        performed_at: data.performed_at ?? now,
        status: data.status ?? 'completed',
        anesthesia_type: data.anesthesia_type ?? null,
        materials_used: data.materials_used ?? [],
        clinical_notes: data.clinical_notes ?? null,
        price_halalas: data.price_halalas,
      };

      await db.insert(treatments).values(newTreatment);
      const created = await this.getById(id);
      if (!created.ok) throw new Error(created.error);
      return created.data;
    });
  }

  async update(id: string, data: UpdateTreatment): Promise<ApiResult<Treatment>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();

      const patch: Record<string, unknown> = {
        ...data,
        updated_at: now,
      };

      if (data.materials_used) {
        patch.materials_used = data.materials_used;
      }

      await db
        .update(treatments)
        .set(patch)
        .where(and(eq(treatments.id, id), isNull(treatments.deleted_at)));

      const updated = await this.getById(id);
      if (!updated.ok) throw new Error(updated.error);
      return updated.data;
    });
  }

  async delete(id: string): Promise<ApiResult<boolean>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      await db.update(treatments).set({ deleted_at: now, updated_at: now }).where(eq(treatments.id, id));
      return true;
    });
  }

  async getPlansByPatient(patientId: string): Promise<ApiResult<TreatmentPlan[]>> {
    return safeExecute(async () => {
      const db = getDb();
      const plans = (await db
        .select()
        .from(treatmentPlans)
        .where(and(eq(treatmentPlans.patient_id, patientId), isNull(treatmentPlans.deleted_at)))
        .orderBy(desc(treatmentPlans.created_at))) as unknown as TreatmentPlan[];

      return plans;
    });
  }

  async createPlan(data: CreateTreatmentPlan, customSqlite?: Database.Database): Promise<ApiResult<TreatmentPlan>> {
    return withTransaction((sqlite) => {
      const now = new Date().toISOString();
      const planId = crypto.randomUUID();

      sqlite.prepare(`
        INSERT INTO treatment_plans (
          id, clinic_id, created_at, updated_at, deleted_at,
          patient_id, dentist_id, title, status, total_halalas,
          discount_halalas, patient_consent_at, notes
        ) VALUES (
          ?, ?, ?, ?, NULL,
          ?, ?, ?, ?, ?,
          ?, ?, ?
        )
      `).run(
        planId,
        data.clinic_id,
        now,
        now,
        data.patient_id,
        data.dentist_id,
        data.title,
        data.status ?? 'draft',
        Math.floor(Number(data.total_halalas) || 0),
        Math.floor(Number(data.discount_halalas) || 0),
        data.patient_consent_at ?? null,
        data.notes ?? null
      );

      if (data.items && data.items.length > 0) {
        const insertItemStmt = sqlite.prepare(`
          INSERT INTO treatment_plan_items (
            id, clinic_id, created_at, updated_at, deleted_at,
            plan_id, procedure_id, tooth_number, surface, quantity,
            unit_price_halalas, discount_halalas, priority, phase, status, scheduled_date
          ) VALUES (
            ?, ?, ?, ?, NULL,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?
          )
        `);

        for (const item of data.items) {
          insertItemStmt.run(
            crypto.randomUUID(),
            data.clinic_id,
            now,
            now,
            planId,
            item.procedure_id,
            item.tooth_number ?? null,
            item.surface ?? null,
            item.quantity ?? 1,
            Math.floor(Number(item.unit_price_halalas) || 0),
            Math.floor(Number(item.discount_halalas) || 0),
            item.priority ?? 1,
            item.phase ?? 1,
            item.status ?? 'planned',
            item.scheduled_date ?? null
          );
        }
      }

      const res = sqlite.prepare('SELECT * FROM treatment_plans WHERE id = ?').get(planId) as any;
      return res as TreatmentPlan;
    }, customSqlite);
  }

  async updatePlan(id: string, data: UpdateTreatmentPlan): Promise<ApiResult<TreatmentPlan>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();

      await db
        .update(treatmentPlans)
        .set({
          ...data,
          updated_at: now,
        })
        .where(eq(treatmentPlans.id, id));

      const res = await db.select().from(treatmentPlans).where(eq(treatmentPlans.id, id)).limit(1);
      return res[0] as unknown as TreatmentPlan;
    });
  }

  async getPlanById(id: string): Promise<ApiResult<TreatmentPlan & { items: TreatmentPlanItem[] }>> {
    return safeExecute(async () => {
      const db = getDb();
      const planRes = await db
        .select()
        .from(treatmentPlans)
        .where(and(eq(treatmentPlans.id, id), isNull(treatmentPlans.deleted_at)))
        .limit(1);

      if (!planRes.length) {
        throw new Error(`خطة العلاج غير موجودة (المعرف: ${id})`);
      }

      const itemsRes = await db
        .select()
        .from(treatmentPlanItems)
        .where(and(eq(treatmentPlanItems.plan_id, id), isNull(treatmentPlanItems.deleted_at)))
        .orderBy(treatmentPlanItems.priority);

      return {
        ...(planRes[0] as unknown as TreatmentPlan),
        items: itemsRes as unknown as TreatmentPlanItem[],
      };
    });
  }

  async deletePlan(id: string): Promise<ApiResult<boolean>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      await db.update(treatmentPlans).set({ deleted_at: now, updated_at: now }).where(eq(treatmentPlans.id, id));
      await db.update(treatmentPlanItems).set({ deleted_at: now, updated_at: now }).where(eq(treatmentPlanItems.plan_id, id));
      return true;
    });
  }

  async createProcedure(data: CreateProcedure): Promise<ApiResult<Procedure>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const newProc: typeof procedures.$inferInsert = {
        id,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        code: data.code,
        name_ar: data.name_ar,
        name_en: data.name_en ?? null,
        category: data.category,
        default_price_halalas: data.default_price_halalas,
        default_duration_min: data.default_duration_min ?? 30,
        requires_tooth: data.requires_tooth ?? false,
        requires_surface: data.requires_surface ?? false,
        is_active: data.is_active ?? true,
        color: data.color ?? '#1E4E9C',
      };
      await db.insert(procedures).values(newProc);
      const res = await db.select().from(procedures).where(eq(procedures.id, id)).limit(1);
      return res[0] as unknown as Procedure;
    });
  }

  async updateProcedure(id: string, data: UpdateProcedure): Promise<ApiResult<Procedure>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      await db
        .update(procedures)
        .set({
          ...data,
          updated_at: now,
        })
        .where(eq(procedures.id, id));
      const res = await db.select().from(procedures).where(eq(procedures.id, id)).limit(1);
      if (!res.length) throw new Error('الإجراء غير موجود');
      return res[0] as unknown as Procedure;
    });
  }

  async deleteProcedure(id: string): Promise<ApiResult<boolean>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      await db.update(procedures).set({ deleted_at: now, updated_at: now }).where(eq(procedures.id, id));
      return true;
    });
  }

  async bulkUpsertProcedures(procs: CreateProcedure[], customSqlite?: Database.Database): Promise<ApiResult<number>> {
    return withTransaction((sqlite) => {
      const now = new Date().toISOString();
      let count = 0;

      const checkStmt = sqlite.prepare('SELECT id FROM procedures WHERE code = ? LIMIT 1');
      const updateStmt = sqlite.prepare(`
        UPDATE procedures
        SET clinic_id = ?, updated_at = ?, deleted_at = NULL, name_ar = ?, name_en = ?,
            category = ?, default_price_halalas = ?, default_duration_min = ?,
            requires_tooth = ?, requires_surface = ?, is_active = ?, color = ?
        WHERE code = ?
      `);
      const insertStmt = sqlite.prepare(`
        INSERT INTO procedures (
          id, clinic_id, created_at, updated_at, deleted_at,
          code, name_ar, name_en, category, default_price_halalas,
          default_duration_min, requires_tooth, requires_surface, is_active, color
        ) VALUES (
          ?, ?, ?, ?, NULL,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?
        )
      `);

      for (const item of procs) {
        const existing = checkStmt.get(item.code) as any;
        if (existing) {
          updateStmt.run(
            item.clinic_id,
            now,
            item.name_ar,
            item.name_en ?? null,
            item.category,
            item.default_price_halalas,
            item.default_duration_min ?? 30,
            item.requires_tooth ? 1 : 0,
            item.requires_surface ? 1 : 0,
            item.is_active ? 1 : 0,
            item.color ?? '#1E4E9C',
            item.code
          );
        } else {
          insertStmt.run(
            crypto.randomUUID(),
            item.clinic_id,
            now,
            now,
            item.code,
            item.name_ar,
            item.name_en ?? null,
            item.category,
            item.default_price_halalas,
            item.default_duration_min ?? 30,
            item.requires_tooth ? 1 : 0,
            item.requires_surface ? 1 : 0,
            item.is_active ? 1 : 0,
            item.color ?? '#1E4E9C'
          );
        }
        count++;
      }
      return count;
    }, customSqlite);
  }

  async acceptPlanTransaction(
    payload: AcceptPlanPayload,
    customSqlite?: Database.Database
  ): Promise<ApiResult<{ invoiceId: string; invoiceNumber: string; treatmentsCount: number }>> {
    return withTransaction((sqlite) => {
      const now = new Date().toISOString();

      // 1. Get plan
      const plan = sqlite
        .prepare('SELECT * FROM treatment_plans WHERE id = ? AND deleted_at IS NULL')
        .get(payload.planId) as any;

      if (!plan) throw new Error('خطة العلاج غير موجودة');

      // 2. Mark plan as accepted
      sqlite.prepare(`
        UPDATE treatment_plans
        SET status = 'accepted', patient_consent_at = ?, updated_at = ?
        WHERE id = ?
      `).run(now, now, payload.planId);

      const invoiceId = crypto.randomUUID();
      const countRow = sqlite.prepare('SELECT COUNT(*) as count FROM invoices').get() as { count: number };
      const invoiceNumber = `INV-2026-${String((countRow?.count || 0) + 1).padStart(4, '0')}`;

      let runningSubtotal = 0;
      let runningDiscount = 0;
      let treatmentsCreated = 0;

      const existingPlanItems = sqlite
        .prepare('SELECT id, procedure_id, tooth_number FROM treatment_plan_items WHERE plan_id = ? AND deleted_at IS NULL')
        .all(payload.planId) as Array<{ id: string; procedure_id: string; tooth_number: number | null }>;

      const insertTreatmentStmt = sqlite.prepare(`
        INSERT INTO treatments (
          id, clinic_id, created_at, updated_at, deleted_at,
          patient_id, appointment_id, plan_item_id, procedure_id, dentist_id,
          tooth_number, surface, performed_at, status, anesthesia_type,
          materials_used, clinical_notes, price_halalas
        ) VALUES (
          ?, ?, ?, ?, NULL,
          ?, NULL, ?, ?, ?,
          ?, ?, ?, 'scheduled', NULL,
          '[]', ?, ?
        )
      `);

      const insertInvItemStmt = sqlite.prepare(`
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

      const findToothStmt = sqlite.prepare(`
        SELECT id, condition FROM tooth_records
        WHERE patient_id = ? AND tooth_number = ? AND deleted_at IS NULL
        LIMIT 1
      `);

      const updateToothStmt = sqlite.prepare(`
        UPDATE tooth_records
        SET status = 'planned', surface = ?, treatment_id = ?, updated_at = ?
        WHERE id = ?
      `);

      const insertToothStmt = sqlite.prepare(`
        INSERT INTO tooth_records (
          id, clinic_id, created_at, updated_at, deleted_at,
          patient_id, tooth_number, surface, condition, status,
          treatment_id, note, recorded_at, recorded_by
        ) VALUES (
          ?, ?, ?, ?, NULL,
          ?, ?, ?, 'healthy', 'planned',
          ?, ?, ?, ?
        )
      `);

      for (const item of payload.items) {
        const lineQty = Math.max(1, Math.floor(Number(item.quantity) || 1));
        const unitPrice = Math.floor(Number(item.unitPriceHalalas) || 0);
        const lineGross = Math.floor(unitPrice * lineQty);
        const lineDiscount = Math.min(lineGross, Math.floor(Number(item.discountHalalas) || 0));
        runningSubtotal += lineGross;
        runningDiscount += lineDiscount;
      }

      const finalNet = Math.max(0, runningSubtotal - runningDiscount);
      const initialStatus = finalNet === 0 ? 'paid' : 'draft';

      const branchRow = sqlite.prepare('SELECT id FROM branches WHERE clinic_id = ? AND deleted_at IS NULL LIMIT 1').get(plan.clinic_id) as any;
      const branchId = branchRow?.id || 'b1000000-0000-0000-0000-000000000001';

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
          ?, ?, 0, 0,
          ?, 0, ?, ?,
          NULL, NULL, ?
        )
      `).run(
        invoiceId,
        plan.clinic_id,
        branchId,
        now,
        now,
        payload.patientId,
        invoiceNumber,
        now,
        new Date(Date.now() + 14 * 86400000).toISOString(),
        runningSubtotal,
        runningDiscount,
        finalNet,
        finalNet,
        initialStatus,
        `فاتورة تقديرية صادرة عن اعتماد الخطة: ${plan.title}`
      );

      for (const item of payload.items) {
        const lineQty = Math.max(1, Math.floor(Number(item.quantity) || 1));
        const unitPrice = Math.floor(Number(item.unitPriceHalalas) || 0);
        const lineGross = Math.floor(unitPrice * lineQty);
        const lineDiscount = Math.min(lineGross, Math.floor(Number(item.discountHalalas) || 0));
        const lineNet = Math.max(0, lineGross - lineDiscount);

        const matchingPlanItem = existingPlanItems.find(
          (pi) =>
            pi.procedure_id === item.procedureId &&
            (item.toothNumber ? pi.tooth_number === item.toothNumber : true)
        );
        const planItemId = matchingPlanItem ? matchingPlanItem.id : null;

        const treatmentId = crypto.randomUUID();
        insertTreatmentStmt.run(
          treatmentId,
          plan.clinic_id,
          now,
          now,
          payload.patientId,
          planItemId,
          item.procedureId,
          payload.dentistId,
          item.toothNumber ?? null,
          item.surface ?? null,
          now,
          `معتمد من الخطة: ${plan.title}`,
          lineNet
        );
        treatmentsCreated++;

        insertInvItemStmt.run(
          crypto.randomUUID(),
          plan.clinic_id,
          now,
          now,
          invoiceId,
          treatmentId,
          `إجراء علاجي ${item.toothNumber ? ` - سن #${item.toothNumber}` : ''}`,
          item.toothNumber ?? null,
          lineQty,
          unitPrice,
          lineDiscount,
          lineNet
        );

        // Update tooth_records for plan teeth
        if (item.toothNumber) {
          const existingTooth = findToothStmt.get(payload.patientId, item.toothNumber) as any;
          if (existingTooth) {
            updateToothStmt.run(
              item.surface || 'whole',
              treatmentId,
              now,
              existingTooth.id
            );
          } else {
            insertToothStmt.run(
              crypto.randomUUID(),
              plan.clinic_id,
              now,
              now,
              payload.patientId,
              item.toothNumber,
              item.surface || 'whole',
              treatmentId,
              `خطة معتمدة: ${plan.title}`,
              now,
              payload.dentistId
            );
          }
        }
      }

      return {
        invoiceId,
        invoiceNumber,
        treatmentsCount: treatmentsCreated,
      };
    }, customSqlite);
  }

  async executeTreatmentTransaction(
    payload: ExecuteTreatmentPayload,
    customSqlite?: Database.Database
  ): Promise<ApiResult<Treatment>> {
    return withTransaction((sqlite) => {
      const now = new Date().toISOString();
      const treatmentId = crypto.randomUUID();
      const clinicId = 'c1000000-0000-0000-0000-000000000001';

      // 1. Clinical safety check on tooth condition
      if (payload.toothNumber) {
        const existingTooth = sqlite
          .prepare('SELECT id, condition FROM tooth_records WHERE patient_id = ? AND tooth_number = ? AND deleted_at IS NULL LIMIT 1')
          .get(payload.patientId, payload.toothNumber) as any;

        if (existingTooth) {
          const prevCond = existingTooth.condition;
          const isMissing = prevCond === 'missing';
          const isAllowedReplacement =
            payload.newToothCondition === 'implant' ||
            payload.newToothCondition === 'crown' ||
            payload.newToothCondition === 'bridge';

          if (isMissing && !isAllowedReplacement) {
            throw new Error(
              `خطأ سريري مانع: السن رقم (${payload.toothNumber}) مسجل كسن مفقود في المخطط السني للمريض. لا يمكن إجراء حشو أو علاج عصب عليه إلا في حال زراعة سن جديد أو تعويض ثابت.`
            );
          }
        }
      }

      // 2. Insert treatment first (so treatments.id exists for foreign keys)
      sqlite.prepare(`
        INSERT INTO treatments (
          id, clinic_id, created_at, updated_at, deleted_at,
          patient_id, appointment_id, plan_item_id, procedure_id, dentist_id,
          tooth_number, surface, performed_at, status, anesthesia_type,
          materials_used, clinical_notes, price_halalas
        ) VALUES (
          ?, ?, ?, ?, NULL,
          ?, NULL, ?, ?, ?,
          ?, ?, ?, 'completed', ?,
          ?, ?, ?
        )
      `).run(
        treatmentId,
        clinicId,
        now,
        now,
        payload.patientId,
        payload.planItemId ?? null,
        payload.procedureId,
        payload.dentistId,
        payload.toothNumber ?? null,
        payload.surface ?? null,
        now,
        payload.anesthesiaType ?? null,
        JSON.stringify(payload.materialsUsed ?? []),
        payload.clinicalNotes ?? null,
        Math.floor(Number(payload.priceHalalas) || 0)
      );

      // 3. Deduct materials from inventory and record transactions
      if (payload.materialsUsed && payload.materialsUsed.length > 0) {
        const findInvItemStmt = sqlite.prepare(`
          SELECT id, clinic_id, name, quantity FROM inventory_items WHERE id = ? AND deleted_at IS NULL
        `);
        const updateInvQtyStmt = sqlite.prepare(`
          UPDATE inventory_items SET quantity = quantity - ?, updated_at = ? WHERE id = ?
        `);
        const insertInvTxStmt = sqlite.prepare(`
          INSERT INTO inventory_transactions (
            id, clinic_id, created_at, updated_at, deleted_at,
            item_id, type, quantity, reason, treatment_id, created_by
          ) VALUES (
            ?, ?, ?, ?, NULL,
            ?, 'out', ?, ?, ?, ?
          )
        `);

        for (const mat of payload.materialsUsed) {
          const matItemId = mat.item_id || (mat as any).itemId;
          const matQty = Math.max(1, Math.floor(Number(mat.quantity_used ?? (mat as any).quantity) || 1));
          const invItem = findInvItemStmt.get(matItemId) as any;
          if (!invItem) {
            throw new Error(`الصنف المخزني غير موجود (${matItemId})`);
          }
          if (invItem.quantity < matQty) {
            throw new Error(`رصيد الصنف "${invItem.name}" غير كافٍ في المخزون (المتوفر: ${invItem.quantity}، المطلوب: ${matQty}).`);
          }

          updateInvQtyStmt.run(matQty, now, matItemId);
          insertInvTxStmt.run(
            crypto.randomUUID(),
            invItem.clinic_id || clinicId,
            now,
            now,
            matItemId,
            matQty,
            `استهلاك مواد للإجراء العلاجي`,
            treatmentId,
            payload.dentistId
          );
        }
      }

      // 4. Update / insert tooth records
      if (payload.toothNumber) {
        const existingTooth = sqlite
          .prepare('SELECT id FROM tooth_records WHERE patient_id = ? AND tooth_number = ? AND deleted_at IS NULL LIMIT 1')
          .get(payload.patientId, payload.toothNumber) as any;

        if (existingTooth) {
          sqlite.prepare(`
            UPDATE tooth_records
            SET status = 'completed', condition = ?, surface = ?, treatment_id = ?, updated_at = ?
            WHERE id = ?
          `).run(
            payload.newToothCondition ?? 'healthy',
            payload.surface || 'whole',
            treatmentId,
            now,
            existingTooth.id
          );
        } else {
          sqlite.prepare(`
            INSERT INTO tooth_records (
              id, clinic_id, created_at, updated_at, deleted_at,
              patient_id, tooth_number, surface, condition, status,
              treatment_id, note, recorded_at, recorded_by
            ) VALUES (
              ?, ?, ?, ?, NULL,
              ?, ?, ?, ?, 'completed',
              ?, ?, ?, ?
            )
          `).run(
            crypto.randomUUID(),
            clinicId,
            now,
            now,
            payload.patientId,
            payload.toothNumber,
            payload.surface || 'whole',
            payload.newToothCondition ?? 'healthy',
            treatmentId,
            payload.clinicalNotes ?? 'تم العلاج',
            now,
            payload.dentistId
          );
        }
      }

      const created = sqlite.prepare('SELECT * FROM treatments WHERE id = ?').get(treatmentId) as any;
      if (created.materials_used && typeof created.materials_used === 'string') {
        try {
          created.materials_used = JSON.parse(created.materials_used);
        } catch {
          created.materials_used = [];
        }
      }
      return created as Treatment;
    }, customSqlite);
  }

  async getProcedures(filters?: ProcedureFilters): Promise<ApiResult<Paginated<Procedure>>> {
    return safeExecute(async () => {
      const db = getDb();
      const page = Math.max(1, filters?.page || 1);
      const limit = Math.min(100, Math.max(1, filters?.limit || 50));
      const offset = (page - 1) * limit;

      const conditions = [isNull(procedures.deleted_at)];
      if (filters?.category) {
        conditions.push(eq(procedures.category, filters.category));
      }
      if (filters?.search) {
        conditions.push(sql`${procedures.name_ar} LIKE ${`%${filters.search}%`}`);
      }

      const whereClause = and(...conditions);
      const items = (await db
        .select()
        .from(procedures)
        .where(whereClause)
        .orderBy(procedures.code)
        .limit(limit)
        .offset(offset)) as unknown as Procedure[];

      const countResult = await db.select({ count: sql<number>`count(*)` }).from(procedures).where(whereClause);
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
}

export const treatmentsRepo = new TreatmentsRepository();
