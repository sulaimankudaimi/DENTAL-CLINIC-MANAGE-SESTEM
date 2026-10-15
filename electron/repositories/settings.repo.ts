import { getDb } from '../db/connection';
import { clinics, settings } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { Clinic, UpdateClinic, ApiResult } from '@shared/contracts';
import { safeExecute } from './base';
import crypto from 'node:crypto';

import {
  appearanceSettingSchema,
  workingHoursSettingSchema,
  messageTemplatesSettingSchema,
  securityPoliciesSettingSchema,
  clinicProfileSettingSchema,
} from '../../shared/ipcSchemas';

export class SettingsRepository {
  private validateSetting(key: string, value: unknown) {
    switch (key) {
      case 'appearance':
        appearanceSettingSchema.parse(value);
        break;
      case 'working_hours':
        workingHoursSettingSchema.parse(value);
        break;
      case 'message_templates':
        messageTemplatesSettingSchema.parse(value);
        break;
      case 'security_policies':
        securityPoliciesSettingSchema.parse(value);
        break;
      case 'clinic_profile':
        clinicProfileSettingSchema.parse(value);
        break;
      default:
        break;
    }
  }

  async getClinic(): Promise<ApiResult<Clinic>> {
    return safeExecute(async () => {
      const db = getDb();
      const res = await db.select().from(clinics).where(isNull(clinics.deleted_at)).limit(1);
      if (!res.length) throw new Error('بيانات العيادة غير موجودة');
      return res[0] as unknown as Clinic;
    });
  }

  async updateClinic(data: UpdateClinic): Promise<ApiResult<Clinic>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      const current = await this.getClinic();
      if (!current.ok) throw new Error(current.error);

      const patch: Record<string, unknown> = {
        ...data,
        updated_at: now,
      };

      if (data.working_hours) {
        patch.working_hours = data.working_hours;
      }

      await db.update(clinics).set(patch).where(eq(clinics.id, current.data.id));
      const res = await this.getClinic();
      if (!res.ok) throw new Error(res.error);
      return res.data;
    });
  }

  async getSettings(): Promise<ApiResult<Record<string, unknown>>> {
    return safeExecute(async () => {
      const db = getDb();
      const rows = await db.select().from(settings).where(isNull(settings.deleted_at));
      const result: Record<string, unknown> = {};
      for (const row of rows) {
        result[row.key] = row.value;
      }
      return result;
    });
  }

  async setSetting(key: string, value: unknown): Promise<ApiResult<boolean>> {
    return safeExecute(async () => {
      this.validateSetting(key, value);
      const db = getDb();
      const now = new Date().toISOString();
      const clinic = await this.getClinic();
      const clinicId = clinic.ok ? clinic.data.id : 'default';

      const existing = await db
        .select()
        .from(settings)
        .where(and(eq(settings.key, key), eq(settings.clinic_id, clinicId)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(settings)
          .set({ value, updated_at: now })
          .where(and(eq(settings.key, key), eq(settings.clinic_id, clinicId)));
      } else {
        await db.insert(settings).values({
          id: crypto.randomUUID(),
          clinic_id: clinicId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
          key,
          value,
          scope: 'clinic',
        });
      }

      return true;
    });
  }
}

export const settingsRepo = new SettingsRepository();
