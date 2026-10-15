import { getDb } from '../db/connection';
import { images } from '../db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import type {
  Image,
  CreateImage,
  PaginationParams,
  Paginated,
  ApiResult,
} from '@shared/contracts';
import { safeExecute } from './base';
import crypto from 'node:crypto';

export class ImagesRepository {
  async list(params?: PaginationParams): Promise<ApiResult<Paginated<Image>>> {
    return safeExecute(async () => {
      const db = getDb();
      const page = Math.max(1, params?.page || 1);
      const limit = Math.min(100, Math.max(1, params?.limit || 20));
      const offset = (page - 1) * limit;

      const whereClause = isNull(images.deleted_at);

      const rows = await db
        .select()
        .from(images)
        .where(whereClause)
        .orderBy(desc(images.taken_at))
        .limit(limit)
        .offset(offset);

      const items = rows.map((r) => ({
        ...r,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags,
      })) as unknown as Image[];

      const countResult = await db.select({ count: sql<number>`count(*)` }).from(images).where(whereClause);
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

  async getByPatient(patientId: string): Promise<ApiResult<Image[]>> {
    return safeExecute(async () => {
      const db = getDb();
      const rows = await db
        .select()
        .from(images)
        .where(and(eq(images.patient_id, patientId), isNull(images.deleted_at)))
        .orderBy(desc(images.taken_at));

      return rows.map((r) => ({
        ...r,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags,
      })) as unknown as Image[];
    });
  }

  async create(data: CreateImage): Promise<ApiResult<Image>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const newImg: typeof images.$inferInsert = {
        id,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        tooth_number: data.tooth_number ?? null,
        type: data.type,
        file_path: data.file_path,
        thumbnail_path: data.thumbnail_path ?? null,
        taken_at: data.taken_at ?? now,
        captured_by: data.captured_by,
        notes: data.notes ?? null,
        tags: data.tags ?? [],
      };

      await db.insert(images).values(newImg);
      const res = await db.select().from(images).where(eq(images.id, id)).limit(1);
      const row = res[0];
      return {
        ...row,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      } as unknown as Image;
    });
  }

  async delete(id: string): Promise<ApiResult<boolean>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      await db.update(images).set({ deleted_at: now, updated_at: now }).where(eq(images.id, id));
      return true;
    });
  }
}

export const imagesRepo = new ImagesRepository();
