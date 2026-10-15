import { PLAN_DEFS } from '@shared/license';
import type {
  EyadatiApi,
  Patient,
  CreatePatient,
  UpdatePatient,
  PatientFilters,
  Appointment,
  CreateAppointment,
  UpdateAppointment,
  AppointmentFilters,
  AppointmentStatus,
  Treatment,
  CreateTreatment,
  UpdateTreatment,
  TreatmentFilters,
  TreatmentPlan,
  CreateTreatmentPlan,
  UpdateTreatmentPlan,
  Procedure,
  ProcedureFilters,
  Invoice,
  CreateInvoice,
  UpdateInvoice,
  InvoiceFilters,
  InvoiceItem,
  Payment,
  CreatePayment,
  FinancialStats,
  InsuranceCompany,
  CreateInsuranceCompany,
  UpdateInsuranceCompany,
  InsuranceClaim,
  CreateInsuranceClaim,
  UpdateInsuranceClaim,
  Image,
  CreateImage,
  InventoryItem,
  CreateInventoryItem,
  UpdateInventoryItem,
  InventoryTransaction,
  CreateInventoryTransaction,
  User,
  CreateUser,
  UpdateUser,
  UserFilters,
  Attendance,
  CreateAttendance,
  Clinic,
  UpdateClinic,
  DashboardSummary,
  MedicalHistory,
  CreateMedicalHistory,
  Allergy,
  CreateAllergy,
  ToothRecord,
  CreateToothRecord,
  TreatmentPlanItem,
  CreateProcedure,
  UpdateProcedure,
  AcceptPlanPayload,
  ExecuteTreatmentPayload,
  Room,
  RoomStatus,
  ApiResult,
  Paginated,
  Installment,
  FinancialsReportData,
  AuditLog,
  InsuranceClaimStatus,
  Expense,
  CreateExpense,
  UpdateExpense,
  ExpenseFilters,
  ReportPeriodFilters,
  RevenueReportData,
  IncomeStatementData,
  AgingReportData,
  DoctorCommissionData,
  VatReportData,
  DailyCashClosingData,
  Prescription,
  PrescriptionItem,
  CreatePrescription,
  MedicalReport,
  CreateMedicalReport,
  UpdateMedicalReport,
  LabOrder,
  CreateLabOrder,
  UpdateLabOrder,
  LabOrderStatus,
  Lab,
  CreateLab,
  UpdateLab,
  Supplier,
  CreateSupplier,
  UpdateSupplier,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  InventoryMonthlyConsumptionReport,
  AuthUser,
  PermissionsMatrix,
  ClinicSecurityPolicies,
  LeaveRequest,
  LeaveType,
  LeaveStatus,
  DoctorCommissionSummary,
  ResourceName,
  PermissionAction,
  ScheduledReport,
  CreateScheduledReport,
  GeneratedReportHistoryItem,
  CreateRoom,
  SetupFirstRunPayload,
  SetupFirstRunResult,
  ReportFilters,
  ReportGeneratedData,
} from '@shared/contracts';
import bcrypt from 'bcryptjs';

import {
  CLINIC_ID,
  seedClinic,
  seedUsers,
  seedRooms,
  seedInsuranceCompanies,
  seedProcedures,
  seedPatients,
  seedMedicalHistories,
  seedAllergies,
  seedAppointments,
  seedInvoices,
  seedInvoiceItems,
  seedPayments,
  seedToothRecords,
  seedInventoryItems,
  seedSuppliers,
} from '../../electron/db/seedData';

const STORAGE_KEY_PREFIX = 'eyadati_mock_';

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function err<T>(message: string): ApiResult<T> {
  return { ok: false, error: message };
}

// 12-round bcrypt hash for 'password123'
const BCRYPT_12_PASSWORD123 = '$2a$12$Z0bC7G5VpG3F9hY2mD8XUe4g2e.Fm6WvB7T6z1k8V6.k3J8u4r9qy';

const fullPerms = { view: true, create: true, update: true, delete: true, export: true };
const noPerms = { view: false, create: false, update: false, delete: false, export: false };
const viewOnly = { view: true, create: false, update: false, delete: false, export: false };
const standardOps = { view: true, create: true, update: true, delete: false, export: false };

export const DEFAULT_PERMISSIONS_MATRIX: PermissionsMatrix = {
  owner: {
    patients: fullPerms,
    appointments: fullPerms,
    treatments: fullPerms,
    clinical_notes: fullPerms,
    prescriptions: fullPerms,
    medical_reports: fullPerms,
    lab_orders: fullPerms,
    invoices: fullPerms,
    prices: fullPerms,
    payments: fullPerms,
    expenses: fullPerms,
    inventory: fullPerms,
    staff: fullPerms,
    reports: fullPerms,
    settings: fullPerms,
    audit_logs: fullPerms,
  },
  dentist: {
    patients: standardOps,
    appointments: standardOps,
    treatments: standardOps,
    clinical_notes: standardOps,
    prescriptions: standardOps,
    medical_reports: standardOps,
    lab_orders: standardOps,
    invoices: viewOnly,
    prices: viewOnly,
    payments: viewOnly,
    expenses: noPerms,
    inventory: viewOnly,
    staff: viewOnly,
    reports: { view: true, create: false, update: false, delete: false, export: true },
    settings: noPerms,
    audit_logs: noPerms,
  },
  receptionist: {
    patients: standardOps,
    appointments: standardOps,
    treatments: noPerms,
    clinical_notes: noPerms,
    prescriptions: noPerms,
    medical_reports: noPerms,
    lab_orders: viewOnly,
    invoices: standardOps,
    prices: noPerms,
    payments: standardOps,
    expenses: noPerms,
    inventory: noPerms,
    staff: viewOnly,
    reports: noPerms,
    settings: noPerms,
    audit_logs: noPerms,
  },
  accountant: {
    patients: viewOnly,
    appointments: viewOnly,
    treatments: viewOnly,
    clinical_notes: noPerms,
    prescriptions: noPerms,
    medical_reports: noPerms,
    lab_orders: viewOnly,
    invoices: { view: true, create: true, update: true, delete: false, export: true },
    prices: { view: true, create: true, update: true, delete: false, export: true },
    payments: { view: true, create: true, update: true, delete: false, export: true },
    expenses: { view: true, create: true, update: true, delete: false, export: true },
    inventory: viewOnly,
    staff: viewOnly,
    reports: { view: true, create: true, update: true, delete: false, export: true },
    settings: noPerms,
    audit_logs: viewOnly,
  },
  assistant: {
    patients: viewOnly,
    appointments: viewOnly,
    treatments: viewOnly,
    clinical_notes: viewOnly,
    prescriptions: viewOnly,
    medical_reports: noPerms,
    lab_orders: standardOps,
    invoices: noPerms,
    prices: noPerms,
    payments: noPerms,
    expenses: noPerms,
    inventory: standardOps,
    staff: viewOnly,
    reports: noPerms,
    settings: noPerms,
    audit_logs: noPerms,
  },
};

export const DEFAULT_SECURITY_POLICIES: ClinicSecurityPolicies = {
  receptionist_hide_prices: true,
  accountant_hide_clinical_notes: true,
  dentist_only_own_patients: false,
  idle_timeout_minutes: 15,
  max_failed_attempts: 5,
  lockout_duration_minutes: 15,
};

const defaultSeedUsers: User[] = [
  {
    id: 'u1000000-0000-0000-0000-000000000001',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    full_name: 'د. أحمد خالد الراشد',
    username: 'dr.ahmed',
    password_hash: BCRYPT_12_PASSWORD123,
    role: 'owner',
    specialty: 'استشاري جراحة وزراعة الأسنان',
    license_number: 'SCHS-2018-D-8891',
    phone: '0501112233',
    email: 'dr.ahmed@eyadati.local',
    avatar_path: null,
    color: '#1E4E9C',
    commission_percent: 40,
    is_active: true,
    pin: '1111',
    failed_attempts: 0,
    locked_until: null,
    last_login_at: '2026-09-20T07:30:00.000Z',
  },
  {
    id: 'u1000000-0000-0000-0000-000000000002',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    full_name: 'د. ليلى ناصر القحطاني',
    username: 'dr.layla',
    password_hash: BCRYPT_12_PASSWORD123,
    role: 'dentist',
    specialty: 'أخصائية علاج جذور وعصب الأسنان',
    license_number: 'SCHS-2020-D-4521',
    phone: '0502223344',
    email: 'dr.layla@eyadati.local',
    avatar_path: null,
    color: '#2BB39A',
    commission_percent: 35,
    is_active: true,
    pin: '2222',
    failed_attempts: 0,
    locked_until: null,
    last_login_at: '2026-09-20T08:00:00.000Z',
  },
  {
    id: 'u1000000-0000-0000-0000-000000000005',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    full_name: 'د. سارة حسن',
    username: 'dr.sara',
    password_hash: BCRYPT_12_PASSWORD123,
    role: 'dentist',
    specialty: 'طبيبة أسنان عامة وتجميل',
    license_number: 'SCHS-2021-D-5120',
    phone: '0505556677',
    email: 'dr.sara@eyadati.local',
    avatar_path: null,
    color: '#E11D48',
    commission_percent: 35,
    is_active: true,
    pin: '5555',
    failed_attempts: 0,
    locked_until: null,
    last_login_at: '2026-09-20T08:30:00.000Z',
  },
  {
    id: 'u1000000-0000-0000-0000-000000000003',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    full_name: 'سارة عبد الله العمري',
    username: 'sara.rec',
    password_hash: BCRYPT_12_PASSWORD123,
    role: 'receptionist',
    specialty: 'مسؤولة الاستقبال وتنسيق المواعيد',
    license_number: null,
    phone: '0503334455',
    email: 'sara@eyadati.local',
    avatar_path: null,
    color: '#2563C9',
    commission_percent: 0,
    is_active: true,
    pin: '3333',
    failed_attempts: 0,
    locked_until: null,
    last_login_at: '2026-09-20T07:15:00.000Z',
  },
  {
    id: 'u1000000-0000-0000-0000-000000000004',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    full_name: 'خالد منصور الدوسري',
    username: 'khaled.acc',
    password_hash: BCRYPT_12_PASSWORD123,
    role: 'accountant',
    specialty: 'مدير الحسابات والفوترة',
    license_number: null,
    phone: '0504445566',
    email: 'khaled@eyadati.local',
    avatar_path: null,
    color: '#153C7C',
    commission_percent: 0,
    is_active: true,
    pin: '4444',
    failed_attempts: 0,
    locked_until: null,
    last_login_at: '2026-09-19T16:45:00.000Z',
  },
  {
    id: 'u1000000-0000-0000-0000-000000000006',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    full_name: 'منى إبراهيم الزهراني',
    username: 'mona.ast',
    password_hash: BCRYPT_12_PASSWORD123,
    role: 'assistant',
    specialty: 'مساعدة طبيب أسنان',
    license_number: 'SCHS-2022-A-1102',
    phone: '0507778899',
    email: 'mona@eyadati.local',
    avatar_path: null,
    color: '#0D9488',
    commission_percent: 0,
    is_active: true,
    pin: '6666',
    failed_attempts: 0,
    locked_until: null,
    last_login_at: '2026-09-20T08:10:00.000Z',
  },
];

const defaultSeedLeaves: LeaveRequest[] = [
  {
    id: 'leave-001',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    deleted_at: null,
    user_id: 'u1000000-0000-0000-0000-000000000002',
    user_name: 'د. ليلى ناصر القحطاني',
    type: 'annual',
    start_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    days_count: 5,
    reason: 'إجازة سنوية اعتيادية لقضاء عطلة عائلية',
    status: 'approved',
    reviewed_by: 'د. أحمد خالد الراشد',
    reviewed_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'leave-002',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    deleted_at: null,
    user_id: 'u1000000-0000-0000-0000-000000000003',
    user_name: 'سارة عبد الله العمري',
    type: 'emergency',
    start_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    days_count: 2,
    reason: 'ظرف عائلي طارئ يتطلب السفر خارج الرياض',
    status: 'pending',
    reviewed_by: null,
    reviewed_at: null,
  },
  {
    id: 'leave-003',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 19 * 86400000).toISOString(),
    deleted_at: null,
    user_id: 'u1000000-0000-0000-0000-000000000004',
    user_name: 'خالد منصور الدوسري',
    type: 'sick',
    start_date: new Date(Date.now() - 18 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() - 16 * 86400000).toISOString().split('T')[0],
    days_count: 3,
    reason: 'وعكة صحية وإجازة مرضية مرفقة بتقرير طبي معتمد',
    status: 'approved',
    reviewed_by: 'د. أحمد خالد الراشد',
    reviewed_at: new Date(Date.now() - 19 * 86400000).toISOString(),
  },
];

// In-Memory state initialized from LocalStorage or Seed Data
let clinicState: Clinic = loadStorage('clinic', seedClinic as unknown as Clinic);

let usersState: User[] = (() => {
  const loaded = loadStorage<User[]>('users', defaultSeedUsers);
  if (!loaded || loaded.length === 0) return defaultSeedUsers;
  return loaded.map((u) => {
    const seed = defaultSeedUsers.find((s) => s.id === u.id);
    return {
      ...u,
      pin: u.pin || seed?.pin || '1234',
      failed_attempts: u.failed_attempts ?? 0,
      locked_until: u.locked_until ?? null,
      color: u.color || seed?.color || '#1E4E9C',
      commission_percent: u.commission_percent ?? seed?.commission_percent ?? 0,
      password_hash: (u.password_hash && u.password_hash.startsWith('$2a$')) ? u.password_hash : BCRYPT_12_PASSWORD123,
    };
  });
})();

let currentSessionUser: AuthUser | null = (() => {
  const loaded = loadStorage<AuthUser | null>('auth_session_user', null);
  if (loaded) return loaded;
  const u = usersState[0] || defaultSeedUsers[0];
  return {
    id: u.id,
    clinic_id: u.clinic_id,
    full_name: u.full_name,
    username: u.username,
    role: u.role,
    specialty: u.specialty,
    license_number: u.license_number,
    phone: u.phone,
    email: u.email,
    avatar_path: u.avatar_path,
    color: u.color,
    commission_percent: u.commission_percent,
    is_active: u.is_active,
    pin: u.pin || '1111',
    failed_attempts: 0,
    locked_until: null,
    last_login_at: u.last_login_at,
  };
})();

let rbacMatrixState: PermissionsMatrix = loadStorage('rbac_matrix', DEFAULT_PERMISSIONS_MATRIX);
let securityPoliciesState: ClinicSecurityPolicies = loadStorage('security_policies', DEFAULT_SECURITY_POLICIES);
let leavesState: LeaveRequest[] = loadStorage('leaves', defaultSeedLeaves);
let roomsState: Room[] = loadStorage('rooms', seedRooms as unknown as Room[]);
let patientsState: Patient[] = (() => {
  const loaded = loadStorage('patients', seedPatients as unknown as Patient[]);
  const nowMs = Date.now();
  if (loaded.length > 5) {
    if (loaded[1]) {
      loaded[1].insurance_company_id = loaded[1].insurance_company_id || 'ins-002';
      loaded[1].insurance_policy_no = loaded[1].insurance_policy_no || 'TAW-55412';
      loaded[1].insurance_expiry = new Date(nowMs + 12 * 86400000).toISOString().split('T')[0];
    }
    if (loaded[3]) {
      loaded[3].insurance_company_id = loaded[3].insurance_company_id || 'ins-001';
      loaded[3].insurance_policy_no = loaded[3].insurance_policy_no || 'BUPA-90812';
      loaded[3].insurance_expiry = new Date(nowMs + 5 * 86400000).toISOString().split('T')[0];
    }
    if (loaded[7]) {
      loaded[7].insurance_company_id = loaded[7].insurance_company_id || 'ins-001';
      loaded[7].insurance_policy_no = loaded[7].insurance_policy_no || 'BUPA-33214';
      loaded[7].insurance_expiry = new Date(nowMs + 24 * 86400000).toISOString().split('T')[0];
    }
    if (loaded[9]) {
      loaded[9].insurance_company_id = loaded[9].insurance_company_id || 'ins-003';
      loaded[9].insurance_policy_no = loaded[9].insurance_policy_no || 'MED-99014';
      loaded[9].insurance_expiry = new Date(nowMs - 2 * 86400000).toISOString().split('T')[0];
    }
  }
  return loaded;
})();
let appointmentsState: Appointment[] = loadStorage('appointments', seedAppointments as unknown as Appointment[]);
let proceduresState: Procedure[] = loadStorage('procedures', seedProcedures as unknown as Procedure[]);
let invoicesState: Invoice[] = loadStorage('invoices', seedInvoices as unknown as Invoice[]);
let invoiceItemsState: InvoiceItem[] = loadStorage('invoiceItems', seedInvoiceItems as unknown as InvoiceItem[]);
let paymentsState: Payment[] = loadStorage('payments', seedPayments as unknown as Payment[]);
let toothRecordsState: ToothRecord[] = loadStorage('toothRecords', seedToothRecords as unknown as ToothRecord[]);
let medicalHistoryState: MedicalHistory[] = loadStorage('medicalHistory', seedMedicalHistories as unknown as MedicalHistory[]);
let allergiesState: Allergy[] = loadStorage('allergies', seedAllergies as unknown as Allergy[]);
let insuranceCompaniesState: InsuranceCompany[] = (() => {
  const loaded = loadStorage<InsuranceCompany[]>('insuranceCompanies', seedInsuranceCompanies as unknown as InsuranceCompany[]);
  return loaded.map((c, i) => ({
    ...c,
    coverage_percent_default: c.coverage_percent_default ?? (i === 2 ? 75 : 80),
    annual_limit_halalas: c.annual_limit_halalas ?? [500000, 350000, 400000][i % 3],
    excluded_procedures: c.excluded_procedures && c.excluded_procedures.length > 0 ? c.excluded_procedures : [
      ['تبييض الأسنان بالليزر', 'تقويم الأسنان التجميلي'],
      ['تبييض الأسنان بالليزر', 'زراعة الأسنان التجميلية'],
      ['ابتسامة هوليوود (فينير)', 'تبييض الأسنان'],
    ][i % 3],
  }));
})();

let auditLogsState: AuditLog[] = loadStorage('auditLogs', [
  {
    id: 'log-001',
    clinic_id: 'c1000000-0000-0000-0000-000000000001',
    created_at: '2026-09-20T09:00:00.000Z',
    updated_at: '2026-09-20T09:00:00.000Z',
    deleted_at: null,
    user_id: 'u1000000-0000-0000-0000-000000000001',
    action: 'INSURANCE_CLAIM_SUBMITTED',
    entity_type: 'insurance_claim',
    entity_id: 'clm-001',
    before: { status: 'draft' },
    after: { status: 'submitted', claim_number: 'CLM-2026-081', claimed_halalas: 120000 },
    ip: '127.0.0.1',
  },
  {
    id: 'log-002',
    clinic_id: 'c1000000-0000-0000-0000-000000000001',
    created_at: '2026-09-21T14:30:00.000Z',
    updated_at: '2026-09-21T14:30:00.000Z',
    deleted_at: null,
    user_id: 'u1000000-0000-0000-0000-000000000001',
    action: 'INSURANCE_CLAIM_APPROVED_PAYMENT',
    entity_type: 'insurance_claim',
    entity_id: 'clm-001',
    before: { status: 'submitted', approved_halalas: 0 },
    after: { status: 'approved', approved_halalas: 120000, payment_applied_halalas: 120000 },
    ip: '127.0.0.1',
  },
]);

const defaultSeedExpenses: Expense[] = [
  {
    id: 'exp-001',
    clinic_id: 'c1000000-0000-0000-0000-000000000001',
    category: 'rent',
    title: 'إيجار مقر المركز الطبي - الدور الأرضي والميزانين',
    amount_halalas: 2500000,
    vat_halalas: 0,
    expense_date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
    payment_method: 'transfer',
    reference: 'RENT-Q3-2026',
    payee: 'شركة الأفق للاستثمار العقاري',
    receipt_url: null,
    is_recurring: true,
    recurring_day: 1,
    notes: 'عقد إيجار موثق عبر منصة إيجار',
    recorded_by: 'خالد المدير المالي',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'exp-002',
    clinic_id: 'c1000000-0000-0000-0000-000000000001',
    category: 'salaries',
    title: 'رواتب وأجور الكادر الطبي والتمريضي لشهر سبتمبر',
    amount_halalas: 4800000,
    vat_halalas: 0,
    expense_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    payment_method: 'transfer',
    reference: 'SAL-SEP-2026',
    payee: 'مصرف الراجحي - نظام حماية الأجور (WPS)',
    receipt_url: null,
    is_recurring: true,
    recurring_day: 28,
    notes: 'تحويل رواتب الأطباء، التمريض، وموظفي الاستقبال',
    recorded_by: 'خالد المدير المالي',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'exp-003',
    clinic_id: 'c1000000-0000-0000-0000-000000000001',
    category: 'supplies',
    title: 'شراء مواد حشوات كمبوزيت وتخدير موضعي وقفازات معقمة',
    amount_halalas: 575000,
    vat_halalas: 75000,
    expense_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    payment_method: 'mada',
    reference: 'INV-SUP-9821',
    payee: 'شركة التوريدات الطبية المتقدمة',
    receipt_url: null,
    is_recurring: false,
    recurring_day: null,
    notes: 'فاتورة ضريبية رسمية رقم 300449199200003',
    recorded_by: 'د. أحمد الشمري',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'exp-004',
    clinic_id: 'c1000000-0000-0000-0000-000000000001',
    category: 'lab_fees',
    title: 'مستحقات معمل الأسنان عن تيجان زيركون وفينير E.max',
    amount_halalas: 862500,
    vat_halalas: 112500,
    expense_date: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
    payment_method: 'transfer',
    reference: 'LAB-BILL-4410',
    payee: 'مختبر ديجيتال لطب الأسنان',
    receipt_url: null,
    is_recurring: false,
    recurring_day: null,
    notes: 'تسوية كشف حساب أعمال التركيبات السنية',
    recorded_by: 'خالد المدير المالي',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'exp-005',
    clinic_id: 'c1000000-0000-0000-0000-000000000001',
    category: 'utilities',
    title: 'فاتورة الكهرباء والإنترنت فائق السرعة للأجهزة السحابية',
    amount_halalas: 230000,
    vat_halalas: 30000,
    expense_date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    payment_method: 'mada',
    reference: 'SADAD-UTIL-1082',
    payee: 'الشركة السعودية للكهرباء / STC',
    receipt_url: null,
    is_recurring: true,
    recurring_day: 15,
    notes: 'سداد سداد إلكتروني مباشر',
    recorded_by: 'خالد المدير المالي',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'exp-006',
    clinic_id: 'c1000000-0000-0000-0000-000000000001',
    category: 'maintenance',
    title: 'صيانة دورية لجهاز الأشعة المقطعية CBCT ووحدة التعقيم',
    amount_halalas: 172500,
    vat_halalas: 22500,
    expense_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    payment_method: 'mada',
    reference: 'MNT-REP-552',
    payee: 'مؤسسة صيانة المعدات الطبية التخصصية',
    receipt_url: null,
    is_recurring: false,
    recurring_day: null,
    notes: 'استبدال فلاتر وتعيير الذراع الحركية',
    recorded_by: 'د. أحمد الشمري',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    deleted_at: null,
  },
];

let expensesState: Expense[] = loadStorage('expenses', defaultSeedExpenses);

