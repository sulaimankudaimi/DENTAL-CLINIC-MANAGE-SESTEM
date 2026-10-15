import { getDb } from '../db/connection';
import { appointments, payments, patients, inventoryItems, insuranceClaims } from '../db/schema';
import { eq, and, isNull, gte, lte, sql } from 'drizzle-orm';
import type { DashboardSummary, ApiResult } from '@shared/contracts';
import { safeExecute } from './base';

export class DashboardRepository {
  async getTodaySummary(): Promise<ApiResult<DashboardSummary>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const todayStart = `${todayStr}T00:00:00.000Z`;
      const todayEnd = `${todayStr}T23:59:59.999Z`;

      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00.000Z`;

      // 1. Today Appointments
      const todayAppts = await db
        .select({
          status: appointments.status,
          count: sql<number>`count(*)`,
        })
        .from(appointments)
        .where(
          and(
            isNull(appointments.deleted_at),
            gte(appointments.start_at, todayStart),
            lte(appointments.start_at, todayEnd)
          )
        )
        .groupBy(appointments.status);

      let todayAppointmentsCount = 0;
      let todayWaitingCount = 0;
      let todayCompletedCount = 0;

      for (const row of todayAppts) {
        const count = Number(row.count);
        todayAppointmentsCount += count;
        if (row.status === 'waiting') todayWaitingCount += count;
        if (row.status === 'completed') todayCompletedCount += count;
      }

      // 2. Today Revenue
      const todayRev = await db
        .select({
          total: sql<number>`COALESCE(SUM(${payments.amount_halalas}), 0)`,
        })
        .from(payments)
        .where(
          and(
            isNull(payments.deleted_at),
            gte(payments.paid_at, todayStart),
            lte(payments.paid_at, todayEnd)
          )
        );
      const todayRevenueHalalas = Number(todayRev[0]?.total || 0);

      // 3. Month Revenue
      const monthRev = await db
        .select({
          total: sql<number>`COALESCE(SUM(${payments.amount_halalas}), 0)`,
        })
        .from(payments)
        .where(
          and(
            isNull(payments.deleted_at),
            gte(payments.paid_at, monthStart)
          )
        );
      const monthRevenueHalalas = Number(monthRev[0]?.total || 0);

      // 4. Active Patients
      const activePat = await db
        .select({ count: sql<number>`count(*)` })
        .from(patients)
        .where(and(isNull(patients.deleted_at), eq(patients.is_active, true)));
      const activePatientsCount = Number(activePat[0]?.count || 0);

      // 5. Low stock items
      const lowStock = await db
        .select({ count: sql<number>`count(*)` })
        .from(inventoryItems)
        .where(
          and(
            isNull(inventoryItems.deleted_at),
            lte(inventoryItems.quantity, inventoryItems.min_quantity)
          )
        );
      const lowStockItemsCount = Number(lowStock[0]?.count || 0);

      // 6. Pending insurance claims
      const pendingClaims = await db
        .select({ count: sql<number>`count(*)` })
        .from(insuranceClaims)
        .where(
          and(
            isNull(insuranceClaims.deleted_at),
            eq(insuranceClaims.status, 'submitted')
          )
        );
      const pendingInsuranceClaimsCount = Number(pendingClaims[0]?.count || 0);

      return {
        todayAppointmentsCount,
        todayWaitingCount,
        todayCompletedCount,
        todayRevenueHalalas,
        monthRevenueHalalas,
        activePatientsCount,
        lowStockItemsCount,
        pendingInsuranceClaimsCount,
      };
    });
  }
}

export const dashboardRepo = new DashboardRepository();
