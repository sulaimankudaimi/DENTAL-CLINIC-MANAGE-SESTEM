import { z } from 'zod';
import type { LicenseStatus } from './license';

// ============================================================================
// 1. BASE TYPES, RESULTS & PAGINATION CONTRACTS
// ============================================================================

export interface BaseEntity {
  id: string;
  clinic_id: string;
  created_at: string; // ISO 8601 UTC
  updated_at: string; // ISO 8601 UTC
  deleted_at: string | null; // Soft delete
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  clinic_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export const paginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(200).default(20).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc').optional(),
  search: z.string().optional(),
});

// ============================================================================
// 2. ENUMS (UNION TYPES) & ARABIC TRANSLATION DICTIONARIES
// ============================================================================

export const USER_ROLES = ['owner', 'dentist', 'assistant', 'receptionist', 'accountant'] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const USER_ROLE_AR: Record<UserRole, string> = {
  owner: 'مالك العيادة',
  dentist: 'طبيب أسنان',
  assistant: 'مساعد طبيب',
  receptionist: 'موظف استقبال',
  accountant: 'محاسب مالي',
};

export const PERMISSION_ACTIONS = ['view', 'create', 'update', 'delete', 'export'] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
export const PERMISSION_ACTION_AR: Record<PermissionAction, string> = {
  view: 'عرض واستعلام',
  create: 'إضافة وإنشاء',
  update: 'تعديل وتحديث',
  delete: 'حذف ونقل للأرشيف',
  export: 'تصدير بيانات وتقارير',
};

export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];
export const GENDER_AR: Record<Gender, string> = {
  male: 'ذكر',
  female: 'أنثى',
};

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];
export const BLOOD_TYPE_AR: Record<BloodType, string> = {
  'A+': 'A+',
  'A-': 'A-',
  'B+': 'B+',
  'B-': 'B-',
  'AB+': 'AB+',
  'AB-': 'AB-',
  'O+': 'O+',
  'O-': 'O-',
  unknown: 'غير محدد',
};

export const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed', 'other'] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];
export const MARITAL_STATUS_AR: Record<MaritalStatus, string> = {
  single: 'أعزب / عزباء',
  married: 'متزوج / متزوجة',
  divorced: 'مطلق / مطلقة',
  widowed: 'أرمل / أرملة',
  other: 'أخرى',
};

export const MEDICAL_CONDITION_KEYS = [
  'diabetes',
  'hypertension',
  'cardiac',
  'asthma',
  'pregnancy',
  'bleeding_disorder',
  'hepatitis',
  'kidney_disease',
  'allergy_penicillin',
  'epilepsy',
  'immunodeficiency',
  'other',
] as const;
export type MedicalConditionKey = (typeof MEDICAL_CONDITION_KEYS)[number];
export const MEDICAL_CONDITION_KEY_AR: Record<MedicalConditionKey, string> = {
  diabetes: 'السكري',
  hypertension: 'ارتفاع ضغط الدم',
  cardiac: 'أمراض القلب والأوعية',
  asthma: 'الربو ومشاكل التنفس',
  pregnancy: 'حمل (للإناث)',
  bleeding_disorder: 'اضطرابات النزف والتخثر',
  hepatitis: 'التهاب الكبد الوبائي',
  kidney_disease: 'أمراض الكلى والقصور الكلوي',
  allergy_penicillin: 'حساسية البنسلين ومضاداته',
  epilepsy: 'الصرع والتشنجات',
  immunodeficiency: 'نقص المناعة',
  other: 'حالات طبية أخرى',
};

export const ALLERGY_SEVERITIES = ['mild', 'moderate', 'severe'] as const;
export type AllergySeverity = (typeof ALLERGY_SEVERITIES)[number];
export const ALLERGY_SEVERITY_AR: Record<AllergySeverity, string> = {
  mild: 'طفيفة',
  moderate: 'متوسطة',
  severe: 'شديدة وخطيرة',
};

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'waiting',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES);
export const APPOINTMENT_STATUS_AR: Record<AppointmentStatus, string> = {
  scheduled: 'مجدول',
  confirmed: 'مؤكد',
  waiting: 'في صالة الانتظار',
  in_progress: 'في العيادة حالياً',
  completed: 'مكتمل بنجاح',
  cancelled: 'ملغي',
  no_show: 'لم يحضر',
};

export const APPOINTMENT_SOURCES = ['walk_in', 'phone', 'whatsapp', 'online'] as const;
export type AppointmentSource = (typeof APPOINTMENT_SOURCES)[number];
export const APPOINTMENT_SOURCE_AR: Record<AppointmentSource, string> = {
  walk_in: 'حضور مباشر للعيادة',
  phone: 'اتصال هاتفي',
  whatsapp: 'واتساب العيادة',
  online: 'حجز إلكتروني',
};

export const ROOM_STATUSES = ['free', 'busy', 'maintenance'] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];
export const ROOM_STATUS_AR: Record<RoomStatus, string> = {
  free: 'متاح وجاهز',
  busy: 'مشغول بمريض',
  maintenance: 'تحت الصيانة والتعقيم',
};

export const PROCEDURE_CATEGORIES = [
  'diagnostic',
  'preventive',
  'restorative',
  'endodontics',
  'oral_surgery',
  'prosthodontics',
  'orthodontics',
  'whitening',
  'implantology',
  'pediatric',
  'periodontics',
] as const;
export type ProcedureCategory = (typeof PROCEDURE_CATEGORIES)[number];
export const PROCEDURE_CATEGORY_AR: Record<ProcedureCategory, string> = {
  diagnostic: 'تشخيص واستشارة',
  preventive: 'وقاية وتنظيف',
  restorative: 'حشوات تجميلية',
  endodontics: 'علاج العصب واللب',
  oral_surgery: 'جراحة الفم والخلع',
  prosthodontics: 'تركيبات ثابتة ومتحركة',
  orthodontics: 'تقويم الأسنان',
  whitening: 'تبييض الأسنان',
  implantology: 'زراعة الأسنان',
  pediatric: 'طب أسنان الأطفال',
  periodontics: 'علاج وجراحة اللثة',
};

export const TOOTH_TYPES = ['incisor', 'canine', 'premolar', 'molar'] as const;
export type ToothType = (typeof TOOTH_TYPES)[number];
export const TOOTH_TYPE_AR: Record<ToothType, string> = {
  incisor: 'قاطع',
  canine: 'ناب',
  premolar: 'ضاحك',
  molar: 'ضرس طاحن',
};

export const TOOTH_SURFACES = ['M', 'O', 'D', 'B', 'L', 'whole'] as const;
export type ToothSurface = (typeof TOOTH_SURFACES)[number];
export const TOOTH_SURFACE_AR: Record<ToothSurface, string> = {
  M: 'إنسي (Mesial)',
  O: 'إطباقي (Occlusal)',
  D: 'وحشي (Distal)',
  B: 'دهليزي / شداقي (Buccal)',
  L: 'لساني (Lingual)',
  whole: 'كامل السن (Whole Tooth)',
};

export const TOOTH_CONDITIONS = [
  'healthy',
  'caries',
  'filled',
  'crown',
  'bridge',
  'implant',
  'missing',
  'root_canal',
  'fractured',
  'impacted',
  'veneer',
  'sealant',
  'to_extract',
] as const;
export type ToothCondition = (typeof TOOTH_CONDITIONS)[number];
export const TOOTH_CONDITION_AR: Record<ToothCondition, string> = {
  healthy: 'سليم تماماً',
  caries: 'تسوس نخر',
  filled: 'محشو سابقاً',
  crown: 'تاج / تلبيسة',
  bridge: 'جسر سني',
  implant: 'زرعة سنية',
  missing: 'مفقود',
  root_canal: 'معالج العصب',
  fractured: 'مكسور / مشروخ',
  impacted: 'منطمر عظمياً',
  veneer: 'قشرة خزفية فينير',
  sealant: 'مادة سادة للوهاد',
  to_extract: 'مقرر خلعه',
};

export const TOOTH_RECORD_STATUSES = ['existing', 'planned', 'completed'] as const;
export type ToothRecordStatus = (typeof TOOTH_RECORD_STATUSES)[number];
export const TOOTH_RECORD_STATUS_AR: Record<ToothRecordStatus, string> = {
  existing: 'حالة موجودة مسبقاً',
  planned: 'خطة علاجية مقترحة',
  completed: 'إجراء مكتمل',
};

export const TREATMENT_PLAN_STATUSES = [
  'draft',
  'proposed',
  'accepted',
  'in_progress',
  'completed',
  'rejected',
] as const;
export type TreatmentPlanStatus = (typeof TREATMENT_PLAN_STATUSES)[number];
export const TREATMENT_PLAN_STATUS_AR: Record<TreatmentPlanStatus, string> = {
  draft: 'مسودة خطة',
  proposed: 'معروضة على المريض',
  accepted: 'مقبولة بموافقة المريض',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتملة بالكامل',
  rejected: 'مرفوضة من المريض',
};

export const TREATMENT_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;
export type TreatmentStatus = (typeof TREATMENT_STATUSES)[number];
export const TREATMENT_STATUS_AR: Record<TreatmentStatus, string> = {
  scheduled: 'مجدول للإجراء',
  in_progress: 'قيد التنفيذ الآن',
  completed: 'منفذ ومكتمل',
  cancelled: 'ملغي',
};

export const INVOICE_STATUSES = ['draft', 'unpaid', 'partial', 'paid', 'overdue', 'void'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export const INVOICE_STATUS_AR: Record<InvoiceStatus, string> = {
  draft: 'مسودة فاتورة',
  unpaid: 'غير مسددة',
  partial: 'مسددة جزئياً',
  paid: 'مدفوعة بالكامل',
  overdue: 'متأخرة السداد',
  void: 'ملغاة / تالفة',
};

export const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'insurance', 'mada', 'apple_pay'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_AR: Record<PaymentMethod, string> = {
  cash: 'نقداً (كاش)',
  card: 'بطاقة بنكية / فيزا',
  transfer: 'تحويل بنكي',
  insurance: 'تغطية شركة التأمين',
  mada: 'شبكة مدى',
  apple_pay: 'Apple Pay',
};

export const INSTALLMENT_STATUSES = ['pending', 'paid', 'overdue', 'cancelled'] as const;
export type InstallmentStatus = (typeof INSTALLMENT_STATUSES)[number];
export const INSTALLMENT_STATUS_AR: Record<InstallmentStatus, string> = {
  pending: 'معلقة في انتظار السداد',
  paid: 'مدفوعة',
  overdue: 'متأخرة عن موعدها',
  cancelled: 'ملغاة',
};

export const INSURANCE_CLAIM_STATUSES = [
  'draft',
  'submitted',
  'pre_approved',
  'approved',
  'partially_approved',
  'rejected',
  'paid',
] as const;
export type InsuranceClaimStatus = (typeof INSURANCE_CLAIM_STATUSES)[number];
export const INSURANCE_CLAIM_STATUS_AR: Record<InsuranceClaimStatus, string> = {
  draft: 'مسودة مطالبة',
  submitted: 'تم إرسالها لشركة التأمين',
  pre_approved: 'موافقة مبدئية',
  approved: 'موافقة معتمدة بالكامل',
  partially_approved: 'موافقة جزئية',
  rejected: 'مطالبة مرفوضة',
  paid: 'تم استلام الدفعة',
};

export const IMAGE_TYPES = [
  'panoramic',
  'periapical',
  'bitewing',
  'cephalometric',
  'cbct',
  'intraoral_photo',
  'extraoral_photo',
  'other',
] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];
export const IMAGE_TYPE_AR: Record<ImageType, string> = {
  panoramic: 'أشعة بانورامية',
  periapical: 'أشعة ذروية (Periapical)',
  bitewing: 'أشعة إطباقية (Bitewing)',
  cephalometric: 'أشعة سيفالومترية',
  cbct: 'أشعة مقطعية ثلاثية الأبعاد (CBCT)',
  intraoral_photo: 'صورة فوتوغرافية داخل الفم',
  extraoral_photo: 'صورة وجه خارجية',
  other: 'مستند أو صورة أخرى',
};

