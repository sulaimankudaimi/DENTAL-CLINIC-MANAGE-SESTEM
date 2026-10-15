import { getDb, getSqlite } from '../db/connection';
import {
  rooms,
  expenses,
  prescriptions,
  prescriptionItems,
  medicalReports,
  labOrders,
  labs,
  rolePermissions,
} from '../db/schema';
import { eq, isNull, desc, and } from 'drizzle-orm';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { systemService } from '../services/system.service';
import { withTransaction } from '../repositories/base';
import { seedReferenceData } from '../db/seed';
import { validatePasswordPolicy } from '../../shared/passwordPolicy';

// IPC Main helper: works in Electron runtime and allows direct invocation in automated tests
type IpcHandler = (event: any, ...args: any[]) => Promise<any> | any;
export const ipcHandlers = new Map<string, IpcHandler>();

let realIpcMain: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const electron = require('electron');
  if (electron && typeof electron === 'object' && electron.ipcMain) {
    realIpcMain = electron.ipcMain;
  }
} catch {}

export const safeIpcMain = {
  handle: (channel: string, handler: IpcHandler) => {
    ipcHandlers.set(channel, handler);
    if (realIpcMain && typeof realIpcMain.handle === 'function') {
      realIpcMain.handle(channel, handler);
    }
  },
};

export async function invokeIpc(channel: string, ...args: any[]): Promise<any> {
  const handler = ipcHandlers.get(channel);
  if (!handler) {
    throw new Error(`لم يتم العثور على معالج للقناة: ${channel}`);
  }
  return handler({}, ...args);
}
import {
  idSchema,
  optionalIdSchema,
  isoDateSchema,
  optionalIsoDateSchema,
  trimmedStringSchema,
  optionalTrimmedStringSchema,
  paginationParamsSchema,
  claimFiltersSchema,
  inventoryFiltersSchema,
  inventoryTransactionFiltersSchema,
  receivePurchaseOrderPayloadSchema,
  createLeaveSchema,
  staffCommissionFilterSchema,
  licenseCodeSchema,
  systemFileOperationSchema,
  firstRunSetupSchema,
  loginCredentialsSchema,
  quickUnlockPinSchema,
  changePasswordSchema,
} from "../../shared/ipcSchemas";
import type {
  CreateRoom,
  UpdateRoom,
  CreateExpense,
  UpdateExpense,
  CreatePrescription,
  CreateMedicalReport,
  UpdateMedicalReport,
  CreateLab,
  UpdateLab,
  CreateLabOrder,
  UpdateLabOrder,
  LabOrderStatus,
  PurchaseOrderStatus,
  InsuranceClaimStatus,
  PermissionsMatrix,
  ClinicSecurityPolicies,
} from "@shared/contracts";
import {
  type ResourceName,
  type PermissionAction,
  patientFiltersSchema,
  createPatientSchema,
  updatePatientSchema,
  createMedicalHistorySchema,
  createAllergySchema,
  createToothRecordSchema,
  appointmentFiltersSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentStatusSchema,
  treatmentFiltersSchema,
  createTreatmentSchema,
  updateTreatmentSchema,
  createTreatmentPlanSchema,
  updateTreatmentPlanSchema,
  procedureFiltersSchema,
  createProcedureSchema,
  updateProcedureSchema,
  invoiceFiltersSchema,
  createInvoiceSchema,
  updateInvoiceSchema,
  createPaymentSchema,
  createInsuranceCompanySchema,
  updateInsuranceCompanySchema,
  createInsuranceClaimSchema,
  updateInsuranceClaimSchema,
  createImageSchema,
  createInventoryItemSchema,
  updateInventoryItemSchema,
  createInventoryTransactionSchema,
  createUserSchema,
  updateUserSchema,
  createAttendanceSchema,
  updateClinicSchema,
  createRoomSchema,
  updateRoomSchema,
  createExpenseSchema,
  updateExpenseSchema,
  createPrescriptionSchema,
  createMedicalReportSchema,
  updateMedicalReportSchema,
  createLabSchema,
  updateLabSchema,
  createLabOrderSchema,
  updateLabOrderSchema,
  acceptPlanPayloadSchema,
  executeTreatmentPayloadSchema,
  scheduledReportSchema,
  reportFilterSchema,
  reportFiltersSchema,
  ReportFilters,
  auditLogFiltersSchema,
  permissionsMatrixSchema,
  clinicSecurityPoliciesSchema,
  createPurchaseOrderSchema,
  createSupplierSchema,
  updateSupplierSchema,
} from '@shared/contracts';

import { patientsRepo } from '../repositories/patients.repo';
import { appointmentsRepo } from '../repositories/appointments.repo';
import { treatmentsRepo } from '../repositories/treatments.repo';
import { invoicesRepo } from '../repositories/invoices.repo';
import { paymentsRepo } from '../repositories/payments.repo';
import { insuranceRepo } from '../repositories/insurance.repo';
import { imagesRepo } from '../repositories/images.repo';
import { inventoryRepo } from '../repositories/inventory.repo';
import { staffRepo } from '../repositories/staff.repo';
import { reportsRepo } from '../repositories/reports.repo';
import { settingsRepo } from '../repositories/settings.repo';
import { dashboardRepo } from '../repositories/dashboard.repo';
import * as licenseService from '../services/license.service';

// ================= SESSION STATE =================
let currentSessionUser: any = null;
let lastSessionActivity = Date.now();

export function setCurrentSessionUser(user: any): void {
  currentSessionUser = user;
  lastSessionActivity = Date.now();
}

export function getCurrentSessionUser(): any {
  return currentSessionUser;
}

function toSafeUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    clinic_id: user.clinic_id,
    full_name: user.full_name,
    username: user.username,
    role: user.role,
    specialty: user.specialty ?? null,
    license_number: user.license_number ?? null,
    phone: user.phone ?? null,
    email: user.email ?? null,
    avatar_path: user.avatar_path ?? null,
    color: user.color ?? '#1E4E9C',
    commission_percent: Number(user.commission_percent) || 0,
    is_active: Boolean(user.is_active),
    must_change_password: Boolean(user.must_change_password),
    last_login_at: user.last_login_at ?? null,
  };
}

function getIdleTimeoutMs(): number {
  try {
    const sqlite = getSqlite();
    const row = sqlite.prepare("SELECT value FROM settings WHERE key = ?").get("security_policies") as { value: string } | undefined;
    if (row?.value) {
      const parsed = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
      const mins = Number(parsed.idle_timeout_minutes || parsed.idle_timeout_min);
      if (mins && mins > 0) {
        return mins * 60 * 1000;
      }
    }
  } catch {}
  return 15 * 60 * 1000;
}

function getLoginPolicyConfig(): { maxAttempts: number; lockoutMinutes: number } {
  try {
    const sqlite = getSqlite();
    const row = sqlite.prepare("SELECT value FROM settings WHERE key = ?").get("security_policies") as { value: string } | undefined;
    if (row?.value) {
      const parsed = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
      const maxAtt = Number(parsed.max_failed_attempts || parsed.max_login_attempts) || 5;
      const lockMin = Number(parsed.lockout_duration_minutes || parsed.lockout_duration_min) || 15;
      return { maxAttempts: maxAtt, lockoutMinutes: lockMin };
    }
  } catch {}
  return { maxAttempts: 5, lockoutMinutes: 15 };
}

function checkSessionTimeout(): boolean {
  if (!currentSessionUser) return false;
  const idleTimeoutMs = getIdleTimeoutMs();
  if (Date.now() - lastSessionActivity > idleTimeoutMs) {
    currentSessionUser = null;
    return true;
  }
  return false;
}

