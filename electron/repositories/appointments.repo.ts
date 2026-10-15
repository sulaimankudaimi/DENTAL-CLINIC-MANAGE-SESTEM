import { getDb } from '../db/connection';
import { appointments } from '../db/schema';
import { eq, and, isNull, gte, lte, desc, sql } from 'drizzle-orm';
import type {
  Appointment,
  CreateAppointment,
  UpdateAppointment,
  AppointmentFilters,
  AppointmentStatus,
  Paginated,
  ApiResult,
} from '@shared/contracts';
import { safeExecute } from './base';
import crypto from 'node:crypto';

export class AppointmentsRepository {
  async list(filters: AppointmentFilters): Promise<ApiResult<Paginated<Appointment>>> {
    return safeExecute(async () => {
      const db = getDb();
      const page = Math.max(1, filters.page || 1);
      const limit = Math.min(100, Math.max(1, filters.limit || 20));
      const offset = (page - 1) * limit;

      const conditions = [isNull(appointments.deleted_at)];

      if (filters.dentist_id) {
        conditions.push(eq(appointments.dentist_id, filters.dentist_id));
      }
      if (filters.patient_id) {
        conditions.push(eq(appointments.patient_id, filters.patient_id));
      }
      if (filters.status) {
        conditions.push(eq(appointments.status, filters.status));
      }
      if (filters.date_from) {
        conditions.push(gte(appointments.start_at, filters.date_from));
      }
      if (filters.date_to) {
        conditions.push(lte(appointments.start_at, filters.date_to));
      }

      const whereClause = and(...conditions);

      const rawItems = await db
        .select()
        .from(appointments)
        .where(whereClause)
        .orderBy(desc(appointments.start_at))
        .limit(limit)
        .offset(offset);

      const items = (rawItems.map((item) => ({
        ...item,
        procedure_ids: Array.isArray(item.procedure_ids)
          ? item.procedure_ids
          : typeof item.procedure_ids === 'string'
            ? JSON.parse(item.procedure_ids)
            : [],
      }))) as unknown as Appointment[];

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
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

  async getById(id: string): Promise<ApiResult<Appointment>> {
    return safeExecute(async () => {
      const db = getDb();
      const result = await db
        .select()
        .from(appointments)
        .where(and(eq(appointments.id, id), isNull(appointments.deleted_at)))
        .limit(1);

      if (!result.length) {
        throw new Error(`الموعد غير موجود (المعرف: ${id})`);
      }

      const item = result[0];
      return {
        ...item,
        procedure_ids: Array.isArray(item.procedure_ids)
          ? item.procedure_ids
          : typeof item.procedure_ids === 'string'
            ? JSON.parse(item.procedure_ids)
            : [],
      } as unknown as Appointment;
    });
  }

  async create(data: CreateAppointment): Promise<ApiResult<Appointment>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();

      // Validate start before end
      if (new Date(data.start_at).getTime() >= new Date(data.end_at).getTime()) {
        throw new Error('وقت نهاية الموعد يجب أن يكون بعد وقت البدء.');
      }

      // Check clinic weekly off-day: Friday (الجمعة = 5)
      const startDate = new Date(data.start_at);
      if (startDate.getDay() === 5 && !data.notes?.includes('[استثناء عطلة]')) {
        throw new Error('يوم الجمعة هو يوم العطلة الأسبوعية للعيادة. لا يمكن حجز مواعيد خلال العطلة الأسبوعية.');
      }

      // Check double-booking conflicts for same dentist
      const conflicts = await db
        .select()
        .from(appointments)
        .where(
          and(
            isNull(appointments.deleted_at),
            eq(appointments.dentist_id, data.dentist_id),
            sql`${appointments.status} NOT IN ('cancelled', 'no_show')`,
            sql`${appointments.start_at} < ${data.end_at} AND ${appointments.end_at} > ${data.start_at}`
          )
        )
        .limit(1);

      if (conflicts.length > 0) {
        throw new Error('تعارض في جدول المواعيد: الطبيب المعالج لديه موعد آخر محجوز مسبقاً في هذه الفترة الزمنية.');
      }

      const id = crypto.randomUUID();

      const newAppt: typeof appointments.$inferInsert = {
        id,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        dentist_id: data.dentist_id,
        branch_id: data.branch_id,
        room_id: data.room_id ?? null,
        start_at: data.start_at,
        end_at: data.end_at,
        procedure_ids: data.procedure_ids ?? [],
        status: data.status ?? 'scheduled',
        source: data.source ?? 'phone',
        color_override: data.color_override ?? null,
        notes: data.notes ?? null,
        reminder_sent_at: data.reminder_sent_at ?? null,
        created_by: data.created_by,
      };

      await db.insert(appointments).values(newAppt);

      const created = await this.getById(id);
      if (!created.ok) throw new Error(created.error);
      return created.data;
    });
  }

  async update(id: string, data: UpdateAppointment): Promise<ApiResult<Appointment>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();

      const patch: Record<string, unknown> = {
        ...data,
        updated_at: now,
      };

      if (data.procedure_ids) {
        patch.procedure_ids = data.procedure_ids;
      }

      await db
        .update(appointments)
        .set(patch)
        .where(and(eq(appointments.id, id), isNull(appointments.deleted_at)));

      const updated = await this.getById(id);
      if (!updated.ok) throw new Error(updated.error);
      return updated.data;
    });
  }

  async delete(id: string): Promise<ApiResult<boolean>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      await db.update(appointments).set({ deleted_at: now, updated_at: now }).where(eq(appointments.id, id));
      return true;
    });
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<ApiResult<Appointment>> {
    return this.update(id, { status });
  }

  async getWeek(from: string, to: string, dentistId?: string): Promise<ApiResult<Appointment[]>> {
    return safeExecute(async () => {
      const db = getDb();
      const conditions = [
        isNull(appointments.deleted_at),
        gte(appointments.start_at, from),
        lte(appointments.start_at, to),
      ];

      if (dentistId) {
        conditions.push(eq(appointments.dentist_id, dentistId));
      }

      const rows = await db
        .select()
        .from(appointments)
        .where(and(...conditions))
        .orderBy(appointments.start_at);

      return rows.map((r) => ({
        ...r,
        procedure_ids: Array.isArray(r.procedure_ids)
          ? r.procedure_ids
          : typeof r.procedure_ids === 'string'
            ? JSON.parse(r.procedure_ids)
            : [],
      })) as unknown as Appointment[];
    });
  }

  async getToday(dentistId?: string): Promise<ApiResult<Appointment[]>> {
    const todayStr = new Date().toISOString().split('T')[0];
    const from = `${todayStr}T00:00:00.000Z`;
    const to = `${todayStr}T23:59:59.999Z`;
    return this.getWeek(from, to, dentistId);
  }
}

export const appointmentsRepo = new AppointmentsRepository();