export const MEDICAL_REPORT_TYPES = ['sick_leave', 'referral', 'dental_report', 'estimate'] as const;
export type MedicalReportType = (typeof MEDICAL_REPORT_TYPES)[number];
export const MEDICAL_REPORT_TYPE_AR: Record<MedicalReportType, string> = {
  sick_leave: 'إجازة مرضية',
  referral: 'خطاب تحويل طبي',
  dental_report: 'تقرير طبي مفصل',
  estimate: 'تقدير تكلفة وخطة علاجية',
};

export const LAB_ORDER_TYPES = [
  'crown',
  'bridge',
  'denture',
  'night_guard',
  'aligner',
  'veneer',
  'inlay_onlay',
  'implant_abutment',
  'post_core',
  'orthodontic',
  'other',
] as const;
export type LabOrderType = (typeof LAB_ORDER_TYPES)[number];
export const LAB_ORDER_TYPE_AR: Record<LabOrderType, string> = {
  crown: 'تاج خزفي (تلبيسة)',
  bridge: 'جسر أسنان',
  denture: 'طقم أسنان متحرك',
  night_guard: 'حارس ليلي (Night Guard)',
  aligner: 'قوالب تقويم شفاف',
  veneer: 'عدسات فينير تجميلية',
  inlay_onlay: 'حشوة مصبوبة (Inlay/Onlay)',
  implant_abutment: 'دعامة وتاج زراعة',
  post_core: 'وتد وقلب جذري (Post & Core)',
  orthodontic: 'جهاز تقويمي',
  other: 'عمل مخبري آخر',
};

export const LAB_ORDER_STATUSES = [
  'ordered',
  'sent',
  'in_progress',
  'ready',
  'received',
  'returned',
  'fitted',
  'rejected',
] as const;
export type LabOrderStatus = (typeof LAB_ORDER_STATUSES)[number];
export const LAB_ORDER_STATUS_AR: Record<LabOrderStatus, string> = {
  ordered: 'تم تحرير الطلب',
  sent: 'أُرسل للمختبر',
  in_progress: 'قيد التنفيذ بالمختبر',
  ready: 'جاهز للاستلام',
  received: 'تم الاستلام بالعيادة',
  returned: 'مُعاد للتعديل',
  fitted: 'تم التركيب للمريض',
  rejected: 'مرفوض ويحتاج إعادة تصنيع',
};

export const INVENTORY_TRANSACTION_TYPES = ['in', 'out', 'adjust', 'waste'] as const;
export type InventoryTransactionType = (typeof INVENTORY_TRANSACTION_TYPES)[number];
export const INVENTORY_TRANSACTION_TYPE_AR: Record<InventoryTransactionType, string> = {
  in: 'توريد / إدخال مخزني',
  out: 'صرف للعيادة',
  adjust: 'تسوية جردية',
  waste: 'تالف / منتهي الصلاحية',
};

export const EXPENSE_CATEGORIES = [
  'rent',
  'salaries',
  'supplies',
  'materials',
  'lab_fees',
  'utilities',
  'marketing',
  'maintenance',
  'licenses',
  'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export const EXPENSE_CATEGORY_AR: Record<ExpenseCategory, string> = {
  rent: 'إيجار المنشأة والمقر',
  salaries: 'رواتب ومستحقات الكادر',
  supplies: 'مستلزمات ومواد طبية',
  materials: 'شراء مواد ومستهلكات طبية',
  lab_fees: 'معامل ومختبرات الأسنان',
  utilities: 'فواتير الكهرباء والمياه والإنترنت',
  marketing: 'تسويق وإعلانات',
  maintenance: 'صيانة معدات وأجهزة العيادة',
  licenses: 'رسوم وتراخيص حكومية',
  other: 'مصروفات تشغيلية أخرى',
};

export const MESSAGE_CHANNELS = ['sms', 'whatsapp', 'email'] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];
export const MESSAGE_CHANNEL_AR: Record<MessageChannel, string> = {
  sms: 'رسالة نصية SMS',
  whatsapp: 'واتساب WhatsApp',
  email: 'بريد إلكتروني',
};

export const LICENSE_PLANS = ['trial', 'basic', 'pro', 'enterprise'] as const;
export type LicensePlan = (typeof LICENSE_PLANS)[number];
export const LICENSE_PLAN_AR: Record<LicensePlan, string> = {
  trial: 'نسخة تجريبية (Trial)',
  basic: 'الباقة الأساسية',
  pro: 'الباقة الاحترافية (Pro)',
  enterprise: 'باقة المنشآت والمجموعات',
};

// ============================================================================
// 3. ENTITY INTERFACES & ZOD SCHEMAS (37 ENTITIES)
// ============================================================================

// 1. Clinic
export interface ClinicWorkingHours {
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  is_open: boolean;
  open_time: string; // "09:00"
  close_time: string; // "21:00"
  break_start?: string;
  break_end?: string;
}

export interface Clinic extends BaseEntity {
  name: string;
  logo_path: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  city: string;
  tax_number: string | null;
  cr_number: string | null;
  currency: string;
  timezone: string;
  working_hours: ClinicWorkingHours[];
  slot_duration_min: number;
}

export const clinicSchema = baseEntitySchema.extend({
  name: z.string().min(2),
  logo_path: z.string().nullable(),
  phone: z.string().min(5),
  email: z.string().email().nullable(),
  address: z.string().nullable(),
  city: z.string().default('الرياض'),
  tax_number: z.string().nullable(),
  cr_number: z.string().nullable(),
  currency: z.string().default('SAR'),
  timezone: z.string().default('Asia/Riyadh'),
  working_hours: z.array(
    z.object({
      day_of_week: z.number().int().min(0).max(6),
      is_open: z.boolean(),
      open_time: z.string(),
      close_time: z.string(),
      break_start: z.string().optional(),
      break_end: z.string().optional(),
    })
  ),
  slot_duration_min: z.number().int().min(5).max(120).default(30),
});

// 2. Branch
export interface Branch extends BaseEntity {
  name: string;
  phone: string | null;
  address: string | null;
  is_active: boolean;
}

export const branchSchema = baseEntitySchema.extend({
  name: z.string().min(2),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  is_active: z.boolean().default(true),
});

// 3. User
export interface User extends BaseEntity {
  full_name: string;
  username: string;
  password_hash: string;
  role: UserRole;
  specialty: string | null;
  license_number: string | null;
  phone: string | null;
  email: string | null;
  avatar_path: string | null;
  color: string;
  commission_percent: number;
  is_active: boolean;
  pin?: string | null;
  failed_attempts?: number;
  locked_until?: string | null;
  last_login_at: string | null;
  must_change_password?: boolean;
  pin_hash?: string | null;
  pin_attempts?: number;
}

export const userSchema = baseEntitySchema.extend({
  full_name: z.string().min(2),
  username: z.string().min(3),
  password_hash: z.string(),
  role: z.enum(USER_ROLES),
  specialty: z.string().nullable(),
  license_number: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  avatar_path: z.string().nullable(),
  color: z.string().default('#1E4E9C'),
  commission_percent: z.number().min(0).max(100).default(0),
  is_active: z.boolean().default(true),
  pin: z.string().nullable().optional(),
  failed_attempts: z.number().int().default(0).optional(),
  locked_until: z.string().datetime().nullable().optional(),
  last_login_at: z.string().datetime().nullable(),
  must_change_password: z.boolean().default(true).optional(),
  pin_hash: z.string().nullable().optional(),
  pin_attempts: z.number().int().default(0).optional(),
});

// 4. RolePermission / Permission
export const RESOURCE_NAMES = [
  'patients',
  'appointments',
  'treatments',
  'clinical_notes',
  'prescriptions',
  'medical_reports',
  'lab_orders',
  'invoices',
  'prices',
  'payments',
  'expenses',
  'inventory',
  'staff',
  'reports',
  'settings',
  'audit_logs',
] as const;
export type ResourceName = (typeof RESOURCE_NAMES)[number];
export const RESOURCE_NAME_AR: Record<ResourceName, string> = {
  patients: 'ملفات المرضى',
  appointments: 'المواعيد وجدول الحجوزات',
  treatments: 'الإجراءات السريرية والعلاج',
  clinical_notes: 'الملاحظات والتشخيص السريري',
  prescriptions: 'الوصفات الدوائية (Rx)',
  medical_reports: 'التقارير الطبية والإجازات',
  lab_orders: 'أوامر ومعامل الأسنان',
  invoices: 'الفواتير والمطالبات',
  prices: 'الأسعار والتعرفة المالية',
  payments: 'سندات القبض والمدفوعات',
  expenses: 'المصروفات والتشغيل',
  inventory: 'المستودع والمخزون الطبي',
  staff: 'إدارة الكادر والموظفين',
  reports: 'التقارير المالية والإحصائيات',
  settings: 'إعدادات المنشأة والنظام',
  audit_logs: 'سجل التدقيق والرقابة الأمني',
};

export type RolePermissions = Record<ResourceName, Record<PermissionAction, boolean>>;
export type PermissionsMatrix = Record<UserRole, RolePermissions>;

export interface ClinicSecurityPolicies {
  receptionist_hide_prices: boolean;
  accountant_hide_clinical_notes: boolean;
  dentist_only_own_patients: boolean;
  idle_timeout_minutes: number;
  max_failed_attempts: number;
  lockout_duration_minutes: number;
}

export interface RolePermission extends BaseEntity {
  role: UserRole;
  resource: string;
  action: PermissionAction;
}

export const rolePermissionSchema = baseEntitySchema.extend({
  role: z.enum(USER_ROLES),
  resource: z.string(),
  action: z.enum(PERMISSION_ACTIONS),
});

// 4b. Leaves & Commissions
export const LEAVE_TYPES = ['annual', 'sick', 'emergency', 'unpaid'] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];
export const LEAVE_TYPE_AR: Record<LeaveType, string> = {
  annual: 'إجازة سنوية اعتيادية',
  sick: 'إجازة مرضية',
  emergency: 'إجازة طارئة / عارضة',
  unpaid: 'إجازة بدون راتب',
};

export const LEAVE_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];
export const LEAVE_STATUS_AR: Record<LeaveStatus, string> = {
  pending: 'قيد المراجعة والاعتماد',
  approved: 'معتمدة ومقبولة',
  rejected: 'مرفوضة',
};