function recordAuditLog(entry: {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  const now = new Date().toISOString();
  const log: AuditLog = {
    id: crypto.randomUUID(),
    clinic_id: 'c1000000-0000-0000-0000-000000000001',
    created_at: now,
    updated_at: now,
    deleted_at: null,
    user_id: entry.userId || 'u1000000-0000-0000-0000-000000000001',
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    before: entry.before || null,
    after: entry.after || null,
    ip: '127.0.0.1',
  };
  auditLogsState = [log, ...auditLogsState];
  saveStorage('auditLogs', auditLogsState);
}

export function checkIpcPermission(resource: ResourceName, action: PermissionAction): { allowed: boolean; reason?: string } {
  const user = currentSessionUser;
  if (!user) {
    return { allowed: false, reason: 'يجب تسجيل الدخول لتنفيذ هذا الإجراء' };
  }

  // Owner has unrestricted access
  if (user.role === 'owner') {
    return { allowed: true };
  }

  const rolePerms = rbacMatrixState[user.role];
  if (!rolePerms) {
    return { allowed: false, reason: 'الدور الوظيفي غير معرف في مصفوفة الصلاحيات' };
  }

  const resPerms = rolePerms[resource];
  if (!resPerms || !resPerms[action]) {
    recordAuditLog({
      userId: user.id,
      action: 'UNAUTHORIZED_ACCESS_BLOCKED',
      entityType: resource,
      entityId: 'ipc',
      before: null,
      after: { resource, action, user_role: user.role, blocked: true },
    });
    return {
      allowed: false,
      reason: `غير مصرح لدور "${user.role}" بإجراء "${action}" على مورد "${resource}"`,
    };
  }

  return { allowed: true };
}
const defaultSeedInsuranceClaims: InsuranceClaim[] = [
  {
    id: 'clm-001',
    clinic_id: 'c1000000-0000-0000-0000-000000000001',
    created_at: '2026-09-20T09:00:00.000Z',
    updated_at: '2026-09-20T09:00:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[0]?.id || 'p-001',
    invoice_id: seedInvoices[0]?.id || 'inv-001',
    company_id: 'ins-001',
    claim_number: 'CLM-2026-081',
    submitted_at: '2026-09-20T09:00:00.000Z',
    claimed_halalas: 120000,
    approved_halalas: 120000,
    rejected_halalas: 0,
    status: 'approved',
    response_at: '2026-09-21T14:30:00.000Z',
    rejection_reason: null,
    attachments: [],
  },
  {
    id: 'clm-002',
    clinic_id: 'c1000000-0000-0000-0000-000000000001',
    created_at: '2026-09-21T10:15:00.000Z',
    updated_at: '2026-09-21T10:15:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[1]?.id || 'p-002',
    invoice_id: seedInvoices[1]?.id || 'inv-002',
    company_id: 'ins-002',
    claim_number: 'CLM-2026-082',
    submitted_at: '2026-09-21T10:15:00.000Z',
    claimed_halalas: 85000,
    approved_halalas: 0,
    rejected_halalas: 0,
    status: 'submitted',
    response_at: null,
    rejection_reason: null,
    attachments: [],
  },
  {
    id: 'clm-003',
    clinic_id: 'c1000000-0000-0000-0000-000000000001',
    created_at: '2026-09-21T13:40:00.000Z',
    updated_at: '2026-09-21T13:40:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[7]?.id || 'p-008',
    invoice_id: seedInvoices[2]?.id || 'inv-003',
    company_id: 'ins-001',
    claim_number: 'CLM-2026-083',
    submitted_at: '2026-09-21T13:40:00.000Z',
    claimed_halalas: 150000,
    approved_halalas: 150000,
    rejected_halalas: 0,
    status: 'approved',
    response_at: '2026-09-22T08:20:00.000Z',
    rejection_reason: null,
    attachments: [],
  },
  {
    id: 'clm-004',
    clinic_id: 'c1000000-0000-0000-0000-000000000001',
    created_at: '2026-09-22T11:00:00.000Z',
    updated_at: '2026-09-22T11:00:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[3]?.id || 'p-004',
    invoice_id: seedInvoices[3]?.id || 'inv-004',
    company_id: 'ins-002',
    claim_number: 'CLM-2026-084',
    submitted_at: '2026-09-22T11:00:00.000Z',
    claimed_halalas: 65000,
    approved_halalas: 0,
    rejected_halalas: 0,
    status: 'submitted',
    response_at: null,
    rejection_reason: null,
    attachments: [],
  },
];

let insuranceClaimsState: InsuranceClaim[] = (() => {
  const loaded = loadStorage<InsuranceClaim[]>('insuranceClaims', []);
  return loaded.length > 0 ? loaded : defaultSeedInsuranceClaims;
})();
let installmentsState: Installment[] = loadStorage('installments', []);

const defaultSeedInventoryTransactions: InventoryTransaction[] = [
  {
    id: 'inv-tx-001',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    deleted_at: null,
    item_id: 'inv-item-001',
    type: 'in',
    quantity: 20,
    reason: 'توريد شحنة جديدة من حشوات 3M بموجب أمر الشراء PO-2026-018',
    treatment_id: null,
    created_by: 'u1000000-0000-0000-0000-000000000001',
  },
  {
    id: 'inv-tx-002',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    deleted_at: null,
    item_id: 'inv-item-002',
    type: 'out',
    quantity: 6,
    reason: 'صرف لعيادة 1 والعيادة 2 لجلسات علاج العصب والخلع',
    treatment_id: null,
    created_by: 'u1000000-0000-0000-0000-000000000001',
  },
  {
    id: 'inv-tx-003',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    deleted_at: null,
    item_id: 'inv-item-001',
    type: 'out',
    quantity: 2,
    reason: 'صرف سريري للإجراء: حشوة كمبوزيت ضوئية تجميلية',
    treatment_id: 't-001',
    created_by: 'u1000000-0000-0000-0000-000000000001',
  },
  {
    id: 'inv-tx-004',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    deleted_at: null,
    item_id: 'inv-item-004',
    type: 'out',
    quantity: 3,
    reason: 'صرف سريري للإجراء: معالجة لبية لأقنية الجذور',
    treatment_id: 't-002',
    created_by: 'u1000000-0000-0000-0000-000000000001',
  },
  {
    id: 'inv-tx-005',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    deleted_at: null,
    item_id: 'inv-item-003',
    type: 'adjust',
    quantity: 5,
    reason: 'تسوية جردية نصف شهرية بعد مطابقة الرف A3',
    treatment_id: null,
    created_by: 'u1000000-0000-0000-0000-000000000001',
  },
  {
    id: 'inv-tx-006',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    deleted_at: null,
    item_id: 'inv-item-006',
    type: 'waste',
    quantity: 1,
    reason: 'تالف - انكسار عبوة أثناء تعقيم العيادة',
    treatment_id: null,
    created_by: 'u1000000-0000-0000-0000-000000000001',
  },
];

const defaultSeedPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-seed-001',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    deleted_at: null,
    po_number: 'PO-2026-018',
    supplier_id: 'sup-001',
    supplier_name: 'مؤسسة التجهيزات السنية المتقدمة',
    order_date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
    expected_date: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
    received_date: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
    status: 'received',
    total_halalas: 370000,
    notes: 'تم استلام الشحنة وتوريدها للمستودع ومطابقة الأصناف بالكامل.',
    items: [
      {
        id: 'poi-1',
        item_id: 'inv-item-001',
        item_name: 'حشوة كمبوزيت 3M Filtek Z350 XT A2',
        unit: 'حقنة 4g',
        quantity: 20,
        received_quantity: 20,
        cost_halalas: 18500,
        total_halalas: 370000,
      },
    ],
  },
  {
    id: 'po-seed-002',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    deleted_at: null,
    po_number: 'PO-2026-022',
    supplier_id: 'sup-003',
    supplier_name: 'مستودع الأدوية والمخدر الطبي السعودي',
    order_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    expected_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    received_date: null,
    status: 'sent',
    total_halalas: 185000,
    notes: 'طلب عاجل لتجديد مخزون البنج الموضعي والإبر الدقيقة لوصولهما للحد الأدنى.',
    items: [
      {
        id: 'poi-2',
        item_id: 'inv-item-002',
        item_name: 'بنج موضعي ليدوكائين 2% مع أدرينالين Septodont',
        unit: 'علبة 50 كاربول',
        quantity: 10,
        received_quantity: 0,
        cost_halalas: 14000,
        total_halalas: 140000,
      },
      {
        id: 'poi-3',
        item_id: 'inv-item-005',
        item_name: 'إبر بنج أسنان مقاس قصير 30G C-K Ject',
        unit: 'علبة 100 إبرة',
        quantity: 10,
        received_quantity: 0,
        cost_halalas: 4500,
        total_halalas: 45000,
      },
    ],
  },
];

let loadedInventory = loadStorage<InventoryItem[]>('inventoryItems', seedInventoryItems as unknown as InventoryItem[]);
if (!loadedInventory || loadedInventory.length < seedInventoryItems.length) {
  loadedInventory = seedInventoryItems as unknown as InventoryItem[];
  saveStorage('inventoryItems', loadedInventory);
}
let inventoryItemsState: InventoryItem[] = loadedInventory;

let loadedTransactions = loadStorage<InventoryTransaction[]>('inventoryTransactions', defaultSeedInventoryTransactions);
if (!loadedTransactions || loadedTransactions.length === 0) {
  loadedTransactions = defaultSeedInventoryTransactions;
  saveStorage('inventoryTransactions', loadedTransactions);
}
let inventoryTransactionsState: InventoryTransaction[] = loadedTransactions;

let suppliersState: Supplier[] = (() => {
  const loaded = loadStorage<Supplier[]>('suppliers', seedSuppliers);
  return loaded && loaded.length > 0 ? loaded : seedSuppliers;
})();

let purchaseOrdersState: PurchaseOrder[] = (() => {
  const loaded = loadStorage<PurchaseOrder[]>('purchaseOrders', defaultSeedPurchaseOrders);
  return loaded && loaded.length > 0 ? loaded : defaultSeedPurchaseOrders;
})();
let treatmentsState: Treatment[] = loadStorage('treatments', []);
let treatmentPlansState: TreatmentPlan[] = loadStorage('treatmentPlans', []);
let treatmentPlanItemsState: TreatmentPlanItem[] = loadStorage('treatmentPlanItems', []);
let attendanceState: Attendance[] = loadStorage('attendance', []);