// ================= AUDIT LOGGING =================
async function writeAudit(
  action: string,
  entityType: string,
  entityId: string,
  before?: unknown,
  after?: unknown,
  overrideUserId?: string
) {
  try {
    const sqlite = getSqlite();
    let clinicId = 'c1000000-0000-0000-0000-000000000001';
    try {
      const clinicRow = sqlite.prepare('SELECT id FROM clinics LIMIT 1').get() as { id: string } | undefined;
      if (clinicRow?.id) clinicId = clinicRow.id;
    } catch {}

    let userId = overrideUserId || currentSessionUser?.id;
    if (!userId) {
      const u = sqlite.prepare('SELECT id FROM users LIMIT 1').get() as { id: string } | undefined;
      userId = u?.id || 'u1000000-0000-0000-0000-000000000001';
    } else {
      const exists = sqlite.prepare('SELECT 1 FROM users WHERE id = ?').get(userId);
      if (!exists) {
        const u = sqlite.prepare('SELECT id FROM users LIMIT 1').get() as { id: string } | undefined;
        userId = u?.id || 'u1000000-0000-0000-0000-000000000001';
      }
    }

    const insertAudit = sqlite.prepare(`
      INSERT INTO audit_log (
        id, clinic_id, created_at, updated_at, deleted_at,
        user_id, action, entity_type, entity_id, before, after, ip
      ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAudit.run(
      crypto.randomUUID(),
      clinicId,
      new Date().toISOString(),
      new Date().toISOString(),
      userId,
      action,
      entityType,
      String(entityId || 'general'),
      before ? (typeof before === 'string' ? before : JSON.stringify(before)) : null,
      after ? (typeof after === 'string' ? after : JSON.stringify(after)) : null,
      '127.0.0.1'
    );
  } catch (err) {
    console.error('Audit log write error:', err);
  }
}

// ================= RBAC & PERMISSION LOGIC =================
function isDentistRestricted(): boolean {
  try {
    const sqlite = getSqlite();
    const row = sqlite.prepare('SELECT value FROM settings WHERE key = ?').get('security_policies') as { value: string } | undefined;
    if (row?.value) {
      const parsed = JSON.parse(row.value);
      if (parsed.dentist_only_own_patients || parsed.restrict_to_own_patients) {
        return true;
      }
    }
  } catch {}
  return false;
}

function checkDentistPatientAccess(dentistId: string, patientId: string): boolean {
  try {
    const sqlite = getSqlite();
    const appt = sqlite.prepare('SELECT 1 FROM appointments WHERE dentist_id = ? AND patient_id = ? LIMIT 1').get(dentistId, patientId);
    if (appt) return true;
    const tr = sqlite.prepare('SELECT 1 FROM treatments WHERE dentist_id = ? AND patient_id = ? LIMIT 1').get(dentistId, patientId);
    if (tr) return true;
    return false;
  } catch {
    return true;
  }
}

function checkPermission(
  user: any,
  resource: ResourceName,
  action: PermissionAction,
  channel: string
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'يجب تسجيل الدخول أولاً' };
  }

  // Owner always has full access
  if (user.role === 'owner') {
    return { allowed: true };
  }

  // Mandatory Rule 1: Accountant cannot read clinical notes, tooth records, medical history, allergies, or imaging
  if (user.role === 'accountant') {
    if (
      resource === 'clinical_notes' ||
      channel.startsWith('toothRecords:') ||
      channel === 'patients:getMedicalHistory' ||
      channel === 'patients:saveMedicalHistory' ||
      channel === 'patients:getAllergies' ||
      channel === 'patients:saveAllergy' ||
      channel.startsWith('prescriptions:') ||
      channel.startsWith('medicalReports:') ||
      channel.startsWith('images:')
    ) {
      return {
        allowed: false,
        reason: 'غير مصرّح للمحاسب المالي بالوصول إلى الملاحظات والملفات السريرية والأشعة للمرضى',
      };
    }
  }

  // Mandatory Rule 2: Receptionist cannot delete anything, cannot edit or delete prices, cannot void or alter invoices
  if (user.role === 'receptionist') {
    if (channel === 'invoices:voidInvoice' || channel === 'invoices:void') {
      return {
        allowed: false,
        reason: 'غير مصرّح لموظف الاستقبال بإلغاء الفواتير (Void Invoice)',
      };
    }
    if (channel === 'invoices:update') {
      return {
        allowed: false,
        reason: 'غير مصرّح لموظف الاستقبال بتعديل مبالغ أو بنود الفواتير الصادرة',
      };
    }
    if (
      resource === 'prices' &&
      (action === 'update' || action === 'create')
    ) {
      return {
        allowed: false,
        reason: 'غير مصرّح لموظف الاستقبال بتعديل أو حذف قائمة الأسعار',
      };
    }
    if (
      channel === 'treatments:createProcedure' ||
      channel === 'treatments:updateProcedure' ||
      channel === 'treatments:deleteProcedure' ||
      channel === 'treatments:bulkUpsertProcedures'
    ) {
      return {
        allowed: false,
        reason: 'غير مصرّح لموظف الاستقبال بتعديل أسعار أو بيانات الإجراءات',
      };
    }
    if (action === 'delete') {
      return {
        allowed: false,
        reason: 'غير مصرّح لموظف الاستقبال بحذف السجلات',
      };
    }
  }

  // System actions (print, pdf, info) allowed for active authenticated staff
  if (channel.startsWith('system:') && action === 'view') {
    return { allowed: true };
  }

  // Query SQLite role_permissions table
  try {
    const sqlite = getSqlite();
    const row = sqlite
      .prepare(`
        SELECT 1 FROM role_permissions
        WHERE role = ? AND (resource = ? OR resource = ?) AND action = ? AND deleted_at IS NULL
        LIMIT 1
      `)
      .get(user.role, resource, resource === 'treatments' ? 'dental_chart' : resource, action);

    if (row) {
      return { allowed: true };
    }
  } catch (err) {
    console.error('Error checking role_permissions table:', err);
  }

  return { allowed: false, reason: 'ليست لديك صلاحية لتنفيذ هذا الإجراء' };
}

// Helper to capture existing record before update/delete
async function defaultGetBefore(channel: string, args: any[]): Promise<any> {
  const id = typeof args[0] === 'string' ? args[0] : (args[1] && typeof args[1] === 'string' ? args[1] : null);
  if (!id) return null;
  try {
    const sqlite = getSqlite();
    if (channel.startsWith('patients:')) {
      return sqlite.prepare('SELECT * FROM patients WHERE id = ?').get(id) || null;
    }
    if (channel.startsWith('appointments:')) {
      return sqlite.prepare('SELECT * FROM appointments WHERE id = ?').get(id) || null;
    }
    if (channel.startsWith('treatments:')) {
      return sqlite.prepare('SELECT * FROM treatments WHERE id = ?').get(id) || null;
    }
    if (channel.startsWith('invoices:')) {
      return sqlite.prepare('SELECT * FROM invoices WHERE id = ?').get(id) || null;
    }
    if (channel.startsWith('inventory:')) {
      return sqlite.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id) || null;
    }
    if (channel.startsWith('staff:')) {
      const u = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
      if (u) {
        const { password_hash, pin_hash, ...safe } = u;
        return safe;
      }
      return null;
    }
    if (channel.startsWith('rooms:')) {
      return sqlite.prepare('SELECT * FROM rooms WHERE id = ?').get(id) || null;
    }
    if (channel.startsWith('expenses:')) {
      return sqlite.prepare('SELECT * FROM expenses WHERE id = ?').get(id) || null;
    }
    if (channel.startsWith('prescriptions:')) {
      return sqlite.prepare('SELECT * FROM prescriptions WHERE id = ?').get(id) || null;
    }
    if (channel.startsWith('medicalReports:')) {
      return sqlite.prepare('SELECT * FROM medical_reports WHERE id = ?').get(id) || null;
    }
    if (channel.startsWith('labs:')) {
      return sqlite.prepare('SELECT * FROM labs WHERE id = ?').get(id) || null;
    }
    if (channel.startsWith('labOrders:')) {
      return sqlite.prepare('SELECT * FROM lab_orders WHERE id = ?').get(id) || null;
    }
    if (channel.startsWith('insurance:updateCompany')) {
      return sqlite.prepare('SELECT * FROM insurance_companies WHERE id = ?').get(id) || null;
    }
    if (channel.startsWith('insurance:updateClaim') || channel.startsWith('insurance:transitionClaimStatus')) {
      return sqlite.prepare('SELECT * FROM insurance_claims WHERE id = ?').get(id) || null;
    }
    if (channel.startsWith('settings:updateClinic')) {
      const res = await settingsRepo.getClinic();
      return res.ok ? res.data : null;
    }
  } catch {
    return null;
  }
  return null;
}

function extractEntityId(res: any, args: any[], channel: string): string {
  if (typeof args[0] === 'string' && args[0].trim().length > 0) {
    return args[0];
  }
  if (res?.data?.id) return String(res.data.id);
  if (res?.data?.invoiceId) return String(res.data.invoiceId);
  if (typeof args[1] === 'string') return args[1];
  return channel;
}

export interface RegisteredIpcChannelInfo {
  channel: string;
  hasSchema: boolean;
  noArgs: boolean;
}

const registeredIpcChannels: RegisteredIpcChannelInfo[] = [];

export function getRegisteredChannels(): RegisteredIpcChannelInfo[] {
  return [...registeredIpcChannels];
}

export interface SecureHandlerOptions {
  resource: ResourceName;
  action: PermissionAction;
  schema?: z.ZodType<any>;
  schemaArgIndex?: number;
  auditAction?: string;
  skipAudit?: boolean;
  entityType?: string;
  getBefore?: (args: any[]) => Promise<any> | any;
}

export function secureHandle(
  channel: string,
  options: SecureHandlerOptions,
  handler: (...args: any[]) => Promise<any> | any
): void {
  const noArgs = handler.length <= 1;
  const hasSchema = Boolean(options.schema || (options as any).schemas);
  const existingIdx = registeredIpcChannels.findIndex((c) => c.channel === channel);
  if (existingIdx >= 0) {
    registeredIpcChannels[existingIdx] = { channel, hasSchema, noArgs };
  } else {
    registeredIpcChannels.push({ channel, hasSchema, noArgs });
  }

  safeIpcMain.handle(channel, async (event, ...args) => {
    // 1. Session check
    checkSessionTimeout();
    if (!currentSessionUser) {
      return { ok: false, error: 'انتهت الجلسة أو يجب تسجيل الدخول' };
    }
    lastSessionActivity = Date.now();

    // 2. Permission check from role_permissions + domain rules
    const permCheck = checkPermission(currentSessionUser, options.resource, options.action, channel);
    if (!permCheck.allowed) {
      await writeAudit(
        'DENIED_' + (options.auditAction || options.action).toUpperCase(),
        options.entityType || options.resource,
        channel,
        null,
        {
          reason: permCheck.reason || 'ليست لديك صلاحية لتنفيذ هذا الإجراء',
          channel,
          role: currentSessionUser.role,
          userId: currentSessionUser.id,
        },
        currentSessionUser.id
      );

      return {
        ok: false,
        error: permCheck.reason || 'ليست لديك صلاحية لتنفيذ هذا الإجراء',
      };
    }

    // 3. Dentist Restriction rule (restrict_to_own_patients)
    if (currentSessionUser.role === 'dentist' && isDentistRestricted()) {
      if (channel === 'patients:list') {
        if (!args[0]) args[0] = {};
        args[0].dentist_id = currentSessionUser.id;
      } else if (channel === 'appointments:list') {
        if (!args[0]) args[0] = {};
        args[0].dentist_id = currentSessionUser.id;
      } else if (channel === 'appointments:getToday') {
        args[0] = currentSessionUser.id;
      } else if (channel === 'appointments:getWeek') {
        args[2] = currentSessionUser.id;
      } else if (channel === 'patients:getById') {
        const patientId = args[0];
        if (patientId && !checkDentistPatientAccess(currentSessionUser.id, patientId)) {
          return {
            ok: false,
            error: 'ليست لديك صلاحية للوصول إلى هذا المريض (مرضاك فقط)',
          };
        }
      }
    }

    // 4. Zod schema validation
    if (options.schema) {
      const argIdx = options.schemaArgIndex ?? (args.length > 1 && typeof args[0] === 'string' ? 1 : 0);
      const dataToValidate = args[argIdx];
      const parsed = options.schema.safeParse(dataToValidate);
      if (!parsed.success) {
        return {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues ? parsed.error.issues.map((i) => i.message).join(' | ') : parsed.error.message,
          },
        };
      }
      args[argIdx] = parsed.data;
    }

    // 5. Capture "before" state
    let beforeState: any = null;
    if (options.getBefore) {
      try {
        beforeState = await options.getBefore(args);
      } catch {
        beforeState = null;
      }
    } else if (options.action === 'update' || options.action === 'delete') {
      try {
        beforeState = await defaultGetBefore(channel, args);
      } catch {
        beforeState = null;
      }
    }

    // 6. Execute Handler
    let res: any;
    try {
      res = await handler(event, ...args);
    } catch (err: any) {
      res = { ok: false, error: err?.message || 'حدث خطأ أثناء تنفيذ الإجراء' };
    }

    // 7. Write Audit Log on success
    if (res && res.ok && !options.skipAudit) {
      const isView = options.action === 'view';
      if (!isView || options.auditAction === 'VIEW') {
        const auditAction = options.auditAction || options.action.toUpperCase();
        const entityId = extractEntityId(res, args, channel);
        await writeAudit(
          auditAction,
          options.entityType || options.resource,
          entityId,
          beforeState,
          res.data ?? null,
          currentSessionUser.id
        );
      }
    }

    return res;
  });
}

// ================= REGISTER IPC HANDLERS =================
export function registerIpcHandlers(): void {
  // ================= PATIENTS =================
  secureHandle('patients:list', { resource: 'patients', action: 'view', schema: patientFiltersSchema }, async (_e, filters) => {
    return patientsRepo.list(filters);
  });

  secureHandle('patients:getById', { resource: 'patients', action: 'view', schema: idSchema, auditAction: 'VIEW' }, async (_e, id: string) => {
    return patientsRepo.getById(id);
  });

  secureHandle('patients:create', { resource: 'patients', action: 'create', schema: createPatientSchema }, async (_e, data) => {
    return patientsRepo.create(data);
  });

  secureHandle('patients:update', { resource: 'patients', action: 'update', schema: updatePatientSchema, schemaArgIndex: 1 }, async (_e, id: string, data) => {
    return patientsRepo.update(id, data);
  });

  secureHandle('patients:delete', { resource: 'patients', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    return patientsRepo.delete(id);
  });

  secureHandle('patients:search', { resource: 'patients', action: 'view', schema: z.string().trim().min(1).max(100) }, async (_e, query: string, page?: number, limit?: number) => {
    return patientsRepo.search(query, page, limit);
  });

  secureHandle('patients:getMedicalHistory', { resource: 'clinical_notes', action: 'view', schema: idSchema }, async (_e, patientId: string) => {
    return patientsRepo.getMedicalHistory(patientId);
  });

  secureHandle('patients:saveMedicalHistory', { resource: 'clinical_notes', action: 'update', schema: createMedicalHistorySchema }, async (_e, data) => {
    return patientsRepo.saveMedicalHistory(data);
  });

  secureHandle('patients:getAllergies', { resource: 'patients', action: 'view', schema: idSchema }, async (_e, patientId: string) => {
    return patientsRepo.getAllergies(patientId);
  });

  secureHandle('patients:saveAllergy', { resource: 'patients', action: 'update', schema: createAllergySchema }, async (_e, data) => {
    return patientsRepo.saveAllergy(data);
  });

  secureHandle('patients:deleteAllergy', { resource: 'patients', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    return patientsRepo.deleteAllergy(id);
  });

  // ================= TOOTH RECORDS =================
  secureHandle('toothRecords:getByPatient', { resource: 'treatments', action: 'view', schema: idSchema }, async (_e, patientId: string) => {
    return patientsRepo.getToothRecords(patientId);
  });

  secureHandle('toothRecords:saveRecord', { resource: 'treatments', action: 'update', schema: createToothRecordSchema }, async (_e, data) => {
    return patientsRepo.saveToothRecord(data);
  });

  secureHandle('toothRecords:deleteRecord', { resource: 'treatments', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    return patientsRepo.deleteToothRecord(id);
  });

  // ================= APPOINTMENTS =================
  secureHandle('appointments:list', { resource: 'appointments', action: 'view', schema: appointmentFiltersSchema }, async (_e, filters) => {
    return appointmentsRepo.list(filters);
  });

  secureHandle('appointments:getById', { resource: 'appointments', action: 'view', schema: idSchema }, async (_e, id: string) => {
    return appointmentsRepo.getById(id);
  });

  secureHandle('appointments:create', { resource: 'appointments', action: 'create', schema: createAppointmentSchema }, async (_e, data) => {
    return appointmentsRepo.create(data);
  });

  secureHandle('appointments:update', { resource: 'appointments', action: 'update', schema: updateAppointmentSchema, schemaArgIndex: 1 }, async (_e, id: string, data) => {
    return appointmentsRepo.update(id, data);
  });

  secureHandle('appointments:delete', { resource: 'appointments', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    return appointmentsRepo.delete(id);
  });

  secureHandle('appointments:updateStatus', { resource: 'appointments', action: 'update', schema: appointmentStatusSchema, schemaArgIndex: 1, auditAction: 'UPDATE_STATUS' }, async (_e, id: string, status: string) => {
    return appointmentsRepo.updateStatus(id, status as any);
  });

  secureHandle('appointments:getWeek', { resource: 'appointments', action: 'view', schema: isoDateSchema }, async (_e, from: string, to: string, dentistId?: string) => {
    return appointmentsRepo.getWeek(from, to, dentistId);
  });

  secureHandle('appointments:getToday', { resource: 'appointments', action: 'view', schema: optionalIdSchema }, async (_e, dentistId?: string) => {
    return appointmentsRepo.getToday(dentistId);
  });

  // ================= TREATMENTS =================
  secureHandle('treatments:list', { resource: 'treatments', action: 'view', schema: treatmentFiltersSchema }, async (_e, filters) => {
    return treatmentsRepo.list(filters);
  });

  secureHandle('treatments:getById', { resource: 'treatments', action: 'view', schema: idSchema }, async (_e, id: string) => {
    return treatmentsRepo.getById(id);
  });

  secureHandle('treatments:create', { resource: 'treatments', action: 'create', schema: createTreatmentSchema }, async (_e, data) => {
    return treatmentsRepo.create(data);
  });

  secureHandle('treatments:update', { resource: 'treatments', action: 'update', schema: updateTreatmentSchema, schemaArgIndex: 1 }, async (_e, id: string, data) => {
    return treatmentsRepo.update(id, data);
  });

  secureHandle('treatments:delete', { resource: 'treatments', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    return treatmentsRepo.delete(id);
  });

  secureHandle('treatments:getPlansByPatient', { resource: 'treatments', action: 'view', schema: idSchema }, async (_e, patientId: string) => {
    return treatmentsRepo.getPlansByPatient(patientId);
  });

  secureHandle('treatments:getPlanById', { resource: 'treatments', action: 'view', schema: idSchema }, async (_e, id: string) => {
    return treatmentsRepo.getPlanById(id);
  });

  secureHandle('treatments:createPlan', { resource: 'treatments', action: 'create', schema: createTreatmentPlanSchema }, async (_e, data) => {
    return treatmentsRepo.createPlan(data);
  });

  secureHandle('treatments:updatePlan', { resource: 'treatments', action: 'update', schema: updateTreatmentPlanSchema, schemaArgIndex: 1 }, async (_e, id: string, data) => {
    return treatmentsRepo.updatePlan(id, data);
  });

  secureHandle('treatments:deletePlan', { resource: 'treatments', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    return treatmentsRepo.deletePlan(id);
  });

  secureHandle('treatments:getProcedures', { resource: 'treatments', action: 'view', schema: procedureFiltersSchema }, async (_e, filters) => {
    return treatmentsRepo.getProcedures(filters);
  });

  secureHandle('treatments:createProcedure', { resource: 'prices', action: 'create', schema: createProcedureSchema }, async (_e, data) => {
    return treatmentsRepo.createProcedure(data);
  });

  secureHandle('treatments:updateProcedure', { resource: 'prices', action: 'update', schema: updateProcedureSchema, schemaArgIndex: 1 }, async (_e, id: string, data) => {
    return treatmentsRepo.updateProcedure(id, data);
  });

  secureHandle('treatments:deleteProcedure', { resource: 'prices', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    return treatmentsRepo.deleteProcedure(id);
  });

  secureHandle('treatments:bulkUpsertProcedures', { resource: 'prices', action: 'update', schema: z.array(createProcedureSchema) }, async (_e, data) => {
    return treatmentsRepo.bulkUpsertProcedures(data);
  });

  secureHandle('treatments:acceptPlanTransaction', { resource: 'treatments', action: 'update', schema: acceptPlanPayloadSchema, auditAction: 'ACCEPT_PLAN' }, async (_e, payload) => {
    return treatmentsRepo.acceptPlanTransaction(payload);
  });

  secureHandle('treatments:executeTreatmentTransaction', { resource: 'treatments', action: 'update', schema: executeTreatmentPayloadSchema, auditAction: 'EXECUTE_TREATMENT' }, async (_e, payload) => {
    return treatmentsRepo.executeTreatmentTransaction(payload);
  });

  // ================= INVOICES =================
  secureHandle('invoices:list', { resource: 'invoices', action: 'view', schema: invoiceFiltersSchema }, async (_e, filters) => {
    return invoicesRepo.list(filters);
  });

  secureHandle('invoices:getById', { resource: 'invoices', action: 'view', schema: idSchema }, async (_e, id: string) => {
    return invoicesRepo.getById(id);
  });

  secureHandle('invoices:create', { resource: 'invoices', action: 'create', schema: createInvoiceSchema }, async (_e, data) => {
    return invoicesRepo.create(data);
  });

  secureHandle('invoices:update', { resource: 'invoices', action: 'update', schema: updateInvoiceSchema, schemaArgIndex: 1 }, async (_e, id: string, data) => {
    return invoicesRepo.update(id, data);
  });

  secureHandle('invoices:voidInvoice', { resource: 'invoices', action: 'delete', schema: trimmedStringSchema(255), schemaArgIndex: 1, auditAction: 'VOID_INVOICE' }, async (_e, id: string, reason: string) => {
    return invoicesRepo.voidInvoice(id, reason);
  });

  secureHandle('invoices:void', { resource: 'invoices', action: 'delete', schema: trimmedStringSchema(255), schemaArgIndex: 1, auditAction: 'VOID_INVOICE' }, async (_e, id: string, reason: string) => {
    return invoicesRepo.voidInvoice(id, reason);
  });

  secureHandle('invoices:getStats', { resource: 'invoices', action: 'view', schema: z.object({ from: optionalIsoDateSchema, to: optionalIsoDateSchema }).strict().optional() }, async (_e, range) => {
    return invoicesRepo.getStats(range);
  });

  // ================= PAYMENTS =================
  secureHandle('payments:list', { resource: 'payments', action: 'view', schema: paginationParamsSchema.optional() }, async (_e, params) => {
    return paymentsRepo.list(params);
  });

  secureHandle('payments:create', { resource: 'payments', action: 'create', schema: createPaymentSchema }, async (_e, data) => {
    return paymentsRepo.create(data);
  });

  secureHandle('payments:getByInvoice', { resource: 'payments', action: 'view', schema: idSchema }, async (_e, invoiceId: string) => {
    return paymentsRepo.getByInvoice(invoiceId);
  });

  // ================= INSURANCE =================
  secureHandle('insurance:getCompanies', { resource: 'invoices', action: 'view' }, async () => {
    return insuranceRepo.getCompanies();
  });

  secureHandle('insurance:createCompany', { resource: 'invoices', action: 'create', schema: createInsuranceCompanySchema }, async (_e, data) => {
    return insuranceRepo.createCompany(data);
  });

  secureHandle('insurance:updateCompany', { resource: 'invoices', action: 'update', schema: updateInsuranceCompanySchema, schemaArgIndex: 1 }, async (_e, id: string, data) => {
    return insuranceRepo.updateCompany(id, data);
  });

  secureHandle('insurance:getClaims', { resource: 'invoices', action: 'view', schema: claimFiltersSchema.optional() }, async (_e, filters) => {
    return insuranceRepo.getClaims(filters);
  });

  secureHandle('insurance:createClaim', { resource: 'invoices', action: 'create', schema: createInsuranceClaimSchema }, async (_e, data) => {
    return insuranceRepo.createClaim(data);
  });

  secureHandle('insurance:updateClaim', { resource: 'invoices', action: 'update', schema: updateInsuranceClaimSchema, schemaArgIndex: 1 }, async (_e, id: string, data) => {
    return insuranceRepo.updateClaim(id, data);
  });

  secureHandle('insurance:transitionClaimStatus', { resource: 'invoices', action: 'update', schema: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'appealed', 'settled']), schemaArgIndex: 1, auditAction: 'CLAIM_STATUS_TRANSITION' }, async (_e, id: string, status: InsuranceClaimStatus, payload?: Record<string, unknown>) => {
    return insuranceRepo.transitionClaimStatus(id, status, payload as any);
  });

  secureHandle('insurance:deleteCompany', { resource: 'invoices', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    return insuranceRepo.deleteCompany(id);
  });

  secureHandle('insurance:getClaimById', { resource: 'invoices', action: 'view', schema: idSchema }, async (_e, id: string) => {
    return insuranceRepo.getClaimById(id);
  });

  secureHandle('insurance:getExpiringPolicies', { resource: 'invoices', action: 'view', schema: z.number().int().min(1).max(365).optional() }, async (_e, daysThreshold?: number) => {
    return insuranceRepo.getExpiringPolicies(daysThreshold);
  });

  secureHandle('insurance:getAuditLogs', { resource: 'invoices', action: 'view', schema: optionalTrimmedStringSchema(50) }, async (_e, entityType?: string, entityId?: string) => {
    return insuranceRepo.getAuditLogs(entityType, entityId);
  });

  // ================= IMAGES =================
  secureHandle('images:list', { resource: 'patients', action: 'view', schema: paginationParamsSchema.optional() }, async (_e, params) => {
    return imagesRepo.list(params);
  });

  secureHandle('images:getByPatient', { resource: 'patients', action: 'view', schema: idSchema }, async (_e, patientId: string) => {
    return imagesRepo.getByPatient(patientId);
  });

  secureHandle('images:create', { resource: 'patients', action: 'create', schema: createImageSchema }, async (_e, data) => {
    return imagesRepo.create(data);
  });

  secureHandle('images:delete', { resource: 'patients', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    return imagesRepo.delete(id);
  });

  // ================= INVENTORY =================
  secureHandle('inventory:list', { resource: 'inventory', action: 'view', schema: inventoryFiltersSchema.optional() }, async (_e, params) => {
    return inventoryRepo.list(params);
  });

  secureHandle('inventory:getById', { resource: 'inventory', action: 'view', schema: idSchema }, async (_e, id: string) => {
    return inventoryRepo.getById(id);
  });

  secureHandle('inventory:create', { resource: 'inventory', action: 'create', schema: createInventoryItemSchema }, async (_e, data) => {
    return inventoryRepo.create(data);
  });

  secureHandle('inventory:update', { resource: 'inventory', action: 'update', schema: updateInventoryItemSchema, schemaArgIndex: 1 }, async (_e, id: string, data) => {
    return inventoryRepo.update(id, data);
  });

  secureHandle('inventory:delete', { resource: 'inventory', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    return inventoryRepo.delete(id);
  });

  secureHandle('inventory:recordTransaction', { resource: 'inventory', action: 'update', schema: createInventoryTransactionSchema, auditAction: 'RECORD_INVENTORY_TRANSACTION' }, async (_e, data) => {
    return inventoryRepo.recordTransaction(data);
  });

  secureHandle('inventory:getTransactions', { resource: 'inventory', action: 'view', schema: inventoryTransactionFiltersSchema.optional() }, async (_e, params) => {
    return inventoryRepo.getTransactions(params);
  });

  secureHandle('inventory:getLowStock', { resource: 'inventory', action: 'view' }, async () => {
    return inventoryRepo.getLowStock();
  });

  secureHandle('inventory:getExpiringItems', { resource: 'inventory', action: 'view', schema: z.number().int().min(1).max(365).optional() }, async (_e, daysThreshold?: number) => {
    return inventoryRepo.getExpiringItems(daysThreshold);
  });

  secureHandle('inventory:getMonthlyConsumptionReport', { resource: 'inventory', action: 'view', schema: z.string().trim().regex(/^\d{4}-\d{2}$/).optional() }, async (_e, month?: string, year?: number) => {
    return inventoryRepo.getMonthlyConsumptionReport(month, year);
  });

  secureHandle('inventory:getSuppliers', { resource: 'inventory', action: 'view' }, async () => {
    return inventoryRepo.getSuppliers();
  });

  secureHandle('inventory:createSupplier', { resource: 'inventory', action: 'create', schema: createSupplierSchema }, async (_e, data) => {
    return inventoryRepo.createSupplier(data);
  });

  secureHandle('inventory:updateSupplier', { resource: 'inventory', action: 'update', schema: updateSupplierSchema, schemaArgIndex: 1 }, async (_e, id: string, data) => {
    return inventoryRepo.updateSupplier(id, data);
  });

  secureHandle('inventory:deleteSupplier', { resource: 'inventory', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    return inventoryRepo.deleteSupplier(id);
  });

  secureHandle('inventory:getPurchaseOrders', { resource: 'inventory', action: 'view' }, async () => {
    return inventoryRepo.getPurchaseOrders();
  });

  secureHandle('inventory:createPurchaseOrder', { resource: 'inventory', action: 'create', schema: createPurchaseOrderSchema }, async (_e, data) => {
    return inventoryRepo.createPurchaseOrder(data);
  });

  secureHandle('inventory:receivePurchaseOrder', { resource: 'inventory', action: 'update', schema: receivePurchaseOrderPayloadSchema.optional(), schemaArgIndex: 1, auditAction: 'RECEIVE_PURCHASE_ORDER' }, async (_e, id: string, payload?: z.infer<typeof receivePurchaseOrderPayloadSchema>) => {
    return inventoryRepo.receivePurchaseOrder(id, payload ? { received_at: payload.received_at, notes: payload.notes ?? undefined } : undefined);
  });

  secureHandle('inventory:updatePurchaseOrderStatus', { resource: 'inventory', action: 'update', schema: z.enum(['draft', 'ordered', 'received', 'partial', 'cancelled']), schemaArgIndex: 1 }, async (_e, id: string, status: PurchaseOrderStatus) => {
    return inventoryRepo.updatePurchaseOrderStatus(id, status);
  });

  // ================= STAFF =================
  secureHandle('staff:list', { resource: 'staff', action: 'view', schema: z.object({ role: z.enum(['owner', 'admin', 'dentist', 'hygienist', 'assistant', 'receptionist', 'accountant', 'technician', 'staff']).optional(), search: z.string().trim().max(100).optional(), is_active: z.boolean().optional() }).strict().optional() }, async (_e, filters) => {
    return staffRepo.list(filters);
  });

  secureHandle('staff:getById', { resource: 'staff', action: 'view', schema: idSchema }, async (_e, id: string) => {
    return staffRepo.getById(id);
  });

  secureHandle('staff:create', { resource: 'staff', action: 'create', schema: createUserSchema }, async (_e, data) => {
    return staffRepo.create(data);
  });

  secureHandle('staff:update', { resource: 'staff', action: 'update', schema: updateUserSchema, schemaArgIndex: 1 }, async (_e, id: string, data) => {
    return staffRepo.update(id, data);
  });

  secureHandle('staff:getAttendance', { resource: 'staff', action: 'view', schema: optionalIdSchema }, async (_e, userId?: string, date?: string) => {
    return staffRepo.getAttendance(userId, date);
  });

  secureHandle('staff:recordAttendance', { resource: 'staff', action: 'create', schema: createAttendanceSchema }, async (_e, data) => {
    return staffRepo.recordAttendance(data);
  });

  secureHandle('staff:getLeaves', { resource: 'staff', action: 'view', schema: optionalIdSchema }, async (_e, userId?: string) => {
    return staffRepo.getLeaves(userId);
  });

  secureHandle('staff:createLeave', { resource: 'staff', action: 'create', schema: createLeaveSchema }, async (_e, data) => {
    return staffRepo.createLeave(data);
  });

  secureHandle('staff:updateLeaveStatus', { resource: 'staff', action: 'update', schema: z.enum(['pending', 'approved', 'rejected']), schemaArgIndex: 1 }, async (_e, id: string, status: 'pending' | 'approved' | 'rejected', reviewedBy?: string) => {
    return staffRepo.updateLeaveStatus(id, status, reviewedBy);
  });

  secureHandle('staff:getCommissions', { resource: 'staff', action: 'view', schema: staffCommissionFilterSchema.optional() }, async (_e, filters) => {
    return staffRepo.getCommissions(filters);
  });

  // ================= REPORTS =================
  secureHandle('reports:getReport', { resource: 'reports', action: 'view', schema: reportFiltersSchema, schemaArgIndex: 1 }, async (_e, reportId: string, filters: ReportFilters) => {
    if (currentSessionUser?.role === 'accountant') {
      const financialReports = ['revenue_report', 'income_statement', 'aging_receivables', 'doctor_commissions', 'vat_report', 'daily_cash_closing', 'payment_methods'];
      if (!financialReports.includes(reportId)) {
        return {
          ok: false,
          error: 'المحاسب مصرح له بالاطلاع على التقارير المالية فقط',
        };
      }
    }

    let safeFilters = { ...(filters || {}) };
    if (currentSessionUser?.role === 'dentist' && isDentistRestricted()) {
      safeFilters.dentist_id = currentSessionUser.id;
    }

    return reportsRepo.getReport(reportId, safeFilters);
  });

  secureHandle('reports:getFinancialReport', { resource: 'reports', action: 'view', schema: isoDateSchema }, async (_e, from: string, to: string) => {
    return reportsRepo.getFinancialReport(from, to);
  });

  secureHandle('reports:getFinancials', { resource: 'reports', action: 'view', schema: z.object({ from: optionalIsoDateSchema, to: optionalIsoDateSchema }).strict().optional() }, async (_e, range?: { from?: string; to?: string }) => {
    return reportsRepo.getFinancials(range);
  });

  secureHandle('reports:getDoctorPerformance', { resource: 'reports', action: 'view', schema: idSchema }, async (_e, dentistId: string, from?: string, to?: string) => {
    return reportsRepo.getDoctorPerformance(dentistId, from, to);
  });

  secureHandle('reports:getRevenueReport', { resource: 'reports', action: 'view', schema: reportFilterSchema }, async (_e, filters) => {
    return reportsRepo.getRevenueReport(filters ?? {});
  });

  secureHandle('reports:getIncomeStatement', { resource: 'reports', action: 'view', schema: reportFilterSchema }, async (_e, filters) => {
    return reportsRepo.getIncomeStatement(filters ?? {});
  });

  secureHandle('reports:getAgingReport', { resource: 'reports', action: 'view' }, async () => {
    return reportsRepo.getAgingReport();
  });

  secureHandle('reports:getDoctorCommissions', { resource: 'reports', action: 'view', schema: reportFilterSchema }, async (_e, filters) => {
    return reportsRepo.getDoctorCommissions(filters ?? {});
  });

  secureHandle('reports:getVatReport', { resource: 'reports', action: 'view', schema: reportFilterSchema }, async (_e, filters) => {
    return reportsRepo.getVatReport(filters ?? {});
  });

  secureHandle('reports:getDailyCashClosing', { resource: 'reports', action: 'view', schema: optionalIsoDateSchema }, async (_e, date?: string, userId?: string) => {
    return reportsRepo.getDailyCashClosing(date, userId);
  });

  secureHandle('reports:getScheduledReports', { resource: 'reports', action: 'view' }, async () => {
    return reportsRepo.getScheduledReports();
  });

  secureHandle('reports:createScheduledReport', { resource: 'reports', action: 'create', schema: scheduledReportSchema }, async (_e, data) => {
    return reportsRepo.createScheduledReport(data);
  });

  secureHandle('reports:updateScheduledReport', { resource: 'reports', action: 'update', schema: scheduledReportSchema.partial(), schemaArgIndex: 1 }, async (_e, id: string, data) => {
    return reportsRepo.updateScheduledReport(id, data);
  });

  secureHandle('reports:deleteScheduledReport', { resource: 'reports', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    return reportsRepo.deleteScheduledReport(id);
  });

  secureHandle('reports:runScheduledReportNow', { resource: 'reports', action: 'create', schema: idSchema }, async (_e, id: string) => {
    return reportsRepo.runScheduledReportNow(id);
  });

  secureHandle('reports:getReportHistory', { resource: 'reports', action: 'view' }, async () => {
    return reportsRepo.getReportHistory();
  });

  // ================= SETTINGS =================
  secureHandle('settings:getClinic', { resource: 'settings', action: 'view' }, async () => {
    return settingsRepo.getClinic();
  });

  secureHandle('settings:updateClinic', { resource: 'settings', action: 'update', schema: updateClinicSchema }, async (_e, data) => {
    return settingsRepo.updateClinic(data);
  });

  secureHandle('settings:getSettings', { resource: 'settings', action: 'view' }, async () => {
    return settingsRepo.getSettings();
  });

  secureHandle('settings:setSetting', { resource: 'settings', action: 'update', schema: z.unknown(), schemaArgIndex: 1 }, async (_e, key: string, value: unknown) => {
    return settingsRepo.setSetting(key, value);
  });

  // ================= LICENSE =================
  secureHandle('license:getStatus', { resource: 'settings', action: 'view' }, async () => {
    const status = await licenseService.getStatus();
    return { ok: true, data: status };
  });

  secureHandle('license:getDeviceCode', { resource: 'settings', action: 'view' }, async () => {
    const code = await licenseService.getFormattedDeviceCode();
    return { ok: true, data: code };
  });

  secureHandle('license:activate', { resource: 'settings', action: 'update', schema: z.string().trim().min(20).max(1024), auditAction: 'LICENSE_ACTIVATE' }, async (_e, token: string) => {
    try {
      const res = await licenseService.activate(token);
      return { ok: true, data: res };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'فشل تفعيل الترخيص بالرمز' };
    }
  });

  secureHandle('license:activateOnline', { resource: 'settings', action: 'update', schema: licenseCodeSchema.shape.code, auditAction: 'LICENSE_ACTIVATE_ONLINE' }, async (_e, code: string) => {
    if (currentSessionUser?.role !== 'owner') {
      return { ok: false, error: 'غير مصرح؛ ميزة التفعيل عبر الإنترنت متاحة للمالك فقط (Owner Only)' };
    }
    try {
      const res = await licenseService.activateOnline(code);
      return { ok: true, data: res };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'فشل التفعيل عبر الإنترنت' };
    }
  });

  secureHandle('license:deactivate', { resource: 'settings', action: 'delete', auditAction: 'LICENSE_DEACTIVATE' }, async () => {
    if (currentSessionUser?.role !== 'owner') {
      return { ok: false, error: 'غير مصرح؛ ميزة إلغاء تفعيل الترخيص متاحة للمالك فقط (Owner Only)' };
    }
    try {
      const res = await licenseService.deactivate();
      return { ok: true, data: res.ok };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'فشل إلغاء تفعيل الترخيص' };
    }
  });

  // ================= DASHBOARD =================
  secureHandle('dashboard:getTodaySummary', { resource: 'patients', action: 'view' }, async () => {
    return dashboardRepo.getTodaySummary();
  });

  // ================= ROOMS =================
  secureHandle('rooms:list', { resource: 'settings', action: 'view' }, async () => {
    const db = getDb();
    const rows = await db.select().from(rooms).where(isNull(rooms.deleted_at));
    return { ok: true, data: rows };
  });

  secureHandle('rooms:getById', { resource: 'settings', action: 'view', schema: idSchema }, async (_e, id: string) => {
    const db = getDb();
    const row = await db.select().from(rooms).where(and(eq(rooms.id, id), isNull(rooms.deleted_at))).limit(1);
    if (!row.length) return { ok: false, error: 'الغرفة غير موجودة' };
    return { ok: true, data: row[0] };
  });

  secureHandle('rooms:updateStatus', { resource: 'settings', action: 'update', schema: z.enum(['free', 'busy', 'maintenance']), schemaArgIndex: 1, auditAction: 'UPDATE_ROOM_STATUS' }, async (_e, id: string, status: 'free' | 'busy' | 'maintenance') => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.update(rooms).set({ status, updated_at: now }).where(eq(rooms.id, id));
    const updated = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return { ok: true, data: updated[0] };
  });

  secureHandle('rooms:create', { resource: 'settings', action: 'create', schema: createRoomSchema }, async (_e, data: CreateRoom) => {
    const db = getDb();
    const now = new Date().toISOString();
    const newRoom = {
      id: crypto.randomUUID(),
      clinic_id: data.clinic_id || 'c1000000-0000-0000-0000-000000000001',
      branch_id: data.branch_id || 'b1000000-0000-0000-0000-000000000001',
      name: data.name,
      number: data.number || '101',
      status: data.status || 'free',
      equipment: data.equipment || [],
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    await db.insert(rooms).values(newRoom as any);
    return { ok: true, data: newRoom };
  });

  secureHandle('rooms:update', { resource: 'settings', action: 'update', schema: updateRoomSchema, schemaArgIndex: 1 }, async (_e, id: string, data: UpdateRoom) => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.update(rooms).set({ ...data, updated_at: now }).where(eq(rooms.id, id));
    const updated = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return { ok: true, data: updated[0] };
  });

  secureHandle('rooms:delete', { resource: 'settings', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.update(rooms).set({ deleted_at: now, updated_at: now }).where(eq(rooms.id, id));
    return { ok: true, data: true };
  });

  // ================= EXPENSES =================
  secureHandle('expenses:list', { resource: 'expenses', action: 'view' }, async () => {
    const db = getDb();
    const rows = await db.select().from(expenses).where(isNull(expenses.deleted_at)).orderBy(desc(expenses.created_at));
    return { ok: true, data: rows };
  });

  secureHandle('expenses:getById', { resource: 'expenses', action: 'view', schema: idSchema }, async (_e, id: string) => {
    const db = getDb();
    const rows = await db.select().from(expenses).where(and(eq(expenses.id, id), isNull(expenses.deleted_at))).limit(1);
    if (!rows.length) return { ok: false, error: 'المصروف غير موجود' };
    return { ok: true, data: rows[0] };
  });

  secureHandle('expenses:create', { resource: 'expenses', action: 'create', schema: createExpenseSchema }, async (_e, data: CreateExpense) => {
    const db = getDb();
    const now = new Date().toISOString();
    const newExp = {
      id: crypto.randomUUID(),
      clinic_id: 'c1000000-0000-0000-0000-000000000001',
      category: data.category,
      title: data.title || 'مصروف عام',
      amount_halalas: Number(data.amount_halalas) || 0,
      vat_halalas: Number(data.vat_halalas) || 0,
      expense_date: data.expense_date || now.slice(0, 10),
      date: data.expense_date || now.slice(0, 10),
      payment_method: data.payment_method || 'mada',
      reference: data.reference || null,
      payee: data.payee || 'جهة غير محددة',
      receipt_path: data.receipt_path || data.receipt_url || null,
      is_recurring: Boolean(data.is_recurring),
      recurring_day: data.recurring_day || null,
      notes: data.notes || '',
      recorded_by: currentSessionUser?.id || null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    await db.insert(expenses).values(newExp as any);
    return { ok: true, data: newExp };
  });

  secureHandle('expenses:update', { resource: 'expenses', action: 'update', schema: updateExpenseSchema, schemaArgIndex: 1 }, async (_e, id: string, data: UpdateExpense) => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.update(expenses).set({ ...(data as any), updated_at: now }).where(eq(expenses.id, id));
    const updated = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    return { ok: true, data: updated[0] };
  });

  secureHandle('expenses:delete', { resource: 'expenses', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.update(expenses).set({ deleted_at: now, updated_at: now }).where(eq(expenses.id, id));
    return { ok: true, data: true };
  });

  secureHandle('expenses:processRecurring', { resource: 'expenses', action: 'update' }, async () => {
    return { ok: true, data: { processed: 0 } };
  });

  // ================= PRESCRIPTIONS =================
  secureHandle('prescriptions:list', { resource: 'prescriptions', action: 'view' }, async () => {
    const db = getDb();
    const rows = await db.select().from(prescriptions).where(isNull(prescriptions.deleted_at));
    return { ok: true, data: { items: rows, total: rows.length, page: 1, limit: 50, totalPages: 1 } };
  });

  secureHandle('prescriptions:getByPatient', { resource: 'prescriptions', action: 'view', schema: idSchema }, async (_e, patientId: string) => {
    const db = getDb();
    const rows = await db.select().from(prescriptions).where(and(eq(prescriptions.patient_id, patientId), isNull(prescriptions.deleted_at)));
    return { ok: true, data: rows };
  });

  secureHandle('prescriptions:getById', { resource: 'prescriptions', action: 'view', schema: idSchema }, async (_e, id: string) => {
    const db = getDb();
    const rows = await db.select().from(prescriptions).where(and(eq(prescriptions.id, id), isNull(prescriptions.deleted_at))).limit(1);
    if (!rows.length) return { ok: false, error: 'الوصفة غير موجودة' };
    const items = await db.select().from(prescriptionItems).where(eq(prescriptionItems.prescription_id, id));
    return { ok: true, data: { ...rows[0], items } };
  });

  secureHandle('prescriptions:create', { resource: 'prescriptions', action: 'create', schema: createPrescriptionSchema }, async (_e, data: CreatePrescription) => {
    const db = getDb();
    const now = new Date().toISOString();
    const newPrescription = {
      id: crypto.randomUUID(),
      clinic_id: 'c1000000-0000-0000-0000-000000000001',
      patient_id: data.patient_id,
      dentist_id: data.dentist_id,
      issued_at: data.issued_at || now,
      notes: data.notes || '',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    await db.insert(prescriptions).values(newPrescription as any);
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        await db.insert(prescriptionItems).values({
          id: crypto.randomUUID(),
          clinic_id: newPrescription.clinic_id,
          prescription_id: newPrescription.id,
          drug_name: item.drug_name,
          dose: item.dose,
          frequency: item.frequency,
          duration_days: item.duration_days,
          instructions: item.instructions || '',
          created_at: now,
          updated_at: now,
          deleted_at: null,
        } as any);
      }
    }
    return { ok: true, data: { ...newPrescription, items: data.items || [] } };
  });

  secureHandle('prescriptions:delete', { resource: 'prescriptions', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.update(prescriptions).set({ deleted_at: now, updated_at: now }).where(eq(prescriptions.id, id));
    return { ok: true, data: true };
  });

  // ================= MEDICAL REPORTS =================
  secureHandle('medicalReports:list', { resource: 'medical_reports', action: 'view' }, async () => {
    const db = getDb();
    const rows = await db.select().from(medicalReports).where(isNull(medicalReports.deleted_at));
    return { ok: true, data: { items: rows, total: rows.length, page: 1, limit: 50, totalPages: 1 } };
  });

  secureHandle('medicalReports:getByPatient', { resource: 'medical_reports', action: 'view', schema: idSchema }, async (_e, patientId: string) => {
    const db = getDb();
    const rows = await db.select().from(medicalReports).where(and(eq(medicalReports.patient_id, patientId), isNull(medicalReports.deleted_at)));
    return { ok: true, data: rows };
  });

  secureHandle('medicalReports:getById', { resource: 'medical_reports', action: 'view', schema: idSchema }, async (_e, id: string) => {
    const db = getDb();
    const rows = await db.select().from(medicalReports).where(and(eq(medicalReports.id, id), isNull(medicalReports.deleted_at))).limit(1);
    if (!rows.length) return { ok: false, error: 'التقرير الطبي غير موجود' };
    return { ok: true, data: rows[0] };
  });

  secureHandle('medicalReports:create', { resource: 'medical_reports', action: 'create', schema: createMedicalReportSchema }, async (_e, data: CreateMedicalReport) => {
    const db = getDb();
    const now = new Date().toISOString();
    const newReport = {
      id: crypto.randomUUID(),
      clinic_id: 'c1000000-0000-0000-0000-000000000001',
      patient_id: data.patient_id,
      type: data.type,
      content: data.content,
      issued_at: data.issued_at || now,
      issued_by: data.issued_by || currentSessionUser?.id || 'u1000000-0000-0000-0000-000000000001',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    await db.insert(medicalReports).values(newReport as any);
    return { ok: true, data: newReport };
  });

  secureHandle('medicalReports:update', { resource: 'medical_reports', action: 'update', schema: updateMedicalReportSchema, schemaArgIndex: 1 }, async (_e, id: string, data: UpdateMedicalReport) => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.update(medicalReports).set({ ...data, updated_at: now }).where(eq(medicalReports.id, id));
    const updated = await db.select().from(medicalReports).where(eq(medicalReports.id, id)).limit(1);
    return { ok: true, data: updated[0] };
  });

  secureHandle('medicalReports:delete', { resource: 'medical_reports', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.update(medicalReports).set({ deleted_at: now, updated_at: now }).where(eq(medicalReports.id, id));
    return { ok: true, data: true };
  });

  // ================= LABS & LAB ORDERS =================
  secureHandle('labs:list', { resource: 'lab_orders', action: 'view' }, async () => {
    const db = getDb();
    const rows = await db.select().from(labs).where(isNull(labs.deleted_at));
    return { ok: true, data: rows };
  });

  secureHandle('labs:getById', { resource: 'lab_orders', action: 'view', schema: idSchema }, async (_e, id: string) => {
    const db = getDb();
    const rows = await db.select().from(labs).where(and(eq(labs.id, id), isNull(labs.deleted_at))).limit(1);
    if (!rows.length) return { ok: false, error: 'المعمل غير موجود' };
    return { ok: true, data: rows[0] };
  });

  secureHandle('labs:create', { resource: 'lab_orders', action: 'create', schema: createLabSchema }, async (_e, data: CreateLab) => {
    const db = getDb();
    const now = new Date().toISOString();
    const newLab = {
      id: crypto.randomUUID(),
      clinic_id: data.clinic_id || 'c1000000-0000-0000-0000-000000000001',
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    await db.insert(labs).values(newLab as any);
    return { ok: true, data: newLab };
  });

  secureHandle('labs:update', { resource: 'lab_orders', action: 'update', schema: updateLabSchema, schemaArgIndex: 1 }, async (_e, id: string, data: UpdateLab) => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.update(labs).set({ ...data, updated_at: now }).where(eq(labs.id, id));
    const updated = await db.select().from(labs).where(eq(labs.id, id)).limit(1);
    return { ok: true, data: updated[0] };
  });

  secureHandle('labs:delete', { resource: 'lab_orders', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.update(labs).set({ deleted_at: now, updated_at: now }).where(eq(labs.id, id));
    return { ok: true, data: true };
  });

  secureHandle('labOrders:list', { resource: 'lab_orders', action: 'view' }, async () => {
    const db = getDb();
    const rows = await db.select().from(labOrders).where(isNull(labOrders.deleted_at));
    return { ok: true, data: { items: rows, total: rows.length, page: 1, limit: 50, totalPages: 1 } };
  });

  secureHandle('labOrders:getById', { resource: 'lab_orders', action: 'view', schema: idSchema }, async (_e, id: string) => {
    const db = getDb();
    const rows = await db.select().from(labOrders).where(and(eq(labOrders.id, id), isNull(labOrders.deleted_at))).limit(1);
    if (!rows.length) return { ok: false, error: 'طلب المعمل غير موجود' };
    return { ok: true, data: rows[0] };
  });

  secureHandle('labOrders:create', { resource: 'lab_orders', action: 'create', schema: createLabOrderSchema }, async (_e, data: CreateLabOrder) => {
    const db = getDb();
    const now = new Date().toISOString();
    const newOrder = {
      id: crypto.randomUUID(),
      clinic_id: 'c1000000-0000-0000-0000-000000000001',
      patient_id: data.patient_id,
      lab_id: data.lab_id,
      treatment_id: data.treatment_id || null,
      type: data.type || 'crown',
      tooth_numbers: data.tooth_numbers || [],
      shade: data.shade || null,
      sent_at: data.sent_at || now,
      due_at: data.due_at || null,
      received_at: data.received_at || null,
      status: data.status || 'ordered',
      cost_halalas: data.cost_halalas || 0,
      notes: data.notes || '',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    await db.insert(labOrders).values(newOrder as any);
    return { ok: true, data: newOrder };
  });

  secureHandle('labOrders:update', { resource: 'lab_orders', action: 'update', schema: updateLabOrderSchema, schemaArgIndex: 1 }, async (_e, id: string, data: UpdateLabOrder) => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.update(labOrders).set({ ...data, updated_at: now }).where(eq(labOrders.id, id));
    const updated = await db.select().from(labOrders).where(eq(labOrders.id, id)).limit(1);
    return { ok: true, data: updated[0] };
  });

  secureHandle('labOrders:delete', { resource: 'lab_orders', action: 'delete', schema: idSchema }, async (_e, id: string) => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.update(labOrders).set({ deleted_at: now, updated_at: now }).where(eq(labOrders.id, id));
    return { ok: true, data: true };
  });

  secureHandle('labOrders:updateStatus', { resource: 'lab_orders', action: 'update', schema: z.enum(['pending', 'sent', 'in_progress', 'ready', 'delivered', 'rejected']), schemaArgIndex: 1, auditAction: 'UPDATE_LAB_ORDER_STATUS' }, async (_e, id: string, status: LabOrderStatus, received_at?: string) => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.update(labOrders).set({ status, received_at: received_at || null, updated_at: now }).where(eq(labOrders.id, id));
    const updated = await db.select().from(labOrders).where(eq(labOrders.id, id)).limit(1);
    return { ok: true, data: updated[0] };
  });

  secureHandle('labOrders:getOverdue', { resource: 'lab_orders', action: 'view' }, async () => {
    const db = getDb();
    const rows = await db.select().from(labOrders).where(and(eq(labOrders.status, 'sent'), isNull(labOrders.deleted_at)));
    return { ok: true, data: rows };
  });

  // ================= AUTH (MANAGED) =================
  secureHandle('auth:unlockAccount', { resource: 'staff', action: 'update', schema: idSchema, auditAction: 'UNLOCK_ACCOUNT' }, async (_e, userId: string) => {
    const sqlite = getSqlite();
    sqlite.prepare('DELETE FROM login_attempts WHERE user_id = ?').run(userId);
    sqlite.prepare('UPDATE users SET pin_attempts = 0 WHERE id = ?').run(userId);
    return { ok: true, data: true };
  });

  secureHandle('auth:resetPin', { resource: 'staff', action: 'update', schema: z.string().trim().length(4).regex(/^\d{4}$/), schemaArgIndex: 1, auditAction: 'RESET_PIN' }, async (_e, userId: string, newPin: string) => {
    const sqlite = getSqlite();
    if (!/^\d{4,6}$/.test(newPin)) {
      return { ok: false, error: 'رمز PIN يجب أن يتكون من 4 إلى 6 أرقام' };
    }
    const hash = bcrypt.hashSync(newPin, 10);
    sqlite.prepare('UPDATE users SET pin_hash = ?, pin_attempts = 0, updated_at = ? WHERE id = ?').run(hash, new Date().toISOString(), userId);
    return { ok: true, data: true };
  });

  secureHandle('auth:changePassword', { resource: 'staff', action: 'update', schema: changePasswordSchema, auditAction: 'CHANGE_PASSWORD' }, async (_e, payload: z.infer<typeof changePasswordSchema>) => {
    const sqlite = getSqlite();
    const userId = payload?.userId || currentSessionUser?.id;
    const newPassword = payload?.newPassword;
    if (!userId || !newPassword) {
      return { ok: false, error: 'المستخدم وكلمة المرور الجديدة مطلوبان' };
    }
    if (newPassword.length < 8 || !/[a-zA-Z\u0600-\u06FF]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return {
        ok: false,
        error: 'كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف وتحتوي على حرف واحد ورقم واحد على الأقل',
      };
    }
    const hash = bcrypt.hashSync(newPassword, 12);
    sqlite
      .prepare('UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?')
      .run(hash, new Date().toISOString(), userId);
    if (currentSessionUser && currentSessionUser.id === userId) {
      currentSessionUser.must_change_password = false;
    }
    return { ok: true, data: true };
  });

  secureHandle('auth:resetPassword', { resource: 'staff', action: 'update', schema: z.string().min(8).max(128), schemaArgIndex: 1, auditAction: 'RESET_PASSWORD' }, async (_e, userId: string, newPass: string) => {
    const sqlite = getSqlite();
    if (!newPass || newPass.length < 8 || !/[a-zA-Z\u0600-\u06FF]/.test(newPass) || !/[0-9]/.test(newPass)) {
      return {
        ok: false,
        error: 'كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف وتحتوي على حرف واحد ورقم واحد على الأقل',
      };
    }
    const hash = bcrypt.hashSync(newPass, 12);
    sqlite
      .prepare('UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?')
      .run(hash, new Date().toISOString(), userId);
    if (currentSessionUser && currentSessionUser.id === userId) {
      currentSessionUser.must_change_password = false;
    }
    return { ok: true, data: true };
  });

  // ================= AUDIT LOGS =================
  secureHandle('auditLogs:list', { resource: 'audit_logs', action: 'view', schema: auditLogFiltersSchema }, async (_e, filters: z.infer<typeof auditLogFiltersSchema>) => {
    try {
      const sqlite = getSqlite();
      let sql = `
        SELECT a.*, u.full_name as user_name
        FROM audit_log a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.deleted_at IS NULL
      `;
      let countSql = `SELECT COUNT(*) as cnt FROM audit_log a WHERE a.deleted_at IS NULL`;
      const params: any[] = [];
      const countParams: any[] = [];

      if (filters?.user_id && filters.user_id !== 'all') {
        sql += ` AND a.user_id = ?`;
        countSql += ` AND a.user_id = ?`;
        params.push(filters.user_id);
        countParams.push(filters.user_id);
      }
      if (filters?.entity_type && filters.entity_type !== 'all') {
        sql += ` AND a.entity_type = ?`;
        countSql += ` AND a.entity_type = ?`;
        params.push(filters.entity_type);
        countParams.push(filters.entity_type);
      }
      if (filters?.action && filters.action !== 'all') {
        sql += ` AND a.action LIKE ?`;
        countSql += ` AND a.action LIKE ?`;
        params.push(`%${filters.action}%`);
        countParams.push(`%${filters.action}%`);
      }
      if (filters?.from) {
        sql += ` AND a.created_at >= ?`;
        countSql += ` AND a.created_at >= ?`;
        params.push(filters.from);
        countParams.push(filters.from);
      }
      if (filters?.to) {
        sql += ` AND a.created_at <= ?`;
        countSql += ` AND a.created_at <= ?`;
        params.push(filters.to);
        countParams.push(filters.to);
      }
      if (filters?.search && filters.search.trim()) {
        const q = `%${filters.search.trim()}%`;
        sql += ` AND (a.entity_id LIKE ? OR a.action LIKE ? OR u.full_name LIKE ?)`;
        countSql += ` AND (a.entity_id LIKE ? OR a.action LIKE ? OR a.user_id IN (SELECT id FROM users WHERE full_name LIKE ?))`;
        params.push(q, q, q);
        countParams.push(q, q, q);
      }

      sql += ` ORDER BY a.created_at DESC`;

      const page = Math.max(1, Number(filters?.page) || 1);
      const limit = Math.min(500, Math.max(1, Number(filters?.limit) || 100));
      const offset = (page - 1) * limit;

      sql += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const totalRow = sqlite.prepare(countSql).get(...countParams) as { cnt: number } | undefined;
      const total = totalRow?.cnt || 0;
      const rows = sqlite.prepare(sql).all(...params) as any[];

      const items = rows.map((r) => {
        let beforeParsed: any = null;
        let afterParsed: any = null;
        try {
          if (r.before) beforeParsed = typeof r.before === 'string' ? JSON.parse(r.before) : r.before;
        } catch {
          beforeParsed = r.before;
        }
        try {
          if (r.after) afterParsed = typeof r.after === 'string' ? JSON.parse(r.after) : r.after;
        } catch {
          afterParsed = r.after;
        }
        return {
          ...r,
          before: beforeParsed,
          after: afterParsed,
        };
      });

      return {
        ok: true,
        data: {
          items,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  secureHandle('auditLogs:getById', { resource: 'audit_logs', action: 'view', schema: idSchema }, async (_e, id: string) => {
    try {
      const sqlite = getSqlite();
      const row = sqlite
        .prepare(`
          SELECT a.*, u.full_name as user_name
          FROM audit_log a
          LEFT JOIN users u ON a.user_id = u.id
          WHERE a.id = ? AND a.deleted_at IS NULL
        `)
        .get(id) as any;

      if (!row) return { ok: false, error: 'سجل التدقيق غير موجود' };
      try {
        if (row.before && typeof row.before === 'string') row.before = JSON.parse(row.before);
      } catch {}
      try {
        if (row.after && typeof row.after === 'string') row.after = JSON.parse(row.after);
      } catch {}

      return { ok: true, data: row };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  secureHandle('auditLogs:export', { resource: 'audit_logs', action: 'export', schema: auditLogFiltersSchema }, async (_e, filters: z.infer<typeof auditLogFiltersSchema>) => {
    try {
      const sqlite = getSqlite();
      let sql = `
        SELECT a.created_at, u.full_name as user_name, a.action, a.entity_type, a.entity_id
        FROM audit_log a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.deleted_at IS NULL
      `;
      const params: any[] = [];
      if (filters?.user_id && filters.user_id !== 'all') {
        sql += ` AND a.user_id = ?`;
        params.push(filters.user_id);
      }
      if (filters?.entity_type && filters.entity_type !== 'all') {
        sql += ` AND a.entity_type = ?`;
        params.push(filters.entity_type);
      }
      if (filters?.action && filters.action !== 'all') {
        sql += ` AND a.action LIKE ?`;
        params.push(`%${filters.action}%`);
      }
      if (filters?.from) {
        sql += ` AND a.created_at >= ?`;
        params.push(filters.from);
      }
      if (filters?.to) {
        sql += ` AND a.created_at <= ?`;
        params.push(filters.to);
      }

      sql += ` ORDER BY a.created_at DESC LIMIT 5000`;
      const rows = sqlite.prepare(sql).all(...params) as any[];

      const header = 'التاريخ والوقت,اسم المستخدم,نوع العملية,الكيان,معرف الكيان\n';
      const csv = rows
        .map((r) => `"${r.created_at}","${r.user_name || ''}","${r.action}","${r.entity_type}","${r.entity_id}"`)
        .join('\n');

      return { ok: true, data: header + csv };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  // ================= RBAC =================
  secureHandle('rbac:getMatrix', { resource: 'settings', action: 'view' }, async () => {
    const db = getDb();
    const rows = await db.select().from(rolePermissions);
    return { ok: true, data: rows };
  });

  secureHandle('rbac:updateMatrix', { resource: 'settings', action: 'update', schema: permissionsMatrixSchema }, async (_e, matrix: PermissionsMatrix) => {
    return { ok: true, data: matrix };
  });

  secureHandle('rbac:getPolicies', { resource: 'settings', action: 'view' }, async () => {
    return {
      ok: true,
      data: {
        idle_timeout_min: 10,
        idle_timeout_minutes: 10,
        max_login_attempts: 5,
        max_failed_attempts: 5,
        lockout_duration_min: 15,
        lockout_duration_minutes: 15,
        receptionist_hide_prices: true,
        accountant_hide_clinical_notes: true,
        dentist_only_own_patients: false,
      },
    };
  });

  secureHandle('rbac:updatePolicies', { resource: 'settings', action: 'update', schema: clinicSecurityPoliciesSchema }, async (_e, policies: Partial<ClinicSecurityPolicies>) => {
    return { ok: true, data: policies };
  });

  // ================= SYSTEM APIS =================
  secureHandle('system:openFile', { resource: 'settings', action: 'view', schema: systemFileOperationSchema.optional(), skipAudit: true }, async (_e, options?: z.infer<typeof systemFileOperationSchema>) => {
    return systemService.openFile(null, options);
  });

  secureHandle('system:saveFile', { resource: 'settings', action: 'view', schema: systemFileOperationSchema.optional(), skipAudit: true }, async (_e, options?: z.infer<typeof systemFileOperationSchema>) => {
    return systemService.saveFile(null, options);
  });

  secureHandle('system:printDocument', { resource: 'invoices', action: 'view', schema: z.record(z.string(), z.unknown()).optional(), skipAudit: true }, async (_e, options?: Record<string, unknown>) => {
    return systemService.printDocument(null, options);
  });

  secureHandle('system:exportPdf', { resource: 'invoices', action: 'export', schema: z.string().trim().max(500).optional(), auditAction: 'EXPORT_PDF' }, async (_e, targetPath?: string) => {
    return systemService.exportPdf(null, targetPath);
  });

  secureHandle('system:getAppVersion', { resource: 'settings', action: 'view', skipAudit: true }, async () => {
    return systemService.getAppVersion();
  });

  secureHandle('system:checkForUpdates', { resource: 'settings', action: 'view', skipAudit: true }, async () => {
    return systemService.checkForUpdates();
  });

  secureHandle('system:backupNow', { resource: 'settings', action: 'export', schema: z.record(z.string(), z.unknown()).optional(), auditAction: 'BACKUP_DATABASE' }, async (_e, options?: Record<string, unknown>) => {
    return systemService.backupNow(options);
  });

  secureHandle('system:restoreBackup', { resource: 'settings', action: 'update', schema: z.string().trim().min(1).max(500), auditAction: 'RESTORE_BACKUP' }, async (_e, filePath: string, password?: string) => {
    return systemService.restoreBackup(filePath, password);
  });

  secureHandle('system:showItemInFolder', { resource: 'settings', action: 'view', schema: z.string().trim().min(1).max(500), skipAudit: true }, async (_e, fullPath: string) => {
    return systemService.showItemInFolder(fullPath);
  });

  // ================= AUTHENTICATION & INITIAL HANDSHAKE (EXEMPT FROM SECUREHANDLE) =================
  // قناة معفاة صراحةً من secureHandle: استعلام عن حالة الحاجة للإعداد الأولي للنظام قبل الدخول
  safeIpcMain.handle('auth:needsSetup', async () => {
    try {
      const sqlite = getSqlite();
      const row = sqlite
        .prepare('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL')
        .get() as { count: number } | undefined;
      const needsSetup = !row || row.count === 0;
      return { ok: true, data: { needsSetup } };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'فشل التحقق من حالة تهيئة النظام' };
    }
  });

  // قناة معفاة صراحةً من secureHandle: معالج الإعداد الأولي للعيادة والمالك (تُنفّذ مرة واحدة فقط)
  safeIpcMain.handle('auth:setupFirstRun', async (_e, payload: z.infer<typeof firstRunSetupSchema>) => {
    try {
      const setupZodSchema = z.object({
        clinic: z.object({
          name: z.string().min(2, 'اسم العيادة يجب أن يتكون من حرفين على الأقل').max(120, 'اسم العيادة يجب ألا يتجاوز 120 حرفاً'),
          phone: z.string().optional(),
          city: z.string().optional(),
          tax_number: z.string().regex(/^3\d{13}3$/, 'الرقم الضريبي يجب أن يتكون من 15 رقماً ويبدأ وينتهي بالرقم 3').optional().or(z.literal('')),
        }),
        owner: z.object({
          full_name: z.string().min(2, 'الاسم الكامل يجب أن يتكون من حرفين على الأقل').max(80, 'الاسم الكامل يجب ألا يتجاوز 80 حرفاً'),
          username: z.string().min(3, 'اسم المستخدم يجب أن يكون بين 3 و 32 حرفاً').max(32, 'اسم المستخدم يجب ألا يتجاوز 32 حرفاً')
            .regex(/^[a-z0-9._]+$/, 'اسم المستخدم يجب أن يتكون من أحرف إنجليزية صغيرة وأرقام ونقاط أو شرطة سفلية فقط'),
          password: z.string(),
        }),
      });

      const parseResult = setupZodSchema.safeParse(payload);
      if (!parseResult.success) {
        return {
          ok: false,
          error: parseResult.error.issues[0]?.message || 'بيانات الإعداد الأولي غير صالحة',
        };
      }

      const { clinic: clinicData, owner: ownerData } = parseResult.data;

      // التحقق من سياسة كلمة المرور المعتمدة
      const policy = validatePasswordPolicy(ownerData.password, ownerData.username);
      if (!policy.valid) {
        return {
          ok: false,
          error: policy.error || 'كلمة المرور لا تستوفي معايير الأمان المعتمدة',
        };
      }

      // التنفيذ داخل معاملة ذرية واحدة withTransaction
      return withTransaction((sqlite) => {
        // (أ) أعد فحص users == 0 داخل المعاملة وارفض إن وجد أي مستخدم
        const countRow = sqlite
          .prepare('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL')
          .get() as { count: number } | undefined;
        if (countRow && countRow.count > 0) {
          throw new Error('تم إعداد النظام مسبقاً');
        }

        const now = new Date().toISOString();
        const clinicId = crypto.randomUUID();
        const branchId = crypto.randomUUID();
        const ownerId = crypto.randomUUID();

        // (ب) إنشاء العيادة
        sqlite.prepare(`
          INSERT INTO clinics (
            id, clinic_id, created_at, updated_at, deleted_at,
            name, phone, city, tax_number, currency, timezone,
            working_hours, slot_duration_min
          ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, 'SAR', 'Asia/Riyadh', '[]', 30)
        `).run(
          clinicId,
          clinicId,
          now,
          now,
          clinicData.name.trim(),
          clinicData.phone?.trim() || '0500000000',
          clinicData.city?.trim() || 'الرياض',
          clinicData.tax_number?.trim() || null
        );

        // إنشاء الفرع الرئيسي
        sqlite.prepare(`
          INSERT INTO branches (
            id, clinic_id, created_at, updated_at, deleted_at,
            name, phone, address, is_active
          ) VALUES (?, ?, ?, ?, NULL, 'الفرع الرئيسي', ?, ?, 1)
        `).run(
          branchId,
          clinicId,
          now,
          now,
          clinicData.phone?.trim() || '0500000000',
          clinicData.city?.trim() || 'الرياض'
        );

        // إنشاء حساب المالك بـ bcrypt 12
        const passwordHash = bcrypt.hashSync(ownerData.password, 12);
        sqlite.prepare(`
          INSERT INTO users (
            id, clinic_id, created_at, updated_at, deleted_at,
            full_name, username, password_hash, role, specialty,
            phone, is_active, must_change_password, pin_hash, pin_attempts
          ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 'owner', 'مالك العيادة', ?, 1, 0, NULL, 0)
        `).run(
          ownerId,
          clinicId,
          now,
          now,
          ownerData.full_name.trim(),
          ownerData.username.trim().toLowerCase(),
          passwordHash,
          clinicData.phone?.trim() || '0500000000'
        );

        // (ج) استدعِ seedReferenceData(...) بالمعرّفات الجديدة
        seedReferenceData(sqlite, clinicId, ownerId);

        // (د) كتابة سطر تدقيق SETUP_COMPLETED بمستخدم المالك الجديد
        sqlite.prepare(`
          INSERT INTO audit_log (
            id, clinic_id, created_at, updated_at, deleted_at,
            user_id, action, entity_type, entity_id, before, after, ip
          ) VALUES (?, ?, ?, ?, NULL, ?, 'SETUP_COMPLETED', 'system', 'setup', NULL, ?, '127.0.0.1')
        `).run(
          crypto.randomUUID(),
          clinicId,
          now,
          now,
          ownerId,
          JSON.stringify({
            clinic_id: clinicId,
            clinic_name: clinicData.name.trim(),
            owner_id: ownerId,
            owner_username: ownerData.username.trim().toLowerCase(),
          })
        );

        return {
          id: ownerId,
          username: ownerData.username.trim().toLowerCase(),
          full_name: ownerData.full_name.trim(),
          role: 'owner',
        };
      });
    } catch (err: any) {
      return { ok: false, error: err?.message || 'فشل إعداد النظام للمرة الأولى' };
    }
  });

  safeIpcMain.handle('auth:login', async (_e, credentials: z.infer<typeof loginCredentialsSchema>) => {
    try {
      const sqlite = getSqlite();
      const { username, password } = credentials || {};
      if (!username || !password) {
        return { ok: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
      }

      const user = sqlite
        .prepare('SELECT * FROM users WHERE username = ? AND deleted_at IS NULL')
        .get(username.trim()) as any;

      const GENERIC_ERROR = 'اسم المستخدم أو كلمة المرور غير صحيحة';

      if (!user) {
        await writeAudit('LOGIN_FAILED', 'auth', username.trim(), null, { reason: 'User not found' });
        return { ok: false, error: GENERIC_ERROR };
      }

      const now = Date.now();
      const attemptRow = sqlite
        .prepare('SELECT attempts, locked_until FROM login_attempts WHERE user_id = ?')
        .get(user.id) as { attempts: number; locked_until: string | null } | undefined;

      if (attemptRow && attemptRow.locked_until) {
        const lockedUntilMs = new Date(attemptRow.locked_until).getTime();
        if (lockedUntilMs > now) {
          const remainingMinutes = Math.max(1, Math.ceil((lockedUntilMs - now) / 60000));
          await writeAudit('LOGIN_BLOCKED', 'auth', user.id, null, { remainingMinutes });
          return {
            ok: false,
            error: `الحساب مقفل أمنياً لمدة ${remainingMinutes} دقيقة بعد تكرار المحاولات الخاطئة`,
          };
        }
      }

      if (!user.password_hash) {
        return { ok: false, error: GENERIC_ERROR };
      }

      let matches = false;
      try {
        matches = bcrypt.compareSync(password, user.password_hash);
      } catch {
        matches = false;
      }

      if (!matches) {
        const { maxAttempts, lockoutMinutes } = getLoginPolicyConfig();
        const currentAttempts = (attemptRow?.attempts || 0) + 1;
        let lockedUntilStr: string | null = null;
        if (currentAttempts >= maxAttempts) {
          lockedUntilStr = new Date(now + lockoutMinutes * 60 * 1000).toISOString();
        }

        sqlite
          .prepare(`
            INSERT INTO login_attempts (user_id, attempts, locked_until, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              attempts = excluded.attempts,
              locked_until = excluded.locked_until,
              updated_at = excluded.updated_at
          `)
          .run(user.id, currentAttempts, lockedUntilStr, new Date().toISOString());

        await writeAudit(
          currentAttempts >= 5 ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
          'auth',
          user.id,
          null,
          { attempts: currentAttempts, lockedUntil: lockedUntilStr }
        );

        if (currentAttempts >= 5) {
          return {
            ok: false,
            error: 'تم قفل الحساب لمدة 15 دقيقة بعد 5 محاولات خاطئة',
          };
        }
        return {
          ok: false,
          error: `اسم المستخدم أو كلمة المرور غير صحيحة (المحاولة ${currentAttempts} من 5)`,
        };
      }

      // Success: clear failed attempts
      sqlite.prepare('DELETE FROM login_attempts WHERE user_id = ?').run(user.id);
      sqlite.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(new Date().toISOString(), user.id);

      const safeUser = toSafeUser(user);
      currentSessionUser = safeUser;
      lastSessionActivity = Date.now();

      await writeAudit('LOGIN_SUCCESS', 'auth', user.id, null, { username: user.username, role: user.role });

      return {
        ok: true,
        data: {
          ...safeUser,
          user: safeUser,
          token: 'session-active',
        },
      };
    } catch (e: any) {
      return { ok: false, error: e.message || 'حدث خطأ أثناء تسجيل الدخول' };
    }
  });

  safeIpcMain.handle('auth:quickUnlockPin', async (_e, payload: z.infer<typeof quickUnlockPinSchema>) => {
    try {
      const sqlite = getSqlite();
      const { pin, userId } = payload || {};
      const targetId = userId || currentSessionUser?.id;
      if (!targetId) return { ok: false, error: 'المستخدم غير محدد' };

      const user = sqlite
        .prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL')
        .get(targetId) as any;

      if (!user) return { ok: false, error: 'المستخدم غير موجود' };

      if (user.pin_attempts >= 5) {
        return {
          ok: false,
          error: 'تم تجاوز الحد الأقصى لمحاولات رمز PIN (5 محاولات). يرجى تسجيل الدخول بكلمة المرور الكاملة.',
        };
      }

      if (!user.pin_hash) {
        return {
          ok: false,
          error: 'لم يتم تعيين رمز PIN لهذا المستخدم. يرجى تسجيل الدخول بكلمة المرور.',
        };
      }

      let valid = false;
      try {
        valid = bcrypt.compareSync(pin, user.pin_hash);
      } catch {
        valid = false;
      }

      if (!valid) {
        const nextAttempts = (user.pin_attempts || 0) + 1;
        sqlite.prepare('UPDATE users SET pin_attempts = ? WHERE id = ?').run(nextAttempts, user.id);
        await writeAudit(
          nextAttempts >= 5 ? 'PIN_LOCKED' : 'PIN_FAILED',
          'auth',
          user.id,
          null,
          { attempts: nextAttempts }
        );
        if (nextAttempts >= 5) {
          return {
            ok: false,
            error: 'تم قفل الدخول برمز PIN بعد 5 محاولات خاطئة. يرجى استخدام كلمة المرور الكاملة.',
          };
        }
        return {
          ok: false,
          error: `رمز PIN غير صحيح (المحاولة ${nextAttempts} من 5)`,
        };
      }

      sqlite.prepare('UPDATE users SET pin_attempts = 0, last_login_at = ? WHERE id = ?').run(new Date().toISOString(), user.id);
      const safeUser = toSafeUser(user);
      currentSessionUser = safeUser;
      lastSessionActivity = Date.now();

      await writeAudit('PIN_UNLOCK_SUCCESS', 'auth', user.id, null, { username: user.username });

      return { ok: true, data: safeUser };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  safeIpcMain.handle('auth:logout', async () => {
    if (currentSessionUser) {
      await writeAudit('LOGOUT', 'auth', currentSessionUser.id, null, { username: currentSessionUser.username });
    }
    currentSessionUser = null;
    return { ok: true, data: true };
  });

  safeIpcMain.handle('auth:me', async () => {
    checkSessionTimeout();
    if (currentSessionUser) {
      lastSessionActivity = Date.now();
    }
    return { ok: true, data: currentSessionUser };
  });

  safeIpcMain.handle('auth:getCurrentUser', async () => {
    checkSessionTimeout();
    if (currentSessionUser) {
      lastSessionActivity = Date.now();
    }
    return { ok: true, data: currentSessionUser };
  });
}