export interface LeaveRequest extends BaseEntity {
  user_id: string;
  user_name?: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface DoctorCommissionSummary {
  doctorId: string;
  doctorName: string;
  specialty: string;
  color: string;
  commissionPercent: number;
  completedTreatmentsCount: number;
  totalRevenueHalalas: number;
  commissionHalalas: number;
  paidHalalas: number;
  balanceHalalas: number;
}

// 5. Patient
export interface Patient extends BaseEntity {
  code: string;
  first_name: string;
  father_name: string | null;
  family_name: string;
  gender: Gender;
  birth_date: string | null; // YYYY-MM-DD
  national_id: string | null;
  phone: string;
  phone_alt: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  blood_type: BloodType;
  marital_status: MaritalStatus;
  occupation: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  referral_source: string | null;
  primary_dentist_id: string | null;
  insurance_company_id: string | null;
  insurance_policy_no: string | null;
  insurance_expiry: string | null;
  notes: string | null;
  photo_path: string | null;
  is_active: boolean;
}

export const patientSchema = baseEntitySchema.extend({
  code: z.string().regex(/^P\d{4,8}$/, 'رمز المريض يجب أن يبدأ بحرف P متبوعاً بأرقام'),
  first_name: z.string().min(2),
  father_name: z.string().nullable(),
  family_name: z.string().min(2),
  gender: z.enum(GENDERS),
  birth_date: z.string().nullable(),
  national_id: z.string().nullable(),
  phone: z.string().min(7),
  phone_alt: z.string().nullable(),
  email: z.string().email().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  blood_type: z.enum(BLOOD_TYPES).default('unknown'),
  marital_status: z.enum(MARITAL_STATUSES).default('single'),
  occupation: z.string().nullable(),
  emergency_contact_name: z.string().nullable(),
  emergency_contact_phone: z.string().nullable(),
  referral_source: z.string().nullable(),
  primary_dentist_id: z.string().uuid().nullable(),
  insurance_company_id: z.string().uuid().nullable(),
  insurance_policy_no: z.string().nullable(),
  insurance_expiry: z.string().nullable(),
  notes: z.string().nullable(),
  photo_path: z.string().nullable(),
  is_active: z.boolean().default(true),
});

// 6. MedicalHistory
export interface MedicalHistory extends BaseEntity {
  patient_id: string;
  condition_key: MedicalConditionKey;
  has_condition: boolean;
  details: string | null;
}

export const medicalHistorySchema = baseEntitySchema.extend({
  patient_id: z.string().uuid(),
  condition_key: z.enum(MEDICAL_CONDITION_KEYS),
  has_condition: z.boolean().default(false),
  details: z.string().nullable(),
});

// 7. Allergy
export interface Allergy extends BaseEntity {
  patient_id: string;
  allergen: string;
  severity: AllergySeverity;
  notes: string | null;
}

export const allergySchema = baseEntitySchema.extend({
  patient_id: z.string().uuid(),
  allergen: z.string().min(1),
  severity: z.enum(ALLERGY_SEVERITIES).default('moderate'),
  notes: z.string().nullable(),
});

// 8. MedicationCurrent
export interface MedicationCurrent extends BaseEntity {
  patient_id: string;
  name: string;
  dosage: string | null;
  since: string | null;
}

export const medicationCurrentSchema = baseEntitySchema.extend({
  patient_id: z.string().uuid(),
  name: z.string().min(1),
  dosage: z.string().nullable(),
  since: z.string().nullable(),
});

// 9. Appointment
export interface Appointment extends BaseEntity {
  patient_id: string;
  dentist_id: string;
  branch_id: string;
  room_id: string | null;
  start_at: string; // ISO 8601 UTC
  end_at: string; // ISO 8601 UTC
  procedure_ids: string[]; // JSON array of procedure UUIDs
  status: AppointmentStatus;
  source: AppointmentSource;
  color_override: string | null;
  notes: string | null;
  reminder_sent_at: string | null;
  created_by: string;
}

export const appointmentSchema = baseEntitySchema.extend({
  patient_id: z.string().uuid(),
  dentist_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  room_id: z.string().uuid().nullable(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  procedure_ids: z.array(z.string().uuid()).default([]),
  status: z.enum(APPOINTMENT_STATUSES).default('scheduled'),
  source: z.enum(APPOINTMENT_SOURCES).default('phone'),
  color_override: z.string().nullable(),
  notes: z.string().nullable(),
  reminder_sent_at: z.string().datetime().nullable(),
  created_by: z.string().uuid(),
});

// 10. Room
export interface RoomEquipment {
  id: string;
  name: string;
  model?: string;
  serial_number?: string;
  last_maintenance_date?: string;
}

export interface Room extends BaseEntity {
  branch_id: string;
  name: string;
  number: string;
  status: RoomStatus;
  equipment: RoomEquipment[];
}

export const roomSchema = baseEntitySchema.extend({
  branch_id: z.string().uuid(),
  name: z.string().min(1),
  number: z.string().min(1),
  status: z.enum(ROOM_STATUSES).default('free'),
  equipment: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      model: z.string().optional(),
      serial_number: z.string().optional(),
      last_maintenance_date: z.string().optional(),
    })
  ).default([]),
});

// 11. Procedure
export interface Procedure extends BaseEntity {
  code: string;
  name_ar: string;
  name_en: string | null;
  category: ProcedureCategory;
  default_price_halalas: number; // INTEGER
  default_duration_min: number;
  requires_tooth: boolean;
  requires_surface: boolean;
  is_active: boolean;
  color: string | null;
}

export const procedureSchema = baseEntitySchema.extend({
  code: z.string().min(1),
  name_ar: z.string().min(2),
  name_en: z.string().nullable(),
  category: z.enum(PROCEDURE_CATEGORIES),
  default_price_halalas: z.number().int().min(0),
  default_duration_min: z.number().int().min(5).max(480).default(30),
  requires_tooth: z.boolean().default(false),
  requires_surface: z.boolean().default(false),
  is_active: z.boolean().default(true),
  color: z.string().nullable(),
});

// 12. TeethRegistry
export interface TeethRegistry extends BaseEntity {
  fdi_number: number; // 11-48 for permanent, 51-85 for primary/deciduous
  universal_number: string; // 1-32 or A-T
  quadrant: number; // 1: Upper Right, 2: Upper Left, 3: Lower Left, 4: Lower Right (and 5-8 primary)
  type: ToothType;
  is_primary: boolean;
  name_ar: string;
  name_en: string;
}

export const teethRegistrySchema = baseEntitySchema.extend({
  fdi_number: z.number().int().min(11).max(85),
  universal_number: z.string(),
  quadrant: z.number().int().min(1).max(8),
  type: z.enum(TOOTH_TYPES),
  is_primary: z.boolean().default(false),
  name_ar: z.string(),
  name_en: z.string(),
});

// 13. ToothRecord
export interface ToothRecord extends BaseEntity {
  patient_id: string;
  tooth_number: number; // FDI 11-85
  surface: ToothSurface;
  condition: ToothCondition;
  status: ToothRecordStatus;
  treatment_id: string | null;
  note: string | null;
  recorded_at: string; // ISO 8601 UTC
  recorded_by: string;
}

export const toothRecordSchema = baseEntitySchema.extend({
  patient_id: z.string().uuid(),
  tooth_number: z.number().int().min(11).max(85),
  surface: z.enum(TOOTH_SURFACES).default('whole'),
  condition: z.enum(TOOTH_CONDITIONS),
  status: z.enum(TOOTH_RECORD_STATUSES).default('existing'),
  treatment_id: z.string().uuid().nullable(),
  note: z.string().nullable(),
  recorded_at: z.string().datetime(),
  recorded_by: z.string().uuid(),
});

// 14. TreatmentPlan
export interface TreatmentPlan extends BaseEntity {
  patient_id: string;
  dentist_id: string;
  title: string;
  status: TreatmentPlanStatus;
  total_halalas: number; // INTEGER
  discount_halalas: number; // INTEGER
  patient_consent_at: string | null;
  notes: string | null;
}

export const treatmentPlanSchema = baseEntitySchema.extend({
  patient_id: z.string().uuid(),
  dentist_id: z.string().uuid(),
  title: z.string().min(2),
  status: z.enum(TREATMENT_PLAN_STATUSES).default('draft'),
  total_halalas: z.number().int().min(0).default(0),
  discount_halalas: z.number().int().min(0).default(0),
  patient_consent_at: z.string().datetime().nullable(),
  notes: z.string().nullable(),
});

// 15. TreatmentPlanItem
export interface TreatmentPlanItem extends BaseEntity {
  plan_id: string;
  procedure_id: string;
  tooth_number: number | null;
  surface: ToothSurface | null;
  quantity: number;
  unit_price_halalas: number; // INTEGER
  discount_halalas: number; // INTEGER
  priority: number;
  phase: number;
  status: ToothRecordStatus;
  scheduled_date: string | null;
}

export const treatmentPlanItemSchema = baseEntitySchema.extend({
  plan_id: z.string().uuid(),
  procedure_id: z.string().uuid(),
  tooth_number: z.number().int().nullable(),
  surface: z.enum(TOOTH_SURFACES).nullable(),
  quantity: z.number().int().min(1).default(1),
  unit_price_halalas: z.number().int().min(0),
  discount_halalas: z.number().int().min(0).default(0),
  priority: z.number().int().default(1),
  phase: z.number().int().default(1),
  status: z.enum(TOOTH_RECORD_STATUSES).default('planned'),
  scheduled_date: z.string().nullable(),
});

// 16. Treatment (Performed)
export interface MaterialUsed {
  item_id: string;
  name: string;
  quantity_used: number;
  unit: string;
}

export interface Treatment extends BaseEntity {
  patient_id: string;
  appointment_id: string | null;
  plan_item_id: string | null;
  procedure_id: string;
  dentist_id: string;
  tooth_number: number | null;
  surface: ToothSurface | null;
  performed_at: string; // ISO 8601 UTC
  status: TreatmentStatus;
  anesthesia_type: string | null;
  materials_used: MaterialUsed[];
  clinical_notes: string | null;
  price_halalas: number; // INTEGER
}

export const treatmentSchema = baseEntitySchema.extend({
  patient_id: z.string().uuid(),
  appointment_id: z.string().uuid().nullable(),
  plan_item_id: z.string().uuid().nullable(),
  procedure_id: z.string().uuid(),
  dentist_id: z.string().uuid(),
  tooth_number: z.number().int().nullable(),
  surface: z.enum(TOOTH_SURFACES).nullable(),
  performed_at: z.string().datetime(),
  status: z.enum(TREATMENT_STATUSES).default('completed'),
  anesthesia_type: z.string().nullable(),
  materials_used: z.array(
    z.object({
      item_id: z.string(),
      name: z.string(),
      quantity_used: z.number(),
      unit: z.string(),
    })
  ).default([]),
  clinical_notes: z.string().nullable(),
  price_halalas: z.number().int().min(0),
});

// 17. Invoice
export interface Invoice extends BaseEntity {
  number: string;
  patient_id: string;
  branch_id: string;
  issue_date: string; // ISO 8601 UTC
  due_date: string | null;
  subtotal_halalas: number; // INTEGER
  discount_halalas: number; // INTEGER
  vat_percent: number; // e.g. 15 for 15%
  vat_halalas: number; // INTEGER
  total_halalas: number; // INTEGER
  paid_halalas: number; // INTEGER
  balance_halalas: number; // INTEGER
  status: InvoiceStatus;
  insurance_claim_id: string | null;
  zatca_qr: string | null;
  notes: string | null;
}

export const invoiceSchema = baseEntitySchema.extend({
  number: z.string().min(1),
  patient_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  issue_date: z.string().datetime(),
  due_date: z.string().datetime().nullable(),
  subtotal_halalas: z.number().int().min(0),
  discount_halalas: z.number().int().min(0).default(0),
  vat_percent: z.number().min(0).max(100).default(15),
  vat_halalas: z.number().int().min(0).default(0),
  total_halalas: z.number().int().min(0),
  paid_halalas: z.number().int().min(0).default(0),
  balance_halalas: z.number().int().min(0),
  status: z.enum(INVOICE_STATUSES).default('draft'),
  insurance_claim_id: z.string().uuid().nullable(),
  zatca_qr: z.string().nullable(),
  notes: z.string().nullable(),
});

// 18. InvoiceItem
export interface InvoiceItem extends BaseEntity {
  invoice_id: string;
  treatment_id: string | null;
  description: string;
  tooth_number: number | null;
  quantity: number;
  unit_price_halalas: number; // INTEGER
  discount_halalas: number; // INTEGER
  total_halalas: number; // INTEGER
}

export const invoiceItemSchema = baseEntitySchema.extend({
  invoice_id: z.string().uuid(),
  treatment_id: z.string().uuid().nullable(),
  description: z.string().min(1),
  tooth_number: z.number().int().nullable(),
  quantity: z.number().int().min(1).default(1),
  unit_price_halalas: z.number().int().min(0),
  discount_halalas: z.number().int().min(0).default(0),
  total_halalas: z.number().int().min(0),
});

// 19. Payment
export interface Payment extends BaseEntity {
  invoice_id: string;
  patient_id: string;
  amount_halalas: number; // INTEGER
  method: PaymentMethod;
  reference: string | null;
  paid_at: string; // ISO 8601 UTC
  received_by: string;
  notes: string | null;
}

export const paymentSchema = baseEntitySchema.extend({
  invoice_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  amount_halalas: z.number().int().min(1),
  method: z.enum(PAYMENT_METHODS).default('cash'),
  reference: z.string().nullable(),
  paid_at: z.string().datetime(),
  received_by: z.string().uuid(),
  notes: z.string().nullable(),
});

