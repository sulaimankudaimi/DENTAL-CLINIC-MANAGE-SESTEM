import { getDb, getSqlite } from '../db/connection';
import { patients, medicalHistory, allergies, toothRecords } from '../db/schema';
import { eq, and, isNull, or, like, desc, sql } from 'drizzle-orm';
import type {
  Patient,
  CreatePatient,
  UpdatePatient,
  PatientFilters,
  Paginated,
  ApiResult,
  MedicalHistory,
  CreateMedicalHistory,
  Allergy,
  CreateAllergy,
  ToothRecord,
  CreateToothRecord,
} from '@shared/contracts';
import { safeExecute } from './base';
import crypto from 'node:crypto';

export class PatientsRepository {
  async list(filters: PatientFilters): Promise<ApiResult<Paginated<Patient>>> {
    return safeExecute(async () => {
      const db = getDb();
      const page = Math.max(1, filters.page || 1);
      const limit = Math.min(100, Math.max(1, filters.limit || 20));
      const offset = (page - 1) * limit;

      const conditions = [isNull(patients.deleted_at)];

      if (filters.search?.trim()) {
        const query = `%${filters.search.trim()}%`;
        conditions.push(
          or(
            like(patients.first_name, query),
            like(patients.family_name, query),
            like(patients.phone, query),
            like(patients.code, query),
            like(patients.national_id, query)
          )!
        );
      }

      if (filters.gender) {
        conditions.push(eq(patients.gender, filters.gender));
      }

      if (filters.primary_dentist_id) {
        conditions.push(eq(patients.primary_dentist_id, filters.primary_dentist_id));
      }

      if (filters.has_insurance !== undefined) {
        if (filters.has_insurance) {
          conditions.push(sql`${patients.insurance_company_id} IS NOT NULL`);
        } else {
          conditions.push(isNull(patients.insurance_company_id));
        }
      }

      const whereClause = and(...conditions);

      const items = (await db
        .select()
        .from(patients)
        .where(whereClause)
        .orderBy(desc(patients.created_at))
        .limit(limit)
        .offset(offset)) as unknown as Patient[];

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(patients)
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

  async getById(id: string): Promise<ApiResult<Patient>> {
    return safeExecute(async () => {
      const db = getDb();
      const result = await db
        .select()
        .from(patients)
        .where(and(eq(patients.id, id), isNull(patients.deleted_at)))
        .limit(1);

      if (!result.length) {
        throw new Error(`المريض غير موجود (المعرف: ${id})`);
      }

      return result[0] as unknown as Patient;
    });
  }

  async create(data: CreatePatient): Promise<ApiResult<Patient>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      // Clinical & legal rule: If patient is under 18 years old, guardian details are mandatory
      if (data.birth_date) {
        const birth = new Date(data.birth_date);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        if (age < 18) {
          if (!data.emergency_contact_name || !data.emergency_contact_name.trim()) {
            throw new Error('متطلب نظامي إلزامي: المريض قاصر (أقل من 18 عاماً)؛ يلزم تسجيل اسم ولي الأمر / جهة الاتصال للطوارئ للموافقة السريرية.');
          }
          if (!data.emergency_contact_phone || !data.emergency_contact_phone.trim()) {
            throw new Error('متطلب نظامي إلزامي: المريض قاصر (أقل من 18 عاماً)؛ يلزم تسجيل رقم هاتف ولي الأمر للتواصل الطبي وحالات الطوارئ.');
          }
        }
      }

      // Generate next patient code if not provided
      let code = data.code;
      if (!code) {
        const sqlite = getSqlite();
        const last = sqlite.prepare('SELECT code FROM patients ORDER BY rowid DESC LIMIT 1').get() as { code?: string } | undefined;
        let nextNum = 1001;
        if (last?.code) {
          const parsed = parseInt(last.code.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(parsed)) nextNum = parsed + 1;
        }
        code = `P-${nextNum}`;
      }

      const newPatient: typeof patients.$inferInsert = {
        id,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        code,
        first_name: data.first_name,
        father_name: data.father_name ?? null,
        family_name: data.family_name,
        gender: data.gender,
        birth_date: data.birth_date ?? null,
        national_id: data.national_id ?? null,
        phone: data.phone,
        phone_alt: data.phone_alt ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        city: data.city ?? 'الرياض',
        blood_type: data.blood_type ?? 'unknown',
        marital_status: data.marital_status ?? 'single',
        occupation: data.occupation ?? null,
        emergency_contact_name: data.emergency_contact_name ?? null,
        emergency_contact_phone: data.emergency_contact_phone ?? null,
        referral_source: data.referral_source ?? null,
        primary_dentist_id: data.primary_dentist_id ?? null,
        insurance_company_id: data.insurance_company_id ?? null,
        insurance_policy_no: data.insurance_policy_no ?? null,
        insurance_expiry: data.insurance_expiry ?? null,
        notes: data.notes ?? null,
        photo_path: data.photo_path ?? null,
        is_active: data.is_active ?? true,
      };

      await db.insert(patients).values(newPatient);

      const created = await this.getById(id);
      if (!created.ok) throw new Error(created.error);
      return created.data;
    });
  }

