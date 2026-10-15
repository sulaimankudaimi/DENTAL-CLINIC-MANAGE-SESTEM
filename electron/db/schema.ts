import { relations } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import type {
  UserRole,
  PermissionAction,
  Gender,
  BloodType,
  MaritalStatus,
  MedicalConditionKey,
  AllergySeverity,
  AppointmentStatus,
  AppointmentSource,
  RoomStatus,
  ProcedureCategory,
  ToothType,
  ToothSurface,
  ToothCondition,
  ToothRecordStatus,
  TreatmentPlanStatus,
  TreatmentStatus,
  InvoiceStatus,
  PaymentMethod,
  InstallmentStatus,
  InsuranceClaimStatus,
  ImageType,
  MedicalReportType,
  LabOrderType,
  LabOrderStatus,
  InventoryTransactionType,
  ExpenseCategory,
  MessageChannel,
  LicensePlan,
  ClinicWorkingHours,
  RoomEquipment,
  MaterialUsed,
  InsuranceClaimAttachment,
  PurchaseOrderStatus,
  LeaveType,
  LeaveStatus,
} from '../../shared/contracts';

// ============================================================================
// 1. CLINICS
// ============================================================================
export const clinics = sqliteTable(
  'clinics',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull(),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    name: text('name').notNull(),
    logo_path: text('logo_path'),
    phone: text('phone').notNull(),
    email: text('email'),
    address: text('address'),
    city: text('city').notNull().default('الرياض'),
    tax_number: text('tax_number'),
    cr_number: text('cr_number'),
    currency: text('currency').notNull().default('SAR'),
    timezone: text('timezone').notNull().default('Asia/Riyadh'),
    working_hours: text('working_hours', { mode: 'json' }).$type<ClinicWorkingHours[]>().notNull(),
    slot_duration_min: integer('slot_duration_min').notNull().default(30),
  },
  (table) => ({
    clinicIdIdx: index('idx_clinics_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 2. BRANCHES
// ============================================================================
export const branches = sqliteTable(
  'branches',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    name: text('name').notNull(),
    phone: text('phone'),
    address: text('address'),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => ({
    clinicIdIdx: index('idx_branches_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 3. USERS
// ============================================================================
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    full_name: text('full_name').notNull(),
    username: text('username').notNull(),
    password_hash: text('password_hash').notNull(),
    role: text('role').$type<UserRole>().notNull(),
    specialty: text('specialty'),
    license_number: text('license_number'),
    phone: text('phone'),
    email: text('email'),
    avatar_path: text('avatar_path'),
    color: text('color').notNull().default('#1E4E9C'),
    commission_percent: integer('commission_percent').notNull().default(0),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    last_login_at: text('last_login_at'),
    must_change_password: integer('must_change_password', { mode: 'boolean' }).notNull().default(true),
    pin_hash: text('pin_hash'),
    pin_attempts: integer('pin_attempts').notNull().default(0),
  },
  (table) => ({
    usernameIdx: uniqueIndex('idx_users_username').on(table.username),
    roleIdx: index('idx_users_role').on(table.role),
    clinicIdIdx: index('idx_users_clinic_id').on(table.clinic_id),
  })
);

export const loginAttempts = sqliteTable(
  'login_attempts',
  {
    user_id: text('user_id').primaryKey(),
    attempts: integer('attempts').notNull().default(0),
    locked_until: text('locked_until'),
    updated_at: text('updated_at').notNull(),
  },
  (table) => ({
    lockedIdx: index('idx_login_attempts_locked').on(table.locked_until),
  })
);

// ============================================================================
// 4. ROLE PERMISSIONS
// ============================================================================
export const rolePermissions = sqliteTable(
  'role_permissions',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    role: text('role').$type<UserRole>().notNull(),
    resource: text('resource').notNull(),
    action: text('action').$type<PermissionAction>().notNull(),
  },
  (table) => ({
    roleResourceActionIdx: uniqueIndex('idx_role_resource_action').on(
      table.role,
      table.resource,
      table.action
    ),
    clinicIdIdx: index('idx_role_permissions_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 5. PATIENTS
// ============================================================================
export const patients = sqliteTable(
  'patients',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    code: text('code').notNull(),
    first_name: text('first_name').notNull(),
    father_name: text('father_name'),
    family_name: text('family_name').notNull(),
    gender: text('gender').$type<Gender>().notNull(),
    birth_date: text('birth_date'),
    national_id: text('national_id'),
    phone: text('phone').notNull(),
    phone_alt: text('phone_alt'),
    email: text('email'),
    address: text('address'),
    city: text('city'),
    blood_type: text('blood_type').$type<BloodType>().notNull().default('unknown'),
    marital_status: text('marital_status').$type<MaritalStatus>().notNull().default('single'),
    occupation: text('occupation'),
    emergency_contact_name: text('emergency_contact_name'),
    emergency_contact_phone: text('emergency_contact_phone'),
    referral_source: text('referral_source'),
    primary_dentist_id: text('primary_dentist_id').references(() => users.id),
    insurance_company_id: text('insurance_company_id'),
    insurance_policy_no: text('insurance_policy_no'),
    insurance_expiry: text('insurance_expiry'),
    notes: text('notes'),
    photo_path: text('photo_path'),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => ({
    codeIdx: uniqueIndex('idx_patients_code').on(table.code),
    phoneIdx: index('idx_patients_phone').on(table.phone),
    familyNameIdx: index('idx_patients_family_name').on(table.family_name),
    clinicIdIdx: index('idx_patients_clinic_id').on(table.clinic_id),
    primaryDentistIdx: index('idx_patients_primary_dentist_id').on(table.primary_dentist_id),
  })
);

// ============================================================================
// 6. MEDICAL HISTORY
// ============================================================================
export const medicalHistory = sqliteTable(
  'medical_history',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    patient_id: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    condition_key: text('condition_key').$type<MedicalConditionKey>().notNull(),
    has_condition: integer('has_condition', { mode: 'boolean' }).notNull().default(false),
    details: text('details'),
  },
  (table) => ({
    patientConditionIdx: index('idx_medical_history_patient_condition').on(
      table.patient_id,
      table.condition_key
    ),
    clinicIdIdx: index('idx_medical_history_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 7. ALLERGIES
// ============================================================================
export const allergies = sqliteTable(
  'allergies',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    patient_id: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    allergen: text('allergen').notNull(),
    severity: text('severity').$type<AllergySeverity>().notNull().default('moderate'),
    notes: text('notes'),
  },
  (table) => ({
    patientIdIdx: index('idx_allergies_patient_id').on(table.patient_id),
    clinicIdIdx: index('idx_allergies_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 8. MEDICATIONS CURRENT
// ============================================================================
export const medicationsCurrent = sqliteTable(
  'medications_current',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    patient_id: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    dosage: text('dosage'),
    since: text('since'),
  },
  (table) => ({
    patientIdIdx: index('idx_medications_patient_id').on(table.patient_id),
    clinicIdIdx: index('idx_medications_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 10. ROOMS (chairs)
// ============================================================================
export const rooms = sqliteTable(
  'rooms',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    branch_id: text('branch_id').notNull().references(() => branches.id),
    name: text('name').notNull(),
    number: text('number').notNull(),
    status: text('status').$type<RoomStatus>().notNull().default('free'),
    equipment: text('equipment', { mode: 'json' }).$type<RoomEquipment[]>().notNull(),
  },
  (table) => ({
    branchIdIdx: index('idx_rooms_branch_id').on(table.branch_id),
    clinicIdIdx: index('idx_rooms_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 9. APPOINTMENTS
// ============================================================================
export const appointments = sqliteTable(
  'appointments',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    patient_id: text('patient_id').notNull().references(() => patients.id),
    dentist_id: text('dentist_id').notNull().references(() => users.id),
    branch_id: text('branch_id').notNull().references(() => branches.id),
    room_id: text('room_id').references(() => rooms.id),
    start_at: text('start_at').notNull(),
    end_at: text('end_at').notNull(),
    procedure_ids: text('procedure_ids', { mode: 'json' }).$type<string[]>().notNull(),
    status: text('status').$type<AppointmentStatus>().notNull().default('scheduled'),
    source: text('source').$type<AppointmentSource>().notNull().default('phone'),
    color_override: text('color_override'),
    notes: text('notes'),
    reminder_sent_at: text('reminder_sent_at'),
    created_by: text('created_by').notNull().references(() => users.id),
  },
  (table) => ({
    startAtIdx: index('idx_appointments_start_at').on(table.start_at),
    dentistIdIdx: index('idx_appointments_dentist_id').on(table.dentist_id),
    statusIdx: index('idx_appointments_status').on(table.status),
    patientIdIdx: index('idx_appointments_patient_id').on(table.patient_id),
    clinicIdIdx: index('idx_appointments_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 11. PROCEDURES (catalogue)
// ============================================================================
export const procedures = sqliteTable(
  'procedures',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    code: text('code').notNull(),
    name_ar: text('name_ar').notNull(),
    name_en: text('name_en'),
    category: text('category').$type<ProcedureCategory>().notNull(),
    default_price_halalas: integer('default_price_halalas').notNull(),
    default_duration_min: integer('default_duration_min').notNull().default(30),
    requires_tooth: integer('requires_tooth', { mode: 'boolean' }).notNull().default(false),
    requires_surface: integer('requires_surface', { mode: 'boolean' }).notNull().default(false),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    color: text('color'),
  },
  (table) => ({
    codeIdx: index('idx_procedures_code').on(table.code),
    categoryIdx: index('idx_procedures_category').on(table.category),
    clinicIdIdx: index('idx_procedures_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 12. TEETH REGISTRY (constant FDI & Universal reference)
// ============================================================================
export const teethRegistry = sqliteTable(
  'teeth_registry',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    fdi_number: integer('fdi_number').notNull(),
    universal_number: text('universal_number').notNull(),
    quadrant: integer('quadrant').notNull(),
    type: text('type').$type<ToothType>().notNull(),
    is_primary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
    name_ar: text('name_ar').notNull(),
    name_en: text('name_en').notNull(),
  },
  (table) => ({
    fdiIdx: uniqueIndex('idx_teeth_registry_fdi').on(table.fdi_number),
    clinicIdIdx: index('idx_teeth_registry_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 13. TOOTH RECORDS (odontogram state)
// ============================================================================
export const toothRecords = sqliteTable(
  'tooth_records',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    patient_id: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    tooth_number: integer('tooth_number').notNull(),
    surface: text('surface').$type<ToothSurface>().notNull().default('whole'),
    condition: text('condition').$type<ToothCondition>().notNull(),
    status: text('status').$type<ToothRecordStatus>().notNull().default('existing'),
    treatment_id: text('treatment_id'),
    note: text('note'),
    recorded_at: text('recorded_at').notNull(),
    recorded_by: text('recorded_by').notNull().references(() => users.id),
  },
  (table) => ({
    patientIdIdx: index('idx_tooth_records_patient_id').on(table.patient_id),
    toothNumberIdx: index('idx_tooth_records_tooth_number').on(table.tooth_number),
    patientToothIdx: index('idx_tooth_records_patient_tooth').on(table.patient_id, table.tooth_number),
    clinicIdIdx: index('idx_tooth_records_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 14. TREATMENT PLANS
// ============================================================================
export const treatmentPlans = sqliteTable(
  'treatment_plans',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    patient_id: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    dentist_id: text('dentist_id').notNull().references(() => users.id),
    title: text('title').notNull(),
    status: text('status').$type<TreatmentPlanStatus>().notNull().default('draft'),
    total_halalas: integer('total_halalas').notNull().default(0),
    discount_halalas: integer('discount_halalas').notNull().default(0),
    patient_consent_at: text('patient_consent_at'),
    notes: text('notes'),
  },
  (table) => ({
    patientIdIdx: index('idx_treatment_plans_patient_id').on(table.patient_id),
    dentistIdIdx: index('idx_treatment_plans_dentist_id').on(table.dentist_id),
    statusIdx: index('idx_treatment_plans_status').on(table.status),
    clinicIdIdx: index('idx_treatment_plans_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 15. TREATMENT PLAN ITEMS
// ============================================================================
export const treatmentPlanItems = sqliteTable(
  'treatment_plan_items',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    plan_id: text('plan_id').notNull().references(() => treatmentPlans.id, { onDelete: 'cascade' }),
    procedure_id: text('procedure_id').notNull().references(() => procedures.id),
    tooth_number: integer('tooth_number'),
    surface: text('surface').$type<ToothSurface>(),
    quantity: integer('quantity').notNull().default(1),
    unit_price_halalas: integer('unit_price_halalas').notNull(),
    discount_halalas: integer('discount_halalas').notNull().default(0),
    priority: integer('priority').notNull().default(1),
    phase: integer('phase').notNull().default(1),
    status: text('status').$type<ToothRecordStatus>().notNull().default('planned'),
    scheduled_date: text('scheduled_date'),
  },
  (table) => ({
    planIdIdx: index('idx_plan_items_plan_id').on(table.plan_id),
    procedureIdIdx: index('idx_plan_items_procedure_id').on(table.procedure_id),
    clinicIdIdx: index('idx_plan_items_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 16. TREATMENTS (Performed clinical treatments)
// ============================================================================
export const treatments = sqliteTable(
  'treatments',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    patient_id: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    appointment_id: text('appointment_id').references(() => appointments.id),
    plan_item_id: text('plan_item_id').references(() => treatmentPlanItems.id),
    procedure_id: text('procedure_id').notNull().references(() => procedures.id),
    dentist_id: text('dentist_id').notNull().references(() => users.id),
    tooth_number: integer('tooth_number'),
    surface: text('surface').$type<ToothSurface>(),
    performed_at: text('performed_at').notNull(),
    status: text('status').$type<TreatmentStatus>().notNull().default('completed'),
    anesthesia_type: text('anesthesia_type'),
    materials_used: text('materials_used', { mode: 'json' }).$type<MaterialUsed[]>().notNull(),
    clinical_notes: text('clinical_notes'),
    price_halalas: integer('price_halalas').notNull(),
  },
  (table) => ({
    patientIdIdx: index('idx_treatments_patient_id').on(table.patient_id),
    dentistIdIdx: index('idx_treatments_dentist_id').on(table.dentist_id),
    performedAtIdx: index('idx_treatments_performed_at').on(table.performed_at),
    clinicIdIdx: index('idx_treatments_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 21. INSURANCE COMPANIES
// ============================================================================
export const insuranceCompanies = sqliteTable(
  'insurance_companies',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    name: text('name').notNull(),
    contact: text('contact'),
    phone: text('phone'),
    email: text('email'),
    coverage_percent_default: integer('coverage_percent_default').notNull().default(80),
    requires_preapproval: integer('requires_preapproval', { mode: 'boolean' }).notNull().default(true),
    notes: text('notes'),
  },
  (table) => ({
    clinicIdIdx: index('idx_insurance_companies_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 17. INVOICES
// ============================================================================
export const invoices = sqliteTable(
  'invoices',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    number: text('number').notNull(),
    patient_id: text('patient_id').notNull().references(() => patients.id),
    branch_id: text('branch_id').notNull().references(() => branches.id),
    issue_date: text('issue_date').notNull(),
    due_date: text('due_date'),
    subtotal_halalas: integer('subtotal_halalas').notNull(),
    discount_halalas: integer('discount_halalas').notNull().default(0),
    vat_percent: integer('vat_percent').notNull().default(15),
    vat_halalas: integer('vat_halalas').notNull().default(0),
    total_halalas: integer('total_halalas').notNull(),
    paid_halalas: integer('paid_halalas').notNull().default(0),
    balance_halalas: integer('balance_halalas').notNull().default(0),
    status: text('status').$type<InvoiceStatus>().notNull().default('draft'),
    insurance_claim_id: text('insurance_claim_id'),
    zatca_qr: text('zatca_qr'),
    notes: text('notes'),
  },
  (table) => ({
    numberIdx: uniqueIndex('idx_invoices_number').on(table.number),
    patientIdIdx: index('idx_invoices_patient_id').on(table.patient_id),
    statusIdx: index('idx_invoices_status').on(table.status),
    issueDateIdx: index('idx_invoices_issue_date').on(table.issue_date),
    clinicIdIdx: index('idx_invoices_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 18. INVOICE ITEMS
// ============================================================================
export const invoiceItems = sqliteTable(
  'invoice_items',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    invoice_id: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
    treatment_id: text('treatment_id').references(() => treatments.id),
    description: text('description').notNull(),
    tooth_number: integer('tooth_number'),
    quantity: integer('quantity').notNull().default(1),
    unit_price_halalas: integer('unit_price_halalas').notNull(),
    discount_halalas: integer('discount_halalas').notNull().default(0),
    total_halalas: integer('total_halalas').notNull(),
  },
  (table) => ({
    invoiceIdIdx: index('idx_invoice_items_invoice_id').on(table.invoice_id),
    clinicIdIdx: index('idx_invoice_items_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 19. PAYMENTS
// ============================================================================
export const payments = sqliteTable(
  'payments',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    invoice_id: text('invoice_id').notNull().references(() => invoices.id),
    patient_id: text('patient_id').notNull().references(() => patients.id),
    amount_halalas: integer('amount_halalas').notNull(),
    method: text('method').$type<PaymentMethod>().notNull().default('cash'),
    reference: text('reference'),
    paid_at: text('paid_at').notNull(),
    received_by: text('received_by').notNull().references(() => users.id),
    notes: text('notes'),
  },
  (table) => ({
    invoiceIdIdx: index('idx_payments_invoice_id').on(table.invoice_id),
    patientIdIdx: index('idx_payments_patient_id').on(table.patient_id),
    paidAtIdx: index('idx_payments_paid_at').on(table.paid_at),
    clinicIdIdx: index('idx_payments_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 20. INSTALLMENTS
// ============================================================================
export const installments = sqliteTable(
  'installments',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    invoice_id: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
    due_date: text('due_date').notNull(),
    amount_halalas: integer('amount_halalas').notNull(),
    paid_at: text('paid_at'),
    status: text('status').$type<InstallmentStatus>().notNull().default('pending'),
  },
  (table) => ({
    invoiceIdIdx: index('idx_installments_invoice_id').on(table.invoice_id),
    statusIdx: index('idx_installments_status').on(table.status),
    clinicIdIdx: index('idx_installments_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 22. INSURANCE CLAIMS
// ============================================================================
export const insuranceClaims = sqliteTable(
  'insurance_claims',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    patient_id: text('patient_id').notNull().references(() => patients.id),
    invoice_id: text('invoice_id').notNull().references(() => invoices.id),
    company_id: text('company_id').notNull().references(() => insuranceCompanies.id),
    claim_number: text('claim_number').notNull(),
    submitted_at: text('submitted_at').notNull(),
    claimed_halalas: integer('claimed_halalas').notNull(),
    approved_halalas: integer('approved_halalas').notNull().default(0),
    rejected_halalas: integer('rejected_halalas').notNull().default(0),
    status: text('status').$type<InsuranceClaimStatus>().notNull().default('draft'),
    response_at: text('response_at'),
    rejection_reason: text('rejection_reason'),
    attachments: text('attachments', { mode: 'json' }).$type<InsuranceClaimAttachment[]>().notNull(),
  },
  (table) => ({
    claimNumberIdx: index('idx_insurance_claims_number').on(table.claim_number),
    patientIdIdx: index('idx_insurance_claims_patient_id').on(table.patient_id),
    companyIdIdx: index('idx_insurance_claims_company_id').on(table.company_id),
    statusIdx: index('idx_insurance_claims_status').on(table.status),
    clinicIdIdx: index('idx_insurance_claims_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 23. IMAGES (X-rays, OPG, CBCT, Intraoral Photos)
// ============================================================================
export const images = sqliteTable(
  'images',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    patient_id: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    tooth_number: integer('tooth_number'),
    type: text('type').$type<ImageType>().notNull(),
    file_path: text('file_path').notNull(),
    thumbnail_path: text('thumbnail_path'),
    taken_at: text('taken_at').notNull(),
    captured_by: text('captured_by').notNull().references(() => users.id),
    notes: text('notes'),
    tags: text('tags', { mode: 'json' }).$type<string[]>().notNull(),
  },
  (table) => ({
    patientIdIdx: index('idx_images_patient_id').on(table.patient_id),
    typeIdx: index('idx_images_type').on(table.type),
    clinicIdIdx: index('idx_images_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 24. PRESCRIPTIONS
// ============================================================================
export const prescriptions = sqliteTable(
  'prescriptions',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    patient_id: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    dentist_id: text('dentist_id').notNull().references(() => users.id),
    issued_at: text('issued_at').notNull(),
    notes: text('notes'),
  },
  (table) => ({
    patientIdIdx: index('idx_prescriptions_patient_id').on(table.patient_id),
    dentistIdIdx: index('idx_prescriptions_dentist_id').on(table.dentist_id),
    clinicIdIdx: index('idx_prescriptions_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 24b. PRESCRIPTION ITEMS
// ============================================================================
export const prescriptionItems = sqliteTable(
  'prescription_items',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    prescription_id: text('prescription_id').notNull().references(() => prescriptions.id, { onDelete: 'cascade' }),
    drug_name: text('drug_name').notNull(),
    dose: text('dose').notNull(),
    frequency: text('frequency').notNull(),
    duration_days: integer('duration_days').notNull(),
    instructions: text('instructions'),
  },
  (table) => ({
    prescriptionIdIdx: index('idx_prescription_items_id').on(table.prescription_id),
    clinicIdIdx: index('idx_prescription_items_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 25. MEDICAL REPORTS
// ============================================================================
export const medicalReports = sqliteTable(
  'medical_reports',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    patient_id: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    type: text('type').$type<MedicalReportType>().notNull(),
    content: text('content').notNull(),
    issued_at: text('issued_at').notNull(),
    issued_by: text('issued_by').notNull().references(() => users.id),
  },
  (table) => ({
    patientIdIdx: index('idx_medical_reports_patient_id').on(table.patient_id),
    typeIdx: index('idx_medical_reports_type').on(table.type),
    clinicIdIdx: index('idx_medical_reports_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 27. LABS
// ============================================================================
export const labs = sqliteTable(
  'labs',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    address: text('address'),
  },
  (table) => ({
    clinicIdIdx: index('idx_labs_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 26. LAB ORDERS
// ============================================================================
export const labOrders = sqliteTable(
  'lab_orders',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    patient_id: text('patient_id').notNull().references(() => patients.id),
    lab_id: text('lab_id').notNull().references(() => labs.id),
    treatment_id: text('treatment_id').references(() => treatments.id),
    type: text('type').$type<LabOrderType>().notNull(),
    tooth_numbers: text('tooth_numbers', { mode: 'json' }).$type<number[]>().notNull(),
    shade: text('shade'),
    sent_at: text('sent_at'),
    due_at: text('due_at'),
    received_at: text('received_at'),
    status: text('status').$type<LabOrderStatus>().notNull().default('ordered'),
    cost_halalas: integer('cost_halalas').notNull().default(0),
    notes: text('notes'),
  },
  (table) => ({
    patientIdIdx: index('idx_lab_orders_patient_id').on(table.patient_id),
    labIdIdx: index('idx_lab_orders_lab_id').on(table.lab_id),
    statusIdx: index('idx_lab_orders_status').on(table.status),
    clinicIdIdx: index('idx_lab_orders_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 30. SUPPLIERS
// ============================================================================
export const suppliers = sqliteTable(
  'suppliers',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    notes: text('notes'),
  },
  (table) => ({
    clinicIdIdx: index('idx_suppliers_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 28. INVENTORY ITEMS
// ============================================================================
export const inventoryItems = sqliteTable(
  'inventory_items',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    name: text('name').notNull(),
    sku: text('sku').notNull(),
    category: text('category').notNull().default('مستهلكات عامة'),
    unit: text('unit').notNull().default('قطعة'),
    quantity: integer('quantity').notNull().default(0),
    min_quantity: integer('min_quantity').notNull().default(5),
    cost_halalas: integer('cost_halalas').notNull().default(0),
    supplier_id: text('supplier_id').references(() => suppliers.id),
    expiry_date: text('expiry_date'),
    location: text('location'),
  },
  (table) => ({
    skuIdx: index('idx_inventory_sku').on(table.sku),
    categoryIdx: index('idx_inventory_category').on(table.category),
    clinicIdIdx: index('idx_inventory_items_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 29. INVENTORY TRANSACTIONS
// ============================================================================
export const inventoryTransactions = sqliteTable(
  'inventory_transactions',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    item_id: text('item_id').notNull().references(() => inventoryItems.id),
    type: text('type').$type<InventoryTransactionType>().notNull(),
    quantity: integer('quantity').notNull(),
    reason: text('reason'),
    treatment_id: text('treatment_id').references(() => treatments.id),
    created_by: text('created_by').notNull().references(() => users.id),
  },
  (table) => ({
    itemIdIdx: index('idx_inventory_tx_item_id').on(table.item_id),
    typeIdx: index('idx_inventory_tx_type').on(table.type),
    clinicIdIdx: index('idx_inventory_tx_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 30. PURCHASE ORDERS
// ============================================================================
export const purchaseOrders = sqliteTable(
  'purchase_orders',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    supplier_id: text('supplier_id').notNull().references(() => suppliers.id),
    number: text('number').notNull(),
    status: text('status').$type<PurchaseOrderStatus>().notNull().default('draft'),
    ordered_at: text('ordered_at'),
    expected_at: text('expected_at'),
    received_at: text('received_at'),
    total_halalas: integer('total_halalas').notNull().default(0),
    notes: text('notes'),
  },
  (table) => ({
    clinicIdIdx: index('idx_purchase_orders_clinic_id').on(table.clinic_id),
    supplierIdIdx: index('idx_purchase_orders_supplier_id').on(table.supplier_id),
    statusIdx: index('idx_purchase_orders_status').on(table.status),
  })
);

// ============================================================================
// 30b. PURCHASE ORDER ITEMS
// ============================================================================
export const purchaseOrderItems = sqliteTable(
  'purchase_order_items',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    po_id: text('po_id').notNull().references(() => purchaseOrders.id),
    item_id: text('item_id').notNull().references(() => inventoryItems.id),
    quantity: integer('quantity').notNull(),
    received_quantity: integer('received_quantity').notNull().default(0),
    unit_cost_halalas: integer('unit_cost_halalas').notNull(),
  },
  (table) => ({
    clinicIdIdx: index('idx_po_items_clinic_id').on(table.clinic_id),
    poIdIdx: index('idx_po_items_po_id').on(table.po_id),
    itemIdIdx: index('idx_po_items_item_id').on(table.item_id),
  })
);

// ============================================================================
// 30c. LEAVE REQUESTS
// ============================================================================
export const leaveRequests = sqliteTable(
  'leave_requests',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    user_id: text('user_id').notNull().references(() => users.id),
    type: text('type').$type<LeaveType>().notNull().default('annual'),
    start_date: text('start_date').notNull(),
    end_date: text('end_date').notNull(),
    days_count: integer('days_count').notNull().default(1),
    reason: text('reason'),
    status: text('status').$type<LeaveStatus>().notNull().default('pending'),
    reviewed_by: text('reviewed_by'),
    reviewed_at: text('reviewed_at'),
    review_notes: text('review_notes'),
  },
  (table) => ({
    clinicIdIdx: index('idx_leave_requests_clinic_id').on(table.clinic_id),
    userIdIdx: index('idx_leave_requests_user_id').on(table.user_id),
    statusIdx: index('idx_leave_requests_status').on(table.status),
  })
);

// ============================================================================
// 31. EXPENSES
// ============================================================================
export const expenses = sqliteTable(
  'expenses',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    category: text('category').$type<ExpenseCategory>().notNull(),
    amount_halalas: integer('amount_halalas').notNull(),
    date: text('date').notNull(),
    payee: text('payee').notNull(),
    payment_method: text('payment_method').$type<PaymentMethod>().notNull().default('transfer'),
    receipt_path: text('receipt_path'),
    notes: text('notes'),
  },
  (table) => ({
    categoryIdx: index('idx_expenses_category').on(table.category),
    dateIdx: index('idx_expenses_date').on(table.date),
    clinicIdIdx: index('idx_expenses_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 32. ATTENDANCE
// ============================================================================
export const attendance = sqliteTable(
  'attendance',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    user_id: text('user_id').notNull().references(() => users.id),
    check_in: text('check_in').notNull(),
    check_out: text('check_out'),
    date: text('date').notNull(),
    notes: text('notes'),
  },
  (table) => ({
    userDateIdx: index('idx_attendance_user_date').on(table.user_id, table.date),
    clinicIdIdx: index('idx_attendance_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 33. NOTIFICATIONS
// ============================================================================
export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    user_id: text('user_id').notNull().references(() => users.id),
    type: text('type').notNull().default('info'),
    title: text('title').notNull(),
    body: text('body').notNull(),
    entity_type: text('entity_type'),
    entity_id: text('entity_id'),
    read_at: text('read_at'),
  },
  (table) => ({
    userIdIdx: index('idx_notifications_user_id').on(table.user_id),
    readAtIdx: index('idx_notifications_read_at').on(table.read_at),
    clinicIdIdx: index('idx_notifications_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 34. MESSAGE TEMPLATES
// ============================================================================
export const messageTemplates = sqliteTable(
  'message_templates',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    key: text('key').notNull(),
    channel: text('channel').$type<MessageChannel>().notNull(),
    body_ar: text('body_ar').notNull(),
  },
  (table) => ({
    keyIdx: uniqueIndex('idx_message_templates_key').on(table.key),
    clinicIdIdx: index('idx_message_templates_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 35. AUDIT LOG
// ============================================================================
export const auditLog = sqliteTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    user_id: text('user_id').notNull().references(() => users.id),
    action: text('action').notNull(),
    entity_type: text('entity_type').notNull(),
    entity_id: text('entity_id').notNull(),
    before: text('before', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    after: text('after', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    ip: text('ip'),
  },
  (table) => ({
    createdAtIdx: index('idx_audit_log_created_at').on(table.created_at),
    userIdIdx: index('idx_audit_log_user_id').on(table.user_id),
    entityIdx: index('idx_audit_log_entity').on(table.entity_type, table.entity_id),
    clinicIdIdx: index('idx_audit_log_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 36. SETTINGS
// ============================================================================
export const settings = sqliteTable(
  'settings',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    key: text('key').notNull(),
    value: text('value', { mode: 'json' }).$type<unknown>(),
    scope: text('scope').notNull().default('clinic'),
  },
  (table) => ({
    keyClinicIdx: uniqueIndex('idx_settings_key_clinic').on(table.key, table.clinic_id),
    clinicIdIdx: index('idx_settings_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// 37. LICENSE
// ============================================================================
export const license = sqliteTable(
  'license',
  {
    id: text('id').primaryKey(),
    clinic_id: text('clinic_id').notNull().references(() => clinics.id),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'),

    key: text('key').notNull(),
    plan: text('plan').$type<LicensePlan>().notNull(),
    seats: integer('seats').notNull().default(1),
    activated_at: text('activated_at').notNull(),
    expires_at: text('expires_at').notNull(),
    device_fingerprint: text('device_fingerprint').notNull(),
    last_check_at: text('last_check_at').notNull(),
    signature: text('signature').notNull(),

    token_hint: text('token_hint'),
    customer: text('customer'),
    features: text('features'),
    max_doctors: integer('max_doctors'),
    max_devices: integer('max_devices'),
    state_cache: text('state_cache'),
    trial_started_at: text('trial_started_at'),
    last_seen_at: text('last_seen_at'),
  },
  (table) => ({
    keyIdx: uniqueIndex('idx_license_key').on(table.key),
    clinicIdIdx: index('idx_license_clinic_id').on(table.clinic_id),
  })
);

// ============================================================================
// RELATIONS
// ============================================================================

export const clinicsRelations = relations(clinics, ({ many }) => ({
  branches: many(branches),
  users: many(users),
  patients: many(patients),
  appointments: many(appointments),
  invoices: many(invoices),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [branches.clinic_id],
    references: [clinics.id],
  }),
  rooms: many(rooms),
  appointments: many(appointments),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [users.clinic_id],
    references: [clinics.id],
  }),
  doctorAppointments: many(appointments, { relationName: 'dentistAppointments' }),
  createdAppointments: many(appointments, { relationName: 'createdAppointments' }),
  treatments: many(treatments),
  prescriptions: many(prescriptions),
  receivedPayments: many(payments),
  attendances: many(attendance),
  notifications: many(notifications),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [patients.clinic_id],
    references: [clinics.id],
  }),
  primaryDentist: one(users, {
    fields: [patients.primary_dentist_id],
    references: [users.id],
  }),
  medicalHistory: many(medicalHistory),
  allergies: many(allergies),
  medicationsCurrent: many(medicationsCurrent),
  appointments: many(appointments),
  toothRecords: many(toothRecords),
  treatmentPlans: many(treatmentPlans),
  treatments: many(treatments),
  invoices: many(invoices),
  images: many(images),
  prescriptions: many(prescriptions),
  medicalReports: many(medicalReports),
  labOrders: many(labOrders),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [appointments.clinic_id],
    references: [clinics.id],
  }),
  patient: one(patients, {
    fields: [appointments.patient_id],
    references: [patients.id],
  }),
  dentist: one(users, {
    fields: [appointments.dentist_id],
    references: [users.id],
    relationName: 'dentistAppointments',
  }),
  creator: one(users, {
    fields: [appointments.created_by],
    references: [users.id],
    relationName: 'createdAppointments',
  }),
  branch: one(branches, {
    fields: [appointments.branch_id],
    references: [branches.id],
  }),
  room: one(rooms, {
    fields: [appointments.room_id],
    references: [rooms.id],
  }),
  treatments: many(treatments),
}));

export const toothRecordsRelations = relations(toothRecords, ({ one }) => ({
  patient: one(patients, {
    fields: [toothRecords.patient_id],
    references: [patients.id],
  }),
  recordedByUser: one(users, {
    fields: [toothRecords.recorded_by],
    references: [users.id],
  }),
}));

export const treatmentPlansRelations = relations(treatmentPlans, ({ one, many }) => ({
  patient: one(patients, {
    fields: [treatmentPlans.patient_id],
    references: [patients.id],
  }),
  dentist: one(users, {
    fields: [treatmentPlans.dentist_id],
    references: [users.id],
  }),
  items: many(treatmentPlanItems),
}));

export const treatmentPlanItemsRelations = relations(treatmentPlanItems, ({ one, many }) => ({
  plan: one(treatmentPlans, {
    fields: [treatmentPlanItems.plan_id],
    references: [treatmentPlans.id],
  }),
  procedure: one(procedures, {
    fields: [treatmentPlanItems.procedure_id],
    references: [procedures.id],
  }),
  treatments: many(treatments),
}));

export const treatmentsRelations = relations(treatments, ({ one }) => ({
  patient: one(patients, {
    fields: [treatments.patient_id],
    references: [patients.id],
  }),
  appointment: one(appointments, {
    fields: [treatments.appointment_id],
    references: [appointments.id],
  }),
  planItem: one(treatmentPlanItems, {
    fields: [treatments.plan_item_id],
    references: [treatmentPlanItems.id],
  }),
  procedure: one(procedures, {
    fields: [treatments.procedure_id],
    references: [procedures.id],
  }),
  dentist: one(users, {
    fields: [treatments.dentist_id],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [invoices.clinic_id],
    references: [clinics.id],
  }),
  patient: one(patients, {
    fields: [invoices.patient_id],
    references: [patients.id],
  }),
  branch: one(branches, {
    fields: [invoices.branch_id],
    references: [branches.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
  installments: many(installments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoice_id],
    references: [invoices.id],
  }),
  treatment: one(treatments, {
    fields: [invoiceItems.treatment_id],
    references: [treatments.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoice_id],
    references: [invoices.id],
  }),
  patient: one(patients, {
    fields: [payments.patient_id],
    references: [patients.id],
  }),
  receivedByUser: one(users, {
    fields: [payments.received_by],
    references: [users.id],
  }),
}));

export const installmentsRelations = relations(installments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [installments.invoice_id],
    references: [invoices.id],
  }),
}));

export const insuranceClaimsRelations = relations(insuranceClaims, ({ one }) => ({
  patient: one(patients, {
    fields: [insuranceClaims.patient_id],
    references: [patients.id],
  }),
  invoice: one(invoices, {
    fields: [insuranceClaims.invoice_id],
    references: [invoices.id],
  }),
  company: one(insuranceCompanies, {
    fields: [insuranceClaims.company_id],
    references: [insuranceCompanies.id],
  }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  patient: one(patients, {
    fields: [prescriptions.patient_id],
    references: [patients.id],
  }),
  dentist: one(users, {
    fields: [prescriptions.dentist_id],
    references: [users.id],
  }),
  items: many(prescriptionItems),
}));

export const prescriptionItemsRelations = relations(prescriptionItems, ({ one }) => ({
  prescription: one(prescriptions, {
    fields: [prescriptionItems.prescription_id],
    references: [prescriptions.id],
  }),
}));

export const labOrdersRelations = relations(labOrders, ({ one }) => ({
  patient: one(patients, {
    fields: [labOrders.patient_id],
    references: [patients.id],
  }),
  lab: one(labs, {
    fields: [labOrders.lab_id],
    references: [labs.id],
  }),
  treatment: one(treatments, {
    fields: [labOrders.treatment_id],
    references: [treatments.id],
  }),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryTransactions.item_id],
    references: [inventoryItems.id],
  }),
  createdByUser: one(users, {
    fields: [inventoryTransactions.created_by],
    references: [users.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [purchaseOrders.clinic_id],
    references: [clinics.id],
  }),
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplier_id],
    references: [suppliers.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  order: one(purchaseOrders, {
    fields: [purchaseOrderItems.po_id],
    references: [purchaseOrders.id],
  }),
  item: one(inventoryItems, {
    fields: [purchaseOrderItems.item_id],
    references: [inventoryItems.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  user: one(users, {
    fields: [leaveRequests.user_id],
    references: [users.id],
  }),
}));