// 20. Installment
export interface Installment extends BaseEntity {
  invoice_id: string;
  due_date: string; // YYYY-MM-DD
  amount_halalas: number; // INTEGER
  paid_at: string | null;
  status: InstallmentStatus;
}

export const installmentSchema = baseEntitySchema.extend({
  invoice_id: z.string().uuid(),
  due_date: z.string(),
  amount_halalas: z.number().int().min(1),
  paid_at: z.string().datetime().nullable(),
  status: z.enum(INSTALLMENT_STATUSES).default('pending'),
});

// 21. InsuranceCompany
export interface InsuranceCompany extends BaseEntity {
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  coverage_percent_default: number;
  requires_preapproval: boolean;
  notes: string | null;
  annual_limit_halalas?: number | null;
  excluded_procedures?: string[];
}

export const insuranceCompanySchema = baseEntitySchema.extend({
  name: z.string().min(2),
  contact: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  coverage_percent_default: z.number().min(0).max(100).default(80),
  requires_preapproval: z.boolean().default(true),
  notes: z.string().nullable(),
  annual_limit_halalas: z.number().int().min(0).nullable().optional(),
  excluded_procedures: z.array(z.string()).default([]).optional(),
});

// 22. InsuranceClaim
export interface InsuranceClaimAttachment {
  file_path: string;
  file_name: string;
  type: string;
}

export interface InsuranceClaim extends BaseEntity {
  patient_id: string;
  invoice_id: string;
  company_id: string;
  claim_number: string;
  submitted_at: string; // ISO 8601 UTC
  claimed_halalas: number; // INTEGER
  approved_halalas: number; // INTEGER
  rejected_halalas: number; // INTEGER
  status: InsuranceClaimStatus;
  response_at: string | null;
  rejection_reason: string | null;
  attachments: InsuranceClaimAttachment[];
}

export const insuranceClaimSchema = baseEntitySchema.extend({
  patient_id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  company_id: z.string().uuid(),
  claim_number: z.string().min(1),
  submitted_at: z.string().datetime(),
  claimed_halalas: z.number().int().min(0),
  approved_halalas: z.number().int().min(0).default(0),
  rejected_halalas: z.number().int().min(0).default(0),
  status: z.enum(INSURANCE_CLAIM_STATUSES).default('draft'),
  response_at: z.string().datetime().nullable(),
  rejection_reason: z.string().nullable(),
  attachments: z.array(
    z.object({
      file_path: z.string(),
      file_name: z.string(),
      type: z.string(),
    })
  ).default([]),
});

// 23. Image (Dental X-Rays & Imaging)
export interface Image extends BaseEntity {
  patient_id: string;
  tooth_number: number | null;
  type: ImageType;
  file_path: string;
  thumbnail_path: string | null;
  taken_at: string; // ISO 8601 UTC
  captured_by: string;
  notes: string | null;
  tags: string[];
}

export const imageSchema = baseEntitySchema.extend({
  patient_id: z.string().uuid(),
  tooth_number: z.number().int().nullable(),
  type: z.enum(IMAGE_TYPES),
  file_path: z.string().min(1),
  thumbnail_path: z.string().nullable(),
  taken_at: z.string().datetime(),
  captured_by: z.string().uuid(),
  notes: z.string().nullable(),
  tags: z.array(z.string()).default([]),
});

// 24. Prescription & PrescriptionItem
export interface Prescription extends BaseEntity {
  patient_id: string;
  dentist_id: string;
  issued_at: string; // ISO 8601 UTC
  notes: string | null;
}

export const prescriptionSchema = baseEntitySchema.extend({
  patient_id: z.string().uuid(),
  dentist_id: z.string().uuid(),
  issued_at: z.string().datetime(),
  notes: z.string().nullable(),
});

export interface PrescriptionItem extends BaseEntity {
  prescription_id: string;
  drug_name: string;
  dose: string;
  frequency: string;
  duration_days: number;
  instructions: string | null;
}

export const prescriptionItemSchema = baseEntitySchema.extend({
  prescription_id: z.string().uuid(),
  drug_name: z.string().min(1),
  dose: z.string().min(1),
  frequency: z.string().min(1),
  duration_days: z.number().int().min(1),
  instructions: z.string().nullable(),
});

// 25. MedicalReport
export interface MedicalReport extends BaseEntity {
  patient_id: string;
  type: MedicalReportType;
  content: string;
  issued_at: string; // ISO 8601 UTC
  issued_by: string;
}

export const medicalReportSchema = baseEntitySchema.extend({
  patient_id: z.string().uuid(),
  type: z.enum(MEDICAL_REPORT_TYPES),
  content: z.string().min(1),
  issued_at: z.string().datetime(),
  issued_by: z.string().uuid(),
});

// 26. LabOrder
export interface LabOrder extends BaseEntity {
  patient_id: string;
  lab_id: string;
  treatment_id: string | null;
  appointment_id?: string | null;
  type: LabOrderType;
  work_description?: string | null;
  tooth_numbers: number[]; // JSON array of FDI teeth
  shade: string | null; // e.g. A2, A3, Bleach BL1
  sent_at: string | null;
  due_at: string | null;
  received_at: string | null;
  status: LabOrderStatus;
  cost_halalas: number; // INTEGER
  notes: string | null;
}

export const labOrderSchema = baseEntitySchema.extend({
  patient_id: z.string().uuid(),
  lab_id: z.string().uuid(),
  treatment_id: z.string().uuid().nullable(),
  appointment_id: z.string().uuid().nullable().optional(),
  type: z.enum(LAB_ORDER_TYPES),
  work_description: z.string().nullable().optional(),
  tooth_numbers: z.array(z.number().int()).default([]),
  shade: z.string().nullable(),
  sent_at: z.string().datetime().nullable(),
  due_at: z.string().datetime().nullable(),
  received_at: z.string().datetime().nullable(),
  status: z.enum(LAB_ORDER_STATUSES).default('ordered'),
  cost_halalas: z.number().int().min(0).default(0),
  notes: z.string().nullable(),
});

// 27. Lab
export interface Lab extends BaseEntity {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export const labSchema = baseEntitySchema.extend({
  name: z.string().min(2),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  address: z.string().nullable(),
});

// 28. InventoryItem
export interface InventoryItem extends BaseEntity {
  name: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost_halalas: number; // INTEGER
  supplier_id: string | null;
  expiry_date: string | null; // YYYY-MM-DD
  location: string | null;
}

export const inventoryItemSchema = baseEntitySchema.extend({
  name: z.string().min(2),
  sku: z.string().min(1),
  category: z.string().default('مستهلكات عامة'),
  unit: z.string().default('قطعة'),
  quantity: z.number().int().min(0).default(0),
  min_quantity: z.number().int().min(0).default(5),
  cost_halalas: z.number().int().min(0).default(0),
  supplier_id: z.string().uuid().nullable(),
  expiry_date: z.string().nullable(),
  location: z.string().nullable(),
});

// 29. InventoryTransaction
export interface InventoryTransaction extends BaseEntity {
  item_id: string;
  type: InventoryTransactionType;
  quantity: number;
  reason: string | null;
  treatment_id: string | null;
  created_by: string;
}

export const inventoryTransactionSchema = baseEntitySchema.extend({
  item_id: z.string().uuid(),
  type: z.enum(INVENTORY_TRANSACTION_TYPES),
  quantity: z.number().int(),
  reason: z.string().nullable(),
  treatment_id: z.string().uuid().nullable(),
  created_by: z.string().uuid(),
});

// 30. Supplier
export interface Supplier extends BaseEntity {
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

export const supplierSchema = baseEntitySchema.extend({
  name: z.string().min(2),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  notes: z.string().nullable(),
});

// 30b. Purchase Order
export const PURCHASE_ORDER_STATUSES = ['draft', 'sent', 'partial', 'received', 'cancelled'] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];
export const PURCHASE_ORDER_STATUS_AR: Record<PurchaseOrderStatus, string> = {
  draft: 'مسودة طلب',
  sent: 'تم الإرسال للمورد',
  partial: 'مستلم جزئياً',
  received: 'مستلم ومورّد للمخزون',
  cancelled: 'ملغي',
};

export interface PurchaseOrderItem {
  id: string;
  item_id: string;
  item_name: string;
  unit: string;
  quantity: number;
  received_quantity: number;
  cost_halalas: number;
  total_halalas: number;
}

export interface PurchaseOrder extends BaseEntity {
  po_number: string;
  number?: string;
  supplier_id: string;
  supplier_name?: string;
  order_date: string;
  ordered_at?: string | null;
  expected_date: string | null;
  expected_at?: string | null;
  received_date: string | null;
  received_at?: string | null;
  status: PurchaseOrderStatus;
  total_halalas: number;
  notes: string | null;
  items: PurchaseOrderItem[];
}

export const createPurchaseOrderItemSchema = z.object({
  item_id: z.string().min(1),
  quantity: z.number().int().positive(),
  cost_halalas: z.number().int().nonnegative(),
});

export const createPurchaseOrderSchema = z.object({
  clinic_id: z.string().optional(),
  supplier_id: z.string().min(1),
  order_date: z.string().optional(),
  expected_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(createPurchaseOrderItemSchema).min(1),
});
export type CreatePurchaseOrder = z.infer<typeof createPurchaseOrderSchema>;

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum(PURCHASE_ORDER_STATUSES),
});

export const receivePurchaseOrderSchema = z.object({
  received_at: z.string().optional(),
  notes: z.string().nullable().optional(),
}).optional();

export interface InventoryMonthlyConsumptionReport {
  period: string; // e.g. "2026-09"
  monthName: string;
  totalConsumedHalalas: number;
  totalTransactionsCount: number;
  totalItemsCount: number;
  byCategory: Array<{
    category: string;
    totalHalalas: number;
    itemsCount: number;
    percentage: number;
  }>;
  topConsumedItems: Array<{
    itemId: string;
    name: string;
    sku: string;
    category: string;
    unit: string;
    quantityConsumed: number;
    costHalalas: number;
    totalHalalas: number;
    transactionsCount: number;
  }>;
  recentMovements: Array<{
    id: string;
    date: string;
    itemName: string;
    category: string;
    type: InventoryTransactionType;
    quantity: number;
    unit: string;
    costHalalas: number;
    reason: string | null;
    createdByName: string;
  }>;
}

// 31. Expense
export interface Expense extends BaseEntity {
  category: ExpenseCategory;
  title: string;
  amount_halalas: number; // INTEGER in halalas
  vat_halalas: number; // INTEGER in halalas
  expense_date: string; // YYYY-MM-DD
  date?: string; // Optional for backward compatibility
  payment_method: PaymentMethod;
  reference: string | null;
  payee: string | null;
  receipt_url: string | null;
  receipt_path?: string | null;
  is_recurring: boolean;
  recurring_day: number | null;
  notes: string | null;
  recorded_by: string | null;
}

export const expenseSchema = baseEntitySchema.extend({
  category: z.enum(EXPENSE_CATEGORIES),
  title: z.string().min(1).default('مصروف عام'),
  amount_halalas: z.number().int().min(1),
  vat_halalas: z.number().int().min(0).default(0),
  expense_date: z.string().default(() => new Date().toISOString().substring(0, 10)),
  date: z.string().optional(),
  payment_method: z.enum(PAYMENT_METHODS).default('mada'),
  reference: z.string().nullable().optional(),
  payee: z.string().nullable().optional(),
  receipt_url: z.string().nullable().optional(),
  receipt_path: z.string().nullable().optional(),
  is_recurring: z.boolean().default(false),
  recurring_day: z.number().int().min(1).max(31).nullable().optional(),
  notes: z.string().nullable().optional(),
  recorded_by: z.string().nullable().optional(),
});

// 32. Attendance
export interface Attendance extends BaseEntity {
  user_id: string;
  check_in: string; // ISO 8601 UTC
  check_out: string | null; // ISO 8601 UTC
  date: string; // YYYY-MM-DD
  notes: string | null;
}

