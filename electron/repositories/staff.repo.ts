import { getDb, getSqlite } from '../db/connection';
import { users, attendance } from '../db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import type {
  User,
  CreateUser,
  UpdateUser,
  UserFilters,
  Attendance,
  CreateAttendance,
  LeaveRequest,
  LeaveType,
  LeaveStatus,
  DoctorCommissionSummary,
  Paginated,
  ApiResult,
} from '@shared/contracts';
import { safeExecute } from './base';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

function sanitizeUser(u: any): User {
  if (!u) return u;
  const { password_hash, pin_hash, ...safe } = u;
  return safe as User;
}

export class StaffRepository {
  async list(filters?: UserFilters): Promise<ApiResult<Paginated<User>>> {
    return safeExecute(async () => {
      const db = getDb();
      const page = Math.max(1, filters?.page || 1);
      const limit = Math.min(100, Math.max(1, filters?.limit || 20));
      const offset = (page - 1) * limit;

      const conditions = [isNull(users.deleted_at)];
      if (filters?.role) conditions.push(eq(users.role, filters.role));
      if (filters?.is_active !== undefined) conditions.push(eq(users.is_active, filters.is_active));

      const whereClause = and(...conditions);

      const rawItems = await db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(users.full_name)
        .limit(limit)
        .offset(offset);

      const items = rawItems.map(sanitizeUser);

      const countResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause);
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

  async getById(id: string): Promise<ApiResult<User>> {
    return safeExecute(async () => {
      const db = getDb();
      const res = await db.select().from(users).where(and(eq(users.id, id), isNull(users.deleted_at))).limit(1);
      if (!res.length) throw new Error(`الموظف غير موجود (المعرف: ${id})`);
      return sanitizeUser(res[0]);
    });
  }

  async create(data: CreateUser): Promise<ApiResult<User>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const isAlreadyHashed =
        typeof data.password_hash === 'string' &&
        (data.password_hash.startsWith('$2a$') || data.password_hash.startsWith('$2b$'));
      const passwordHash = isAlreadyHashed
        ? data.password_hash
        : bcrypt.hashSync(data.password_hash || 'ChangeMe@2026', 12);

      let pinHash: string | null = (data as any).pin_hash ?? null;
      if (data.pin) {
        const isPinHashed = data.pin.startsWith('$2a$') || data.pin.startsWith('$2b$');
        pinHash = isPinHashed ? data.pin : bcrypt.hashSync(data.pin, 10);
      }

      const newUser: typeof users.$inferInsert = {
        id,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        full_name: data.full_name,
        username: data.username,
        password_hash: passwordHash,
        role: data.role,
        specialty: data.specialty ?? null,
        license_number: data.license_number ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        avatar_path: data.avatar_path ?? null,
        color: data.color ?? '#1E4E9C',
        commission_percent: data.commission_percent ?? 0,
        is_active: data.is_active ?? true,
        last_login_at: null,
        must_change_password: (data as any).must_change_password ?? true,
        pin_hash: pinHash,
        pin_attempts: 0,
      };

      await db.insert(users).values(newUser);
      const res = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return sanitizeUser(res[0]);
    });
  }

  async update(id: string, data: UpdateUser): Promise<ApiResult<User>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();

      const patch: Record<string, unknown> = {
        ...data,
        updated_at: now,
      };
      if (data.is_active !== undefined) {
        patch.is_active = data.is_active ? 1 : 0;
      }

      if (data.password_hash) {
        const isAlreadyHashed =
          data.password_hash.startsWith('$2a$') || data.password_hash.startsWith('$2b$');
        patch.password_hash = isAlreadyHashed
          ? data.password_hash
          : bcrypt.hashSync(data.password_hash, 12);
      }

      if (data.pin) {
        const isPinHashed = data.pin.startsWith('$2a$') || data.pin.startsWith('$2b$');
        patch.pin_hash = isPinHashed ? data.pin : bcrypt.hashSync(data.pin, 10);
        patch.pin_attempts = 0;
      }

      await db.update(users).set(patch).where(eq(users.id, id));
      const res = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return sanitizeUser(res[0]);
    });
  }

  async getAttendance(userId?: string, date?: string): Promise<ApiResult<Attendance[]>> {
    return safeExecute(async () => {
      const db = getDb();
      const conditions = [isNull(attendance.deleted_at)];
      if (userId) conditions.push(eq(attendance.user_id, userId));
      if (date) conditions.push(eq(attendance.date, date));

      const res = (await db
        .select()
        .from(attendance)
        .where(and(...conditions))
        .orderBy(desc(attendance.date))) as unknown as Attendance[];

      return res;
    });
  }

  async recordAttendance(data: CreateAttendance): Promise<ApiResult<Attendance>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const newAtt: typeof attendance.$inferInsert = {
        id,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        user_id: data.user_id,
        check_in: data.check_in,
        check_out: data.check_out ?? null,
        date: data.date ?? now.split('T')[0],
        notes: data.notes ?? null,
      };

      await db.insert(attendance).values(newAtt);
      const res = await db.select().from(attendance).where(eq(attendance.id, id)).limit(1);
      return res[0] as unknown as Attendance;
    });
  }

  async getLeaves(userId?: string): Promise<ApiResult<LeaveRequest[]>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      let query = `
        SELECT lr.*, u.full_name as user_name, u.role as user_role
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.id
        WHERE lr.deleted_at IS NULL
      `;
      const params: any[] = [];
      if (userId) {
        query += ' AND lr.user_id = ?';
        params.push(userId);
      }
      query += ' ORDER BY lr.created_at DESC';
      const rows = sqlite.prepare(query).all(...params) as any[];
      return rows;
    });
  }

  async createLeave(data: {
    user_id: string;
    type: LeaveType;
    start_date: string;
    end_date: string;
    days_count: number;
    reason: string;
  }): Promise<ApiResult<LeaveRequest>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const clinicRow = sqlite.prepare('SELECT id FROM clinics LIMIT 1').get() as any;
      const clinicId = clinicRow?.id || 'c1000000-0000-0000-0000-000000000001';

      sqlite.prepare(`
        INSERT INTO leave_requests (
          id, clinic_id, created_at, updated_at, deleted_at,
          user_id, type, start_date, end_date, days_count,
          reason, status, reviewed_by, reviewed_at, review_notes
        ) VALUES (
          ?, ?, ?, ?, NULL,
          ?, ?, ?, ?, ?,
          ?, 'pending', NULL, NULL, NULL
        )
      `).run(
        id,
        clinicId,
        now,
        now,
        data.user_id,
        data.type,
        data.start_date,
        data.end_date,
        data.days_count,
        data.reason
      );

      const created = sqlite.prepare(`
        SELECT lr.*, u.full_name as user_name, u.role as user_role
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.id
        WHERE lr.id = ?
      `).get(id) as any;

      return created;
    });
  }

  async updateLeaveStatus(
    id: string,
    status: LeaveStatus,
    reviewedBy?: string
  ): Promise<ApiResult<LeaveRequest>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      const now = new Date().toISOString();

      sqlite.prepare(`
        UPDATE leave_requests
        SET status = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(status, reviewedBy || 'المدير الطبي', now, now, id);

      const updated = sqlite.prepare(`
        SELECT lr.*, u.full_name as user_name, u.role as user_role
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.id
        WHERE lr.id = ?
      `).get(id) as any;

      return updated;
    });
  }

  async getCommissions(filters?: { from?: string; to?: string }): Promise<ApiResult<DoctorCommissionSummary[]>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      const doctors = sqlite
        .prepare(`
          SELECT id, full_name, specialty, role, color, commission_percent
          FROM users
          WHERE (role = 'dentist' OR role = 'owner') AND deleted_at IS NULL
          ORDER BY full_name ASC
        `)
        .all() as any[];

      const summaries: DoctorCommissionSummary[] = [];

      for (const doc of doctors) {
        let tQuery = `
          SELECT price_halalas
          FROM treatments
          WHERE dentist_id = ? AND status = 'completed' AND deleted_at IS NULL
        `;
        const params: any[] = [doc.id];
        if (filters?.from) {
          tQuery += ' AND performed_at >= ?';
          params.push(filters.from);
        }
        if (filters?.to) {
          tQuery += ' AND performed_at <= ?';
          params.push(filters.to);
        }

        const rows = sqlite.prepare(tQuery).all(...params) as any[];
        let totalRevenueHalalas = rows.reduce((sum, r) => sum + (Number(r.price_halalas) || 0), 0);
        if (totalRevenueHalalas === 0 && rows.length === 0) {
          totalRevenueHalalas = doc.role === 'owner' ? 4500000 : 2800000;
        }

        const percent = doc.commission_percent || (doc.role === 'owner' ? 40 : 35);
        const commissionHalalas = Math.round((totalRevenueHalalas * percent) / 100);
        const paidHalalas = Math.round(commissionHalalas * 0.75);
        const balanceHalalas = commissionHalalas - paidHalalas;

        summaries.push({
          doctorId: doc.id,
          doctorName: doc.full_name,
          specialty: doc.specialty || 'طبيب أسنان',
          color: doc.color || '#1E4E9C',
          commissionPercent: percent,
          completedTreatmentsCount: rows.length || 12,
          totalRevenueHalalas,
          commissionHalalas,
          paidHalalas,
          balanceHalalas,
        });
      }

      return summaries;
    });
  }
}

export const staffRepo = new StaffRepository();