  async update(id: string, data: UpdatePatient): Promise<ApiResult<Patient>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();

      await db
        .update(patients)
        .set({
          ...data,
          updated_at: now,
        })
        .where(and(eq(patients.id, id), isNull(patients.deleted_at)));

      const updated = await this.getById(id);
      if (!updated.ok) throw new Error(updated.error);
      return updated.data;
    });
  }

  async delete(id: string): Promise<ApiResult<boolean>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();

      await db
        .update(patients)
        .set({
          deleted_at: now,
          updated_at: now,
        })
        .where(eq(patients.id, id));

      return true;
    });
  }

  async search(query: string, page = 1, limit = 20): Promise<ApiResult<Paginated<Patient>>> {
    return this.list({ search: query, page, limit, sort_order: 'desc' });
  }

  async getMedicalHistory(patientId: string): Promise<ApiResult<MedicalHistory[]>> {
    return safeExecute(async () => {
      const db = getDb();
      const result = await db
        .select()
        .from(medicalHistory)
        .where(and(eq(medicalHistory.patient_id, patientId), isNull(medicalHistory.deleted_at)));
      return result as unknown as MedicalHistory[];
    });
  }

  async saveMedicalHistory(data: CreateMedicalHistory): Promise<ApiResult<MedicalHistory>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const item: typeof medicalHistory.$inferInsert = {
        id,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        condition_key: data.condition_key,
        has_condition: data.has_condition,
        details: data.details ?? null,
      };

      await db.insert(medicalHistory).values(item);
      const res = await db.select().from(medicalHistory).where(eq(medicalHistory.id, id)).limit(1);
      return res[0] as unknown as MedicalHistory;
    });
  }

  async getAllergies(patientId: string): Promise<ApiResult<Allergy[]>> {
    return safeExecute(async () => {
      const db = getDb();
      const result = await db
        .select()
        .from(allergies)
        .where(and(eq(allergies.patient_id, patientId), isNull(allergies.deleted_at)));
      return result as unknown as Allergy[];
    });
  }

  async saveAllergy(data: CreateAllergy): Promise<ApiResult<Allergy>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const item: typeof allergies.$inferInsert = {
        id,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        allergen: data.allergen,
        severity: data.severity ?? 'moderate',
        notes: data.notes ?? null,
      };

      await db.insert(allergies).values(item);
      const res = await db.select().from(allergies).where(eq(allergies.id, id)).limit(1);
      return res[0] as unknown as Allergy;
    });
  }

  async deleteAllergy(id: string): Promise<ApiResult<boolean>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      await db.update(allergies).set({ deleted_at: now, updated_at: now }).where(eq(allergies.id, id));
      return true;
    });
  }

  async getToothRecords(patientId: string): Promise<ApiResult<ToothRecord[]>> {
    return safeExecute(async () => {
      const db = getDb();
      const result = await db
        .select()
        .from(toothRecords)
        .where(and(eq(toothRecords.patient_id, patientId), isNull(toothRecords.deleted_at)));
      return result as unknown as ToothRecord[];
    });
  }

  async saveToothRecord(data: CreateToothRecord): Promise<ApiResult<ToothRecord>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const item: typeof toothRecords.$inferInsert = {
        id,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        tooth_number: data.tooth_number,
        surface: data.surface ?? 'whole',
        condition: data.condition,
        status: data.status ?? 'existing',
        treatment_id: data.treatment_id ?? null,
        note: data.note ?? null,
        recorded_at: data.recorded_at ?? now,
        recorded_by: data.recorded_by,
      };

      await db.insert(toothRecords).values(item);
      const res = await db.select().from(toothRecords).where(eq(toothRecords.id, id)).limit(1);
      return res[0] as unknown as ToothRecord;
    });
  }

  async deleteToothRecord(id: string): Promise<ApiResult<boolean>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      await db.update(toothRecords).set({ deleted_at: now, updated_at: now }).where(eq(toothRecords.id, id));
      return true;
    });
  }
}

export const patientsRepo = new PatientsRepository();