export const attendanceSchema = baseEntitySchema.extend({
  user_id: z.string().uuid(),
  check_in: z.string().datetime(),
  check_out: z.string().datetime().nullable(),
  date: z.string(),
  notes: z.string().nullable(),
});

// 33. Notification
export interface Notification extends BaseEntity {
  user_id: string;
  type: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
}

export const notificationSchema = baseEntitySchema.extend({
  user_id: z.string().uuid(),
  type: z.string().default('info'),
  title: z.string().min(1),
  body: z.string().min(1),
  entity_type: z.string().nullable(),
  entity_id: z.string().uuid().nullable(),
  read_at: z.string().datetime().nullable(),
});

// 34. MessageTemplate
export interface MessageTemplate extends BaseEntity {
  key: string;
  channel: MessageChannel;
  body_ar: string;
}

export const messageTemplateSchema = baseEntitySchema.extend({
  key: z.string().min(1),
  channel: z.enum(MESSAGE_CHANNELS),
  body_ar: z.string().min(1),
});

// 35. AuditLog
export interface AuditLog extends BaseEntity {
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
}

export const auditLogSchema = baseEntitySchema.extend({
  user_id: z.string().uuid(),
  action: z.string().min(1),
  entity_type: z.string().min(1),
  entity_id: z.string().min(1),
  before: z.record(z.unknown()).nullable(),
  after: z.record(z.unknown()).nullable(),
  ip: z.string().nullable(),
});

// 36. Setting
export interface Setting extends BaseEntity {
  key: string;
  value: unknown;
  scope: string; // 'clinic' | 'system' | 'user'
}

export const settingSchema = baseEntitySchema.extend({
  key: z.string().min(1),
  value: z.unknown(),
  scope: z.string().default('clinic'),
});

// 37. License
export interface License extends BaseEntity {
  key: string;
  plan: LicensePlan;
  seats: number;
  activated_at: string; // ISO 8601 UTC
  expires_at: string; // ISO 8601 UTC
  device_fingerprint: string;
  last_check_at: string; // ISO 8601 UTC
  signature: string;

  token_hint?: string | null;
  customer?: string | null;
  features?: string | null;
  max_doctors?: number | null;
  max_devices?: number | null;
  state_cache?: string | null;
  trial_started_at?: string | null;
  last_seen_at?: string | null;
}

export const licenseSchema = baseEntitySchema.extend({
  key: z.string().min(1),
  plan: z.enum(LICENSE_PLANS),
  seats: z.number().int().min(1).default(1),
  activated_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  device_fingerprint: z.string().min(1),
  last_check_at: z.string().datetime(),
  signature: z.string().min(1),
  token_hint: z.string().nullable().optional(),
  customer: z.string().nullable().optional(),
  features: z.string().nullable().optional(),
  max_doctors: z.number().int().nullable().optional(),
  max_devices: z.number().int().nullable().optional(),
  state_cache: z.string().nullable().optional(),
  trial_started_at: z.string().nullable().optional(),
  last_seen_at: z.string().nullable().optional(),
});

// ============================================================================
// 4. DTO CONTRACTS (CREATE, UPDATE, FILTERS)
// ============================================================================

// --- Clinic DTOs ---
export const createClinicSchema = clinicSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateClinic = z.infer<typeof createClinicSchema>;
export const updateClinicSchema = createClinicSchema.partial();
export type UpdateClinic = z.infer<typeof updateClinicSchema>;

// --- Branch DTOs ---
export const createBranchSchema = branchSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateBranch = z.infer<typeof createBranchSchema>;
export const updateBranchSchema = createBranchSchema.partial();
export type UpdateBranch = z.infer<typeof updateBranchSchema>;

// --- User DTOs ---
export const createUserSchema = userSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateUser = z.infer<typeof createUserSchema>;
export const updateUserSchema = createUserSchema.partial().omit({ username: true });
export type UpdateUser = z.infer<typeof updateUserSchema>;
export const userFiltersSchema = paginationParamsSchema.extend({
  role: z.enum(USER_ROLES).optional(),
  is_active: z.boolean().optional(),
});
export type UserFilters = z.infer<typeof userFiltersSchema>;

// --- Patient DTOs ---
export const createPatientSchema = patientSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true, code: true }).extend({
  code: z.string().optional(), // Auto-generated if omitted
});
export type CreatePatient = z.infer<typeof createPatientSchema>;
export const updatePatientSchema = patientSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true, code: true }).partial();
export type UpdatePatient = z.infer<typeof updatePatientSchema>;
export const patientFiltersSchema = paginationParamsSchema.extend({
  gender: z.enum(GENDERS).optional(),
  primary_dentist_id: z.string().uuid().optional(),
  insurance_company_id: z.string().uuid().optional(),
  has_insurance: z.boolean().optional(),
  is_active: z.boolean().optional(),
  has_medical_alert: z.boolean().optional(),
});
export type PatientFilters = z.infer<typeof patientFiltersSchema>;

// --- Medical History DTOs ---
export const createMedicalHistorySchema = medicalHistorySchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateMedicalHistory = z.infer<typeof createMedicalHistorySchema>;
export const updateMedicalHistorySchema = createMedicalHistorySchema.partial();
export type UpdateMedicalHistory = z.infer<typeof updateMedicalHistorySchema>;

// --- Allergy DTOs ---
export const createAllergySchema = allergySchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateAllergy = z.infer<typeof createAllergySchema>;
export const updateAllergySchema = createAllergySchema.partial();
export type UpdateAllergy = z.infer<typeof updateAllergySchema>;

// --- Medication Current DTOs ---
export const createMedicationCurrentSchema = medicationCurrentSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateMedicationCurrent = z.infer<typeof createMedicationCurrentSchema>;
export const updateMedicationCurrentSchema = createMedicationCurrentSchema.partial();
export type UpdateMedicationCurrent = z.infer<typeof updateMedicationCurrentSchema>;

// --- Appointment DTOs ---
export const createAppointmentSchema = appointmentSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true, reminder_sent_at: true }).extend({
  reminder_sent_at: z.string().datetime().nullable().optional(),
});
export type CreateAppointment = z.infer<typeof createAppointmentSchema>;
export const updateAppointmentSchema = createAppointmentSchema.partial();
export type UpdateAppointment = z.infer<typeof updateAppointmentSchema>;
export const appointmentFiltersSchema = paginationParamsSchema.extend({
  patient_id: z.string().uuid().optional(),
  dentist_id: z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
  room_id: z.string().uuid().optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});
export type AppointmentFilters = z.infer<typeof appointmentFiltersSchema>;

// --- Room DTOs ---
export const createRoomSchema = roomSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateRoom = z.infer<typeof createRoomSchema>;
export const updateRoomSchema = createRoomSchema.partial();
export type UpdateRoom = z.infer<typeof updateRoomSchema>;

// --- Procedure DTOs ---
export const createProcedureSchema = procedureSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateProcedure = z.infer<typeof createProcedureSchema>;
export const updateProcedureSchema = createProcedureSchema.partial();
export type UpdateProcedure = z.infer<typeof updateProcedureSchema>;
export const procedureFiltersSchema = paginationParamsSchema.extend({
  category: z.enum(PROCEDURE_CATEGORIES).optional(),
  is_active: z.boolean().optional(),
});
export type ProcedureFilters = z.infer<typeof procedureFiltersSchema>;

// --- ToothRecord DTOs ---
export const createToothRecordSchema = toothRecordSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateToothRecord = z.infer<typeof createToothRecordSchema>;
export const updateToothRecordSchema = createToothRecordSchema.partial();
export type UpdateToothRecord = z.infer<typeof updateToothRecordSchema>;
export const toothRecordFiltersSchema = z.object({
  patient_id: z.string().uuid(),
  tooth_number: z.number().int().optional(),
  status: z.enum(TOOTH_RECORD_STATUSES).optional(),
});
export type ToothRecordFilters = z.infer<typeof toothRecordFiltersSchema>;

// --- TreatmentPlan DTOs ---
export const createTreatmentPlanItemSchema = treatmentPlanItemSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateTreatmentPlanItem = z.infer<typeof createTreatmentPlanItemSchema>;
export const updateTreatmentPlanItemSchema = createTreatmentPlanItemSchema.partial();
export type UpdateTreatmentPlanItem = z.infer<typeof updateTreatmentPlanItemSchema>;

export const createTreatmentPlanSchema = treatmentPlanSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true }).extend({
  items: z.array(createTreatmentPlanItemSchema.omit({ plan_id: true })).optional(),
});
export type CreateTreatmentPlan = z.infer<typeof createTreatmentPlanSchema>;
export const updateTreatmentPlanSchema = createTreatmentPlanSchema.partial();
export type UpdateTreatmentPlan = z.infer<typeof updateTreatmentPlanSchema>;

// --- Treatment DTOs ---
export const createTreatmentSchema = treatmentSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateTreatment = z.infer<typeof createTreatmentSchema>;
export const updateTreatmentSchema = createTreatmentSchema.partial();
export type UpdateTreatment = z.infer<typeof updateTreatmentSchema>;
export const treatmentFiltersSchema = paginationParamsSchema.extend({
  patient_id: z.string().uuid().optional(),
  dentist_id: z.string().uuid().optional(),
  status: z.enum(TREATMENT_STATUSES).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});
export type TreatmentFilters = z.infer<typeof treatmentFiltersSchema>;

// --- Invoice DTOs ---
export const createInvoiceSchema = invoiceSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true, number: true }).extend({
  number: z.string().optional(),
  items: z.array(invoiceItemSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true, invoice_id: true })).min(1),
});
export type CreateInvoice = z.infer<typeof createInvoiceSchema>;
export const updateInvoiceSchema = invoiceSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true, number: true }).partial();
export type UpdateInvoice = z.infer<typeof updateInvoiceSchema>;
export const invoiceFiltersSchema = paginationParamsSchema.extend({
  patient_id: z.string().uuid().optional(),
  status: z.enum(INVOICE_STATUSES).optional(),
  branch_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>;

// --- Payment DTOs ---
export const createPaymentSchema = paymentSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreatePayment = z.infer<typeof createPaymentSchema>;
export const updatePaymentSchema = createPaymentSchema.partial();
export type UpdatePayment = z.infer<typeof updatePaymentSchema>;

// --- Installment DTOs ---
export const createInstallmentSchema = installmentSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateInstallment = z.infer<typeof createInstallmentSchema>;
export const updateInstallmentSchema = createInstallmentSchema.partial();
export type UpdateInstallment = z.infer<typeof updateInstallmentSchema>;

// --- Insurance DTOs ---
export const createInsuranceCompanySchema = insuranceCompanySchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateInsuranceCompany = z.infer<typeof createInsuranceCompanySchema>;
export const updateInsuranceCompanySchema = createInsuranceCompanySchema.partial();
export type UpdateInsuranceCompany = z.infer<typeof updateInsuranceCompanySchema>;

export const createInsuranceClaimSchema = insuranceClaimSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateInsuranceClaim = z.infer<typeof createInsuranceClaimSchema>;
export const updateInsuranceClaimSchema = createInsuranceClaimSchema.partial();
export type UpdateInsuranceClaim = z.infer<typeof updateInsuranceClaimSchema>;

// --- Image DTOs ---
export const createImageSchema = imageSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateImage = z.infer<typeof createImageSchema>;
export const updateImageSchema = createImageSchema.partial();
export type UpdateImage = z.infer<typeof updateImageSchema>;

// --- Prescription DTOs ---
export const createPrescriptionSchema = prescriptionSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true }).extend({
  items: z.array(prescriptionItemSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true, prescription_id: true, clinic_id: true })).min(1),
});
export type CreatePrescription = z.infer<typeof createPrescriptionSchema>;

// --- Medical Report DTOs ---
export const createMedicalReportSchema = medicalReportSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateMedicalReport = z.infer<typeof createMedicalReportSchema>;
export const updateMedicalReportSchema = createMedicalReportSchema.partial();
export type UpdateMedicalReport = z.infer<typeof updateMedicalReportSchema>;