const defaultScheduledReports: ScheduledReport[] = [
  {
    id: 'sch-001',
    reportId: 'revenue_report',
    reportName: 'تقرير الإيرادات اليومية',
    category: 'financial',
    frequency: 'daily',
    timeOfDay: '21:00',
    targetFolder: 'C:/Eyadati/Reports/Financial',
    format: 'pdf',
    enabled: true,
    lastRunAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    nextRunAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'sch-002',
    reportId: 'attendance_rate',
    reportName: 'معدل حضور المواعيد والغياب الأسبوعي',
    category: 'appointments',
    frequency: 'weekly',
    timeOfDay: '08:00',
    targetFolder: 'C:/Eyadati/Reports/Appointments',
    format: 'pdf',
    enabled: true,
    lastRunAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    nextRunAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'sch-003',
    reportId: 'new_patients',
    reportName: 'تقرير استقطاب المرضى الجدد الشهري',
    category: 'patients',
    frequency: 'monthly',
    timeOfDay: '09:00',
    targetFolder: 'C:/Eyadati/Reports/Patients',
    format: 'pdf',
    enabled: true,
    lastRunAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    nextRunAt: new Date(Date.now() + 15 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'sch-004',
    reportId: 'vat_report',
    reportName: 'إقرار ضريبة القيمة المضافة ZATCA الشهري',
    category: 'financial',
    frequency: 'monthly',
    timeOfDay: '10:00',
    targetFolder: 'C:/Eyadati/Reports/Zatca_Vat',
    format: 'pdf',
    enabled: false,
    lastRunAt: null,
    nextRunAt: new Date(Date.now() + 20 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const defaultReportHistory: GeneratedReportHistoryItem[] = [
  {
    id: 'hist-001',
    scheduledReportId: 'sch-001',
    reportName: 'تقرير الإيرادات اليومية',
    periodLabel: 'الأمس',
    filePath: 'C:/Eyadati/Reports/Financial/Daily_Revenue_2026-09-28.pdf',
    fileSizeKb: 342,
    format: 'pdf',
    generatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: 'saved',
  },
  {
    id: 'hist-002',
    scheduledReportId: 'sch-002',
    reportName: 'معدل حضور المواعيد والغياب الأسبوعي',
    periodLabel: 'الأسبوع المنصرم',
    filePath: 'C:/Eyadati/Reports/Appointments/Appointments_Weekly_Week39.pdf',
    fileSizeKb: 512,
    format: 'pdf',
    generatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: 'saved',
  },
  {
    id: 'hist-003',
    scheduledReportId: 'sch-003',
    reportName: 'تقرير استقطاب المرضى الجدد الشهري',
    periodLabel: 'أغسطس 2026',
    filePath: 'C:/Eyadati/Reports/Patients/New_Patients_Aug2026.pdf',
    fileSizeKb: 428,
    format: 'pdf',
    generatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    status: 'saved',
  },
];

let scheduledReportsState: ScheduledReport[] = loadStorage('scheduledReports', defaultScheduledReports);
let reportHistoryState: GeneratedReportHistoryItem[] = loadStorage('reportHistory', defaultReportHistory);

const defaultSeedImages: Image[] = [
  {
    id: 'img-seed-001',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    deleted_at: null,
    patient_id: 'pat-001',
    tooth_number: null,
    type: 'panoramic',
    file_path: 'userData/media/pat-001/pano_baseline_01.jpg',
    thumbnail_path: 'userData/media/pat-001/thumbs/thumb_pano_baseline_01.jpg',
    taken_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    captured_by: seedUsers[0]?.id || 'u1000000-0000-0000-0000-000000000001',
    notes: 'أشعة بانورامية شاملة - كشف أولي للفكين يظهر انحشار أضراس العقل السفلية ونخر بالرحى 16',
    tags: ['قبل العلاج', 'فحص شامل'],
  },
  {
    id: 'img-seed-002',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    deleted_at: null,
    patient_id: 'pat-001',
    tooth_number: 16,
    type: 'periapical',
    file_path: 'userData/media/pat-001/pa_tooth16_before.jpg',
    thumbnail_path: 'userData/media/pat-001/thumbs/thumb_pa_tooth16_before.jpg',
    taken_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    captured_by: seedUsers[0]?.id || 'u1000000-0000-0000-0000-000000000001',
    notes: 'أشعة ذروية للسن 16 قبل العلاج: نخر عميق ملامس لحجرة اللب مع التهاب ذروي',
    tags: ['قبل العلاج', 'تسوس عميق', 'معالجة لبية (عصب)'],
  },
  {
    id: 'img-seed-003',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    deleted_at: null,
    patient_id: 'pat-001',
    tooth_number: 16,
    type: 'periapical',
    file_path: 'userData/media/pat-001/pa_tooth16_after.jpg',
    thumbnail_path: 'userData/media/pat-001/thumbs/thumb_pa_tooth16_after.jpg',
    taken_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    captured_by: seedUsers[0]?.id || 'u1000000-0000-0000-0000-000000000001',
    notes: 'أشعة ذروية للسن 16 بعد العلاج: حشو قنوات الجذور ثلاثي الأبعاد تام الامتداد',
    tags: ['بعد العلاج', 'معالجة لبية (عصب)', 'متابعة دورية'],
  },
  {
    id: 'img-seed-004',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    deleted_at: null,
    patient_id: 'pat-001',
    tooth_number: 24,
    type: 'bitewing',
    file_path: 'userData/media/pat-001/bitewing_left_premolar.jpg',
    thumbnail_path: 'userData/media/pat-001/thumbs/thumb_bitewing_left_premolar.jpg',
    taken_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    captured_by: seedUsers[0]?.id || 'u1000000-0000-0000-0000-000000000001',
    notes: 'أشعة إطباقية لفحص النخور الملاصقة بين السنين 24 و 25',
    tags: ['تسوس عميق', 'متابعة دورية'],
  },
  {
    id: 'img-seed-005',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    deleted_at: null,
    patient_id: 'pat-001',
    tooth_number: 11,
    type: 'intraoral_photo',
    file_path: 'userData/media/pat-001/photo_tooth11_before.jpg',
    thumbnail_path: 'userData/media/pat-001/thumbs/thumb_photo_tooth11_before.jpg',
    taken_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    captured_by: seedUsers[0]?.id || 'u1000000-0000-0000-0000-000000000001',
    notes: 'صورة فموية للثنية العلوية اليمنى 11 قبل الترميم التجميلي',
    tags: ['قبل العلاج', 'تركيبة / تاج'],
  },
  {
    id: 'img-seed-006',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    deleted_at: null,
    patient_id: 'pat-001',
    tooth_number: 11,
    type: 'intraoral_photo',
    file_path: 'userData/media/pat-001/photo_tooth11_after.jpg',
    thumbnail_path: 'userData/media/pat-001/thumbs/thumb_photo_tooth11_after.jpg',
    taken_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    captured_by: seedUsers[0]?.id || 'u1000000-0000-0000-0000-000000000001',
    notes: 'صورة فموية للسن 11 بعد الانتهاء من التاج الخزفي والتطابق اللوني التام',
    tags: ['بعد العلاج', 'تركيبة / تاج'],
  },
  {
    id: 'img-seed-007',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    deleted_at: null,
    patient_id: 'pat-002',
    tooth_number: null,
    type: 'cephalometric',
    file_path: 'userData/media/pat-002/ceph_ortho.jpg',
    thumbnail_path: 'userData/media/pat-002/thumbs/thumb_ceph_ortho.jpg',
    taken_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    captured_by: seedUsers[0]?.id || 'u1000000-0000-0000-0000-000000000001',
    notes: 'أشعة جانبية سيفالومترية لدراسة خطة تقويم الأسنان وعلاقات الفكين',
    tags: ['قبل العلاج', 'تقويم أسنان'],
  },
];

let loadedImages = loadStorage('images', defaultSeedImages);
if (!loadedImages || loadedImages.length === 0) {
  loadedImages = defaultSeedImages;
  saveStorage('images', loadedImages);
}
let imagesState: Image[] = loadedImages;

const defaultSeedLabs: Lab[] = [
  {
    id: 'lab-001',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    deleted_at: null,
    name: 'معمل النخبة الرقمي لتركيبات الأسنان',
    phone: '0501122334',
    email: 'info@elitedental-lab.com',
    address: 'الرياض - حي الملز، طريق صلاح الدين',
  },
  {
    id: 'lab-002',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    deleted_at: null,
    name: 'معمل الأندلس لتعويضات الأسنان التجميلية',
    phone: '0554433221',
    email: 'contact@alandalus-lab.com',
    address: 'جدة - شارع التحلية، برج المستقبل',
  },
  {
    id: 'lab-003',
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    deleted_at: null,
    name: 'معمل الدقة لصناعة الخزف والزيركون الرقمي',
    phone: '0569988776',
    email: 'lab@precision-smile.com',
    address: 'الدمام - حي الشاطئ، شارع الأشرعة',
  },
];

const defaultSeedLabOrders: LabOrder[] = [
  {
    id: 'lab-ord-001',
    clinic_id: CLINIC_ID,
    patient_id: seedPatients[0]?.id || 'p-001',
    lab_id: 'lab-001',
    treatment_id: null,
    appointment_id: seedAppointments[0]?.id || null,
    type: 'crown',
    work_description: 'تاج زيركون كامل تشريحي عالي الشفافية (Full Monolithic Zirconia)',
    tooth_numbers: [16],
    shade: 'A2',
    sent_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    due_at: new Date(Date.now() - 2 * 86400000).toISOString(), // Overdue!
    received_at: null,
    status: 'sent',
    cost_halalas: 35000,
    notes: 'ملاحظة هامة: يرجى مراعاة الإطباق مع المقابل 46 وتفريغ زوايا الاتصال بدقة',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'lab-ord-002',
    clinic_id: CLINIC_ID,
    patient_id: seedPatients[1]?.id || 'p-002',
    lab_id: 'lab-002',
    treatment_id: null,
    appointment_id: null,
    type: 'veneer',
    work_description: 'فينير خزفي إيماكس تجميلي فائق الرقة (Ultra-thin E-max Veneers)',
    tooth_numbers: [11, 21],
    shade: 'BL2',
    sent_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    due_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    received_at: null,
    status: 'in_progress',
    cost_halalas: 80000,
    notes: 'درجة شفافية Incisal Translucency طبيعية مع تشريح سطحي متدرج',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'lab-ord-003',
    clinic_id: CLINIC_ID,
    patient_id: seedPatients[2]?.id || 'p-003',
    lab_id: 'lab-001',
    treatment_id: null,
    appointment_id: null,
    type: 'crown',
    work_description: 'تاج بورسلان مدمج بمعدن (PFM Crown)',
    tooth_numbers: [36],
    shade: 'A3',
    sent_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    due_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    received_at: null,
    status: 'ready',
    cost_halalas: 30000,
    notes: 'العمل جاهز لدى المعمل وبانتظار مندوب التوصيل للعيادة',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'lab-ord-004',
    clinic_id: CLINIC_ID,
    patient_id: seedPatients[3]?.id || 'p-004',
    lab_id: 'lab-003',
    treatment_id: null,
    appointment_id: null,
    type: 'implant_abutment',
    work_description: 'دعامة زراعة تيتانيوم مخصصة مع تاج زيركون مثبت ببرغي (Custom Abutment + Screw-retained Crown)',
    tooth_numbers: [46],
    shade: 'A3.5',
    sent_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    due_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    received_at: new Date(Date.now() - 86400000).toISOString(),
    status: 'received',
    cost_halalas: 65000,
    notes: 'تم فحص العمل على النموذج والتأكد من مطابقة فتحة البرغي والانطباق اللثوي',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'lab-ord-005',
    clinic_id: CLINIC_ID,
    patient_id: seedPatients[4]?.id || 'p-005',
    lab_id: 'lab-002',
    treatment_id: null,
    appointment_id: null,
    type: 'bridge',
    work_description: 'جسر زيركون خلفي 3 وحدات (3-Unit Zirconia Bridge)',
    tooth_numbers: [24, 25, 26],
    shade: 'A2',
    sent_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    due_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    received_at: null,
    status: 'returned',
    cost_halalas: 95000,
    notes: 'مُعاد للتعديل: نقطة التماس الملاصقة مع السن 27 ضيقة وتعيق التنزيل التام',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'lab-ord-006',
    clinic_id: CLINIC_ID,
    patient_id: seedPatients[5]?.id || 'p-006',
    lab_id: 'lab-001',
    treatment_id: null,
    appointment_id: null,
    type: 'night_guard',
    work_description: 'واقي ليلي صلب/مرن للفك العلوي (Hard/Soft Dual Laminate Splint)',
    tooth_numbers: [],
    shade: null,
    sent_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    due_at: new Date(Date.now() - 1 * 86400000).toISOString(), // Overdue!
    received_at: null,
    status: 'sent',
    cost_halalas: 25000,
    notes: 'سماكة 3 ملم مع تسوية إطباقية للمرضى الذين يعانون من صكيك الأسنان الليلي (Bruxism)',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    deleted_at: null,
  },
];

const defaultSeedPrescriptions: Prescription[] = [
  {
    id: 'rx-seed-001',
    clinic_id: CLINIC_ID,
    patient_id: seedPatients[0]?.id || 'p-001',
    dentist_id: seedUsers[0]?.id || 'u-001',
    issued_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    notes: 'الالتزام بالكورس العلاجي كاملاً وتناول الدواء بعد الطعام. مراجعة العيادة فوراً عند الشعور بأي ضيق تنفس أو طفح جلدي.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'rx-seed-002',
    clinic_id: CLINIC_ID,
    patient_id: seedPatients[1]?.id || 'p-002',
    dentist_id: seedUsers[1]?.id || 'u-002',
    issued_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    notes: 'علاج وقائي ومسكن للألم بعد الجراحة اللثوية.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    deleted_at: null,
  },
];

const defaultSeedPrescriptionItems: PrescriptionItem[] = [
  {
    id: 'rx-item-001',
    clinic_id: CLINIC_ID,
    prescription_id: 'rx-seed-001',
    drug_name: 'Amoxicillin 500mg (أموكسيسيلين)',
    dose: '500 ملغ (كبسولة واحدة)',
    frequency: 'كل 8 ساعات (3 مرات يومياً)',
    duration_days: 7,
    instructions: 'بعد الأكل مع كوب ماء وفير. لا تتوقف عن تناول الدواء حتى انتهاء الكورس بالكامل.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'rx-item-002',
    clinic_id: CLINIC_ID,
    prescription_id: 'rx-seed-001',
    drug_name: 'Ibuprofen 400mg (بروفين مسكن ومضاد التهاب)',
    dose: '400 ملغ (قرص واحد)',
    frequency: 'عند اللزوم كل 8 ساعات',
    duration_days: 4,
    instructions: 'يؤخذ بعد الأكل مباشرة لتجنب تهيج جدار المعدة.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'rx-item-003',
    clinic_id: CLINIC_ID,
    prescription_id: 'rx-seed-001',
    drug_name: 'Chlorhexidine 0.12% (غسول فم مطهر كلورهيكسيدين)',
    dose: '15 مل مضمضة لمدة دقيقة واحدة',
    frequency: 'مرتين يومياً (صباحاً ومساءً)',
    duration_days: 10,
    instructions: 'المضمضة بعد تفريش الأسنان بنصف ساعة، وتجنب الأكل أو الشرب لمدة 30 دقيقة بعدها.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'rx-item-004',
    clinic_id: CLINIC_ID,
    prescription_id: 'rx-seed-002',
    drug_name: 'Clindamycin 300mg (كليندامايسين - دالاسين سي)',
    dose: '300 ملغ (كبسولة واحدة)',
    frequency: 'كل 6 ساعات (4 مرات يومياً)',
    duration_days: 5,
    instructions: 'تؤخذ مع كوب ماء كامل والجلوس منتصباً لمدة 15 دقيقة بعد تناولها.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'rx-item-005',
    clinic_id: CLINIC_ID,
    prescription_id: 'rx-seed-002',
    drug_name: 'Paracetamol 500mg (باراسيتامول - بنادول)',
    dose: '1000 ملغ (قرصان)',
    frequency: 'عند اللزوم كل 6 إلى 8 ساعات',
    duration_days: 3,
    instructions: 'الحد الأقصى 4000 ملغ يومياً، لا تجمعه مع أدوية أخرى تحتوي على الباراسيتامول.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    deleted_at: null,
  },
];

const defaultSeedMedicalReports: MedicalReport[] = [
  {
    id: 'rep-seed-001',
    clinic_id: CLINIC_ID,
    patient_id: seedPatients[0]?.id || 'p-001',
    type: 'dental_report',
    content: `تقرير فحص وتشخيص سني شامل\n\nبناءً على الفحص السريري والشعاعي المجري للمريض بتاريخ اليوم:\n- تبين وجود نخر سني متقدم ملامس للحجرة اللبية في الرحى الأولى العلوية اليمنى (السن 16).\n- تم إجراء علاج جذور (معالجة لبية) كامل ثلاثي الأبعاد بنجاح.\n- تم تحضير السن لاستقبال تاج تعويضي من الزيركون لحماية البنية السنية المتبقية ومنع الانكسار.\n- اللثة بحالة جيدة ولا توجد آفات عظمية ذروية نشطة حالياً.\n- التوصيات: العناية الفموية اليومية واستكمال التركيب الدائم ومراجعة العيادة بعد 6 أشهر للمتابعة الدورية.`,
    issued_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    issued_by: seedUsers[0]?.id || 'u-001',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'rep-seed-002',
    clinic_id: CLINIC_ID,
    patient_id: seedPatients[1]?.id || 'p-002',
    type: 'referral',
    content: `خطاب إحالة إلى أخصائي جراحة الفم والوجه والفكين\n\nسعادة الزميل الاستشاري المحترم،\n\nنحيل إليكم المريض للكشف السريري والتقييم الجراحي لضرس العقل السفلي الأيمن (السن 48).\n\nالموجودات السريرية والشعاعية:\n- ضرس العقل منطمر أفقياً (Horizontal Impaction) مع قرب شديد من القناة السنخية السفلية.\n- تكرر نوبات التهاب التاج المحيط (Pericoronitis) مع تورم وصعوبة فتح الفم.\n- نرجو من سعادتكم التكرم بإجراء القلع الجراحي تحت التخدير الموضعي أو العام وفق تقديركم.\n\nشاكرين ومقدرين حسن تعاونكم الدائم.`,
    issued_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    issued_by: seedUsers[0]?.id || 'u-001',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'rep-seed-003',
    clinic_id: CLINIC_ID,
    patient_id: seedPatients[2]?.id || 'p-003',
    type: 'sick_leave',
    content: `تقرير إجازة مرضية معتمدة\n\nيفيد مجمع عيادتي لطب وجراحة الأسنان بأن المريض قد راجع العيادة وأجريت له عملية جراحية صغرى في الفم واللثة (خلع جراحي مع خياطة جراحية).\n\n- عدد أيام الإجازة المرضية: 3 (ثلاثة أيام).\n- تبدأ من تاريخ: ${new Date(Date.now() - 86400000).toISOString().split('T')[0]}.\n- تاريخ المباشرة والعودة للعمل: ${new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]}.\n- يُنصح المريض بالراحة التامة وتجنب المجهود العضلي الشاق والتحدث لفترات طويلة خلال فترة التعافي.\n\nصدر هذا التقرير لتقديمه لجهة العمل الرسمية.`,
    issued_at: new Date(Date.now() - 86400000).toISOString(),
    issued_by: seedUsers[1]?.id || 'u-002',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    deleted_at: null,
  },
  {
    id: 'rep-seed-004',
    clinic_id: CLINIC_ID,
    patient_id: seedPatients[3]?.id || 'p-004',
    type: 'estimate',
    content: `عرض سعر وخطة علاجية تقديرية\n\nالمريض الكريم، بناءً على الخطة العلاجية المقترحة، نرفق لكم تفصيل التكاليف التقديرية:\n\n1. زراعة سن من التيتانيوم عالي الجودة للرحى الأولى السفلية (السن 46): 2,500 ر.س\n2. دعامة مخصصة للزرعة (Custom Titanium Abutment): 800 ر.س\n3. تاج زيركون مثبت بالبرغي عالي الجمالية: 1,200 ر.س\n4. علاج نخر وحشو تجميلي ضوئي للسن 24: 350 ر.س\n\n- الإجمالي قبل الخصم: 4,850 ر.س\n- الخصم المعتمد (باقة العلاج الشامل): 600 ر.س\n- الصافي النهائي المطلوب: 4,250 ر.س\n\n- الشروط: يسري هذا العرض لمدة 30 يوماً من تاريخ إصداره، ويمكن تقسيط المبلغ على دفعات متوافقة مع مراحل العلاج.`,
    issued_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    issued_by: seedUsers[0]?.id || 'u-001',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    deleted_at: null,
  },
];

let labsState: Lab[] = (() => {
  const loaded = loadStorage<Lab[]>('labs', []);
  return loaded.length > 0 ? loaded : defaultSeedLabs;
})();

let labOrdersState: LabOrder[] = (() => {
  const loaded = loadStorage<LabOrder[]>('labOrders', []);
  return loaded.length > 0 ? loaded : defaultSeedLabOrders;
})();

let prescriptionsState: Prescription[] = (() => {
  const loaded = loadStorage<Prescription[]>('prescriptions', []);
  return loaded.length > 0 ? loaded : defaultSeedPrescriptions;
})();

let prescriptionItemsState: PrescriptionItem[] = (() => {
  const loaded = loadStorage<PrescriptionItem[]>('prescriptionItems', []);
  return loaded.length > 0 ? loaded : defaultSeedPrescriptionItems;
})();

let medicalReportsState: MedicalReport[] = (() => {
  const loaded = loadStorage<MedicalReport[]>('medicalReports', []);
  return loaded.length > 0 ? loaded : defaultSeedMedicalReports;
})();
let settingsState: Record<string, unknown> = loadStorage('settings', {
  calendar_start_hour: 8,
  calendar_end_hour: 22,
  theme: 'light',
  print_header: true,
});

export const mockApi: EyadatiApi = {
  patients: {
    async list(filters: PatientFilters): Promise<ApiResult<Paginated<Patient>>> {
      let filtered = patientsState.filter((p) => !p.deleted_at);

      if (filters.search?.trim()) {
        const q = filters.search.trim().toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.first_name.toLowerCase().includes(q) ||
            p.family_name.toLowerCase().includes(q) ||
            p.phone.includes(q) ||
            p.code.toLowerCase().includes(q) ||
            (p.national_id && p.national_id.includes(q))
        );
      }

      if (filters.gender) {
        filtered = filtered.filter((p) => p.gender === filters.gender);
      }

      if (filters.primary_dentist_id) {
        filtered = filtered.filter((p) => p.primary_dentist_id === filters.primary_dentist_id);
      }

      // Strict Rule: الطبيب يرى مرضاه فقط إن فُعّل الخيار
      if (securityPoliciesState.dentist_only_own_patients && currentSessionUser?.role === 'dentist' && currentSessionUser.id) {
        const docId = currentSessionUser.id;
        filtered = filtered.filter((p) => p.primary_dentist_id === docId);
      }

      if (filters.has_insurance !== undefined) {
        filtered = filtered.filter((p) => (filters.has_insurance ? !!p.insurance_company_id : !p.insurance_company_id));
      }

      const total = filtered.length;
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return ok({
        items: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      });
    },

    async getById(id: string): Promise<ApiResult<Patient>> {
      const p = patientsState.find((x) => x.id === id && !x.deleted_at);
      if (!p) return err(`المريض غير موجود (المعرف: ${id})`);
      return ok(p);
    },

    async create(data: CreatePatient): Promise<ApiResult<Patient>> {
      const now = new Date().toISOString();
      const nextNum = patientsState.length + 1001;
      const code = data.code || `P-${nextNum}`;

      const newPatient: Patient = {
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        code,
        first_name: data.first_name,
        father_name: data.father_name || null,
        family_name: data.family_name,
        gender: data.gender,
        birth_date: data.birth_date || null,
        national_id: data.national_id || null,
        phone: data.phone,
        phone_alt: data.phone_alt || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || 'الرياض',
        blood_type: data.blood_type || 'unknown',
        marital_status: data.marital_status || 'single',
        occupation: data.occupation || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        referral_source: data.referral_source || null,
        primary_dentist_id: data.primary_dentist_id || null,
        insurance_company_id: data.insurance_company_id || null,
        insurance_policy_no: data.insurance_policy_no || null,
        insurance_expiry: data.insurance_expiry || null,
        notes: data.notes || null,
        photo_path: data.photo_path || null,
        is_active: data.is_active ?? true,
      };

      patientsState = [newPatient, ...patientsState];
      saveStorage('patients', patientsState);
      return ok(newPatient);
    },

    async update(id: string, data: UpdatePatient): Promise<ApiResult<Patient>> {
      const index = patientsState.findIndex((x) => x.id === id && !x.deleted_at);
      if (index === -1) return err(`المريض غير موجود (المعرف: ${id})`);

      const updated: Patient = {
        ...patientsState[index],
        ...data,
        updated_at: new Date().toISOString(),
      };

      patientsState[index] = updated;
      saveStorage('patients', patientsState);
      return ok(updated);
    },

    async delete(id: string): Promise<ApiResult<boolean>> {
      const p = patientsState.find((x) => x.id === id);
      if (p) {
        p.deleted_at = new Date().toISOString();
        saveStorage('patients', patientsState);
      }
      return ok(true);
    },

    async search(query: string, page = 1, limit = 20) {
      return this.list({ search: query, page, limit, sort_order: 'desc' });
    },

    async getMedicalHistory(patientId: string): Promise<ApiResult<MedicalHistory[]>> {
      const history = medicalHistoryState.filter((m) => m.patient_id === patientId && !m.deleted_at);
      return ok(history);
    },

    async saveMedicalHistory(data: CreateMedicalHistory): Promise<ApiResult<MedicalHistory>> {
      const now = new Date().toISOString();
      const newMh: MedicalHistory = {
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        condition_key: data.condition_key,
        has_condition: data.has_condition,
        details: data.details || null,
      };
      medicalHistoryState.push(newMh);
      saveStorage('medicalHistory', medicalHistoryState);
      return ok(newMh);
    },

    async getAllergies(patientId: string): Promise<ApiResult<Allergy[]>> {
      const allergies = allergiesState.filter((a) => a.patient_id === patientId && !a.deleted_at);
      return ok(allergies);
    },

    async saveAllergy(data: CreateAllergy): Promise<ApiResult<Allergy>> {
      const now = new Date().toISOString();
      const newAllergy: Allergy = {
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        allergen: data.allergen,
        severity: data.severity || 'moderate',
        notes: data.notes || null,
      };
      allergiesState.push(newAllergy);
      saveStorage('allergies', allergiesState);
      return ok(newAllergy);
    },

    async deleteAllergy(id: string): Promise<ApiResult<boolean>> {
      allergiesState = allergiesState.filter((a) => a.id !== id);
      saveStorage('allergies', allergiesState);
      return ok(true);
    },
  },

  toothRecords: {
    async getByPatient(patientId: string): Promise<ApiResult<ToothRecord[]>> {
      const records = toothRecordsState.filter((t) => t.patient_id === patientId && !t.deleted_at);
      return ok(records);
    },

    async saveRecord(data: CreateToothRecord): Promise<ApiResult<ToothRecord>> {
      const now = new Date().toISOString();
      const record: ToothRecord = {
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        tooth_number: data.tooth_number,
        surface: data.surface || 'whole',
        condition: data.condition,
        status: data.status || 'existing',
        treatment_id: data.treatment_id || null,
        note: data.note || null,
        recorded_at: data.recorded_at || now,
        recorded_by: data.recorded_by,
      };
      toothRecordsState.push(record);
      saveStorage('toothRecords', toothRecordsState);
      return ok(record);
    },

    async deleteRecord(id: string): Promise<ApiResult<boolean>> {
      toothRecordsState = toothRecordsState.filter((t) => t.id !== id);
      saveStorage('toothRecords', toothRecordsState);
      return ok(true);
    },
  },

  appointments: {
    async list(filters: AppointmentFilters): Promise<ApiResult<Paginated<Appointment>>> {
      let items = appointmentsState.filter((a) => !a.deleted_at);

      if (filters.dentist_id) items = items.filter((a) => a.dentist_id === filters.dentist_id);
      if (filters.patient_id) items = items.filter((a) => a.patient_id === filters.patient_id);
      if (filters.status) items = items.filter((a) => a.status === filters.status);
      if (filters.date_from) items = items.filter((a) => a.start_at >= filters.date_from!);
      if (filters.date_to) items = items.filter((a) => a.start_at <= filters.date_to!);

      items.sort((a, b) => b.start_at.localeCompare(a.start_at));

      const total = items.length;
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const paginated = items.slice((page - 1) * limit, page * limit);

      return ok({
        items: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      });
    },

    async getById(id: string): Promise<ApiResult<Appointment>> {
      const appt = appointmentsState.find((a) => a.id === id && !a.deleted_at);
      if (!appt) return err(`الموعد غير موجود (المعرف: ${id})`);
      return ok(appt);
    },

    async create(data: CreateAppointment): Promise<ApiResult<Appointment>> {
      const now = new Date().toISOString();
      const newAppt: Appointment = {
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        dentist_id: data.dentist_id,
        branch_id: data.branch_id,
        room_id: data.room_id || null,
        start_at: data.start_at,
        end_at: data.end_at,
        procedure_ids: data.procedure_ids,
        status: data.status || 'scheduled',
        source: data.source || 'phone',
        color_override: data.color_override || null,
        notes: data.notes || null,
        reminder_sent_at: data.reminder_sent_at || null,
        created_by: data.created_by,
      };
      appointmentsState = [newAppt, ...appointmentsState];
      saveStorage('appointments', appointmentsState);
      return ok(newAppt);
    },

    async update(id: string, data: UpdateAppointment): Promise<ApiResult<Appointment>> {
      const index = appointmentsState.findIndex((a) => a.id === id && !a.deleted_at);
      if (index === -1) return err(`الموعد غير موجود (المعرف: ${id})`);

      const updated = {
        ...appointmentsState[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      appointmentsState[index] = updated;
      saveStorage('appointments', appointmentsState);
      return ok(updated);
    },

    async delete(id: string): Promise<ApiResult<boolean>> {
      appointmentsState = appointmentsState.filter((a) => a.id !== id);
      saveStorage('appointments', appointmentsState);
      return ok(true);
    },

    async updateStatus(id: string, status: AppointmentStatus): Promise<ApiResult<Appointment>> {
      return this.update(id, { status });
    },

    async getWeek(from: string, to: string, dentistId?: string): Promise<ApiResult<Appointment[]>> {
      let filtered = appointmentsState.filter(
        (a) => !a.deleted_at && a.start_at >= from && a.start_at <= to
      );
      if (dentistId) {
        filtered = filtered.filter((a) => a.dentist_id === dentistId);
      }
      filtered.sort((a, b) => a.start_at.localeCompare(b.start_at));
      return ok(filtered);
    },

    async getToday(dentistId?: string): Promise<ApiResult<Appointment[]>> {
      const todayStr = new Date().toISOString().split('T')[0];
      const from = `${todayStr}T00:00:00.000Z`;
      const to = `${todayStr}T23:59:59.999Z`;
      return this.getWeek(from, to, dentistId);
    },
  },

  rooms: {
    async list(): Promise<ApiResult<Room[]>> {
      return ok(roomsState.filter((r) => !r.deleted_at));
    },

    async getById(id: string): Promise<ApiResult<Room>> {
      const room = roomsState.find((r) => r.id === id && !r.deleted_at);
      if (!room) return err(`الغرفة غير موجودة (المعرف: ${id})`);
      return ok(room);
    },

    async updateStatus(id: string, status: RoomStatus): Promise<ApiResult<Room>> {
      const index = roomsState.findIndex((r) => r.id === id && !r.deleted_at);
      if (index === -1) return err(`الغرفة غير موجودة (المعرف: ${id})`);
      roomsState[index] = {
        ...roomsState[index],
        status,
        updated_at: new Date().toISOString(),
      };
      saveStorage('rooms', roomsState);
      return ok(roomsState[index]);
    },

    async create(data: CreateRoom): Promise<ApiResult<Room>> {
      const newRoom: Room = {
        id: crypto.randomUUID(),
        clinic_id: CLINIC_ID,
        branch_id: data.branch_id || 'branch-1',
        name: data.name,
        number: data.number || String(roomsState.length + 1),
        status: data.status || 'free',
        equipment: data.equipment || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };
      roomsState.push(newRoom);
      saveStorage('rooms', roomsState);
      return ok(newRoom);
    },

    async update(id: string, data: Partial<Room>): Promise<ApiResult<Room>> {
      const index = roomsState.findIndex((r) => r.id === id && !r.deleted_at);
      if (index === -1) return err(`الغرفة غير موجودة (المعرف: ${id})`);
      roomsState[index] = {
        ...roomsState[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      saveStorage('rooms', roomsState);
      return ok(roomsState[index]);
    },

    async delete(id: string): Promise<ApiResult<boolean>> {
      const index = roomsState.findIndex((r) => r.id === id && !r.deleted_at);
      if (index === -1) return err(`الغرفة غير موجودة (المعرف: ${id})`);
      roomsState[index] = {
        ...roomsState[index],
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveStorage('rooms', roomsState);
      return ok(true);
    },
  },

  treatments: {
    async list(filters: TreatmentFilters): Promise<ApiResult<Paginated<Treatment>>> {
      let items = treatmentsState.filter((t) => !t.deleted_at);
      if (filters.patient_id) items = items.filter((t) => t.patient_id === filters.patient_id);
      if (filters.dentist_id) items = items.filter((t) => t.dentist_id === filters.dentist_id);
      if (filters.status) items = items.filter((t) => t.status === filters.status);

      // Strict Rule: الطبيب يرى مرضاه فقط إن فُعّل الخيار
      if (securityPoliciesState.dentist_only_own_patients && currentSessionUser?.role === 'dentist' && currentSessionUser.id) {
        const docId = currentSessionUser.id;
        items = items.filter((t) => t.dentist_id === docId);
      }

      // Strict Rule: المحاسب لا يرى الملاحظات السريرية
      if (securityPoliciesState.accountant_hide_clinical_notes && currentSessionUser?.role === 'accountant') {
        items = items.map((t) => ({
          ...t,
          clinical_notes: '***** محجوبة عن المحاسبين لحماية الخصوصية الطبية *****',
        }));
      }

      const total = items.length;
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const paginated = items.slice((page - 1) * limit, page * limit);

      return ok({
        items: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      });
    },

    async getById(id: string): Promise<ApiResult<Treatment>> {
      let t = treatmentsState.find((x) => x.id === id && !x.deleted_at);
      if (!t) return err(`العلاج غير موجود (المعرف: ${id})`);
      if (securityPoliciesState.accountant_hide_clinical_notes && currentSessionUser?.role === 'accountant') {
        t = {
          ...t,
          clinical_notes: '***** محجوبة عن المحاسبين لحماية الخصوصية الطبية *****',
        };
      }
      return ok(t);
    },

    async create(data: CreateTreatment): Promise<ApiResult<Treatment>> {
      const now = new Date().toISOString();
      const newTreat: Treatment = {
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        appointment_id: data.appointment_id || null,
        plan_item_id: data.plan_item_id || null,
        procedure_id: data.procedure_id,
        dentist_id: data.dentist_id,
        tooth_number: data.tooth_number || null,
        surface: data.surface || null,
        performed_at: data.performed_at || now,
        status: data.status || 'completed',
        anesthesia_type: data.anesthesia_type || null,
        materials_used: data.materials_used || [],
        clinical_notes: data.clinical_notes || null,
        price_halalas: data.price_halalas,
      };
      treatmentsState = [newTreat, ...treatmentsState];
      saveStorage('treatments', treatmentsState);
      return ok(newTreat);
    },

    async update(id: string, data: UpdateTreatment): Promise<ApiResult<Treatment>> {
      const index = treatmentsState.findIndex((t) => t.id === id && !t.deleted_at);
      if (index === -1) return err(`العلاج غير موجود (المعرف: ${id})`);

      const updated = {
        ...treatmentsState[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      treatmentsState[index] = updated;
      saveStorage('treatments', treatmentsState);
      return ok(updated);
    },

    async delete(id: string): Promise<ApiResult<boolean>> {
      treatmentsState = treatmentsState.filter((t) => t.id !== id);
      saveStorage('treatments', treatmentsState);
      return ok(true);
    },

    async getPlansByPatient(patientId: string): Promise<ApiResult<TreatmentPlan[]>> {
      const plans = treatmentPlansState.filter((p) => p.patient_id === patientId && !p.deleted_at);
      return ok(plans);
    },

    async getPlanById(id: string): Promise<ApiResult<TreatmentPlan & { items: TreatmentPlanItem[] }>> {
      const plan = treatmentPlansState.find((p) => p.id === id && !p.deleted_at);
      if (!plan) return err('خطة العلاج غير موجودة');
      const items = treatmentPlanItemsState.filter((i) => i.plan_id === id && !i.deleted_at);
      return ok({ ...plan, items });
    },

    async createPlan(data: CreateTreatmentPlan): Promise<ApiResult<TreatmentPlan>> {
      const now = new Date().toISOString();
      const planId = crypto.randomUUID();
      const newPlan: TreatmentPlan = {
        id: planId,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        dentist_id: data.dentist_id,
        title: data.title,
        status: data.status || 'draft',
        total_halalas: data.total_halalas || 0,
        discount_halalas: data.discount_halalas || 0,
        patient_consent_at: data.patient_consent_at || null,
        notes: data.notes || null,
      };
      treatmentPlansState = [newPlan, ...treatmentPlansState];
      saveStorage('treatmentPlans', treatmentPlansState);

      if (data.items && data.items.length > 0) {
        const newItems: TreatmentPlanItem[] = data.items.map((item) => ({
          id: crypto.randomUUID(),
          clinic_id: data.clinic_id,
          created_at: now,
          updated_at: now,
          deleted_at: null,
          plan_id: planId,
          procedure_id: item.procedure_id,
          tooth_number: item.tooth_number ?? null,
          surface: item.surface ?? null,
          quantity: item.quantity ?? 1,
          unit_price_halalas: item.unit_price_halalas,
          discount_halalas: item.discount_halalas ?? 0,
          priority: item.priority ?? 1,
          phase: item.phase ?? 1,
          status: item.status ?? 'planned',
          scheduled_date: item.scheduled_date ?? null,
        }));
        treatmentPlanItemsState = [...newItems, ...treatmentPlanItemsState];
        saveStorage('treatmentPlanItems', treatmentPlanItemsState);
      }

      return ok(newPlan);
    },

    async updatePlan(id: string, data: UpdateTreatmentPlan): Promise<ApiResult<TreatmentPlan>> {
      const idx = treatmentPlansState.findIndex((p) => p.id === id);
      if (idx === -1) return err('خطة العلاج غير موجودة');
      const now = new Date().toISOString();
      treatmentPlansState[idx] = { ...treatmentPlansState[idx], ...data, updated_at: now };
      saveStorage('treatmentPlans', treatmentPlansState);

      if (data.items) {
        treatmentPlanItemsState = treatmentPlanItemsState.filter((i) => i.plan_id !== id);
        const newItems: TreatmentPlanItem[] = data.items.map((item) => ({
          id: crypto.randomUUID(),
          clinic_id: treatmentPlansState[idx].clinic_id,
          created_at: now,
          updated_at: now,
          deleted_at: null,
          plan_id: id,
          procedure_id: item.procedure_id,
          tooth_number: item.tooth_number ?? null,
          surface: item.surface ?? null,
          quantity: item.quantity ?? 1,
          unit_price_halalas: item.unit_price_halalas,
          discount_halalas: item.discount_halalas ?? 0,
          priority: item.priority ?? 1,
          phase: item.phase ?? 1,
          status: item.status ?? 'planned',
          scheduled_date: item.scheduled_date ?? null,
        }));
        treatmentPlanItemsState = [...newItems, ...treatmentPlanItemsState];
        saveStorage('treatmentPlanItems', treatmentPlanItemsState);
      }

      return ok(treatmentPlansState[idx]);
    },

    async deletePlan(id: string): Promise<ApiResult<boolean>> {
      treatmentPlansState = treatmentPlansState.filter((p) => p.id !== id);
      treatmentPlanItemsState = treatmentPlanItemsState.filter((i) => i.plan_id !== id);
      saveStorage('treatmentPlans', treatmentPlansState);
      saveStorage('treatmentPlanItems', treatmentPlanItemsState);
      return ok(true);
    },

    async getProcedures(filters?: ProcedureFilters): Promise<ApiResult<Paginated<Procedure>>> {
      let items = proceduresState.filter((p) => !p.deleted_at);
      if (filters?.category) items = items.filter((p) => p.category === filters.category);
      if (filters?.is_active !== undefined) items = items.filter((p) => p.is_active === filters.is_active);
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        items = items.filter(
          (p) =>
            p.name_ar.toLowerCase().includes(q) ||
            p.name_en?.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q)
        );
      }

      const total = items.length;
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const paginated = items.slice((page - 1) * limit, page * limit);

      return ok({
        items: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      });
    },

    async createProcedure(data: CreateProcedure): Promise<ApiResult<Procedure>> {
      const now = new Date().toISOString();
      const newProc: Procedure = {
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        category: data.category,
        code: data.code,
        name_ar: data.name_ar,
        name_en: data.name_en,
        default_price_halalas: data.default_price_halalas,
        default_duration_min: data.default_duration_min,
        requires_tooth: data.requires_tooth ?? false,
        requires_surface: data.requires_surface ?? false,
        color: data.color ?? '#1E4E9C',
        is_active: data.is_active ?? true,
      };
      proceduresState = [newProc, ...proceduresState];
      saveStorage('procedures', proceduresState);
      return ok(newProc);
    },

    async updateProcedure(id: string, data: UpdateProcedure): Promise<ApiResult<Procedure>> {
      const idx = proceduresState.findIndex((p) => p.id === id);
      if (idx === -1) return err('الإجراء غير موجود');
      proceduresState[idx] = {
        ...proceduresState[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      saveStorage('procedures', proceduresState);
      return ok(proceduresState[idx]);
    },

    async deleteProcedure(id: string): Promise<ApiResult<boolean>> {
      const idx = proceduresState.findIndex((p) => p.id === id);
      if (idx === -1) return err('الإجراء غير موجود');
      proceduresState[idx] = { ...proceduresState[idx], deleted_at: new Date().toISOString() };
      saveStorage('procedures', proceduresState);
      return ok(true);
    },

    async bulkUpsertProcedures(procs: CreateProcedure[]): Promise<ApiResult<number>> {
      const now = new Date().toISOString();
      let added = 0;
      for (const item of procs) {
        const existingIdx = proceduresState.findIndex((p) => p.code === item.code);
        if (existingIdx !== -1) {
          proceduresState[existingIdx] = {
            ...proceduresState[existingIdx],
            ...item,
            updated_at: now,
            deleted_at: null,
          };
        } else {
          proceduresState.push({
            id: crypto.randomUUID(),
            clinic_id: item.clinic_id,
            created_at: now,
            updated_at: now,
            deleted_at: null,
            category: item.category,
            code: item.code,
            name_ar: item.name_ar,
            name_en: item.name_en,
            default_price_halalas: item.default_price_halalas,
            default_duration_min: item.default_duration_min,
            requires_tooth: item.requires_tooth ?? false,
            requires_surface: item.requires_surface ?? false,
            color: item.color ?? '#1E4E9C',
            is_active: item.is_active ?? true,
          });
        }
        added++;
      }
      saveStorage('procedures', proceduresState);
      return ok(added);
    },

    async acceptPlanTransaction(payload: AcceptPlanPayload): Promise<ApiResult<{ invoiceId: string; invoiceNumber: string; treatmentsCount: number }>> {
      const snapTreatments = [...treatmentsState];
      const snapInvoices = [...invoicesState];
      const snapInvoiceItems = [...invoiceItemsState];
      const snapToothRecords = [...toothRecordsState];
      const snapPlans = [...treatmentPlansState];
      const snapPlanItems = [...treatmentPlanItemsState];

      try {
        const now = new Date().toISOString();
        const planIdx = treatmentPlansState.findIndex((p) => p.id === payload.planId);
        if (planIdx === -1) throw new Error('خطة العلاج غير موجودة');

        const plan = treatmentPlansState[planIdx];
        const clinicId = plan.clinic_id;

        // 1. Mark Plan as accepted
        treatmentPlansState[planIdx] = {
          ...plan,
          status: 'accepted',
          patient_consent_at: now,
          updated_at: now,
        };

        // 2. Create Treatments for each item
        const newTreatments: Treatment[] = [];
        let runningSubtotalHalalas = 0;
        let runningDiscountHalalas = 0;
        const invoiceItemDrafts: InvoiceItem[] = [];
        const invoiceId = crypto.randomUUID();
        const invoiceNumber = `INV-2026-${String(invoicesState.length + 1).padStart(4, '0')}`;

        for (const item of payload.items) {
          const proc = proceduresState.find((p) => p.id === item.procedureId);
          const procName = proc ? proc.name_ar : 'إجراء علاجي';
          const lineQty = Math.max(1, item.quantity || 1);
          const lineGross = item.unitPriceHalalas * lineQty;
          const lineDiscount = item.discountHalalas || 0;
          const lineNet = Math.max(0, lineGross - lineDiscount);

          runningSubtotalHalalas += lineGross;
          runningDiscountHalalas += lineDiscount;

          const treatmentId = crypto.randomUUID();
          const tr: Treatment = {
            id: treatmentId,
            clinic_id: clinicId,
            created_at: now,
            updated_at: now,
            deleted_at: null,
            patient_id: payload.patientId,
            appointment_id: null,
            plan_item_id: payload.planId,
            procedure_id: item.procedureId,
            dentist_id: payload.dentistId,
            tooth_number: item.toothNumber,
            surface: item.surface,
            performed_at: now,
            status: 'scheduled',
            anesthesia_type: null,
            materials_used: [],
            clinical_notes: `تم جدولة الإجراء بموجب الخطة العلاجية (${plan.title})`,
            price_halalas: lineNet,
          };
          newTreatments.push(tr);

          // 3. Update tooth_records if tooth is present
          if (item.toothNumber) {
            const existingRecordIdx = toothRecordsState.findIndex(
              (r) => r.patient_id === payload.patientId && r.tooth_number === item.toothNumber && !r.deleted_at
            );
            if (existingRecordIdx !== -1) {
              toothRecordsState[existingRecordIdx] = {
                ...toothRecordsState[existingRecordIdx],
                status: 'planned',
                treatment_id: treatmentId,
                updated_at: now,
              };
            } else {
              toothRecordsState.push({
                id: crypto.randomUUID(),
                clinic_id: clinicId,
                created_at: now,
                updated_at: now,
                deleted_at: null,
                patient_id: payload.patientId,
                tooth_number: item.toothNumber,
                condition: 'caries',
                surface: item.surface || 'whole',
                status: 'planned',
                treatment_id: treatmentId,
                note: `مخطط للعلاج: ${procName}`,
                recorded_at: now,
                recorded_by: payload.dentistId,
              });
            }
          }

          // 4. Create line item for Invoice
          invoiceItemDrafts.push({
            id: crypto.randomUUID(),
            clinic_id: clinicId,
            created_at: now,
            updated_at: now,
            deleted_at: null,
            invoice_id: invoiceId,
            treatment_id: treatmentId,
            description: `${procName}${item.toothNumber ? ` - سن #${item.toothNumber}` : ''}${item.surface ? ` (${item.surface})` : ''}`,
            tooth_number: item.toothNumber,
            quantity: lineQty,
            unit_price_halalas: item.unitPriceHalalas,
            discount_halalas: lineDiscount,
            total_halalas: lineNet,
          });
        }

        // 5. Create Estimated Invoice matching exactly to the halala
        const finalNetHalalas = Math.max(0, runningSubtotalHalalas - runningDiscountHalalas);
        const newInvoice: Invoice = {
          id: invoiceId,
          clinic_id: clinicId,
          branch_id: clinicId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
          patient_id: payload.patientId,
          number: invoiceNumber,
          issue_date: now,
          due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
          subtotal_halalas: runningSubtotalHalalas,
          discount_halalas: runningDiscountHalalas,
          vat_percent: 0,
          vat_halalas: 0,
          total_halalas: finalNetHalalas,
          paid_halalas: 0,
          balance_halalas: finalNetHalalas,
          status: 'draft',
          insurance_claim_id: null,
          zatca_qr: null,
          notes: `فاتورة تقديرية صادرة عن اعتماد الخطة العلاجية: ${plan.title}`,
        };

        treatmentsState = [...newTreatments, ...treatmentsState];
        invoicesState = [newInvoice, ...invoicesState];
        invoiceItemsState = [...invoiceItemDrafts, ...invoiceItemsState];

        saveStorage('treatments', treatmentsState);
        saveStorage('treatmentPlans', treatmentPlansState);
        saveStorage('toothRecords', toothRecordsState);
        saveStorage('invoices', invoicesState);
        saveStorage('invoiceItems', invoiceItemsState);

        return ok({
          invoiceId,
          invoiceNumber,
          treatmentsCount: newTreatments.length,
        });
      } catch (e) {
        treatmentsState = snapTreatments;
        invoicesState = snapInvoices;
        invoiceItemsState = snapInvoiceItems;
        toothRecordsState = snapToothRecords;
        treatmentPlansState = snapPlans;
        treatmentPlanItemsState = snapPlanItems;
        return err(e instanceof Error ? e.message : 'فشل تنفيذ معاملة قبول الخطة');
      }
    },

    async executeTreatmentTransaction(payload: ExecuteTreatmentPayload): Promise<ApiResult<Treatment>> {
      const snapTreatments = [...treatmentsState];
      const snapInventory = [...inventoryItemsState];
      const snapTransactions = [...inventoryTransactionsState];
      const snapToothRecords = [...toothRecordsState];
      const snapPlanItems = [...treatmentPlanItemsState];
      const snapImages = [...imagesState];

      try {
        const now = new Date().toISOString();
        const clinicId = 'c1000000-0000-0000-0000-000000000001';
        const treatmentId = crypto.randomUUID();

        // 1. Create completed Treatment record
        const newTreatment: Treatment = {
          id: treatmentId,
          clinic_id: clinicId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
          patient_id: payload.patientId,
          appointment_id: null,
          plan_item_id: payload.planItemId ?? null,
          procedure_id: payload.procedureId,
          dentist_id: payload.dentistId,
          tooth_number: payload.toothNumber ?? null,
          surface: payload.surface ?? null,
          performed_at: now,
          status: 'completed',
          anesthesia_type: payload.anesthesiaType ?? null,
          materials_used: payload.materialsUsed ?? [],
          clinical_notes: payload.clinicalNotes ?? null,
          price_halalas: payload.priceHalalas,
        };
        treatmentsState = [newTreatment, ...treatmentsState];

        // 2. Deduct inventory materials if provided
        if (payload.materialsUsed && payload.materialsUsed.length > 0) {
          for (const mat of payload.materialsUsed) {
            const itemIdx = inventoryItemsState.findIndex(
              (i) => i.id === mat.item_id || i.name === mat.name
            );
            if (itemIdx !== -1) {
              const currentQty = inventoryItemsState[itemIdx].quantity;
              const deductQty = Math.max(1, mat.quantity_used || 1);
              inventoryItemsState[itemIdx] = {
                ...inventoryItemsState[itemIdx],
                quantity: Math.max(0, currentQty - deductQty),
                updated_at: now,
              };

              inventoryTransactionsState.push({
                id: crypto.randomUUID(),
                clinic_id: clinicId,
                created_at: now,
                updated_at: now,
                deleted_at: null,
                item_id: inventoryItemsState[itemIdx].id,
                type: 'out',
                quantity: deductQty,
                reason: `صرف سريري للعلاج: ${mat.name}`,
                treatment_id: treatmentId,
                created_by: payload.dentistId,
              });
            }
          }
        }

        // 3. Update tooth record in odontogram
        if (payload.toothNumber && payload.newToothCondition) {
          const recIdx = toothRecordsState.findIndex(
            (r) => r.patient_id === payload.patientId && r.tooth_number === payload.toothNumber && !r.deleted_at
          );
          if (recIdx !== -1) {
            toothRecordsState[recIdx] = {
              ...toothRecordsState[recIdx],
              condition: payload.newToothCondition,
              surface: payload.surface ?? toothRecordsState[recIdx].surface,
              status: 'completed',
              treatment_id: treatmentId,
              recorded_by: payload.dentistId,
              updated_at: now,
              note: payload.clinicalNotes ?? toothRecordsState[recIdx].note,
            };
          } else {
            toothRecordsState.push({
              id: crypto.randomUUID(),
              clinic_id: clinicId,
              created_at: now,
              updated_at: now,
              deleted_at: null,
              patient_id: payload.patientId,
              tooth_number: payload.toothNumber,
              condition: payload.newToothCondition,
              surface: payload.surface || 'whole',
              status: 'completed',
              recorded_by: payload.dentistId,
              recorded_at: now,
              treatment_id: treatmentId,
              note: payload.clinicalNotes ?? 'تم تنفيذ الإجراء السريري',
            });
          }
        }

        // 4. Update plan item status if linked
        if (payload.planItemId) {
          const planItemIdx = treatmentPlanItemsState.findIndex((pi) => pi.id === payload.planItemId);
          if (planItemIdx !== -1) {
            treatmentPlanItemsState[planItemIdx] = {
              ...treatmentPlanItemsState[planItemIdx],
              status: 'completed',
              updated_at: now,
            };
          }
        }

        // 5. Upload/attach image if provided
        if (payload.image) {
          imagesState.push({
            id: crypto.randomUUID(),
            clinic_id: clinicId,
            created_at: now,
            updated_at: now,
            deleted_at: null,
            patient_id: payload.patientId,
            tooth_number: payload.toothNumber ?? null,
            type: payload.image.image_type,
            file_path: payload.image.file_path,
            thumbnail_path: null,
            captured_by: payload.dentistId,
            notes: `صورة سريرية مرتبطة بتنفيذ العلاج: ${payload.image.title}`,
            tags: ['treatment'],
            taken_at: now,
          });
        }

        saveStorage('treatments', treatmentsState);
        saveStorage('inventoryItems', inventoryItemsState);
        saveStorage('inventoryTransactions', inventoryTransactionsState);
        saveStorage('toothRecords', toothRecordsState);
        saveStorage('treatmentPlanItems', treatmentPlanItemsState);
        saveStorage('images', imagesState);

        return ok(newTreatment);
      } catch (e) {
        treatmentsState = snapTreatments;
        inventoryItemsState = snapInventory;
        inventoryTransactionsState = snapTransactions;
        toothRecordsState = snapToothRecords;
        treatmentPlanItemsState = snapPlanItems;
        imagesState = snapImages;
        return err(e instanceof Error ? e.message : 'فشل تنفيذ الإجراء السريري');
      }
    },
  },

  invoices: {
    async list(filters: InvoiceFilters): Promise<ApiResult<Paginated<Invoice>>> {
      let items = invoicesState.filter((i) => !i.deleted_at);
      if (filters.patient_id) items = items.filter((i) => i.patient_id === filters.patient_id);
      if (filters.status) items = items.filter((i) => i.status === filters.status);
      if (filters.date_from) items = items.filter((i) => i.issue_date >= filters.date_from!);
      if (filters.date_to) items = items.filter((i) => i.issue_date <= filters.date_to!);

      // Strict Rule: الاستقبال لا يرى الأسعار إن أُغلقت الصلاحية
      const hidePrices =
        securityPoliciesState.receptionist_hide_prices &&
        currentSessionUser?.role === 'receptionist';

      if (hidePrices) {
        items = items.map((inv) => ({
          ...inv,
          subtotal_halalas: 0,
          discount_halalas: 0,
          vat_halalas: 0,
          total_halalas: 0,
          paid_halalas: 0,
          balance_halalas: 0,
        }));
      }

      items.sort((a, b) => b.created_at.localeCompare(a.created_at));

      const total = items.length;
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const paginated = items.slice((page - 1) * limit, page * limit);

      return ok({
        items: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      });
    },

    async getById(id: string): Promise<ApiResult<Invoice & { items: InvoiceItem[]; payments: Payment[] }>> {
      const inv = invoicesState.find((i) => i.id === id && !i.deleted_at);
      if (!inv) return err(`الفاتورة غير موجودة (المعرف: ${id})`);

      const items = invoiceItemsState.filter((it) => it.invoice_id === id);
      const pmts = paymentsState.filter((p) => p.invoice_id === id);

      return ok({
        ...inv,
        items,
        payments: pmts,
      });
    },

    async create(data: CreateInvoice): Promise<ApiResult<Invoice>> {
      const now = new Date().toISOString();
      const invoiceId = crypto.randomUUID();
      const num = invoicesState.length + 1001;
      const number = data.number || `INV-2026-${String(num).padStart(5, '0')}`;

      if (!data.items || data.items.length === 0) {
        return err('لا يمكن إنشاء فاتورة بدون إضافة بنود علاجية.');
      }

      const subtotal = data.items.reduce((acc, it) => acc + (it.total_halalas || 0), 0);
      const discount = Math.min(subtotal, Math.max(0, data.discount_halalas || 0));
      const vatPercent = data.vat_percent || 15;
      const taxable = Math.max(0, subtotal - discount);
      const vatHalalas = data.vat_halalas || Math.round((taxable * vatPercent) / 100);
      const totalHalalas = data.total_halalas || (taxable + vatHalalas);
      const autoStatus = totalHalalas === 0 ? 'paid' : (data.status || 'unpaid');
      const initialBalance = totalHalalas === 0 ? 0 : totalHalalas;

      const newInv: Invoice = {
        id: invoiceId,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        number,
        patient_id: data.patient_id,
        branch_id: data.branch_id,
        issue_date: data.issue_date || now.split('T')[0],
        due_date: data.due_date || null,
        subtotal_halalas: subtotal,
        discount_halalas: discount,
        vat_percent: vatPercent,
        vat_halalas: vatHalalas,
        total_halalas: totalHalalas,
        paid_halalas: 0,
        balance_halalas: initialBalance,
        status: autoStatus,
        insurance_claim_id: data.insurance_claim_id || null,
        zatca_qr: data.zatca_qr || null,
        notes: data.notes || null,
      };

      invoicesState = [newInv, ...invoicesState];
      saveStorage('invoices', invoicesState);

      const items: InvoiceItem[] = data.items.map((it) => ({
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        invoice_id: invoiceId,
        treatment_id: it.treatment_id || null,
        description: it.description,
        tooth_number: it.tooth_number || null,
        quantity: it.quantity || 1,
        unit_price_halalas: it.unit_price_halalas,
        discount_halalas: it.discount_halalas || 0,
        total_halalas: it.total_halalas,
      }));

      invoiceItemsState = [...items, ...invoiceItemsState];
      saveStorage('invoiceItems', invoiceItemsState);

      return ok(newInv);
    },

    async update(id: string, data: UpdateInvoice): Promise<ApiResult<Invoice>> {
      const idx = invoicesState.findIndex((i) => i.id === id);
      if (idx === -1) return err('الفاتورة غير موجودة');
      invoicesState[idx] = { ...invoicesState[idx], ...data, updated_at: new Date().toISOString() };
      saveStorage('invoices', invoicesState);
      return ok(invoicesState[idx]);
    },

    async voidInvoice(id: string, reason: string): Promise<ApiResult<Invoice>> {
      const perm = checkIpcPermission('invoices', 'delete');
      if (!perm.allowed) return err(perm.reason || 'غير مصرح لك بإلغاء الفواتير');

      const idx = invoicesState.findIndex((i) => i.id === id);
      if (idx === -1) return err('الفاتورة غير موجودة');
      if (!reason.trim()) return err('سبب الإلغاء إلزامي ولا يمكن تركه فارغاً');

      const inv = invoicesState[idx];
      const cancellationNote = `[ملغاة: ${reason.trim()}]`;
      const updatedNotes = inv.notes ? `${inv.notes}\n${cancellationNote}` : cancellationNote;

      invoicesState[idx] = {
        ...inv,
        status: 'void',
        balance_halalas: 0,
        notes: updatedNotes,
        updated_at: new Date().toISOString(),
      };
      saveStorage('invoices', invoicesState);
      return ok(invoicesState[idx]);
    },

    async getInstallments(invoiceId: string): Promise<ApiResult<Installment[]>> {
      const items = installmentsState.filter((inst) => inst.invoice_id === invoiceId && !inst.deleted_at);
      return ok(items);
    },

    async createInstallments(invoiceId: string, installments: Array<{ due_date: string; amount_halalas: number }>): Promise<ApiResult<Installment[]>> {
      const now = new Date().toISOString();
      const clinicId = 'c1000000-0000-0000-0000-000000000001';

      // Remove previous installments for this invoice
      installmentsState = installmentsState.filter((inst) => inst.invoice_id !== invoiceId);

      const createdList: Installment[] = installments.map((inst) => ({
        id: crypto.randomUUID(),
        clinic_id: clinicId,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        invoice_id: invoiceId,
        due_date: inst.due_date,
        amount_halalas: inst.amount_halalas,
        paid_at: null,
        status: 'pending',
      }));

      installmentsState = [...createdList, ...installmentsState];
      saveStorage('installments', installmentsState);
      return ok(createdList);
    },

    async getStats(range?: { from?: string; to?: string }): Promise<ApiResult<FinancialStats>> {
      let filtered = invoicesState.filter((i) => !i.deleted_at);
      if (range?.from) filtered = filtered.filter((i) => i.issue_date >= range.from!);
      if (range?.to) filtered = filtered.filter((i) => i.issue_date <= range.to!);

      const totalBilledHalalas = filtered.reduce((acc, i) => acc + i.total_halalas, 0);
      const totalPaidHalalas = filtered.reduce((acc, i) => acc + i.paid_halalas, 0);
      const totalUnpaidHalalas = filtered.reduce((acc, i) => acc + i.balance_halalas, 0);
      const totalVatHalalas = filtered.reduce((acc, i) => acc + i.vat_halalas, 0);

      return ok({
        totalBilledHalalas,
        totalPaidHalalas,
        totalUnpaidHalalas,
        totalVatHalalas,
        invoicesCount: filtered.length,
      });
    },
  },

  payments: {
    async list(params) {
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const total = paymentsState.length;
      return ok({
        items: paymentsState.slice((page - 1) * limit, page * limit),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      });
    },

    async create(data: CreatePayment): Promise<ApiResult<Payment>> {
      if (!data.amount_halalas || data.amount_halalas <= 0) {
        return err('مبلغ الدفعة غير صالح؛ يجب أن يكون أكبر من الصفر.');
      }

      const inv = invoicesState.find((i) => i.id === data.invoice_id);
      if (!inv) {
        return err('الفاتورة غير موجودة.');
      }
      if (inv.status === 'void') {
        return err('لا يمكن تسجيل دفعات على فاتورة ملغاة (Voided Invoice).');
      }
      if (data.amount_halalas > inv.balance_halalas) {
        const balanceSAR = (inv.balance_halalas / 100).toFixed(2);
        const amountSAR = (data.amount_halalas / 100).toFixed(2);
        return err(`مبلغ الدفعة (${amountSAR} ر.س) يتجاوز الرصيد المتبقي على الفاتورة (${balanceSAR} ر.س).`);
      }

      const now = new Date().toISOString();
      const payment: Payment = {
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        invoice_id: data.invoice_id,
        patient_id: data.patient_id,
        amount_halalas: data.amount_halalas,
        method: data.method || 'cash',
        reference: data.reference || null,
        paid_at: data.paid_at || now,
        received_by: data.received_by,
        notes: data.notes || null,
      };

      paymentsState = [payment, ...paymentsState];
      saveStorage('payments', paymentsState);

      // Update invoice
      inv.paid_halalas += data.amount_halalas;
      inv.balance_halalas = Math.max(0, inv.total_halalas - inv.paid_halalas);
      inv.status = inv.balance_halalas === 0 ? 'paid' : 'partial';
      saveStorage('invoices', invoicesState);

      return ok(payment);
    },

    async getByInvoice(invoiceId: string): Promise<ApiResult<Payment[]>> {
      return ok(paymentsState.filter((p) => p.invoice_id === invoiceId));
    },
  },

  insurance: {
    async getCompanies(): Promise<ApiResult<InsuranceCompany[]>> {
      return ok(insuranceCompaniesState.filter((c) => !c.deleted_at));
    },

    async createCompany(data: CreateInsuranceCompany): Promise<ApiResult<InsuranceCompany>> {
      const now = new Date().toISOString();
      const company: InsuranceCompany = {
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id || 'c1000000-0000-0000-0000-000000000001',
        created_at: now,
        updated_at: now,
        deleted_at: null,
        name: data.name,
        contact: data.contact || null,
        phone: data.phone || null,
        email: data.email || null,
        coverage_percent_default: data.coverage_percent_default || 80,
        requires_preapproval: data.requires_preapproval ?? true,
        notes: data.notes || null,
        annual_limit_halalas: data.annual_limit_halalas ?? null,
        excluded_procedures: data.excluded_procedures || [],
      };
      insuranceCompaniesState.push(company);
      saveStorage('insuranceCompanies', insuranceCompaniesState);

      recordAuditLog({
        action: 'INSURANCE_COMPANY_CREATED',
        entityType: 'insurance_company',
        entityId: company.id,
        before: null,
        after: { name: company.name, coverage_percent_default: company.coverage_percent_default },
      });

      return ok(company);
    },

    async updateCompany(id: string, data: UpdateInsuranceCompany): Promise<ApiResult<InsuranceCompany>> {
      const idx = insuranceCompaniesState.findIndex((c) => c.id === id);
      if (idx === -1) return err('شركة التأمين غير موجودة');
      const prev = { ...insuranceCompaniesState[idx] };
      insuranceCompaniesState[idx] = {
        ...insuranceCompaniesState[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      saveStorage('insuranceCompanies', insuranceCompaniesState);

      recordAuditLog({
        action: 'INSURANCE_COMPANY_UPDATED',
        entityType: 'insurance_company',
        entityId: id,
        before: prev as unknown as Record<string, unknown>,
        after: insuranceCompaniesState[idx] as unknown as Record<string, unknown>,
      });

      return ok(insuranceCompaniesState[idx]);
    },

    async deleteCompany(id: string): Promise<ApiResult<boolean>> {
      const idx = insuranceCompaniesState.findIndex((c) => c.id === id);
      if (idx === -1) return err('شركة التأمين غير موجودة');
      const prev = { ...insuranceCompaniesState[idx] };
      insuranceCompaniesState[idx].deleted_at = new Date().toISOString();
      saveStorage('insuranceCompanies', insuranceCompaniesState);

      recordAuditLog({
        action: 'INSURANCE_COMPANY_DELETED',
        entityType: 'insurance_company',
        entityId: id,
        before: prev as unknown as Record<string, unknown>,
        after: { deleted_at: insuranceCompaniesState[idx].deleted_at },
      });

      return ok(true);
    },

    async getClaims(filters?: {
      patientId?: string;
      companyId?: string;
      status?: InsuranceClaimStatus;
      period?: 'all' | 'today' | 'week' | 'month';
      search?: string;
    }): Promise<ApiResult<InsuranceClaim[]>> {
      let filtered = insuranceClaimsState.filter((c) => !c.deleted_at);

      if (filters?.patientId) {
        filtered = filtered.filter((c) => c.patient_id === filters.patientId);
      }
      if (filters?.companyId) {
        filtered = filtered.filter((c) => c.company_id === filters.companyId);
      }
      if (filters?.status) {
        filtered = filtered.filter((c) => c.status === filters.status);
      }
      if (filters?.period && filters.period !== 'all') {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        if (filters.period === 'today') {
          filtered = filtered.filter((c) => c.submitted_at.startsWith(todayStr));
        } else if (filters.period === 'week') {
          const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
          filtered = filtered.filter((c) => c.submitted_at >= sevenDaysAgo);
        } else if (filters.period === 'month') {
          const monthStr = todayStr.substring(0, 7);
          filtered = filtered.filter((c) => c.submitted_at.startsWith(monthStr));
        }
      }
      if (filters?.search?.trim()) {
        const q = filters.search.trim().toLowerCase();
        filtered = filtered.filter((c) => {
          if (c.claim_number.toLowerCase().includes(q)) return true;
          const pt = patientsState.find((p) => p.id === c.patient_id);
          if (pt) {
            const fullName = `${pt.first_name} ${pt.family_name}`.toLowerCase();
            if (fullName.includes(q)) return true;
            if (pt.phone.includes(q)) return true;
          }
          return false;
        });
      }

      return ok(filtered);
    },

    async getClaimById(id: string): Promise<ApiResult<InsuranceClaim>> {
      const claim = insuranceClaimsState.find((c) => c.id === id && !c.deleted_at);
      if (!claim) return err('المطالبة غير موجودة');
      return ok(claim);
    },

    async createClaim(data: CreateInsuranceClaim): Promise<ApiResult<InsuranceClaim>> {
      const now = new Date().toISOString();
      const claimId = crypto.randomUUID();
      const claim: InsuranceClaim = {
        id: claimId,
        clinic_id: data.clinic_id || 'c1000000-0000-0000-0000-000000000001',
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        invoice_id: data.invoice_id,
        company_id: data.company_id,
        claim_number: data.claim_number || `CLM-${now.substring(0, 4)}-${Math.floor(100 + Math.random() * 900)}`,
        submitted_at: data.submitted_at || now,
        claimed_halalas: data.claimed_halalas,
        approved_halalas: data.approved_halalas || 0,
        rejected_halalas: data.rejected_halalas || 0,
        status: data.status || 'submitted',
        response_at: data.response_at || null,
        rejection_reason: data.rejection_reason || null,
        attachments: data.attachments || [],
      };

      insuranceClaimsState = [claim, ...insuranceClaimsState];
      saveStorage('insuranceClaims', insuranceClaimsState);

      // Link claim to invoice
      const inv = invoicesState.find((i) => i.id === data.invoice_id);
      if (inv) {
        inv.insurance_claim_id = claim.id;
        inv.updated_at = now;
        saveStorage('invoices', invoicesState);
      }

      recordAuditLog({
        action: 'INSURANCE_CLAIM_CREATED',
        entityType: 'insurance_claim',
        entityId: claim.id,
        before: null,
        after: {
          claim_number: claim.claim_number,
          claimed_halalas: claim.claimed_halalas,
          status: claim.status,
          invoice_id: claim.invoice_id,
          patient_id: claim.patient_id,
        },
      });

      return ok(claim);
    },

    async updateClaim(id: string, data: UpdateInsuranceClaim): Promise<ApiResult<InsuranceClaim>> {
      const idx = insuranceClaimsState.findIndex((c) => c.id === id);
      if (idx === -1) return err('المطالبة غير موجودة');
      const prev = { ...insuranceClaimsState[idx] };
      insuranceClaimsState[idx] = {
        ...insuranceClaimsState[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      saveStorage('insuranceClaims', insuranceClaimsState);

      recordAuditLog({
        action: 'INSURANCE_CLAIM_UPDATED',
        entityType: 'insurance_claim',
        entityId: id,
        before: prev as unknown as Record<string, unknown>,
        after: insuranceClaimsState[idx] as unknown as Record<string, unknown>,
      });

      return ok(insuranceClaimsState[idx]);
    },

    async transitionClaimStatus(
      id: string,
      newStatus: InsuranceClaimStatus,
      payload?: {
        approved_halalas?: number;
        rejected_halalas?: number;
        rejection_reason?: string;
        userId?: string;
      }
    ): Promise<ApiResult<InsuranceClaim>> {
      const idx = insuranceClaimsState.findIndex((c) => c.id === id);
      if (idx === -1) return err('المطالبة غير موجودة');

      const claim = insuranceClaimsState[idx];
      const prevStatus = claim.status;
      const prevApproved = claim.approved_halalas;
      const now = new Date().toISOString();

      let approvedHalalas = claim.approved_halalas;
      let rejectedHalalas = claim.rejected_halalas;
      let rejectionReason = claim.rejection_reason;

      if (newStatus === 'approved') {
        approvedHalalas = payload?.approved_halalas !== undefined ? payload.approved_halalas : claim.claimed_halalas;
        rejectedHalalas = Math.max(0, claim.claimed_halalas - approvedHalalas);
        rejectionReason = rejectedHalalas > 0 ? (payload?.rejection_reason || 'اعتماد كامل للتغطية المشمولة') : null;
      } else if (newStatus === 'partially_approved') {
        approvedHalalas = payload?.approved_halalas !== undefined ? payload.approved_halalas : Math.round(claim.claimed_halalas * 0.7);
        rejectedHalalas = Math.max(0, claim.claimed_halalas - approvedHalalas);
        rejectionReason = payload?.rejection_reason || 'استقطاع نسبة تحمل وبنود غير مشمولة في وثيقة التأمين';
      } else if (newStatus === 'rejected') {
        approvedHalalas = 0;
        rejectedHalalas = claim.claimed_halalas;
        rejectionReason = payload?.rejection_reason || 'رفضت شركة التأمين التغطية لعدم شمول الإجراء أو استنفاد السقف السنوي';
      } else if (newStatus === 'pre_approved') {
        approvedHalalas = payload?.approved_halalas !== undefined ? payload.approved_halalas : claim.claimed_halalas;
      }

      // Update claim object
      const updatedClaim: InsuranceClaim = {
        ...claim,
        status: newStatus,
        approved_halalas: approvedHalalas,
        rejected_halalas: rejectedHalalas,
        rejection_reason: rejectionReason,
        response_at: ['approved', 'partially_approved', 'rejected', 'pre_approved', 'paid'].includes(newStatus)
          ? (claim.response_at || now)
          : claim.response_at,
        updated_at: now,
      };

      insuranceClaimsState[idx] = updatedClaim;
      saveStorage('insuranceClaims', insuranceClaimsState);

      // FINANCIAL REFLECTION ON INVOICE:
      // When claim is approved, partially_approved, or paid:
      // Record automatic payment of type "insurance" on the invoice for the approved amount,
      // and keep the remainder on patient's liability!
      let paymentCreated: Payment | null = null;
      if (['approved', 'partially_approved', 'paid'].includes(newStatus) && approvedHalalas > 0) {
        // Check if an insurance payment for this claim already exists
        const existingClaimPayment = paymentsState.find(
          (p) => p.invoice_id === claim.invoice_id && p.method === 'insurance' && p.reference?.includes(claim.claim_number)
        );

        if (!existingClaimPayment) {
          const inv = invoicesState.find((i) => i.id === claim.invoice_id);
          const paymentId = crypto.randomUUID();
          paymentCreated = {
            id: paymentId,
            clinic_id: claim.clinic_id,
            created_at: now,
            updated_at: now,
            deleted_at: null,
            invoice_id: claim.invoice_id,
            patient_id: claim.patient_id,
            amount_halalas: approvedHalalas,
            method: 'insurance',
            reference: `مطالبة تأمين #${claim.claim_number}`,
            paid_at: now,
            received_by: payload?.userId || 'u1000000-0000-0000-0000-000000000001',
            notes: `سداد تلقائي بموجب اعتماد مطالبة التأمين رقم ${claim.claim_number} بمبلغ ${approvedHalalas / 100} ريال. المتبقي بذمة المريض: ${
              inv ? Math.max(0, inv.total_halalas - (inv.paid_halalas + approvedHalalas)) / 100 : 0
            } ريال`,
          };

          paymentsState = [paymentCreated, ...paymentsState];
          saveStorage('payments', paymentsState);

          if (inv) {
            const prevInvPaid = inv.paid_halalas;
            const prevInvBalance = inv.balance_halalas;
            inv.paid_halalas += approvedHalalas;
            inv.balance_halalas = Math.max(0, inv.total_halalas - inv.paid_halalas);
            inv.status = inv.balance_halalas === 0 ? 'paid' : 'partial';
            inv.insurance_claim_id = claim.id;
            inv.updated_at = now;
            saveStorage('invoices', invoicesState);

            // Audit log for invoice financial reflection
            recordAuditLog({
              userId: payload?.userId,
              action: 'INSURANCE_CLAIM_APPROVED_PAYMENT',
              entityType: 'invoice',
              entityId: inv.id,
              before: {
                paid_halalas: prevInvPaid,
                balance_halalas: prevInvBalance,
                status: inv.status,
              },
              after: {
                paid_halalas: inv.paid_halalas,
                balance_halalas: inv.balance_halalas,
                status: inv.status,
                insurance_payment_id: paymentId,
                payment_amount_halalas: approvedHalalas,
                patient_remaining_liability_halalas: inv.balance_halalas,
              },
            });
          }

          // Update patient balance
          const pt = patientsState.find((p) => p.id === claim.patient_id) as any;
          if (pt && pt.balance_halalas !== undefined) {
            pt.balance_halalas = Math.max(0, (pt.balance_halalas || 0) - approvedHalalas);
            pt.updated_at = now;
            saveStorage('patients', patientsState);
          }
        }
      }

      // Audit log for claim transition
      recordAuditLog({
        userId: payload?.userId,
        action: 'CLAIM_STATUS_TRANSITION',
        entityType: 'insurance_claim',
        entityId: claim.id,
        before: {
          status: prevStatus,
          approved_halalas: prevApproved,
          rejection_reason: claim.rejection_reason,
        },
        after: {
          status: newStatus,
          approved_halalas: approvedHalalas,
          rejected_halalas: rejectedHalalas,
          rejection_reason: rejectionReason,
          automatic_payment_applied: !!paymentCreated,
          payment_halalas: paymentCreated?.amount_halalas ?? 0,
        },
      });

      return ok(updatedClaim);
    },

    async getExpiringPolicies(daysThreshold = 30): Promise<ApiResult<Array<Patient & { daysRemaining: number }>>> {
      const now = Date.now();
      const results: Array<Patient & { daysRemaining: number }> = [];

      for (const p of patientsState) {
        if (!p.deleted_at && p.insurance_company_id && p.insurance_expiry) {
          const expTime = new Date(p.insurance_expiry).getTime();
          const diffDays = Math.ceil((expTime - now) / 86400000);
          if (diffDays <= daysThreshold) {
            results.push({
              ...p,
              daysRemaining: diffDays,
            });
          }
        }
      }

      // Sort by soonest expiring first (or expired negative days)
      results.sort((a, b) => a.daysRemaining - b.daysRemaining);
      return ok(results);
    },

    async getAuditLogs(entityType?: string, entityId?: string): Promise<ApiResult<AuditLog[]>> {
      let filtered = auditLogsState;
      if (entityType) {
        filtered = filtered.filter((l) => l.entity_type === entityType);
      }
      if (entityId) {
        filtered = filtered.filter((l) => l.entity_id === entityId);
      }
      return ok(filtered);
    },
  },

  expenses: {
    async list(filters?: ExpenseFilters): Promise<ApiResult<Expense[]>> {
      let filtered = expensesState.filter((e) => !e.deleted_at);

      if (filters?.category && filters.category !== 'all') {
        filtered = filtered.filter((e) => e.category === filters.category);
      }
      if (filters?.from) {
        filtered = filtered.filter((e) => e.expense_date >= filters.from!);
      }
      if (filters?.to) {
        filtered = filtered.filter((e) => e.expense_date <= filters.to!);
      }
      if (filters?.is_recurring !== undefined) {
        filtered = filtered.filter((e) => e.is_recurring === filters.is_recurring);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.payee?.toLowerCase().includes(q) ||
            e.reference?.toLowerCase().includes(q) ||
            e.notes?.toLowerCase().includes(q)
        );
      }

      // Sort by newest expense_date first
      filtered.sort((a, b) => b.expense_date.localeCompare(a.expense_date));
      return ok(filtered);
    },

    async getById(id: string): Promise<ApiResult<Expense>> {
      const exp = expensesState.find((e) => e.id === id && !e.deleted_at);
      if (!exp) return err('المصروف غير موجود');
      return ok(exp);
    },

    async create(data: CreateExpense): Promise<ApiResult<Expense>> {
      const now = new Date().toISOString();
      const newExp: Expense = {
        id: crypto.randomUUID(),
        clinic_id: 'c1000000-0000-0000-0000-000000000001',
        category: data.category,
        title: data.title,
        amount_halalas: data.amount_halalas,
        vat_halalas: data.vat_halalas ?? 0,
        expense_date: data.expense_date || now.split('T')[0],
        payment_method: data.payment_method || 'mada',
        reference: data.reference || null,
        payee: data.payee || null,
        receipt_url: data.receipt_url || null,
        is_recurring: data.is_recurring ?? false,
        recurring_day: data.recurring_day || null,
        notes: data.notes || null,
        recorded_by: data.recorded_by || 'المستخدم الحالي',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };

      expensesState = [newExp, ...expensesState];
      saveStorage('expenses', expensesState);

      recordAuditLog({
        action: 'EXPENSE_RECORDED',
        entityType: 'expense',
        entityId: newExp.id,
        before: null,
        after: {
          title: newExp.title,
          amount_halalas: newExp.amount_halalas,
          category: newExp.category,
          is_recurring: newExp.is_recurring,
        },
      });

      return ok(newExp);
    },

    async update(id: string, data: UpdateExpense): Promise<ApiResult<Expense>> {
      const idx = expensesState.findIndex((e) => e.id === id);
      if (idx === -1) return err('المصروف غير موجود');
      const prev = { ...expensesState[idx] };
      expensesState[idx] = {
        ...expensesState[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      saveStorage('expenses', expensesState);

      recordAuditLog({
        action: 'EXPENSE_UPDATED',
        entityType: 'expense',
        entityId: id,
        before: prev as unknown as Record<string, unknown>,
        after: expensesState[idx] as unknown as Record<string, unknown>,
      });

      return ok(expensesState[idx]);
    },

    async delete(id: string): Promise<ApiResult<boolean>> {
      const idx = expensesState.findIndex((e) => e.id === id);
      if (idx === -1) return err('المصروف غير موجود');
      expensesState[idx].deleted_at = new Date().toISOString();
      saveStorage('expenses', expensesState);

      recordAuditLog({
        action: 'EXPENSE_DELETED',
        entityType: 'expense',
        entityId: id,
        before: { title: expensesState[idx].title },
        after: { deleted_at: expensesState[idx].deleted_at },
      });

      return ok(true);
    },

    async processRecurring(): Promise<ApiResult<Expense[]>> {
      const now = new Date();
      const currentYearMonth = now.toISOString().substring(0, 7); // e.g. "2026-09"
      const recurringTemplates = expensesState.filter((e) => !e.deleted_at && e.is_recurring);
      const generated: Expense[] = [];

      for (const tpl of recurringTemplates) {
        // Check if an expense with the same title already exists in the current month
        const alreadyExists = expensesState.some(
          (e) => !e.deleted_at && e.title === tpl.title && e.expense_date.startsWith(currentYearMonth)
        );

        if (!alreadyExists) {
          const day = tpl.recurring_day ? String(tpl.recurring_day).padStart(2, '0') : '01';
          const newExp: Expense = {
            ...tpl,
            id: crypto.randomUUID(),
            expense_date: `${currentYearMonth}-${day}`,
            reference: `${tpl.reference || 'REC'}-${currentYearMonth}`,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          };
          generated.push(newExp);
        }
      }

      if (generated.length > 0) {
        expensesState = [...generated, ...expensesState];
        saveStorage('expenses', expensesState);
      }

      return ok(generated);
    },
  },

  images: {
    async list(params) {
      const active = imagesState.filter((i) => !i.deleted_at);
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      return ok({
        items: active.slice((page - 1) * limit, page * limit),
        total: active.length,
        page,
        limit,
        totalPages: Math.ceil(active.length / limit) || 1,
      });
    },

    async getByPatient(patientId: string): Promise<ApiResult<Image[]>> {
      return ok(imagesState.filter((i) => i.patient_id === patientId && !i.deleted_at));
    },

    async create(data: CreateImage): Promise<ApiResult<Image>> {
      const now = new Date().toISOString();
      const image: Image = {
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        patient_id: data.patient_id,
        tooth_number: data.tooth_number || null,
        type: data.type,
        file_path: data.file_path,
        thumbnail_path: data.thumbnail_path || null,
        taken_at: data.taken_at || now,
        captured_by: data.captured_by,
        notes: data.notes || null,
        tags: data.tags || [],
      };
      imagesState.push(image);
      saveStorage('images', imagesState);
      return ok(image);
    },

    async delete(id: string): Promise<ApiResult<boolean>> {
      const index = imagesState.findIndex((i) => i.id === id);
      if (index !== -1) {
        imagesState[index] = {
          ...imagesState[index],
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        saveStorage('images', imagesState);
      }
      return ok(true);
    },
  },

  inventory: {
    async list(params) {
      let filtered = inventoryItemsState.filter((i) => !i.deleted_at);

      if (params?.search) {
        const q = params.search.toLowerCase().trim();
        filtered = filtered.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.sku.toLowerCase().includes(q) ||
            i.category.toLowerCase().includes(q) ||
            (i.location && i.location.toLowerCase().includes(q))
        );
      }

      if (params?.category && params.category !== 'all') {
        filtered = filtered.filter((i) => i.category === params.category);
      }

      if (params?.status) {
        const now = Date.now();
        if (params.status === 'low_stock') {
          filtered = filtered.filter((i) => i.quantity <= i.min_quantity);
        } else if (params.status === 'expiring_60') {
          filtered = filtered.filter((i) => {
            if (!i.expiry_date) return false;
            const diff = Math.ceil((new Date(i.expiry_date).getTime() - now) / 86400000);
            return diff > 0 && diff <= 60;
          });
        } else if (params.status === 'expired') {
          filtered = filtered.filter((i) => {
            if (!i.expiry_date) return false;
            const diff = Math.ceil((new Date(i.expiry_date).getTime() - now) / 86400000);
            return diff <= 0;
          });
        }
      }

      const page = params?.page || 1;
      const limit = params?.limit || 50;
      return ok({
        items: filtered.slice((page - 1) * limit, page * limit),
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit) || 1,
      });
    },

    async getById(id: string): Promise<ApiResult<InventoryItem>> {
      const item = inventoryItemsState.find((i) => i.id === id && !i.deleted_at);
      if (!item) return err('الصنف غير موجود');
      return ok(item);
    },

    async create(data: CreateInventoryItem): Promise<ApiResult<InventoryItem>> {
      const now = new Date().toISOString();
      const item: InventoryItem = {
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id || CLINIC_ID,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        name: data.name,
        sku: data.sku,
        category: data.category || 'مستهلكات عامة',
        unit: data.unit || 'قطعة',
        quantity: data.quantity || 0,
        min_quantity: data.min_quantity || 5,
        cost_halalas: data.cost_halalas || 0,
        supplier_id: data.supplier_id || null,
        expiry_date: data.expiry_date || null,
        location: data.location || null,
      };
      inventoryItemsState = [item, ...inventoryItemsState];
      saveStorage('inventoryItems', inventoryItemsState);

      // Record initial inventory transaction if quantity > 0
      if (item.quantity > 0) {
        const tx: InventoryTransaction = {
          id: crypto.randomUUID(),
          clinic_id: item.clinic_id,
          created_at: now,
          updated_at: now,
          deleted_at: null,
          item_id: item.id,
          type: 'in',
          quantity: item.quantity,
          reason: 'رصيد افتتاحي عند إضافة الصنف',
          treatment_id: null,
          created_by: 'u1000000-0000-0000-0000-000000000001',
        };
        inventoryTransactionsState = [tx, ...inventoryTransactionsState];
        saveStorage('inventoryTransactions', inventoryTransactionsState);
      }

      return ok(item);
    },

    async update(id: string, data: UpdateInventoryItem): Promise<ApiResult<InventoryItem>> {
      const idx = inventoryItemsState.findIndex((i) => i.id === id);
      if (idx === -1) return err('الصنف غير موجود');
      inventoryItemsState[idx] = { ...inventoryItemsState[idx], ...data, updated_at: new Date().toISOString() };
      saveStorage('inventoryItems', inventoryItemsState);
      return ok(inventoryItemsState[idx]);
    },

    async delete(id: string): Promise<ApiResult<boolean>> {
      const idx = inventoryItemsState.findIndex((i) => i.id === id);
      if (idx !== -1) {
        inventoryItemsState[idx] = {
          ...inventoryItemsState[idx],
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        saveStorage('inventoryItems', inventoryItemsState);
      }
      return ok(true);
    },

    async recordTransaction(data: CreateInventoryTransaction): Promise<ApiResult<InventoryTransaction>> {
      const now = new Date().toISOString();
      const tx: InventoryTransaction = {
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id || CLINIC_ID,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        item_id: data.item_id,
        type: data.type,
        quantity: Math.max(1, data.quantity),
        reason: data.reason || null,
        treatment_id: data.treatment_id || null,
        created_by: data.created_by || 'u1000000-0000-0000-0000-000000000001',
      };
      inventoryTransactionsState = [tx, ...inventoryTransactionsState];
      saveStorage('inventoryTransactions', inventoryTransactionsState);

      const itemIdx = inventoryItemsState.findIndex((i) => i.id === data.item_id);
      if (itemIdx !== -1) {
        const item = inventoryItemsState[itemIdx];
        let newQty = item.quantity;
        if (data.type === 'in') {
          newQty += tx.quantity;
        } else if (data.type === 'out' || data.type === 'waste') {
          newQty = Math.max(0, newQty - tx.quantity);
        } else if (data.type === 'adjust') {
          // In adjustments, quantity may represent new verified balance or delta
          newQty = tx.quantity;
        }
        inventoryItemsState[itemIdx] = {
          ...item,
          quantity: newQty,
          updated_at: now,
        };
        saveStorage('inventoryItems', inventoryItemsState);
      }
      return ok(tx);
    },

    async getTransactions(params?: { itemId?: string; type?: any; limit?: number }) {
      let filtered = inventoryTransactionsState.filter((t) => !t.deleted_at);
      if (params?.itemId) {
        filtered = filtered.filter((t) => t.item_id === params.itemId);
      }
      if (params?.type && params.type !== 'all') {
        filtered = filtered.filter((t) => t.type === params.type);
      }
      const limit = params?.limit || 100;
      const sliced = filtered.slice(0, limit);

      const enriched = sliced.map((tx) => {
        const item = inventoryItemsState.find((i) => i.id === tx.item_id);
        const treatment = tx.treatment_id ? treatmentsState.find((t) => t.id === tx.treatment_id) : null;
        const user = usersState.find((u) => u.id === tx.created_by);
        return {
          ...tx,
          item_name: item?.name || 'صنف غير معروف',
          item_unit: item?.unit || 'قطعة',
          item_sku: item?.sku || 'SKU',
          treatment_title: treatment ? `إجراء علاجي (#${treatment.id.slice(0, 6)})` : undefined,
          created_by_name: user?.full_name || 'طاقم العيادة',
        };
      });

      return ok(enriched);
    },

    async getLowStock(): Promise<ApiResult<InventoryItem[]>> {
      return ok(inventoryItemsState.filter((i) => !i.deleted_at && i.quantity <= i.min_quantity));
    },

    async getExpiringItems(daysThreshold = 60) {
      const now = Date.now();
      const results: Array<InventoryItem & { daysRemaining: number; isExpired: boolean }> = [];

      for (const item of inventoryItemsState) {
        if (!item.deleted_at && item.expiry_date) {
          const expTime = new Date(item.expiry_date).getTime();
          const diffDays = Math.ceil((expTime - now) / 86400000);
          if (diffDays <= daysThreshold) {
            results.push({
              ...item,
              daysRemaining: diffDays,
              isExpired: diffDays <= 0,
            });
          }
        }
      }

      results.sort((a, b) => a.daysRemaining - b.daysRemaining);
      return ok(results);
    },

    async getMonthlyConsumptionReport(month?: string, year?: number): Promise<ApiResult<InventoryMonthlyConsumptionReport>> {
      const targetDate = new Date();
      const targetYear = year || targetDate.getFullYear();
      const targetMonthStr = month || `${targetYear}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

      const arabicMonths: Record<string, string> = {
        '01': 'يناير',
        '02': 'فبراير',
        '03': 'مارس',
        '04': 'أبريل',
        '05': 'مايو',
        '06': 'يونيو',
        '07': 'يوليو',
        '08': 'أغسطس',
        '09': 'سبتمبر',
        '10': 'أكتوبر',
        '11': 'نوفمبر',
        '12': 'ديسمبر',
      };
      const monthPart = targetMonthStr.split('-')[1] || '09';
      const monthName = `${arabicMonths[monthPart] || 'الشهر الحالي'} ${targetYear}`;

      // Filter out/waste transactions in this month
      const consumptionTx = inventoryTransactionsState.filter(
        (t) =>
          !t.deleted_at &&
          (t.type === 'out' || t.type === 'waste') &&
          t.created_at.startsWith(targetMonthStr)
      );

      let totalConsumedHalalas = 0;
      const itemMap = new Map<
        string,
        {
          itemId: string;
          name: string;
          sku: string;
          category: string;
          unit: string;
          quantityConsumed: number;
          costHalalas: number;
          totalHalalas: number;
          transactionsCount: number;
        }
      >();

      const categoryMap = new Map<string, { totalHalalas: number; itemsCount: number }>();

      for (const tx of consumptionTx) {
        const item = inventoryItemsState.find((i) => i.id === tx.item_id);
        const cost = item ? item.cost_halalas : 0;
        const lineHalalas = cost * tx.quantity;
        totalConsumedHalalas += lineHalalas;

        const cat = item?.category || 'مستهلكات عامة';
        const existingCat = categoryMap.get(cat) || { totalHalalas: 0, itemsCount: 0 };
        categoryMap.set(cat, {
          totalHalalas: existingCat.totalHalalas + lineHalalas,
          itemsCount: existingCat.itemsCount + tx.quantity,
        });

        if (item) {
          const existingItem = itemMap.get(item.id);
          if (existingItem) {
            existingItem.quantityConsumed += tx.quantity;
            existingItem.totalHalalas += lineHalalas;
            existingItem.transactionsCount += 1;
          } else {
            itemMap.set(item.id, {
              itemId: item.id,
              name: item.name,
              sku: item.sku,
              category: item.category,
              unit: item.unit,
              quantityConsumed: tx.quantity,
              costHalalas: cost,
              totalHalalas: lineHalalas,
              transactionsCount: 1,
            });
          }
        }
      }

      const topConsumedItems = Array.from(itemMap.values()).sort(
        (a, b) => b.totalHalalas - a.totalHalalas
      );

      const byCategory = Array.from(categoryMap.entries()).map(([cat, val]) => ({
        category: cat,
        totalHalalas: val.totalHalalas,
        itemsCount: val.itemsCount,
        percentage:
          totalConsumedHalalas > 0
            ? Math.round((val.totalHalalas / totalConsumedHalalas) * 100)
            : 0,
      }));

      const recentMovements = consumptionTx.slice(0, 15).map((tx) => {
        const item = inventoryItemsState.find((i) => i.id === tx.item_id);
        const user = usersState.find((u) => u.id === tx.created_by);
        return {
          id: tx.id,
          date: tx.created_at,
          itemName: item?.name || 'مادة مستهلكة',
          category: item?.category || 'عام',
          type: tx.type,
          quantity: tx.quantity,
          unit: item?.unit || 'قطعة',
          costHalalas: (item?.cost_halalas || 0) * tx.quantity,
          reason: tx.reason,
          createdByName: user?.full_name || 'طاقم العيادة',
        };
      });

      return ok({
        period: targetMonthStr,
        monthName,
        totalConsumedHalalas,
        totalTransactionsCount: consumptionTx.length,
        totalItemsCount: itemMap.size,
        byCategory,
        topConsumedItems,
        recentMovements,
      });
    },

    async getSuppliers(): Promise<ApiResult<Supplier[]>> {
      return ok(suppliersState.filter((s) => !s.deleted_at));
    },

    async createSupplier(data: CreateSupplier): Promise<ApiResult<Supplier>> {
      const now = new Date().toISOString();
      const sup: Supplier = {
        id: crypto.randomUUID(),
        clinic_id: CLINIC_ID,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      };
      suppliersState = [sup, ...suppliersState];
      saveStorage('suppliers', suppliersState);
      return ok(sup);
    },

    async updateSupplier(id: string, data: UpdateSupplier): Promise<ApiResult<Supplier>> {
      const idx = suppliersState.findIndex((s) => s.id === id);
      if (idx === -1) return err('المورد غير موجود');
      suppliersState[idx] = { ...suppliersState[idx], ...data, updated_at: new Date().toISOString() };
      saveStorage('suppliers', suppliersState);
      return ok(suppliersState[idx]);
    },

    async deleteSupplier(id: string): Promise<ApiResult<boolean>> {
      const idx = suppliersState.findIndex((s) => s.id === id);
      if (idx !== -1) {
        suppliersState[idx] = {
          ...suppliersState[idx],
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        saveStorage('suppliers', suppliersState);
      }
      return ok(true);
    },

    async getPurchaseOrders(): Promise<ApiResult<PurchaseOrder[]>> {
      const orders = purchaseOrdersState.filter((po) => !po.deleted_at);
      const enriched = orders.map((po) => {
        const sup = suppliersState.find((s) => s.id === po.supplier_id);
        return {
          ...po,
          supplier_name: sup?.name || po.supplier_name || 'مورد عام',
        };
      });
      return ok(enriched);
    },

    async createPurchaseOrder(data: {
      supplier_id: string;
      order_date?: string;
      expected_date?: string | null;
      notes?: string | null;
      items: Array<{ item_id: string; quantity: number; cost_halalas: number }>;
    }): Promise<ApiResult<PurchaseOrder>> {
      const now = new Date().toISOString();
      const sup = suppliersState.find((s) => s.id === data.supplier_id);
      const poNum = `PO-${new Date().getFullYear()}-${String(purchaseOrdersState.length + 1).padStart(3, '0')}`;

      let totalHalalas = 0;
      const poItems: PurchaseOrderItem[] = data.items.map((it) => {
        const item = inventoryItemsState.find((i) => i.id === it.item_id);
        const lineTotal = it.cost_halalas * it.quantity;
        totalHalalas += lineTotal;
        return {
          id: crypto.randomUUID(),
          item_id: it.item_id,
          item_name: item?.name || 'صنف',
          unit: item?.unit || 'قطعة',
          quantity: it.quantity,
          received_quantity: 0,
          cost_halalas: it.cost_halalas,
          total_halalas: lineTotal,
        };
      });

      const po: PurchaseOrder = {
        id: crypto.randomUUID(),
        clinic_id: CLINIC_ID,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        po_number: poNum,
        supplier_id: data.supplier_id,
        supplier_name: sup?.name || 'مورد معتمد',
        order_date: data.order_date || now.split('T')[0],
        expected_date: data.expected_date || null,
        received_date: null,
        status: 'draft',
        total_halalas: totalHalalas,
        notes: data.notes || null,
        items: poItems,
      };

      purchaseOrdersState = [po, ...purchaseOrdersState];
      saveStorage('purchaseOrders', purchaseOrdersState);
      return ok(po);
    },

    async updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus): Promise<ApiResult<PurchaseOrder>> {
      const idx = purchaseOrdersState.findIndex((p) => p.id === id);
      if (idx === -1) return err('أمر الشراء غير موجود');
      purchaseOrdersState[idx] = {
        ...purchaseOrdersState[idx],
        status,
        updated_at: new Date().toISOString(),
      };
      saveStorage('purchaseOrders', purchaseOrdersState);
      return ok(purchaseOrdersState[idx]);
    },

    async receivePurchaseOrder(id: string): Promise<ApiResult<PurchaseOrder>> {
      const idx = purchaseOrdersState.findIndex((p) => p.id === id);
      if (idx === -1) return err('أمر الشراء غير موجود');

      const po = purchaseOrdersState[idx];
      const now = new Date().toISOString();

      // Automatically add quantities to inventory items and record 'in' transactions
      for (const poi of po.items) {
        const itemIdx = inventoryItemsState.findIndex((i) => i.id === poi.item_id);
        if (itemIdx !== -1) {
          inventoryItemsState[itemIdx] = {
            ...inventoryItemsState[itemIdx],
            quantity: inventoryItemsState[itemIdx].quantity + poi.quantity,
            cost_halalas: poi.cost_halalas || inventoryItemsState[itemIdx].cost_halalas,
            updated_at: now,
          };

          inventoryTransactionsState = [
            {
              id: crypto.randomUUID(),
              clinic_id: CLINIC_ID,
              created_at: now,
              updated_at: now,
              deleted_at: null,
              item_id: poi.item_id,
              type: 'in',
              quantity: poi.quantity,
              reason: `توريد واستلام أمر الشراء ${po.po_number} من ${po.supplier_name}`,
              treatment_id: null,
              created_by: 'u1000000-0000-0000-0000-000000000001',
            },
            ...inventoryTransactionsState,
          ];
        }
      }

      purchaseOrdersState[idx] = {
        ...po,
        status: 'received',
        received_date: now.split('T')[0],
        updated_at: now,
      };

      saveStorage('inventoryItems', inventoryItemsState);
      saveStorage('inventoryTransactions', inventoryTransactionsState);
      saveStorage('purchaseOrders', purchaseOrdersState);

      return ok(purchaseOrdersState[idx]);
    },
  },

  staff: {
    async list(filters?: UserFilters): Promise<ApiResult<Paginated<User>>> {
      let items = usersState.filter((u) => !u.deleted_at);
      if (filters?.role) items = items.filter((u) => u.role === filters.role);
      if (filters?.is_active !== undefined) items = items.filter((u) => u.is_active === filters.is_active);

      return ok({
        items,
        total: items.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      });
    },

    async getById(id: string): Promise<ApiResult<User>> {
      const u = usersState.find((x) => x.id === id);
      if (!u) return err('الموظف غير موجود');
      return ok(u);
    },

    async create(data: CreateUser): Promise<ApiResult<User>> {
      const now = new Date().toISOString();
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

      const user: User = {
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        full_name: data.full_name,
        username: data.username,
        password_hash: passwordHash,
        role: data.role,
        specialty: data.specialty || null,
        license_number: data.license_number || null,
        phone: data.phone || null,
        email: data.email || null,
        avatar_path: data.avatar_path || null,
        color: data.color || '#1E4E9C',
        commission_percent: data.commission_percent || 0,
        is_active: data.is_active ?? true,
        last_login_at: null,
        must_change_password: (data as any).must_change_password ?? true,
        pin_hash: pinHash,
        pin_attempts: 0,
      };
      usersState.push(user);
      saveStorage('users', usersState);
      return ok(user);
    },

    async update(id: string, data: UpdateUser): Promise<ApiResult<User>> {
      const idx = usersState.findIndex((u) => u.id === id);
      if (idx === -1) return err('الموظف غير موجود');
      usersState[idx] = { ...usersState[idx], ...data, updated_at: new Date().toISOString() };
      saveStorage('users', usersState);
      return ok(usersState[idx]);
    },

    async getAttendance(userId?: string, date?: string): Promise<ApiResult<Attendance[]>> {
      let items = attendanceState;
      if (userId) items = items.filter((a) => a.user_id === userId);
      if (date) items = items.filter((a) => a.date === date);
      return ok(items);
    },

    async recordAttendance(data: CreateAttendance): Promise<ApiResult<Attendance>> {
      const now = new Date().toISOString();
      const att: Attendance = {
        id: crypto.randomUUID(),
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        user_id: data.user_id,
        check_in: data.check_in,
        check_out: data.check_out || null,
        date: data.date || now.split('T')[0],
        notes: data.notes || null,
      };
      attendanceState.push(att);
      saveStorage('attendance', attendanceState);
      return ok(att);
    },

    async getLeaves(userId?: string): Promise<ApiResult<LeaveRequest[]>> {
      let items = leavesState.filter((l) => !l.deleted_at);
      if (userId) items = items.filter((l) => l.user_id === userId);
      const enriched = items.map((l) => {
        const u = usersState.find((usr) => usr.id === l.user_id);
        return {
          ...l,
          user_name: u?.full_name || l.user_name || 'موظف العيادة',
        };
      });
      return ok(enriched);
    },

    async createLeave(data: { user_id: string; type: LeaveType; start_date: string; end_date: string; days_count: number; reason: string }): Promise<ApiResult<LeaveRequest>> {
      const now = new Date().toISOString();
      const u = usersState.find((usr) => usr.id === data.user_id);
      const leave: LeaveRequest = {
        id: crypto.randomUUID(),
        clinic_id: CLINIC_ID,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        user_id: data.user_id,
        user_name: u?.full_name || 'موظف العيادة',
        type: data.type,
        start_date: data.start_date,
        end_date: data.end_date,
        days_count: data.days_count,
        reason: data.reason,
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
      };
      leavesState = [leave, ...leavesState];
      saveStorage('leaves', leavesState);

      recordAuditLog({
        userId: currentSessionUser?.id || data.user_id,
        action: 'LEAVE_REQUEST_SUBMITTED',
        entityType: 'leave_request',
        entityId: leave.id,
        before: null,
        after: { user_name: leave.user_name, type: leave.type, days_count: leave.days_count },
      });

      return ok(leave);
    },

    async updateLeaveStatus(id: string, status: LeaveStatus, reviewedBy?: string): Promise<ApiResult<LeaveRequest>> {
      const idx = leavesState.findIndex((l) => l.id === id);
      if (idx === -1) return err('طلب الإجازة غير موجود');

      const prev = leavesState[idx];
      leavesState[idx] = {
        ...prev,
        status,
        reviewed_by: reviewedBy || currentSessionUser?.full_name || 'المدير الطبي',
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveStorage('leaves', leavesState);

      recordAuditLog({
        userId: currentSessionUser?.id || 'u1000000-0000-0000-0000-000000000001',
        action: `LEAVE_REQUEST_${status.toUpperCase()}`,
        entityType: 'leave_request',
        entityId: id,
        before: { status: prev.status },
        after: { status, reviewed_by: leavesState[idx].reviewed_by },
      });

      return ok(leavesState[idx]);
    },

    async getCommissions(filters?: { from?: string; to?: string }): Promise<ApiResult<DoctorCommissionSummary[]>> {
      const doctors = usersState.filter((u) => (u.role === 'dentist' || u.role === 'owner') && !u.deleted_at);
      const from = filters?.from;
      const to = filters?.to;

      const summaries: DoctorCommissionSummary[] = doctors.map((doc) => {
        let docTreatments = treatmentsState.filter((t) => t.dentist_id === doc.id && !t.deleted_at && t.status === 'completed');
        if (from) docTreatments = docTreatments.filter((t) => t.performed_at >= from);
        if (to) docTreatments = docTreatments.filter((t) => t.performed_at <= to);

        let totalRevenueHalalas = docTreatments.reduce((sum, t) => sum + t.price_halalas, 0);
        if (totalRevenueHalalas === 0) {
          totalRevenueHalalas = doc.role === 'owner' ? 4500000 : (doc.username === 'dr.layla' ? 3200000 : 2800000);
        }
        const percent = doc.commission_percent || (doc.role === 'owner' ? 40 : 35);
        const commissionHalalas = Math.round((totalRevenueHalalas * percent) / 100);
        const paidHalalas = Math.round(commissionHalalas * 0.75);
        const balanceHalalas = commissionHalalas - paidHalalas;

        return {
          doctorId: doc.id,
          doctorName: doc.full_name,
          specialty: doc.specialty || 'طب وجراحة الأسنان',
          color: doc.color || '#1E4E9C',
          commissionPercent: percent,
          completedTreatmentsCount: docTreatments.length || (doc.role === 'owner' ? 24 : 18),
          totalRevenueHalalas,
          commissionHalalas,
          paidHalalas,
          balanceHalalas,
        };
      });

      return ok(summaries);
    },
  },

  reports: {
    async getReport(reportId: string, filters: ReportFilters): Promise<ApiResult<ReportGeneratedData>> {
      const toBound = filters.to.length === 10 ? `${filters.to}T23:59:59.999Z` : filters.to;
      const pays = paymentsState.filter((p) => {
        if (p.deleted_at) return false;
        if (p.paid_at < filters.from || p.paid_at > toBound) return false;
        if (filters.payment_method && p.method !== filters.payment_method) return false;
        if (filters.dentist_id && filters.dentist_id !== 'all') {
          const pt = patientsState.find((x) => x.id === p.patient_id);
          if (pt?.primary_dentist_id !== filters.dentist_id && p.received_by !== filters.dentist_id) return false;
        }
        return true;
      });

      const totalRevenue = pays.reduce((sum, p) => sum + p.amount_halalas, 0);
      const appts = appointmentsState.filter((a) => {
        if (a.deleted_at) return false;
        if (a.start_at < filters.from || a.start_at > toBound) return false;
        if (filters.dentist_id && a.dentist_id !== filters.dentist_id) return false;
        if (filters.branch_id && a.branch_id !== filters.branch_id) return false;
        return true;
      });

      const totalAppts = appts.length;
      const attendedAppts = appts.filter((a) => a.status === 'completed').length;

      const kpis = [
        { id: 'k1', title: 'إجمالي الإيرادات', value: `${(totalRevenue / 100).toLocaleString('ar-SA')} ر.س`, subtitle: `${pays.length} دفعة محصلة` },
        { id: 'k2', title: 'عدد المواعيد', value: totalAppts, subtitle: `${attendedAppts} مكتملة` },
        { id: 'k3', title: 'متوسط الدفعة', value: `${pays.length > 0 ? (Math.round(totalRevenue / pays.length) / 100).toLocaleString('ar-SA') : 0} ر.س` },
        { id: 'k4', title: 'المرضى الجدد', value: patientsState.filter((pt) => !pt.deleted_at && pt.created_at >= filters.from && pt.created_at <= toBound).length },
      ];

      const chartData = [
        { period: 'الفترة المحددة', revenueSAR: Math.round(totalRevenue / 100), count: pays.length },
      ];

      const tableColumns = [
        { key: 'ref', header: 'المرجع / المعرف' },
        { key: 'date', header: 'التاريخ' },
        { key: 'category', header: 'البيان' },
        { key: 'amount', header: 'المبلغ (ر.س)' },
      ];

      const tableRows = pays.slice(0, 50).map((p) => ({
        ref: p.reference || p.id.slice(0, 8),
        date: p.paid_at.slice(0, 10),
        category: `دفعة ${p.method}`,
        amount: `${(p.amount_halalas / 100).toFixed(2)} ر.س`,
      }));

      return ok({
        reportId,
        kpis,
        chartData,
        tableColumns,
        tableRows,
        totalRevenueHalalas: totalRevenue,
        count: pays.length,
      });
    },

    async getFinancialReport(from: string, to: string) {
      const payments = paymentsState.filter((p) => p.paid_at >= from && p.paid_at <= to);
      const invoices = invoicesState.filter((i) => i.issue_date >= from && i.issue_date <= to);
      const totalRevenue = payments.reduce((acc, p) => acc + p.amount_halalas, 0);
      const totalExpenses = 450000; // Mock fixed expenses

      return ok({
        totalRevenueHalalas: totalRevenue,
        totalExpensesHalalas: totalExpenses,
        netProfitHalalas: totalRevenue - totalExpenses,
        invoicesCount: invoices.length,
        paymentsCount: payments.length,
      });
    },

    async getFinancials(range?: { from?: string; to?: string; year?: number }): Promise<ApiResult<FinancialsReportData>> {
      const now = new Date();
      const currentYear = range?.year || now.getFullYear();

      const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // 1. Calculate Monthly Cash Flow & Revenue
      const monthlyData = monthNamesEn.map((en, idx) => {
        const mStr = String(idx + 1).padStart(2, '0');
        const prefix = `${currentYear}-${mStr}`;

        const monthInvoices = invoicesState.filter((i) => !i.deleted_at && i.issue_date.startsWith(prefix));
        const monthPayments = paymentsState.filter((p) => !p.deleted_at && p.paid_at.startsWith(prefix));

        const revenueHalalas = monthInvoices.reduce((sum, inv) => sum + inv.total_halalas, 0);
        const cashFlowHalalas = monthPayments.reduce((sum, pay) => sum + pay.amount_halalas, 0);

        // Realistic fallback for months if current year seed data is condensed
        const fallbackFactor = [180000, 240000, 310000, 290000, 420000, 380000, 490000, 450000, 560000, 620000, 580000, 670000][idx];
        const finalRevenue = revenueHalalas > 0 ? revenueHalalas : fallbackFactor;
        const finalCash = cashFlowHalalas > 0 ? cashFlowHalalas : Math.round(fallbackFactor * 0.85);

        return {
          month: monthNamesAr[idx],
          monthKey: en,
          revenueHalalas: finalRevenue,
          revenueSAR: Math.round(finalRevenue / 100),
          cashFlowHalalas: finalCash,
          cashFlowSAR: Math.round(finalCash / 100),
          invoicesCount: monthInvoices.length || Math.floor(finalRevenue / 30000),
        };
      });

      // 2. Revenue By Service breakdown
      const serviceCategories = [
        { name: 'علاج العصب واللب', nameEn: 'Root Canal', color: '#1E4E9C', ratio: 0.35 },
        { name: 'حشوات تجميلية', nameEn: 'Composite Fillings', color: '#0D9488', ratio: 0.25 },
        { name: 'تركيبات وتيجان', nameEn: 'Crown & Bridge', color: '#E11D48', ratio: 0.18 },
        { name: 'جراحة وخلع', nameEn: 'Oral Surgery', color: '#F59E0B', ratio: 0.12 },
        { name: 'تنظيف وتبييض', nameEn: 'Prophylaxis', color: '#8B5CF6', ratio: 0.06 },
        { name: 'زراعة وتقويم', nameEn: 'Implant & Ortho', color: '#10B981', ratio: 0.04 },
      ];

      const totalClinicRevenueHalalas = invoicesState.reduce((sum, inv) => sum + (inv.deleted_at ? 0 : inv.total_halalas), 0) || 1200000;

      const revenueByService = serviceCategories.map((svc) => {
        const revHalalas = Math.round(totalClinicRevenueHalalas * svc.ratio);
        return {
          category: svc.nameEn.toLowerCase().replace(/\s+/g, '_'),
          name: svc.name,
          nameEn: svc.nameEn,
          revenueHalalas: revHalalas,
          revenueSAR: Math.round(revHalalas / 100),
          percentage: Math.round(svc.ratio * 100),
          color: svc.color,
          count: Math.max(1, Math.round(revHalalas / 45000)),
        };
      });

      // 3. Annual Trend Curve
      const annualTrend = monthlyData.map((m) => ({
        month: m.monthKey,
        revenueSAR: m.revenueSAR,
        collectedSAR: m.cashFlowSAR,
      }));

      // 4. Summary metrics
      const currentMonthPrefix = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const thisMonthPayments = paymentsState.filter((p) => !p.deleted_at && p.paid_at.startsWith(currentMonthPrefix));
      const monthlyRevenueHalalas = thisMonthPayments.reduce((sum, p) => sum + p.amount_halalas, 0) || 120000; // 1,200.00 ر.س

      const pendingInvoices = invoicesState.filter((i) => !i.deleted_at && i.status !== 'paid' && i.status !== 'void');
      const pendingCount = pendingInvoices.length > 0 ? pendingInvoices.length : 25;

      const approvedClaims = insuranceClaimsState.filter((c) => c.status === 'approved');
      const approvedRatio = insuranceClaimsState.length > 0 ? Math.round((approvedClaims.length / insuranceClaimsState.length) * 100) : 94;
      const insuredPatientsCount = patientsState.filter((p) => !p.deleted_at && !!p.insurance_company_id).length || 18;

      return ok({
        monthlyCashFlow: monthlyData,
        revenueByService,
        annualTrend,
        summary: {
          monthlyRevenueHalalas,
          pendingInvoicesCount: pendingCount,
          refundedHalalas: 0,
          insuranceApprovedPercent: approvedRatio || 94,
          insuranceActiveCount: insuredPatientsCount,
        },
      });
    },

    async getDoctorPerformance(dentistId: string, from?: string, to?: string) {
      const appts = appointmentsState.filter((a) => {
        if (a.dentist_id !== dentistId) return false;
        if (from && a.start_at < from) return false;
        if (to && a.start_at > to) return false;
        return true;
      });

      const treats = treatmentsState.filter((t) => {
        if (t.dentist_id !== dentistId) return false;
        if (from && t.performed_at < from) return false;
        if (to && t.performed_at > to) return false;
        return true;
      });

      const earnings = treats.reduce((acc, t) => acc + t.price_halalas, 0);

      return ok({
        treatmentsCount: treats.length,
        totalEarningsHalalas: earnings,
        appointmentsCount: appts.length,
      });
    },

    async getRevenueReport(filters: ReportPeriodFilters): Promise<ApiResult<RevenueReportData>> {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      let from = `${todayStr.substring(0, 7)}-01`;
      let to = todayStr;

      if (filters.period === 'today') {
        from = todayStr;
        to = todayStr;
      } else if (filters.period === 'week') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        from = d.toISOString().split('T')[0];
      } else if (filters.period === 'month') {
        from = `${todayStr.substring(0, 7)}-01`;
      } else if (filters.period === 'quarter') {
        const d = new Date(now);
        d.setDate(d.getDate() - 90);
        from = d.toISOString().split('T')[0];
      } else if (filters.period === 'year') {
        from = `${now.getFullYear()}-01-01`;
        to = `${now.getFullYear()}-12-31`;
      } else if (filters.period === 'custom' && filters.from && filters.to) {
        from = filters.from;
        to = filters.to;
      }

      // Filter payments strictly within the period
      let inPeriodPayments = paymentsState.filter((p) => {
        if (p.deleted_at) return false;
        const pDate = p.paid_at.substring(0, 10);
        return pDate >= from && pDate <= to;
      });

      // If empty in demo mode, adapt to include active payments so user sees rich stats
      if (inPeriodPayments.length === 0 && paymentsState.length > 0) {
        // Adjust the latest payments' dates to fall within the period
        inPeriodPayments = paymentsState.slice(0, Math.min(8, paymentsState.length)).map((p, idx) => ({
          ...p,
          paid_at: `${from}T${String(10 + idx).padStart(2, '0')}:00:00.000Z`,
        }));
      }

      const totalRevenueHalalas = inPeriodPayments.reduce((sum, p) => sum + p.amount_halalas, 0);

      // Build Items
      const items = inPeriodPayments.map((p, idx) => {
        const inv = invoicesState.find((i) => i.id === p.invoice_id);
        const pat = patientsState.find((pt) => pt.id === p.patient_id);
        const invItems = invoiceItemsState.filter((it) => it.invoice_id === p.invoice_id);
        const dentists = usersState.filter((u) => u.role === 'dentist' && !u.deleted_at);
        const dentist = dentists[idx % (dentists.length || 1)] || dentists[0];
        const insCompany = pat?.insurance_company_id
          ? insuranceCompaniesState.find((c) => c.id === pat.insurance_company_id)
          : null;

        return {
          id: p.id,
          paymentId: p.id,
          invoiceNumber: inv?.number || `INV-2026-${String(idx + 1).padStart(4, '0')}`,
          patientName: pat ? `${pat.first_name} ${pat.family_name}` : 'مريض مراجع',
          doctorName: dentist ? dentist.full_name : 'د. أحمد الشمري',
          procedureName: invItems[0]?.description || 'علاج عصب وترميم سني',
          insuranceName: insCompany ? insCompany.name : (p.method === 'insurance' ? 'تأمين طبي' : 'نقدي / مباشر'),
          date: p.paid_at,
          method: p.method,
          amountHalalas: p.amount_halalas,
        };
      });

      // Group by Doctor (guaranteed to sum exactly to totalRevenueHalalas)
      const docMap = new Map<string, { doctorId: string; doctorName: string; amountHalalas: number; count: number }>();
      for (const item of items) {
        const existing = docMap.get(item.doctorName);
        if (existing) {
          existing.amountHalalas += item.amountHalalas;
          existing.count += 1;
        } else {
          docMap.set(item.doctorName, {
            doctorId: item.doctorName,
            doctorName: item.doctorName,
            amountHalalas: item.amountHalalas,
            count: 1,
          });
        }
      }
      const byDoctor = Array.from(docMap.values()).map((d) => ({
        ...d,
        percentage: totalRevenueHalalas > 0 ? Math.round((d.amountHalalas / totalRevenueHalalas) * 100) : 0,
      }));

      // Group by Procedure (guaranteed to sum exactly to totalRevenueHalalas)
      const procMap = new Map<string, { procedureName: string; category: string; amountHalalas: number; count: number }>();
      for (const item of items) {
        const existing = procMap.get(item.procedureName);
        if (existing) {
          existing.amountHalalas += item.amountHalalas;
          existing.count += 1;
        } else {
          procMap.set(item.procedureName, {
            procedureName: item.procedureName,
            category: 'علاجات سنية عامة',
            amountHalalas: item.amountHalalas,
            count: 1,
          });
        }
      }
      const byProcedure = Array.from(procMap.values()).map((pr) => ({
        ...pr,
        percentage: totalRevenueHalalas > 0 ? Math.round((pr.amountHalalas / totalRevenueHalalas) * 100) : 0,
      }));

      // Group by Insurance (guaranteed to sum exactly to totalRevenueHalalas)
      const insMap = new Map<string, { companyId: string | null; companyName: string; amountHalalas: number; count: number }>();
      for (const item of items) {
        const existing = insMap.get(item.insuranceName);
        if (existing) {
          existing.amountHalalas += item.amountHalalas;
          existing.count += 1;
        } else {
          insMap.set(item.insuranceName, {
            companyId: null,
            companyName: item.insuranceName,
            amountHalalas: item.amountHalalas,
            count: 1,
          });
        }
      }
      const byInsurance = Array.from(insMap.values()).map((ins) => ({
        ...ins,
        percentage: totalRevenueHalalas > 0 ? Math.round((ins.amountHalalas / totalRevenueHalalas) * 100) : 0,
      }));

      // Group by Period Day (guaranteed to sum exactly to totalRevenueHalalas)
      const periodMap = new Map<string, { date: string; label: string; amountHalalas: number; count: number }>();
      for (const item of items) {
        const dStr = item.date.substring(0, 10);
        const existing = periodMap.get(dStr);
        if (existing) {
          existing.amountHalalas += item.amountHalalas;
          existing.count += 1;
        } else {
          periodMap.set(dStr, {
            date: dStr,
            label: dStr,
            amountHalalas: item.amountHalalas,
            count: 1,
          });
        }
      }
      const byPeriod = Array.from(periodMap.values()).sort((a, b) => a.date.localeCompare(b.date));

      const uniqueInvoices = new Set(items.map((i) => i.invoiceNumber));

      return ok({
        totalRevenueHalalas,
        totalInvoicesCount: uniqueInvoices.size,
        totalPaymentsCount: items.length,
        byPeriod,
        byDoctor,
        byProcedure,
        byInsurance,
        items,
      });
    },

    async getIncomeStatement(filters: ReportPeriodFilters): Promise<ApiResult<IncomeStatementData>> {
      const revRes = await mockApi.reports.getRevenueReport(filters);
      const totalRevenue = revRes.ok ? revRes.data.totalRevenueHalalas : 0;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      let from = `${todayStr.substring(0, 7)}-01`;
      let to = todayStr;

      if (filters.period === 'today') {
        from = todayStr;
        to = todayStr;
      } else if (filters.period === 'week') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        from = d.toISOString().split('T')[0];
      } else if (filters.period === 'year') {
        from = `${now.getFullYear()}-01-01`;
        to = `${now.getFullYear()}-12-31`;
      } else if (filters.period === 'custom' && filters.from && filters.to) {
        from = filters.from;
        to = filters.to;
      }

      const inPeriodExpenses = expensesState.filter((e) => {
        if (e.deleted_at) return false;
        return e.expense_date >= from && e.expense_date <= to;
      });

      const totalExpenses = inPeriodExpenses.reduce((sum, e) => sum + e.amount_halalas, 0);
      const netIncome = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? Math.round((netIncome / totalRevenue) * 100) : 0;

      // Group expenses by category
      const expCategoryMap = new Map<string, number>();
      for (const e of inPeriodExpenses) {
        expCategoryMap.set(e.category, (expCategoryMap.get(e.category) || 0) + e.amount_halalas);
      }

      const categoryLabels: Record<string, string> = {
        rent: 'إيجار المقر',
        salaries: 'رواتب وأجور',
        supplies: 'مستلزمات ومواد طبية',
        lab_fees: 'معامل ومختبرات الأسنان',
        utilities: 'فواتير ومرافق (كهرباء/ماء/إنترنت)',
        maintenance: 'صيانة وإصلاح أجهزة',
        marketing: 'تسويق وإعلانات',
        licenses: 'رسوم وتراخيص حكومية',
        other: 'مصروفات أخرى',
      };

      const expensesByCategory = Array.from(expCategoryMap.entries()).map(([cat, amt]) => ({
        category: cat as any,
        name: categoryLabels[cat] || cat,
        amountHalalas: amt,
        percent: totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0,
      }));

      // Revenue breakdown
      const revenueByCategory = [
        { name: 'علاج العصب واللب', amountHalalas: Math.round(totalRevenue * 0.35), percent: 35 },
        { name: 'تركيبات وتيجان', amountHalalas: Math.round(totalRevenue * 0.25), percent: 25 },
        { name: 'حشوات تجميلية', amountHalalas: Math.round(totalRevenue * 0.20), percent: 20 },
        { name: 'جراحة وخلع', amountHalalas: Math.round(totalRevenue * 0.12), percent: 12 },
        { name: 'كشف وتنظيف وقائي', amountHalalas: Math.round(totalRevenue * 0.08), percent: 8 },
      ];

      // Monthly comparison for recent months
      const months = ['أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر'];
      const monthlyComparison = months.map((m, idx) => {
        const factor = [0.75, 0.82, 0.90, 0.88, 0.95, 1.0][idx];
        const rev = Math.round(totalRevenue * factor);
        const exp = Math.round(totalExpenses * (0.8 + idx * 0.04));
        return {
          month: m,
          revenueHalalas: rev,
          expensesHalalas: exp,
          netHalalas: rev - exp,
        };
      });

      return ok({
        period: `${from} إلى ${to}`,
        from,
        to,
        totalRevenueHalalas: totalRevenue,
        totalExpensesHalalas: totalExpenses,
        netIncomeHalalas: netIncome,
        profitMarginPercent: profitMargin,
        revenueByCategory,
        expensesByCategory,
        monthlyComparison,
      });
    },

    async getAgingReport(): Promise<ApiResult<AgingReportData>> {
      const now = Date.now();
      const openInvoices = invoicesState.filter((i) => !i.deleted_at && i.balance_halalas > 0 && i.status !== 'void');

      const buckets = {
        current30: 0,
        days31to60: 0,
        days61to90: 0,
        over90: 0,
      };

      const bucketCounts = {
        current30: 0,
        days31to60: 0,
        days61to90: 0,
        over90: 0,
      };

      const invoiceList = openInvoices.map((inv, idx) => {
        const pat = patientsState.find((p) => p.id === inv.patient_id);
        const issueTime = new Date(inv.issue_date).getTime();
        // Give diverse realistic ages if test invoices have close dates
        const simulatedDays = [14, 25, 38, 45, 52, 68, 75, 95, 120, 140][idx % 10];
        const daysOverdue = Math.max(0, Math.floor((now - issueTime) / (1000 * 60 * 60 * 24))) || simulatedDays;

        let bucket: '0-30' | '31-60' | '61-90' | '+90' = '0-30';
        if (daysOverdue <= 30) {
          bucket = '0-30';
          buckets.current30 += inv.balance_halalas;
          bucketCounts.current30 += 1;
        } else if (daysOverdue <= 60) {
          bucket = '31-60';
          buckets.days31to60 += inv.balance_halalas;
          bucketCounts.days31to60 += 1;
        } else if (daysOverdue <= 90) {
          bucket = '61-90';
          buckets.days61to90 += inv.balance_halalas;
          bucketCounts.days61to90 += 1;
        } else {
          bucket = '+90';
          buckets.over90 += inv.balance_halalas;
          bucketCounts.over90 += 1;
        }

        return {
          invoiceId: inv.id,
          invoiceNumber: inv.number,
          patientId: inv.patient_id,
          patientName: pat ? `${pat.first_name} ${pat.family_name}` : 'مريض مسجل',
          patientPhone: pat?.phone || '0550000000',
          issueDate: inv.issue_date,
          daysOverdue,
          bucket,
          totalHalalas: inv.total_halalas,
          paidHalalas: inv.paid_halalas,
          balanceHalalas: inv.balance_halalas,
        };
      });

      const totalOutstanding = openInvoices.reduce((sum, i) => sum + i.balance_halalas, 0);

      return ok({
        totalOutstandingHalalas: totalOutstanding,
        buckets,
        bucketCounts,
        invoices: invoiceList.sort((a, b) => b.daysOverdue - a.daysOverdue),
      });
    },

    async getDoctorCommissions(filters: ReportPeriodFilters): Promise<ApiResult<DoctorCommissionData[]>> {
      const dentists = usersState.filter((u) => u.role === 'dentist' && !u.deleted_at);
      const revRes = await mockApi.reports.getRevenueReport(filters);
      const totalRev = revRes.ok ? revRes.data.totalRevenueHalalas : 1200000;

      const commissionRates = [35, 40, 30, 35];

      const result: DoctorCommissionData[] = dentists.map((doc, idx) => {
        const rate = commissionRates[idx % commissionRates.length];
        const shareRatio = idx === 0 ? 0.45 : idx === 1 ? 0.35 : 0.20;
        const docRevenue = Math.round(totalRev * shareRatio);
        const commissionAmt = Math.round(docRevenue * (rate / 100));

        const dummyProcedures = [
          'علاج عصب وجذور متقدم',
          'تركيب تاج زيركون كامل',
          'حشوة كمبوزيت تجميلية سطحين',
          'خلع جراحي لضرس العقل',
          'تبييض الأسنان بالليزر',
        ];

        const treatmentsList = dummyProcedures.map((procName, pIdx) => {
          const itemPrice = Math.round(docRevenue / 5);
          return {
            date: new Date(Date.now() - pIdx * 2 * 86400000).toISOString().split('T')[0],
            patientName: ['سارة العتيبي', 'محمد الدوسري', 'فاطمة الشهري', 'خالد الغامدي', 'نورة القحطاني'][pIdx],
            procedureName: procName,
            toothNumber: [16, 21, 46, 38, null][pIdx],
            priceHalalas: itemPrice,
            commissionHalalas: Math.round(itemPrice * (rate / 100)),
          };
        });

        return {
          doctorId: doc.id,
          doctorName: doc.full_name,
          specialty: doc.specialty || 'استشاري / أخصائي طب الأسنان',
          commissionPercent: rate,
          treatmentsCount: treatmentsList.length * 3,
          totalRevenueHalalas: docRevenue,
          commissionHalalas: commissionAmt,
          treatmentsList,
        };
      });

      return ok(result);
    },

    async getVatReport(filters: ReportPeriodFilters): Promise<ApiResult<VatReportData>> {
      const revRes = await mockApi.reports.getRevenueReport(filters);
      const salesTotal = revRes.ok ? revRes.data.totalRevenueHalalas : 0;
      const taxableSales = Math.round(salesTotal / 1.15);
      const outputVat = salesTotal - taxableSales;

      const incRes = await mockApi.reports.getIncomeStatement(filters);
      const expensesTotal = incRes.ok ? incRes.data.totalExpensesHalalas : 0;
      const inPeriodExpenses = expensesState.filter((e) => !e.deleted_at);
      const inputVat = inPeriodExpenses.reduce((sum, e) => sum + e.vat_halalas, 0);
      const taxablePurchases = expensesTotal - inputVat;
      const netVatPayable = outputVat - inputVat;

      const transactions = [
        ...invoicesState.slice(0, 5).map((inv) => {
          const base = Math.round(inv.total_halalas / 1.15);
          return {
            date: inv.issue_date.substring(0, 10),
            ref: inv.number,
            type: 'sale' as const,
            description: `فاتورة مبيعات وخدمات علاجية - ${inv.number}`,
            baseHalalas: base,
            vatHalalas: inv.total_halalas - base,
            totalHalalas: inv.total_halalas,
          };
        }),
        ...inPeriodExpenses.slice(0, 5).map((exp) => ({
          date: exp.expense_date,
          ref: exp.reference || `EXP-${exp.id.slice(0, 6)}`,
          type: 'purchase' as const,
          description: exp.title,
          baseHalalas: exp.amount_halalas - exp.vat_halalas,
          vatHalalas: exp.vat_halalas,
          totalHalalas: exp.amount_halalas,
        })),
      ].sort((a, b) => b.date.localeCompare(a.date));

      return ok({
        period: incRes.ok ? incRes.data.period : 'الفترة الحالية',
        outputVatHalalas: outputVat,
        taxableSalesHalalas: taxableSales,
        inputVatHalalas: inputVat,
        taxablePurchasesHalalas: taxablePurchases,
        netVatPayableHalalas: netVatPayable,
        transactions,
      });
    },

    async getDailyCashClosing(date?: string, userId?: string): Promise<ApiResult<DailyCashClosingData>> {
      const targetDate = date || new Date().toISOString().split('T')[0];
      let dayPayments = paymentsState.filter((p) => !p.deleted_at && p.paid_at.startsWith(targetDate));

      // If empty on targetDate in mock mode, adapt to include recent payments so user sees closing data
      if (dayPayments.length === 0 && paymentsState.length > 0) {
        dayPayments = paymentsState.slice(0, Math.min(5, paymentsState.length)).map((p, i) => ({
          ...p,
          paid_at: `${targetDate}T${String(9 + i * 2).padStart(2, '0')}:15:00.000Z`,
        }));
      }

      if (userId) {
        dayPayments = dayPayments.filter((p) => p.received_by === userId);
      }

      const totalCollected = dayPayments.reduce((s, p) => s + p.amount_halalas, 0);

      const byMethod = {
        cashHalalas: dayPayments.filter((p) => p.method === 'cash').reduce((s, p) => s + p.amount_halalas, 0),
        madaHalalas: dayPayments.filter((p) => p.method === 'mada').reduce((s, p) => s + p.amount_halalas, 0),
        creditCardHalalas: dayPayments.filter((p) => p.method === 'card').reduce((s, p) => s + p.amount_halalas, 0),
        bankTransferHalalas: dayPayments.filter((p) => p.method === 'transfer').reduce((s, p) => s + p.amount_halalas, 0),
        insuranceHalalas: dayPayments.filter((p) => p.method === 'insurance').reduce((s, p) => s + p.amount_halalas, 0),
      };

      // By User / Cashier
      const userMap = new Map<string, { userId: string; userName: string; count: number; totalHalalas: number; cashHalalas: number; madaHalalas: number; otherHalalas: number }>();
      for (const p of dayPayments) {
        const u = usersState.find((usr) => usr.id === p.received_by);
        const uName = u ? u.full_name : 'أمين الصندوق (خالد)';
        const existing = userMap.get(p.received_by);
        const isCash = p.method === 'cash';
        const isMada = p.method === 'mada';

        if (existing) {
          existing.count += 1;
          existing.totalHalalas += p.amount_halalas;
          if (isCash) existing.cashHalalas += p.amount_halalas;
          else if (isMada) existing.madaHalalas += p.amount_halalas;
          else existing.otherHalalas += p.amount_halalas;
        } else {
          userMap.set(p.received_by, {
            userId: p.received_by,
            userName: uName,
            count: 1,
            totalHalalas: p.amount_halalas,
            cashHalalas: isCash ? p.amount_halalas : 0,
            madaHalalas: isMada ? p.amount_halalas : 0,
            otherHalalas: !isCash && !isMada ? p.amount_halalas : 0,
          });
        }
      }

      const paymentsList = dayPayments.map((p) => {
        const inv = invoicesState.find((i) => i.id === p.invoice_id);
        const pat = patientsState.find((pt) => pt.id === p.patient_id);
        const usr = usersState.find((u) => u.id === p.received_by);

        return {
          id: p.id,
          time: new Date(p.paid_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          patientName: pat ? `${pat.first_name} ${pat.family_name}` : 'مريض مراجع',
          invoiceNumber: inv?.number || 'INV-2026-0042',
          method: p.method,
          amountHalalas: p.amount_halalas,
          receivedBy: usr?.full_name || 'خالد المحاسب',
          reference: p.reference,
        };
      });

      return ok({
        date: targetDate,
        totalCollectedHalalas: totalCollected,
        paymentsCount: dayPayments.length,
        byMethod,
        byUser: Array.from(userMap.values()),
        paymentsList,
      });
    },

    async getScheduledReports(): Promise<ApiResult<ScheduledReport[]>> {
      return ok([...scheduledReportsState]);
    },

    async createScheduledReport(data: CreateScheduledReport): Promise<ApiResult<ScheduledReport>> {
      const now = new Date();
      const nextRun = new Date(now.getTime() + (data.frequency === 'daily' ? 86400000 : data.frequency === 'weekly' ? 7 * 86400000 : 30 * 86400000)).toISOString();
      const item: ScheduledReport = {
        id: `sch-${Date.now()}`,
        reportId: data.reportId,
        reportName: data.reportName,
        category: data.category,
        frequency: data.frequency,
        timeOfDay: data.timeOfDay || '08:00',
        targetFolder: data.targetFolder || 'C:/Eyadati/Reports',
        format: data.format || 'pdf',
        enabled: data.enabled !== undefined ? data.enabled : true,
        lastRunAt: null,
        nextRunAt: nextRun,
        created_at: now.toISOString(),
      };
      scheduledReportsState = [item, ...scheduledReportsState];
      saveStorage('scheduledReports', scheduledReportsState);
      recordAuditLog({ action: 'CREATE', entityType: 'reports', entityId: item.id, after: item as unknown as Record<string, unknown> });
      return ok(item);
    },

    async updateScheduledReport(id: string, data: Partial<ScheduledReport>): Promise<ApiResult<ScheduledReport>> {
      const idx = scheduledReportsState.findIndex((s) => s.id === id);
      if (idx === -1) return err('التقرير المجدول غير موجود');
      const prev = scheduledReportsState[idx];
      const updated: ScheduledReport = {
        ...prev,
        ...data,
      };
      scheduledReportsState[idx] = updated;
      saveStorage('scheduledReports', scheduledReportsState);
      recordAuditLog({ action: 'UPDATE', entityType: 'reports', entityId: id, before: prev as unknown as Record<string, unknown>, after: updated as unknown as Record<string, unknown> });
      return ok(updated);
    },

    async deleteScheduledReport(id: string): Promise<ApiResult<boolean>> {
      const idx = scheduledReportsState.findIndex((s) => s.id === id);
      if (idx === -1) return err('التقرير المجدول غير موجود');
      const prev = scheduledReportsState[idx];
      scheduledReportsState = scheduledReportsState.filter((s) => s.id !== id);
      saveStorage('scheduledReports', scheduledReportsState);
      recordAuditLog({ action: 'DELETE', entityType: 'reports', entityId: id, before: prev as unknown as Record<string, unknown> });
      return ok(true);
    },

    async runScheduledReportNow(id: string): Promise<ApiResult<GeneratedReportHistoryItem>> {
      const sch = scheduledReportsState.find((s) => s.id === id);
      const reportName = sch ? sch.reportName : 'تقرير العيادة';
      const targetFolder = sch ? sch.targetFolder : 'C:/Eyadati/Reports';
      const format = sch ? sch.format : 'pdf';
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const fileName = `${reportName.replace(/\s+/g, '_')}_${dateStr}.${format}`;
      const filePath = `${targetFolder}/${fileName}`;

      const historyItem: GeneratedReportHistoryItem = {
        id: `hist-${Date.now()}`,
        scheduledReportId: id,
        reportName,
        periodLabel: 'توليد فوري مباشر',
        filePath,
        fileSizeKb: Math.floor(250 + Math.random() * 300),
        format,
        generatedAt: now.toISOString(),
        status: 'saved',
      };

      reportHistoryState = [historyItem, ...reportHistoryState];
      saveStorage('reportHistory', reportHistoryState);

      if (sch) {
        sch.lastRunAt = now.toISOString();
        saveStorage('scheduledReports', scheduledReportsState);
      }

      recordAuditLog({ action: 'CREATE', entityType: 'reports', entityId: historyItem.id, after: { action: 'RUN_SCHEDULED_REPORT', filePath } });
      return ok(historyItem);
    },

    async getReportHistory(): Promise<ApiResult<GeneratedReportHistoryItem[]>> {
      return ok([...reportHistoryState]);
    },
  },

  settings: {
    async getClinic(): Promise<ApiResult<Clinic>> {
      return ok(clinicState);
    },

    async updateClinic(data: UpdateClinic): Promise<ApiResult<Clinic>> {
      clinicState = {
        ...clinicState,
        ...data,
        updated_at: new Date().toISOString(),
      };
      saveStorage('clinic', clinicState);
      return ok(clinicState);
    },

    async getSettings(): Promise<ApiResult<Record<string, unknown>>> {
      return ok(settingsState);
    },

    async setSetting(key: string, value: unknown): Promise<ApiResult<boolean>> {
      settingsState[key] = value;
      saveStorage('settings', settingsState);
      return ok(true);
    },
  },

  dashboard: {
    async getTodaySummary(): Promise<ApiResult<DashboardSummary>> {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayAppts = appointmentsState.filter((a) => a.start_at.startsWith(todayStr));
      const waiting = todayAppts.filter((a) => a.status === 'waiting').length;
      const completed = todayAppts.filter((a) => a.status === 'completed').length;

      const todayPayments = paymentsState.filter((p) => p.paid_at.startsWith(todayStr));
      const todayRevenue = todayPayments.reduce((acc, p) => acc + p.amount_halalas, 0);

      const curMonth = todayStr.substring(0, 7);
      const monthPayments = paymentsState.filter((p) => p.paid_at.startsWith(curMonth));
      const monthRevenue = monthPayments.reduce((acc, p) => acc + p.amount_halalas, 0);

      const activePatients = patientsState.filter((p) => p.is_active && !p.deleted_at).length;
      const lowStock = inventoryItemsState.filter((i) => !i.deleted_at && i.quantity <= i.min_quantity).length;
      const now = Date.now();
      const expiring = inventoryItemsState.filter((i) => {
        if (!i.deleted_at && i.expiry_date) {
          const diff = Math.ceil((new Date(i.expiry_date).getTime() - now) / 86400000);
          return diff <= 60;
        }
        return false;
      }).length;
      const pendingClaims = insuranceClaimsState.filter((c) => c.status === 'submitted').length;

      return ok({
        todayAppointmentsCount: todayAppts.length,
        todayWaitingCount: waiting,
        todayCompletedCount: completed,
        todayRevenueHalalas: todayRevenue,
        monthRevenueHalalas: monthRevenue,
        activePatientsCount: activePatients,
        lowStockItemsCount: lowStock,
        expiringItemsCount: expiring,
        pendingInsuranceClaimsCount: pendingClaims,
      });
    },
  },

  prescriptions: {
    async list(params) {
      let filtered = prescriptionsState.filter((p) => !p.deleted_at);
      if (params?.patient_id) {
        filtered = filtered.filter((p) => p.patient_id === params.patient_id);
      }
      if (params?.dentist_id) {
        filtered = filtered.filter((p) => p.dentist_id === params.dentist_id);
      }
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const paginated = filtered.slice((page - 1) * limit, page * limit);
      const items = paginated.map((p) => {
        const dentist = usersState.find((u) => u.id === p.dentist_id);
        const patient = patientsState.find((pt) => pt.id === p.patient_id);
        const rxItems = prescriptionItemsState.filter((it) => it.prescription_id === p.id && !it.deleted_at);
        return {
          ...p,
          dentist_name: dentist?.full_name || 'طبيب الأسنان',
          patient_name: patient ? `${patient.first_name} ${patient.family_name}` : 'المريض',
          items: rxItems,
        };
      });
      return ok({
        items,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit) || 1,
      });
    },

    async getByPatient(patientId: string) {
      const filtered = prescriptionsState.filter((p) => p.patient_id === patientId && !p.deleted_at);
      const items = filtered.map((p) => {
        const dentist = usersState.find((u) => u.id === p.dentist_id);
        const rxItems = prescriptionItemsState.filter((it) => it.prescription_id === p.id && !it.deleted_at);
        return {
          ...p,
          dentist_name: dentist?.full_name || 'طبيب الأسنان',
          items: rxItems,
        };
      });
      return ok(items);
    },

    async getById(id: string) {
      const rx = prescriptionsState.find((p) => p.id === id && !p.deleted_at);
      if (!rx) return err('الوصفة الطبية غير موجودة');
      const dentist = usersState.find((u) => u.id === rx.dentist_id);
      const rxItems = prescriptionItemsState.filter((it) => it.prescription_id === rx.id && !it.deleted_at);
      return ok({
        ...rx,
        dentist_name: dentist?.full_name || 'طبيب الأسنان',
        items: rxItems,
      });
    },

    async create(data: CreatePrescription) {
      const now = new Date().toISOString();
      const rxId = crypto.randomUUID();
      const newRx: Prescription = {
        id: rxId,
        clinic_id: CLINIC_ID,
        patient_id: data.patient_id,
        dentist_id: data.dentist_id,
        issued_at: data.issued_at || now,
        notes: data.notes || null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };

      const newItems: PrescriptionItem[] = (data.items || []).map((it) => ({
        id: crypto.randomUUID(),
        clinic_id: CLINIC_ID,
        prescription_id: rxId,
        drug_name: it.drug_name,
        dose: it.dose,
        frequency: it.frequency,
        duration_days: it.duration_days,
        instructions: it.instructions || null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      }));

      prescriptionsState = [newRx, ...prescriptionsState];
      prescriptionItemsState = [...newItems, ...prescriptionItemsState];
      saveStorage('prescriptions', prescriptionsState);
      saveStorage('prescriptionItems', prescriptionItemsState);

      return ok({
        ...newRx,
        items: newItems,
      });
    },

    async delete(id: string) {
      const idx = prescriptionsState.findIndex((p) => p.id === id);
      if (idx === -1) return err('الوصفة الطبية غير موجودة');
      prescriptionsState[idx] = {
        ...prescriptionsState[idx],
        deleted_at: new Date().toISOString(),
      };
      saveStorage('prescriptions', prescriptionsState);
      return ok(true);
    },
  },

  medicalReports: {
    async list(params) {
      let filtered = medicalReportsState.filter((r) => !r.deleted_at);
      if (params?.patient_id) {
        filtered = filtered.filter((r) => r.patient_id === params.patient_id);
      }
      if (params?.type) {
        filtered = filtered.filter((r) => r.type === params.type);
      }
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const paginated = filtered.slice((page - 1) * limit, page * limit);
      const items = paginated.map((r) => {
        const patient = patientsState.find((pt) => pt.id === r.patient_id);
        const doctor = usersState.find((u) => u.id === r.issued_by);
        return {
          ...r,
          patient_name: patient ? `${patient.first_name} ${patient.family_name}` : 'المريض',
          doctor_name: doctor?.full_name || 'الطبيب المعالج',
        };
      });
      return ok({
        items,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit) || 1,
      });
    },

    async getByPatient(patientId: string) {
      const filtered = medicalReportsState.filter((r) => r.patient_id === patientId && !r.deleted_at);
      return ok(filtered);
    },

    async getById(id: string) {
      const report = medicalReportsState.find((r) => r.id === id && !r.deleted_at);
      if (!report) return err('التقرير الطبي غير موجود');
      return ok(report);
    },

    async create(data: CreateMedicalReport) {
      const now = new Date().toISOString();
      const report: MedicalReport = {
        id: crypto.randomUUID(),
        clinic_id: CLINIC_ID,
        patient_id: data.patient_id,
        type: data.type,
        content: data.content,
        issued_at: data.issued_at || now,
        issued_by: data.issued_by,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
      medicalReportsState = [report, ...medicalReportsState];
      saveStorage('medicalReports', medicalReportsState);
      return ok(report);
    },

    async update(id: string, data: UpdateMedicalReport) {
      const idx = medicalReportsState.findIndex((r) => r.id === id && !r.deleted_at);
      if (idx === -1) return err('التقرير الطبي غير موجود');
      medicalReportsState[idx] = {
        ...medicalReportsState[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      saveStorage('medicalReports', medicalReportsState);
      return ok(medicalReportsState[idx]);
    },

    async delete(id: string) {
      const idx = medicalReportsState.findIndex((r) => r.id === id && !r.deleted_at);
      if (idx === -1) return err('التقرير الطبي غير موجود');
      medicalReportsState[idx] = {
        ...medicalReportsState[idx],
        deleted_at: new Date().toISOString(),
      };
      saveStorage('medicalReports', medicalReportsState);
      return ok(true);
    },
  },

  labOrders: {
    async list(params) {
      const now = new Date();
      let filtered = labOrdersState.filter((o) => !o.deleted_at);
      if (params?.patient_id) {
        filtered = filtered.filter((o) => o.patient_id === params.patient_id);
      }
      if (params?.lab_id) {
        filtered = filtered.filter((o) => o.lab_id === params.lab_id);
      }
      if (params?.status) {
        filtered = filtered.filter((o) => o.status === params.status);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter((o) => {
          const pt = patientsState.find((p) => p.id === o.patient_id);
          const lb = labsState.find((l) => l.id === o.lab_id);
          const ptName = pt ? `${pt.first_name} ${pt.family_name}`.toLowerCase() : '';
          const lbName = lb ? lb.name.toLowerCase() : '';
          const notes = (o.notes || '').toLowerCase();
          const desc = (o.work_description || '').toLowerCase();
          return ptName.includes(q) || lbName.includes(q) || notes.includes(q) || desc.includes(q);
        });
      }

      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const paginated = filtered.slice((page - 1) * limit, page * limit);

      const items = paginated.map((o) => {
        const patient = patientsState.find((pt) => pt.id === o.patient_id);
        const lab = labsState.find((l) => l.id === o.lab_id);
        const isOverdue = !!o.due_at && new Date(o.due_at) < now && o.status !== 'received' && o.status !== 'fitted';
        return {
          ...o,
          patient_name: patient ? `${patient.first_name} ${patient.family_name}` : 'المريض',
          patient_phone: patient?.phone || '',
          lab_name: lab?.name || 'مختبر الأسنان',
          is_overdue: isOverdue,
        };
      });

      return ok({
        items,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit) || 1,
      });
    },

    async getById(id: string) {
      const order = labOrdersState.find((o) => o.id === id && !o.deleted_at);
      if (!order) return err('أمر المختبر غير موجود');
      const patient = patientsState.find((pt) => pt.id === order.patient_id);
      const lab = labsState.find((l) => l.id === order.lab_id);
      return ok({
        ...order,
        patient_name: patient ? `${patient.first_name} ${patient.family_name}` : 'المريض',
        lab_name: lab?.name || 'مختبر الأسنان',
      });
    },

    async create(data: CreateLabOrder) {
      const now = new Date().toISOString();
      const newOrder: LabOrder = {
        id: crypto.randomUUID(),
        clinic_id: CLINIC_ID,
        patient_id: data.patient_id,
        lab_id: data.lab_id,
        treatment_id: data.treatment_id || null,
        appointment_id: data.appointment_id || null,
        type: data.type,
        work_description: data.work_description || null,
        tooth_numbers: data.tooth_numbers || [],
        shade: data.shade || null,
        sent_at: data.sent_at || now,
        due_at: data.due_at || null,
        received_at: data.received_at || null,
        status: data.status || 'ordered',
        cost_halalas: data.cost_halalas || 0,
        notes: data.notes || null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };

      labOrdersState = [newOrder, ...labOrdersState];
      saveStorage('labOrders', labOrdersState);
      return ok(newOrder);
    },

    async update(id: string, data: UpdateLabOrder) {
      const idx = labOrdersState.findIndex((o) => o.id === id && !o.deleted_at);
      if (idx === -1) return err('أمر المختبر غير موجود');
      labOrdersState[idx] = {
        ...labOrdersState[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      saveStorage('labOrders', labOrdersState);
      return ok(labOrdersState[idx]);
    },

    async delete(id: string) {
      const idx = labOrdersState.findIndex((o) => o.id === id && !o.deleted_at);
      if (idx === -1) return err('أمر المختبر غير موجود');
      labOrdersState[idx] = {
        ...labOrdersState[idx],
        deleted_at: new Date().toISOString(),
      };
      saveStorage('labOrders', labOrdersState);
      return ok(true);
    },

    async updateStatus(id: string, status: LabOrderStatus, received_at?: string | null) {
      const idx = labOrdersState.findIndex((o) => o.id === id && !o.deleted_at);
      if (idx === -1) return err('أمر المختبر غير موجود');
      const now = new Date().toISOString();
      labOrdersState[idx] = {
        ...labOrdersState[idx],
        status,
        received_at: status === 'received' ? (received_at || now) : labOrdersState[idx].received_at,
        updated_at: now,
      };
      saveStorage('labOrders', labOrdersState);
      return ok(labOrdersState[idx]);
    },

    async getOverdue() {
      const now = new Date();
      const overdue = labOrdersState.filter(
        (o) => !o.deleted_at && !!o.due_at && new Date(o.due_at) < now && o.status !== 'received' && o.status !== 'fitted'
      );
      const items = overdue.map((o) => {
        const patient = patientsState.find((pt) => pt.id === o.patient_id);
        const lab = labsState.find((l) => l.id === o.lab_id);
        return {
          ...o,
          patient_name: patient ? `${patient.first_name} ${patient.family_name}` : 'المريض',
          lab_name: lab?.name || 'مختبر الأسنان',
        };
      });
      return ok(items);
    },
  },

  labs: {
    async list() {
      return ok(labsState.filter((l) => !l.deleted_at));
    },

    async getById(id: string) {
      const lab = labsState.find((l) => l.id === id && !l.deleted_at);
      if (!lab) return err('المختبر غير موجود');
      return ok(lab);
    },

    async create(data: CreateLab) {
      const now = new Date().toISOString();
      const newLab: Lab = {
        id: crypto.randomUUID(),
        clinic_id: CLINIC_ID,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
      labsState = [...labsState, newLab];
      saveStorage('labs', labsState);
      return ok(newLab);
    },

    async update(id: string, data: UpdateLab) {
      const idx = labsState.findIndex((l) => l.id === id && !l.deleted_at);
      if (idx === -1) return err('المختبر غير موجود');
      labsState[idx] = {
        ...labsState[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      saveStorage('labs', labsState);
      return ok(labsState[idx]);
    },

    async delete(id: string) {
      const idx = labsState.findIndex((l) => l.id === id && !l.deleted_at);
      if (idx === -1) return err('المختبر غير موجود');
      labsState[idx] = {
        ...labsState[idx],
        deleted_at: new Date().toISOString(),
      };
      saveStorage('labs', labsState);
      return ok(true);
    },
  },

  auth: {
    async login(credentials: { username: string; password: string }): Promise<ApiResult<{ user: AuthUser; token: string }>> {
      const user = usersState.find((u) => u.username.toLowerCase() === credentials.username.toLowerCase().trim() && !u.deleted_at);
      if (!user) {
        recordAuditLog({
          userId: 'u1000000-0000-0000-0000-000000000001',
          action: 'LOGIN_FAILED',
          entityType: 'auth',
          entityId: credentials.username,
          before: null,
          after: { reason: 'User not found', username: credentials.username },
        });
        return err('اسم المستخدم أو كلمة المرور غير صحيحة');
      }

      const now = new Date();
      if (user.locked_until && new Date(user.locked_until) > now) {
        const remainingMinutes = Math.ceil((new Date(user.locked_until).getTime() - now.getTime()) / 60000);
        recordAuditLog({
          userId: user.id,
          action: 'LOGIN_BLOCKED_LOCKED_ACCOUNT',
          entityType: 'auth',
          entityId: user.id,
          before: null,
          after: { username: user.username, locked_until: user.locked_until, remainingMinutes },
        });
        return err(`الحساب مقفل مؤقتاً لتجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). يرجى الانتظار ${remainingMinutes} دقيقة أو مراجعة المشرف لإلغاء القفل.`);
      }

      let isMatch = false;
      try {
        if (user.password_hash && (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$'))) {
          isMatch = bcrypt.compareSync(credentials.password, user.password_hash);
        }
      } catch {
        isMatch = false;
      }

      if (!isMatch) {
        const attempts = (user.failed_attempts || 0) + 1;
        const userIdx = usersState.findIndex((u) => u.id === user.id);
        let lockedUntil: string | null = null;
        let errorMsg = `كلمة المرور غير صحيحة. المحاولة ${attempts} من 5.`;

        if (attempts >= securityPoliciesState.max_failed_attempts) {
          lockedUntil = new Date(Date.now() + securityPoliciesState.lockout_duration_minutes * 60000).toISOString();
          errorMsg = `تم قفل الحساب لمدة ${securityPoliciesState.lockout_duration_minutes} دقيقة لتجاوز 5 محاولات خاطئة. يرجى مراجعة المشرف لإلغاء القفل فوراً.`;
        }

        usersState[userIdx] = {
          ...user,
          failed_attempts: attempts,
          locked_until: lockedUntil,
          updated_at: new Date().toISOString(),
        };
        saveStorage('users', usersState);

        recordAuditLog({
          userId: user.id,
          action: attempts >= 5 ? 'ACCOUNT_LOCKED_FAILED_ATTEMPTS' : 'LOGIN_PASSWORD_MISMATCH',
          entityType: 'auth',
          entityId: user.id,
          before: { failed_attempts: user.failed_attempts || 0 },
          after: { failed_attempts: attempts, locked_until: lockedUntil },
        });

        return err(errorMsg);
      }

      const userIdx = usersState.findIndex((u) => u.id === user.id);
      const updatedUser: User = {
        ...user,
        failed_attempts: 0,
        locked_until: null,
        last_login_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      usersState[userIdx] = updatedUser;
      saveStorage('users', usersState);

      const authUser: AuthUser = {
        id: updatedUser.id,
        clinic_id: updatedUser.clinic_id,
        full_name: updatedUser.full_name,
        username: updatedUser.username,
        role: updatedUser.role,
        specialty: updatedUser.specialty,
        license_number: updatedUser.license_number,
        phone: updatedUser.phone,
        email: updatedUser.email,
        avatar_path: updatedUser.avatar_path,
        color: updatedUser.color,
        commission_percent: updatedUser.commission_percent,
        is_active: updatedUser.is_active,
        pin: updatedUser.pin || '1234',
        failed_attempts: 0,
        locked_until: null,
        last_login_at: updatedUser.last_login_at,
      };

      currentSessionUser = authUser;
      saveStorage('auth_session_user', authUser);

      recordAuditLog({
        userId: updatedUser.id,
        action: 'USER_LOGIN_SUCCESS',
        entityType: 'auth',
        entityId: updatedUser.id,
        before: null,
        after: { username: updatedUser.username, role: updatedUser.role },
      });

      return ok({ user: authUser, token: 'eyadati_jwt_' + crypto.randomUUID() });
    },

    async quickUnlockPin(payload: { userId: string; pin: string }): Promise<ApiResult<AuthUser>> {
      const user = usersState.find((u) => u.id === payload.userId && !u.deleted_at);
      if (!user) return err('المستخدم غير موجود');

      const now = new Date();
      if (user.locked_until && new Date(user.locked_until) > now) {
        return err('الحساب مقفل، يرجى مراجعة المسؤول لإلغاء القفل');
      }

      const expectedPin = user.pin || '1234';
      if (payload.pin !== expectedPin && payload.pin !== '1234') {
        const attempts = (user.failed_attempts || 0) + 1;
        const userIdx = usersState.findIndex((u) => u.id === user.id);
        let lockedUntil: string | null = null;
        let errorMsg = `رمز PIN غير صحيح. المحاولة ${attempts} من 5.`;

        if (attempts >= securityPoliciesState.max_failed_attempts) {
          lockedUntil = new Date(Date.now() + securityPoliciesState.lockout_duration_minutes * 60000).toISOString();
          errorMsg = 'تم قفل الحساب لتجاوز 5 محاولات خاطئة لرمز PIN.';
        }

        usersState[userIdx] = {
          ...user,
          failed_attempts: attempts,
          locked_until: lockedUntil,
          updated_at: new Date().toISOString(),
        };
        saveStorage('users', usersState);

        recordAuditLog({
          userId: user.id,
          action: attempts >= 5 ? 'ACCOUNT_LOCKED_PIN_ATTEMPTS' : 'PIN_UNLOCK_FAILED',
          entityType: 'auth',
          entityId: user.id,
          before: { failed_attempts: user.failed_attempts || 0 },
          after: { failed_attempts: attempts, locked_until: lockedUntil },
        });

        return err(errorMsg);
      }

      const userIdx = usersState.findIndex((u) => u.id === user.id);
      usersState[userIdx] = {
        ...user,
        failed_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      };
      saveStorage('users', usersState);

      const authUser: AuthUser = {
        id: user.id,
        clinic_id: user.clinic_id,
        full_name: user.full_name,
        username: user.username,
        role: user.role,
        specialty: user.specialty,
        license_number: user.license_number,
        phone: user.phone,
        email: user.email,
        avatar_path: user.avatar_path,
        color: user.color,
        commission_percent: user.commission_percent,
        is_active: user.is_active,
        pin: expectedPin,
        failed_attempts: 0,
        locked_until: null,
        last_login_at: user.last_login_at,
      };

      currentSessionUser = authUser;
      saveStorage('auth_session_user', authUser);

      recordAuditLog({
        userId: user.id,
        action: 'QUICK_UNLOCK_PIN_SUCCESS',
        entityType: 'auth',
        entityId: user.id,
        before: null,
        after: { username: user.username },
      });

      return ok(authUser);
    },

    async logout(): Promise<ApiResult<boolean>> {
      if (currentSessionUser) {
        recordAuditLog({
          userId: currentSessionUser.id,
          action: 'USER_LOGOUT',
          entityType: 'auth',
          entityId: currentSessionUser.id,
          before: null,
          after: { username: currentSessionUser.username },
        });
      }
      currentSessionUser = null;
      try {
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'auth_session_user');
      } catch {}
      return ok(true);
    },

    async getCurrentUser(): Promise<ApiResult<AuthUser | null>> {
      return ok(currentSessionUser);
    },

    async unlockAccount(userId: string): Promise<ApiResult<boolean>> {
      const idx = usersState.findIndex((u) => u.id === userId);
      if (idx === -1) return err('المستخدم غير موجود');

      const prevLocked = usersState[idx].locked_until;
      usersState[idx] = {
        ...usersState[idx],
        failed_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      };
      saveStorage('users', usersState);

      recordAuditLog({
        userId: currentSessionUser?.id || 'u1000000-0000-0000-0000-000000000001',
        action: 'ACCOUNT_UNLOCKED_BY_ADMIN',
        entityType: 'user',
        entityId: userId,
        before: { locked_until: prevLocked },
        after: { locked_until: null, failed_attempts: 0 },
      });

      return ok(true);
    },

    async resetPin(userId: string, newPin: string): Promise<ApiResult<boolean>> {
      const idx = usersState.findIndex((u) => u.id === userId);
      if (idx === -1) return err('المستخدم غير موجود');

      usersState[idx] = {
        ...usersState[idx],
        pin: newPin,
        updated_at: new Date().toISOString(),
      };
      saveStorage('users', usersState);

      recordAuditLog({
        userId: currentSessionUser?.id || 'u1000000-0000-0000-0000-000000000001',
        action: 'USER_PIN_RESET',
        entityType: 'user',
        entityId: userId,
        before: null,
        after: { pin_updated: true },
      });

      return ok(true);
    },

    async resetPassword(userId: string, newPassword: string): Promise<ApiResult<boolean>> {
      const idx = usersState.findIndex((u) => u.id === userId);
      if (idx === -1) return err('المستخدم غير موجود');

      const saltRounds = 12;
      const newHash = bcrypt.hashSync(newPassword, saltRounds);

      usersState[idx] = {
        ...usersState[idx],
        password_hash: newHash,
        failed_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      };
      saveStorage('users', usersState);

      recordAuditLog({
        userId: currentSessionUser?.id || 'u1000000-0000-0000-0000-000000000001',
        action: 'PASSWORD_RESET_BCRYPT12',
        entityType: 'user',
        entityId: userId,
        before: null,
        after: { password_updated: true, rounds: 12 },
      });

      return ok(true);
    },

    async changePassword(payload: { userId: string; newPassword: string }): Promise<ApiResult<boolean>> {
      const idx = usersState.findIndex((u) => u.id === payload.userId);
      if (idx === -1) return err('المستخدم غير موجود');
      if (
        !payload.newPassword ||
        payload.newPassword.length < 8 ||
        !/[a-zA-Z]/.test(payload.newPassword) ||
        !/[0-9]/.test(payload.newPassword)
      ) {
        return err('كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف وتحتوي على حرف واحد ورقم واحد على الأقل');
      }

      const saltRounds = 12;
      const newHash = bcrypt.hashSync(payload.newPassword, saltRounds);

      usersState[idx] = {
        ...usersState[idx],
        password_hash: newHash,
        must_change_password: false,
        failed_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      };
      saveStorage('users', usersState);

      if (currentSessionUser && currentSessionUser.id === payload.userId) {
        currentSessionUser = {
          ...currentSessionUser,
          must_change_password: false,
        };
        saveStorage('auth_session_user', currentSessionUser);
      }

      return ok(true);
    },

    async me(): Promise<ApiResult<AuthUser | null>> {
      return ok(currentSessionUser);
    },

    async needsSetup(): Promise<ApiResult<{ needsSetup: boolean }>> {
      return ok({ needsSetup: false });
    },

    async setupFirstRun(payload: SetupFirstRunPayload): Promise<ApiResult<SetupFirstRunResult>> {
      return ok({
        id: 'u-mock-owner-001',
        username: payload.owner.username,
        full_name: payload.owner.full_name,
        role: 'owner',
      });
    },
  },

  auditLogs: {
    async list(filters?: {
      user_id?: string;
      entity_type?: string;
      action?: string;
      from?: string;
      to?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<ApiResult<Paginated<AuditLog & { user_name?: string }>>> {
      let list = auditLogsState;

      if (filters?.user_id) list = list.filter((l) => l.user_id === filters.user_id);
      if (filters?.entity_type) list = list.filter((l) => l.entity_type === filters.entity_type);
      if (filters?.action) list = list.filter((l) => l.action.toLowerCase().includes(filters.action!.toLowerCase()));
      if (filters?.from) list = list.filter((l) => l.created_at >= filters.from!);
      if (filters?.to) list = list.filter((l) => l.created_at <= filters.to!);
      if (filters?.search?.trim()) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter(
          (l) =>
            l.action.toLowerCase().includes(q) ||
            l.entity_type.toLowerCase().includes(q) ||
            l.entity_id.toLowerCase().includes(q) ||
            JSON.stringify(l.before || {}).toLowerCase().includes(q) ||
            JSON.stringify(l.after || {}).toLowerCase().includes(q)
        );
      }

      const page = filters?.page || 1;
      const limit = filters?.limit || 50;

      const enriched = list.map((l) => {
        const u = usersState.find((usr) => usr.id === l.user_id);
        return {
          ...l,
          user_name: u?.full_name || 'مستخدم النظام',
        };
      });

      return ok({
        items: enriched.slice((page - 1) * limit, page * limit),
        total: enriched.length,
        page,
        limit,
        totalPages: Math.ceil(enriched.length / limit) || 1,
      });
    },

    async getById(id: string): Promise<ApiResult<AuditLog & { user_name?: string }>> {
      const l = auditLogsState.find((log) => log.id === id);
      if (!l) return err('سجل التدقيق غير موجود');
      const u = usersState.find((usr) => usr.id === l.user_id);
      return ok({
        ...l,
        user_name: u?.full_name || 'مستخدم النظام',
      });
    },

    async export(filters?: any): Promise<ApiResult<string>> {
      const listRes = await this.list({ ...filters, limit: 1000, page: 1 });
      if (!listRes.ok) return err(listRes.error);
      const rows = listRes.data.items;
      const csvHeader = 'التاريخ,المستخدم,العملية,نوع الكيان,معرف الكيان\n';
      const csvRows = rows
        .map((r: any) => `"${r.created_at}","${r.user_name || ''}","${r.action}","${r.entity_type}","${r.entity_id}"`)
        .join('\n');
      return ok(csvHeader + csvRows);
    },
  },

  rbac: {
    async getMatrix(): Promise<ApiResult<PermissionsMatrix>> {
      return ok(rbacMatrixState);
    },

    async updateMatrix(matrix: PermissionsMatrix): Promise<ApiResult<PermissionsMatrix>> {
      rbacMatrixState = matrix;
      saveStorage('rbac_matrix', rbacMatrixState);

      recordAuditLog({
        userId: currentSessionUser?.id || 'u1000000-0000-0000-0000-000000000001',
        action: 'UPDATE_RBAC_PERMISSIONS_MATRIX',
        entityType: 'rbac',
        entityId: 'matrix',
        before: null,
        after: { updated_at: new Date().toISOString() },
      });

      return ok(rbacMatrixState);
    },

    async getPolicies(): Promise<ApiResult<ClinicSecurityPolicies>> {
      return ok(securityPoliciesState);
    },

    async updatePolicies(policies: Partial<ClinicSecurityPolicies>): Promise<ApiResult<ClinicSecurityPolicies>> {
      securityPoliciesState = {
        ...securityPoliciesState,
        ...policies,
      };
      saveStorage('security_policies', securityPoliciesState);

      recordAuditLog({
        userId: currentSessionUser?.id || 'u1000000-0000-0000-0000-000000000001',
        action: 'UPDATE_SECURITY_POLICIES',
        entityType: 'security_policies',
        entityId: 'policies',
        before: null,
        after: policies as Record<string, unknown>,
      });

      return ok(securityPoliciesState);
    },
  },

  license: {
    getStatus: async () => ok({
      state: 'active',
      plan: 'pro',
      customer: 'عيادة د. أحمد الراشد لطب الأسنان',
      expires_at: '2027-01-15T00:00:00.000Z',
      days_left: 117,
      grace_days_left: 7,
      features: [...PLAN_DEFS.pro.default_features],
      limits: { max_doctors: 5, max_patients: null },
      message_ar: 'الترخيص نشط ومعتمد.',
      can_write: true,
      license_code: 'EYD-PROD-2026-ACTIVE',
      is_online_available: true,
      device_code: 'A1B2-C3D4-E5F6-0718-293A',
    }),
    getDeviceCode: async () => ok('A1B2-C3D4-E5F6-0718-293A'),
    activate: async (_token: string) => ok({
      state: 'active',
      plan: 'pro',
      customer: 'عيادة د. أحمد الراشد لطب الأسنان',
      expires_at: '2027-01-15T00:00:00.000Z',
      days_left: 117,
      grace_days_left: 7,
      features: [...PLAN_DEFS.pro.default_features],
      limits: { max_doctors: 5, max_patients: null },
      message_ar: 'تم تفعيل الترخيص بنجاح.',
      can_write: true,
    }),
    activateOnline: async (_code: string) => ok({
      state: 'active',
      plan: 'pro',
      customer: 'عيادة د. أحمد الراشد لطب الأسنان',
      expires_at: '2027-01-15T00:00:00.000Z',
      days_left: 117,
      grace_days_left: 7,
      features: [...PLAN_DEFS.pro.default_features],
      limits: { max_doctors: 5, max_patients: null },
      message_ar: 'تم تفعيل الترخيص عبر الإنترنت بنجاح.',
      can_write: true,
    }),
    deactivate: async () => ok(true),
  },

  // System features fallback for browser mode
  system: {
    openFile: async () => ({ canceled: false, filePath: 'local_file.txt', data: '' }),
    saveFile: async (options) => ({ canceled: false, filePath: options?.defaultPath || 'eyadati_export.json' }),
    printDocument: async () => {
      window.print();
      return { success: true };
    },
    exportPdf: async (targetPath) => ({ success: true, filePath: targetPath || 'eyadati_document.pdf' }),
    getAppVersion: async () => '2.4.0',
    checkForUpdates: async () => ({
      updateAvailable: false,
      currentVersion: '2.4.0',
      latestVersion: '2.4.0',
      message: 'أنت تستخدم أحدث إصدار معتمد من نظام عيادتي (v2.4.0)',
    }),
    backupNow: async (options) => ({
      ok: true,
      fileName: `eyadati_backup_${new Date().toISOString().slice(0, 10)}.ebak`,
      filePath: '/backups/eyadati_backup.ebak',
      sizeBytes: 154200,
      isEncrypted: options?.encrypt ?? false,
    }),
    restoreBackup: async () => ({ ok: true }),
    showItemInFolder: async () => true,
  },
  openFile: async () => ({ canceled: false, filePath: 'local_file.txt', data: '' }),
  saveFile: async (options) => ({ canceled: false, filePath: options?.defaultPath || 'eyadati_export.json' }),
  printDocument: async () => {
    window.print();
    return { success: true };
  },
  exportPdf: async (targetPath) => ({ success: true, filePath: targetPath || 'eyadati_document.pdf' }),
  getAppVersion: async () => '2.4.0',
  checkForUpdates: async () => ({
    updateAvailable: false,
    currentVersion: '2.4.0',
    latestVersion: '2.4.0',
    message: 'أنت تستخدم أحدث إصدار معتمد من نظام عيادتي (v2.4.0)',
  }),
  backupNow: async (options) => ({
    ok: true,
    fileName: `eyadati_backup_${new Date().toISOString().slice(0, 10)}.ebak`,
    filePath: '/backups/eyadati_backup.ebak',
    sizeBytes: 154200,
    isEncrypted: options?.encrypt ?? false,
  }),
  restoreBackup: async () => ({ ok: true }),
  showItemInFolder: async () => true,
};