// --- Lab Order DTOs ---
export const createLabOrderSchema = labOrderSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateLabOrder = z.infer<typeof createLabOrderSchema>;
export const updateLabOrderSchema = createLabOrderSchema.partial();
export type UpdateLabOrder = z.infer<typeof updateLabOrderSchema>;

export const createLabSchema = labSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateLab = z.infer<typeof createLabSchema>;
export const updateLabSchema = createLabSchema.partial();
export type UpdateLab = z.infer<typeof updateLabSchema>;

// --- Inventory DTOs ---
export const createInventoryItemSchema = inventoryItemSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateInventoryItem = z.infer<typeof createInventoryItemSchema>;
export const updateInventoryItemSchema = createInventoryItemSchema.partial();
export type UpdateInventoryItem = z.infer<typeof updateInventoryItemSchema>;

export const createInventoryTransactionSchema = inventoryTransactionSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateInventoryTransaction = z.infer<typeof createInventoryTransactionSchema>;

export const createSupplierSchema = supplierSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateSupplier = z.infer<typeof createSupplierSchema>;
export const updateSupplierSchema = createSupplierSchema.partial();
export type UpdateSupplier = z.infer<typeof updateSupplierSchema>;

// --- Expense DTOs ---
export const createExpenseSchema = expenseSchema.omit({ id: true, clinic_id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateExpense = z.infer<typeof createExpenseSchema>;
export const updateExpenseSchema = createExpenseSchema.partial();
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;
export const expenseFiltersSchema = paginationParamsSchema.extend({
  category: z.union([z.enum(EXPENSE_CATEGORIES), z.literal('all')]).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  is_recurring: z.boolean().optional(),
  search: z.string().optional(),
});
export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>;

// --- Attendance DTOs ---
export const createAttendanceSchema = attendanceSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateAttendance = z.infer<typeof createAttendanceSchema>;
export const updateAttendanceSchema = createAttendanceSchema.partial();
export type UpdateAttendance = z.infer<typeof updateAttendanceSchema>;

// --- Notification DTOs ---
export const createNotificationSchema = notificationSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true, read_at: true });
export type CreateNotification = z.infer<typeof createNotificationSchema>;

// --- Message Template DTOs ---
export const createMessageTemplateSchema = messageTemplateSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateMessageTemplate = z.infer<typeof createMessageTemplateSchema>;
export const updateMessageTemplateSchema = createMessageTemplateSchema.partial();
export type UpdateMessageTemplate = z.infer<typeof updateMessageTemplateSchema>;

// --- Audit Log DTOs ---
export const createAuditLogSchema = auditLogSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateAuditLog = z.infer<typeof createAuditLogSchema>;

// --- Setting DTOs ---
export const createSettingSchema = settingSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateSetting = z.infer<typeof createSettingSchema>;
export const updateSettingSchema = createSettingSchema.partial();
export type UpdateSetting = z.infer<typeof updateSettingSchema>;

// --- License DTOs ---
export const createLicenseSchema = licenseSchema.omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export type CreateLicense = z.infer<typeof createLicenseSchema>;
export const updateLicenseSchema = createLicenseSchema.partial();
export type UpdateLicense = z.infer<typeof updateLicenseSchema>;

// --- Advanced Transactions & Security DTOs ---
export const acceptPlanPayloadSchema = z.object({
  planId: z.string().min(1),
  patientId: z.string().min(1),
  dentistId: z.string().optional(),
  items: z.array(
    z.object({
      procedureId: z.string().min(1),
      toothNumber: z.number().nullable().optional(),
      surface: z.string().nullable().optional(),
      unitPriceHalalas: z.number().optional(),
      discountHalalas: z.number().optional(),
      quantity: z.number().optional(),
      phase: z.number().optional(),
    }).passthrough()
  ),
}).passthrough();

export const executeTreatmentPayloadSchema = z.object({
  patientId: z.string().min(1),
  dentistId: z.string().optional(),
  procedureId: z.string().min(1),
  toothNumber: z.number().nullable().optional(),
  surface: z.string().nullable().optional(),
  anesthesiaType: z.string().nullable().optional(),
  materialsUsed: z.array(z.any()).optional(),
  clinicalNotes: z.string().nullable().optional(),
  durationMinutes: z.number().optional(),
  priceHalalas: z.number().optional(),
  planItemId: z.string().nullable().optional(),
}).passthrough();

export const scheduledReportSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  frequency: z.string().default('monthly'),
  time: z.string().optional(),
  day_of_week: z.number().optional(),
  day_of_month: z.number().optional(),
  recipients: z.array(z.string()).optional(),
  format: z.string().default('pdf'),
  is_active: z.boolean().default(true),
}).passthrough();

export const reportFilterSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  branchId: z.string().optional(),
  branch_id: z.string().optional(),
  dentistId: z.string().optional(),
  dentist_id: z.string().optional(),
  period: z.string().optional(),
  category: z.string().optional(),
}).passthrough();

export const reportFiltersSchema = z.object({
  from: z.string(),
  to: z.string(),
  dentist_id: z.string().optional(),
  branch_id: z.string().optional(),
  procedure_category: z.string().optional(),
  insurance_company_id: z.string().optional(),
  payment_method: z.string().optional(),
}).passthrough();

export type ReportFilters = z.infer<typeof reportFiltersSchema>;

export interface ReportKpiCard {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  isCurrency?: boolean;
  color?: string;
}

export interface ReportTableColumn {
  key: string;
  header: string;
  align?: 'right' | 'center' | 'left';
  width?: string;
  render?: (row: any) => any;
}

export interface ReportGeneratedData {
  reportId: string;
  kpis: ReportKpiCard[];
  chartData: any[];
  tableColumns: ReportTableColumn[];
  tableRows: any[];
  summaryNote?: string;
  totalRevenueHalalas?: number;
  count?: number;
}

export const auditLogFiltersSchema = z.object({
  user_id: z.string().optional(),
  entity_type: z.string().optional(),
  action: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(500).optional(),
}).passthrough();

export const permissionsMatrixSchema = z.record(z.string(), z.any());

export const clinicSecurityPoliciesSchema = z.object({
  receptionist_hide_prices: z.boolean().optional(),
  accountant_hide_clinical_notes: z.boolean().optional(),
  dentist_only_own_patients: z.boolean().optional(),
  restrict_to_own_patients: z.boolean().optional(),
  idle_timeout_minutes: z.number().optional(),
  idle_timeout_min: z.number().optional(),
  max_failed_attempts: z.number().optional(),
  max_login_attempts: z.number().optional(),
  lockout_duration_minutes: z.number().optional(),
  lockout_duration_min: z.number().optional(),
}).passthrough();

export interface DashboardSummary {
  todayAppointmentsCount: number;
  todayWaitingCount: number;
  todayCompletedCount: number;
  todayRevenueHalalas: number;
  monthRevenueHalalas: number;
  activePatientsCount: number;
  lowStockItemsCount: number;
  expiringItemsCount?: number;
  pendingInsuranceClaimsCount: number;
}

export interface FinancialStats {
  totalBilledHalalas: number;
  totalPaidHalalas: number;
  totalUnpaidHalalas: number;
  totalVatHalalas: number;
  invoicesCount: number;
}

// ============================================================================
// 5. IPC API CONTRACT FOR RENDERER (window.eyadati.<module>.<method>)
// ============================================================================

export interface PatientsIpcApi {
  list: (filters: PatientFilters) => Promise<ApiResult<Paginated<Patient>>>;
  getById: (id: string) => Promise<ApiResult<Patient>>;
  create: (data: CreatePatient) => Promise<ApiResult<Patient>>;
  update: (id: string, data: UpdatePatient) => Promise<ApiResult<Patient>>;
  delete: (id: string) => Promise<ApiResult<boolean>>;
  search: (query: string, page?: number, limit?: number) => Promise<ApiResult<Paginated<Patient>>>;
  getMedicalHistory: (patientId: string) => Promise<ApiResult<MedicalHistory[]>>;
  saveMedicalHistory: (data: CreateMedicalHistory) => Promise<ApiResult<MedicalHistory>>;
  getAllergies: (patientId: string) => Promise<ApiResult<Allergy[]>>;
  saveAllergy: (data: CreateAllergy) => Promise<ApiResult<Allergy>>;
  deleteAllergy: (id: string) => Promise<ApiResult<boolean>>;
}

export interface AppointmentsIpcApi {
  list: (filters: AppointmentFilters) => Promise<ApiResult<Paginated<Appointment>>>;
  getById: (id: string) => Promise<ApiResult<Appointment>>;
  create: (data: CreateAppointment) => Promise<ApiResult<Appointment>>;
  update: (id: string, data: UpdateAppointment) => Promise<ApiResult<Appointment>>;
  delete: (id: string) => Promise<ApiResult<boolean>>;
  updateStatus: (id: string, status: AppointmentStatus) => Promise<ApiResult<Appointment>>;
  getWeek: (from: string, to: string, dentistId?: string) => Promise<ApiResult<Appointment[]>>;
  getToday: (dentistId?: string) => Promise<ApiResult<Appointment[]>>;
}

export interface ToothRecordsIpcApi {
  getByPatient: (patientId: string) => Promise<ApiResult<ToothRecord[]>>;
  saveRecord: (data: CreateToothRecord) => Promise<ApiResult<ToothRecord>>;
  deleteRecord: (id: string) => Promise<ApiResult<boolean>>;
}

export interface AcceptPlanPayload {
  planId: string;
  patientId: string;
  dentistId: string;
  items: Array<{
    procedureId: string;
    toothNumber: number | null;
    surface: ToothSurface | null;
    unitPriceHalalas: number;
    discountHalalas: number;
    quantity: number;
    phase?: number;
  }>;
}

export interface ExecuteTreatmentPayload {
  patientId: string;
  dentistId: string;
  procedureId: string;
  toothNumber?: number | null;
  surface?: ToothSurface | null;
  anesthesiaType?: string | null;
  materialsUsed?: MaterialUsed[];
  clinicalNotes?: string | null;
  durationMinutes?: number;
  priceHalalas: number;
  planItemId?: string | null;
  newToothCondition?: ToothCondition;
  image?: { title: string; image_type: ImageType; file_path: string };
}

export interface TreatmentsIpcApi {
  list: (filters: TreatmentFilters) => Promise<ApiResult<Paginated<Treatment>>>;
  getById: (id: string) => Promise<ApiResult<Treatment>>;
  create: (data: CreateTreatment) => Promise<ApiResult<Treatment>>;
  update: (id: string, data: UpdateTreatment) => Promise<ApiResult<Treatment>>;
  delete: (id: string) => Promise<ApiResult<boolean>>;
  getPlansByPatient: (patientId: string) => Promise<ApiResult<TreatmentPlan[]>>;
  getPlanById?: (id: string) => Promise<ApiResult<TreatmentPlan & { items: TreatmentPlanItem[] }>>;
  createPlan: (data: CreateTreatmentPlan) => Promise<ApiResult<TreatmentPlan>>;
  updatePlan: (id: string, data: UpdateTreatmentPlan) => Promise<ApiResult<TreatmentPlan>>;
  deletePlan?: (id: string) => Promise<ApiResult<boolean>>;
  getProcedures: (filters?: ProcedureFilters) => Promise<ApiResult<Paginated<Procedure>>>;
  createProcedure?: (data: CreateProcedure) => Promise<ApiResult<Procedure>>;
  updateProcedure?: (id: string, data: UpdateProcedure) => Promise<ApiResult<Procedure>>;
  deleteProcedure?: (id: string) => Promise<ApiResult<boolean>>;
  bulkUpsertProcedures?: (procedures: CreateProcedure[]) => Promise<ApiResult<number>>;
  acceptPlanTransaction?: (payload: AcceptPlanPayload) => Promise<ApiResult<{ invoiceId: string; invoiceNumber: string; treatmentsCount: number }>>;
  executeTreatmentTransaction?: (payload: ExecuteTreatmentPayload) => Promise<ApiResult<Treatment>>;
}

export interface FinancialsReportData {
  monthlyCashFlow: Array<{
    month: string;
    monthKey: string;
    revenueHalalas: number;
    revenueSAR: number;
    cashFlowHalalas: number;
    cashFlowSAR: number;
    invoicesCount: number;
  }>;
  revenueByService: Array<{
    category: string;
    name: string;
    nameEn: string;
    revenueHalalas: number;
    revenueSAR: number;
    percentage: number;
    color: string;
    count: number;
  }>;
  annualTrend: Array<{
    month: string;
    revenueSAR: number;
    collectedSAR: number;
  }>;
  summary: {
    monthlyRevenueHalalas: number;
    pendingInvoicesCount: number;
    refundedHalalas: number;
    insuranceApprovedPercent: number;
    insuranceActiveCount: number;
  };
}

export interface InvoicesIpcApi {
  list: (filters: InvoiceFilters) => Promise<ApiResult<Paginated<Invoice>>>;
  getById: (id: string) => Promise<ApiResult<Invoice & { items: InvoiceItem[]; payments: Payment[] }>>;
  create: (data: CreateInvoice) => Promise<ApiResult<Invoice>>;
  update: (id: string, data: UpdateInvoice) => Promise<ApiResult<Invoice>>;
  voidInvoice: (id: string, reason: string) => Promise<ApiResult<Invoice>>;
  void?: (id: string, reason: string) => Promise<ApiResult<Invoice>>;
  getInstallments?: (invoiceId: string) => Promise<ApiResult<Installment[]>>;
  createInstallments?: (invoiceId: string, installments: Array<{ due_date: string; amount_halalas: number }>) => Promise<ApiResult<Installment[]>>;
  getStats: (range?: { from?: string; to?: string }) => Promise<ApiResult<FinancialStats>>;
}

export interface PaymentsIpcApi {
  list: (params?: PaginationParams) => Promise<ApiResult<Paginated<Payment>>>;
  create: (data: CreatePayment) => Promise<ApiResult<Payment>>;
  getByInvoice: (invoiceId: string) => Promise<ApiResult<Payment[]>>;
}

export interface InsuranceIpcApi {
  getCompanies: () => Promise<ApiResult<InsuranceCompany[]>>;
  createCompany: (data: CreateInsuranceCompany) => Promise<ApiResult<InsuranceCompany>>;
  updateCompany: (id: string, data: UpdateInsuranceCompany) => Promise<ApiResult<InsuranceCompany>>;
  deleteCompany: (id: string) => Promise<ApiResult<boolean>>;
  getClaims: (filters?: {
    patientId?: string;
    companyId?: string;
    status?: InsuranceClaimStatus;
    period?: 'all' | 'today' | 'week' | 'month';
    search?: string;
  }) => Promise<ApiResult<InsuranceClaim[]>>;
  getClaimById: (id: string) => Promise<ApiResult<InsuranceClaim>>;
  createClaim: (data: CreateInsuranceClaim) => Promise<ApiResult<InsuranceClaim>>;
  updateClaim: (id: string, data: UpdateInsuranceClaim) => Promise<ApiResult<InsuranceClaim>>;
  transitionClaimStatus: (
    id: string,
    status: InsuranceClaimStatus,
    payload?: {
      approved_halalas?: number;
      rejected_halalas?: number;
      rejection_reason?: string;
      userId?: string;
    }
  ) => Promise<ApiResult<InsuranceClaim>>;
  getExpiringPolicies: (daysThreshold?: number) => Promise<ApiResult<Array<Patient & { daysRemaining: number }>>>;
  getAuditLogs: (entityType?: string, entityId?: string) => Promise<ApiResult<AuditLog[]>>;
}

export interface ImagesIpcApi {
  list: (params?: PaginationParams) => Promise<ApiResult<Paginated<Image>>>;
  getByPatient: (patientId: string) => Promise<ApiResult<Image[]>>;
  create: (data: CreateImage) => Promise<ApiResult<Image>>;
  delete: (id: string) => Promise<ApiResult<boolean>>;
}

export interface InventoryIpcApi {
  list: (params?: PaginationParams & { search?: string; category?: string; status?: string }) => Promise<ApiResult<Paginated<InventoryItem>>>;
  getById: (id: string) => Promise<ApiResult<InventoryItem>>;
  create: (data: CreateInventoryItem) => Promise<ApiResult<InventoryItem>>;
  update: (id: string, data: UpdateInventoryItem) => Promise<ApiResult<InventoryItem>>;
  delete: (id: string) => Promise<ApiResult<boolean>>;
  recordTransaction: (data: CreateInventoryTransaction) => Promise<ApiResult<InventoryTransaction>>;
  getTransactions: (params?: { itemId?: string; type?: InventoryTransactionType; limit?: number }) => Promise<ApiResult<Array<InventoryTransaction & { item_name?: string; item_unit?: string; item_sku?: string; treatment_title?: string; created_by_name?: string }>>>;
  getLowStock: () => Promise<ApiResult<InventoryItem[]>>;
  getExpiringItems: (daysThreshold?: number) => Promise<ApiResult<Array<InventoryItem & { daysRemaining: number; isExpired: boolean }>>>;
  getMonthlyConsumptionReport: (month?: string, year?: number) => Promise<ApiResult<InventoryMonthlyConsumptionReport>>;
  getSuppliers: () => Promise<ApiResult<Supplier[]>>;
  createSupplier: (data: CreateSupplier) => Promise<ApiResult<Supplier>>;
  updateSupplier: (id: string, data: UpdateSupplier) => Promise<ApiResult<Supplier>>;
  deleteSupplier: (id: string) => Promise<ApiResult<boolean>>;
  getPurchaseOrders: () => Promise<ApiResult<PurchaseOrder[]>>;
  createPurchaseOrder: (data: { supplier_id: string; order_date?: string; expected_date?: string | null; notes?: string | null; items: Array<{ item_id: string; quantity: number; cost_halalas: number }> }) => Promise<ApiResult<PurchaseOrder>>;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrderStatus) => Promise<ApiResult<PurchaseOrder>>;
  receivePurchaseOrder: (id: string, payload?: { received_at?: string; notes?: string }) => Promise<ApiResult<PurchaseOrder>>;
}

export interface StaffIpcApi {
  list: (filters?: UserFilters) => Promise<ApiResult<Paginated<User>>>;
  getById: (id: string) => Promise<ApiResult<User>>;
  create: (data: CreateUser) => Promise<ApiResult<User>>;
  update: (id: string, data: UpdateUser) => Promise<ApiResult<User>>;
  getAttendance: (userId?: string, date?: string) => Promise<ApiResult<Attendance[]>>;
  recordAttendance: (data: CreateAttendance) => Promise<ApiResult<Attendance>>;
  getLeaves: (userId?: string) => Promise<ApiResult<LeaveRequest[]>>;
  createLeave: (data: { user_id: string; type: LeaveType; start_date: string; end_date: string; days_count: number; reason: string }) => Promise<ApiResult<LeaveRequest>>;
  updateLeaveStatus: (id: string, status: LeaveStatus, reviewedBy?: string) => Promise<ApiResult<LeaveRequest>>;
  getCommissions: (filters?: { from?: string; to?: string }) => Promise<ApiResult<DoctorCommissionSummary[]>>;
}

export interface AuthUser {
  id: string;
  clinic_id: string;
  full_name: string;
  username: string;
  role: UserRole;
  specialty: string | null;
  license_number: string | null;
  phone: string | null;
  email: string | null;
  avatar_path: string | null;
  color: string;
  commission_percent: number;
  is_active: boolean;
  pin?: string | null;
  failed_attempts?: number;
  locked_until?: string | null;
  last_login_at: string | null;
  must_change_password?: boolean;
}

export interface SetupFirstRunPayload {
  clinic: {
    name: string;
    phone?: string;
    city?: string;
    tax_number?: string;
  };
  owner: {
    full_name: string;
    username: string;
    password: string;
  };
}

export interface SetupFirstRunResult {
  id: string;
  username: string;
  full_name: string;
  role: string;
}

export interface AuthIpcApi {
  login: (credentials: { username: string; password: string }) => Promise<ApiResult<{ user: AuthUser; token?: string }>>;
  quickUnlockPin: (payload: { userId: string; pin: string }) => Promise<ApiResult<AuthUser>>;
  logout: () => Promise<ApiResult<boolean>>;
  getCurrentUser: () => Promise<ApiResult<AuthUser | null>>;
  me: () => Promise<ApiResult<AuthUser | null>>;
  unlockAccount: (userId: string) => Promise<ApiResult<boolean>>;
  resetPin: (userId: string, newPin: string) => Promise<ApiResult<boolean>>;
  resetPassword: (userId: string, newPassword: string) => Promise<ApiResult<boolean>>;
  changePassword: (payload: { userId: string; newPassword: string }) => Promise<ApiResult<boolean>>;
  needsSetup: () => Promise<ApiResult<{ needsSetup: boolean }>>;
  setupFirstRun: (payload: SetupFirstRunPayload) => Promise<ApiResult<SetupFirstRunResult>>;
}

export interface AuditLogsIpcApi {
  list: (filters?: {
    user_id?: string;
    entity_type?: string;
    action?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<ApiResult<Paginated<AuditLog & { user_name?: string }>>>;
  getById: (id: string) => Promise<ApiResult<AuditLog & { user_name?: string }>>;
  export: (filters?: any) => Promise<ApiResult<string>>;
}

export interface RbacIpcApi {
  getMatrix: () => Promise<ApiResult<PermissionsMatrix>>;
  updateMatrix: (matrix: PermissionsMatrix) => Promise<ApiResult<PermissionsMatrix>>;
  getPolicies: () => Promise<ApiResult<ClinicSecurityPolicies>>;
  updatePolicies: (policies: Partial<ClinicSecurityPolicies>) => Promise<ApiResult<ClinicSecurityPolicies>>;
}

export type ReportPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface ReportPeriodFilters {
  period: ReportPeriod;
  from?: string;
  to?: string;
  dentistId?: string;
  branchId?: string;
  category?: string;
}

export interface RevenueReportData {
  totalRevenueHalalas: number;
  totalInvoicesCount: number;
  totalPaymentsCount: number;
  byPeriod: Array<{ date: string; label: string; amountHalalas: number; count: number }>;
  byDoctor: Array<{ doctorId: string; doctorName: string; amountHalalas: number; count: number; percentage: number }>;
  byProcedure: Array<{ procedureName: string; category: string; amountHalalas: number; count: number; percentage: number }>;
  byInsurance: Array<{ companyId: string | null; companyName: string; amountHalalas: number; count: number; percentage: number }>;
  items: Array<{
    id: string;
    paymentId: string;
    invoiceNumber: string;
    patientName: string;
    doctorName: string;
    procedureName: string;
    insuranceName: string;
    date: string;
    method: string;
    amountHalalas: number;
  }>;
}

export interface IncomeStatementData {
  period: string;
  from: string;
  to: string;
  totalRevenueHalalas: number;
  totalExpensesHalalas: number;
  netIncomeHalalas: number;
  profitMarginPercent: number;
  revenueByCategory: Array<{ name: string; amountHalalas: number; percent: number }>;
  expensesByCategory: Array<{ category: ExpenseCategory; name: string; amountHalalas: number; percent: number }>;
  monthlyComparison: Array<{ month: string; revenueHalalas: number; expensesHalalas: number; netHalalas: number }>;
}

export interface AgingReportData {
  totalOutstandingHalalas: number;
  buckets: {
    current30: number;
    days31to60: number;
    days61to90: number;
    over90: number;
  };
  bucketCounts: {
    current30: number;
    days31to60: number;
    days61to90: number;
    over90: number;
  };
  invoices: Array<{
    invoiceId: string;
    invoiceNumber: string;
    patientId: string;
    patientName: string;
    patientPhone: string;
    issueDate: string;
    daysOverdue: number;
    bucket: '0-30' | '31-60' | '61-90' | '+90';
    totalHalalas: number;
    paidHalalas: number;
    balanceHalalas: number;
  }>;
}

export interface DoctorCommissionData {
  doctorId: string;
  doctorName: string;
  specialty: string;
  commissionPercent: number;
  treatmentsCount: number;
  totalRevenueHalalas: number;
  commissionHalalas: number;
  treatmentsList: Array<{
    date: string;
    patientName: string;
    procedureName: string;
    toothNumber: number | null;
    priceHalalas: number;
    commissionHalalas: number;
  }>;
}

export interface VatReportData {
  period: string;
  outputVatHalalas: number;
  taxableSalesHalalas: number;
  inputVatHalalas: number;
  taxablePurchasesHalalas: number;
  netVatPayableHalalas: number;
  transactions: Array<{
    date: string;
    ref: string;
    type: 'sale' | 'purchase';
    description: string;
    baseHalalas: number;
    vatHalalas: number;
    totalHalalas: number;
  }>;
}

export interface DailyCashClosingData {
  date: string;
  totalCollectedHalalas: number;
  paymentsCount: number;
  byMethod: {
    cashHalalas: number;
    madaHalalas: number;
    creditCardHalalas: number;
    bankTransferHalalas: number;
    insuranceHalalas: number;
  };
  byUser: Array<{
    userId: string;
    userName: string;
    count: number;
    totalHalalas: number;
    cashHalalas: number;
    madaHalalas: number;
    otherHalalas: number;
  }>;
  paymentsList: Array<{
    id: string;
    time: string;
    patientName: string;
    invoiceNumber: string;
    method: string;
    amountHalalas: number;
    receivedBy: string;
    reference: string | null;
  }>;
}

// --- Scheduled Reports ---
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';
export type ScheduledReportFormat = 'pdf' | 'csv';

export interface ScheduledReport {
  id: string;
  reportId: string;
  reportName: string;
  category: 'patients' | 'appointments' | 'clinical' | 'financial';
  frequency: ScheduleFrequency;
  timeOfDay: string;
  targetFolder: string;
  format: ScheduledReportFormat;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  created_at: string;
}

export interface CreateScheduledReport {
  reportId: string;
  reportName: string;
  category: 'patients' | 'appointments' | 'clinical' | 'financial';
  frequency: ScheduleFrequency;
  timeOfDay: string;
  targetFolder: string;
  format?: ScheduledReportFormat;
  enabled?: boolean;
}

export interface GeneratedReportHistoryItem {
  id: string;
  scheduledReportId?: string;
  reportName: string;
  periodLabel: string;
  filePath: string;
  fileSizeKb: number;
  format: 'pdf' | 'csv';
  generatedAt: string;
  status: 'saved' | 'failed';
}

export interface ExpensesIpcApi {
  list: (filters?: ExpenseFilters) => Promise<ApiResult<Expense[]>>;
  getById: (id: string) => Promise<ApiResult<Expense>>;
  create: (data: CreateExpense) => Promise<ApiResult<Expense>>;
  update: (id: string, data: UpdateExpense) => Promise<ApiResult<Expense>>;
  delete: (id: string) => Promise<ApiResult<boolean>>;
  processRecurring: () => Promise<ApiResult<Expense[]>>;
}

export interface ReportsIpcApi {
  getReport: (reportId: string, filters: ReportFilters) => Promise<ApiResult<ReportGeneratedData>>;
  getFinancialReport: (from: string, to: string) => Promise<ApiResult<{
    totalRevenueHalalas: number;
    totalExpensesHalalas: number;
    netProfitHalalas: number;
    invoicesCount: number;
    paymentsCount: number;
  }>>;
  getFinancials: (range?: { from?: string; to?: string; year?: number }) => Promise<ApiResult<FinancialsReportData>>;
  getDoctorPerformance: (dentistId: string, from?: string, to?: string) => Promise<ApiResult<{
    treatmentsCount: number;
    totalEarningsHalalas: number;
    appointmentsCount: number;
  }>>;
  getRevenueReport: (filters: ReportPeriodFilters) => Promise<ApiResult<RevenueReportData>>;
  getIncomeStatement: (filters: ReportPeriodFilters) => Promise<ApiResult<IncomeStatementData>>;
  getAgingReport: () => Promise<ApiResult<AgingReportData>>;
  getDoctorCommissions: (filters: ReportPeriodFilters) => Promise<ApiResult<DoctorCommissionData[]>>;
  getVatReport: (filters: ReportPeriodFilters) => Promise<ApiResult<VatReportData>>;
  getDailyCashClosing: (date?: string, userId?: string) => Promise<ApiResult<DailyCashClosingData>>;
  getScheduledReports: () => Promise<ApiResult<ScheduledReport[]>>;
  createScheduledReport: (data: CreateScheduledReport) => Promise<ApiResult<ScheduledReport>>;
  updateScheduledReport: (id: string, data: Partial<ScheduledReport>) => Promise<ApiResult<ScheduledReport>>;
  deleteScheduledReport: (id: string) => Promise<ApiResult<boolean>>;
  runScheduledReportNow: (id: string) => Promise<ApiResult<GeneratedReportHistoryItem>>;
  getReportHistory: () => Promise<ApiResult<GeneratedReportHistoryItem[]>>;
}

export interface SettingsIpcApi {
  getClinic: () => Promise<ApiResult<Clinic>>;
  updateClinic: (data: UpdateClinic) => Promise<ApiResult<Clinic>>;
  getSettings: () => Promise<ApiResult<Record<string, unknown>>>;
  setSetting: (key: string, value: unknown) => Promise<ApiResult<boolean>>;
}

export interface RoomsIpcApi {
  list: () => Promise<ApiResult<Room[]>>;
  getById: (id: string) => Promise<ApiResult<Room>>;
  updateStatus: (id: string, status: RoomStatus) => Promise<ApiResult<Room>>;
  create: (data: CreateRoom) => Promise<ApiResult<Room>>;
  update: (id: string, data: Partial<Room>) => Promise<ApiResult<Room>>;
  delete: (id: string) => Promise<ApiResult<boolean>>;
}

export interface DashboardIpcApi {
  getTodaySummary: () => Promise<ApiResult<DashboardSummary>>;
}

export interface PrescriptionsIpcApi {
  list: (params?: { patient_id?: string; dentist_id?: string; page?: number; limit?: number }) => Promise<ApiResult<Paginated<Prescription & { items: PrescriptionItem[]; dentist_name?: string; patient_name?: string }>>>;
  getByPatient: (patientId: string) => Promise<ApiResult<Array<Prescription & { items: PrescriptionItem[]; dentist_name?: string }>>>;
  getById: (id: string) => Promise<ApiResult<Prescription & { items: PrescriptionItem[]; dentist_name?: string }>>;
  create: (data: CreatePrescription) => Promise<ApiResult<Prescription & { items: PrescriptionItem[] }>>;
  delete: (id: string) => Promise<ApiResult<boolean>>;
}

export interface MedicalReportsIpcApi {
  list: (params?: { patient_id?: string; type?: MedicalReportType; page?: number; limit?: number }) => Promise<ApiResult<Paginated<MedicalReport & { patient_name?: string; doctor_name?: string }>>>;
  getByPatient: (patientId: string) => Promise<ApiResult<MedicalReport[]>>;
  getById: (id: string) => Promise<ApiResult<MedicalReport>>;
  create: (data: CreateMedicalReport) => Promise<ApiResult<MedicalReport>>;
  update: (id: string, data: UpdateMedicalReport) => Promise<ApiResult<MedicalReport>>;
  delete: (id: string) => Promise<ApiResult<boolean>>;
}

export interface LabOrdersIpcApi {
  list: (params?: { patient_id?: string; lab_id?: string; status?: LabOrderStatus; page?: number; limit?: number; search?: string }) => Promise<ApiResult<Paginated<LabOrder & { patient_name?: string; patient_phone?: string; lab_name?: string; is_overdue?: boolean }>>>;
  getById: (id: string) => Promise<ApiResult<LabOrder & { patient_name?: string; lab_name?: string }>>;
  create: (data: CreateLabOrder) => Promise<ApiResult<LabOrder>>;
  update: (id: string, data: UpdateLabOrder) => Promise<ApiResult<LabOrder>>;
  delete: (id: string) => Promise<ApiResult<boolean>>;
  updateStatus: (id: string, status: LabOrderStatus, received_at?: string | null) => Promise<ApiResult<LabOrder>>;
  getOverdue: () => Promise<ApiResult<Array<LabOrder & { patient_name?: string; lab_name?: string }>>>;
}

export interface LabsIpcApi {
  list: () => Promise<ApiResult<Lab[]>>;
  getById: (id: string) => Promise<ApiResult<Lab>>;
  create: (data: CreateLab) => Promise<ApiResult<Lab>>;
  update: (id: string, data: UpdateLab) => Promise<ApiResult<Lab>>;
  delete: (id: string) => Promise<ApiResult<boolean>>;
}

export interface LicenseStatusResult extends LicenseStatus {
  license_code?: string;
  is_online_available: boolean;
  device_code: string;
}

export interface LicenseIpcApi {
  getStatus: () => Promise<ApiResult<LicenseStatusResult>>;
  getDeviceCode: () => Promise<ApiResult<string>>;
  activate: (token: string) => Promise<ApiResult<LicenseStatus>>;
  activateOnline: (code: string) => Promise<ApiResult<LicenseStatus>>;
  deactivate: () => Promise<ApiResult<boolean>>;
}

export interface EyadatiSystemApi {
  openFile: (options?: { title?: string; defaultPath?: string; buttonLabel?: string; filters?: Array<{ name: string; extensions: string[] }> }) => Promise<{ canceled: boolean; filePath?: string; data?: string }>;
  saveFile: (options?: { title?: string; defaultPath?: string; buttonLabel?: string; filters?: Array<{ name: string; extensions: string[] }>; content?: string }) => Promise<{ canceled: boolean; filePath?: string }>;
  printDocument: (options?: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  exportPdf: (targetPath?: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<{ updateAvailable: boolean; currentVersion: string; latestVersion: string; message: string }>;
  backupNow: (options?: { destinationPath?: string; encrypt?: boolean; password?: string; compress?: boolean; isAuto?: boolean }) => Promise<{ ok: boolean; filePath?: string; fileName?: string; sizeBytes?: number; isEncrypted?: boolean; error?: string }>;
  restoreBackup: (filePath: string, password?: string) => Promise<{ ok: boolean; error?: string }>;
  showItemInFolder: (fullPath: string) => Promise<boolean>;
}

export interface EyadatiApi {
  patients: PatientsIpcApi;
  appointments: AppointmentsIpcApi;
  rooms: RoomsIpcApi;
  toothRecords: ToothRecordsIpcApi;
  treatments: TreatmentsIpcApi;
  invoices: InvoicesIpcApi;
  payments: PaymentsIpcApi;
  expenses: ExpensesIpcApi;
  insurance: InsuranceIpcApi;
  images: ImagesIpcApi;
  inventory: InventoryIpcApi;
  staff: StaffIpcApi;
  reports: ReportsIpcApi;
  settings: SettingsIpcApi;
  dashboard: DashboardIpcApi;
  prescriptions: PrescriptionsIpcApi;
  medicalReports: MedicalReportsIpcApi;
  labOrders: LabOrdersIpcApi;
  labs: LabsIpcApi;
  auth: AuthIpcApi;
  auditLogs: AuditLogsIpcApi;
  rbac: RbacIpcApi;
  license: LicenseIpcApi;
  system?: EyadatiSystemApi;
  openFile?: EyadatiSystemApi['openFile'];
  saveFile?: EyadatiSystemApi['saveFile'];
  printDocument?: EyadatiSystemApi['printDocument'];
  exportPdf?: EyadatiSystemApi['exportPdf'];
  getAppVersion?: EyadatiSystemApi['getAppVersion'];
  checkForUpdates?: EyadatiSystemApi['checkForUpdates'];
  backupNow?: EyadatiSystemApi['backupNow'];
  restoreBackup?: EyadatiSystemApi['restoreBackup'];
  showItemInFolder?: EyadatiSystemApi['showItemInFolder'];
}

declare global {
  interface Window {
    eyadati?: EyadatiApi;
    eyadatiSystem?: EyadatiSystemApi;
  }
}
