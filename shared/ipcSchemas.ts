import { z } from 'zod';

// ==========================================
// 1. Primitive Reusable Schemas
// ==========================================

export const idSchema = z.string().trim().min(1, 'المعرف مطلوب').max(64, 'المعرف طويل جداً');
export const optionalIdSchema = z.string().trim().min(1).max(64).optional();
export const nullableIdSchema = z.string().trim().min(1).max(64).nullable().optional();

export const isoDateSchema = z
  .string()
  .trim()
  .min(10, 'التاريخ غير مكتمل')
  .max(35, 'التاريخ طويل جداً')
  .regex(/^\d{4}-\d{2}-\d{2}/, 'صيغة التاريخ غير صالحة');

export const optionalIsoDateSchema = isoDateSchema.optional();

export const moneyHalalasSchema = z.number().int('المبلغ يجب أن يكون عدداً صحيحاً بالهللات').min(0, 'المبلغ لا يمكن أن يكون سالباً');

export const trimmedStringSchema = (max = 255, min = 1) =>
  z.string().trim().min(min, 'الحقل مطلوب').max(max, `الحد الأقصى هو ${max} حرفاً`);

export const optionalTrimmedStringSchema = (max = 255) =>
  z.string().trim().max(max, `الحد الأقصى هو ${max} حرفاً`).optional();

// ==========================================
// 2. Pagination & Search Schemas
// ==========================================

export const paginationParamsSchema = z
  .object({
    page: z.number().int().min(1, 'رقم الصفحة يجب أن يكون 1 أو أكثر').default(1).optional(),
    limit: z.number().int().min(1).max(200, 'الحد الأقصى للصفحة هو 200 عنصر').default(20).optional(),
    search: z.string().trim().max(100).optional(),
    sortBy: z.string().trim().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  })
  .strict();

export const patientSearchSchema = z
  .object({
    query: z.string().trim().min(1, 'عبارة البحث مطلوبة').max(100),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  })
  .strict();

// ==========================================
// 3. Auth & Credentials Schemas
// ==========================================

export const loginCredentialsSchema = z
  .object({
    username: z.string().trim().min(1, 'اسم المستخدم مطلوب').max(64),
    password: z.string().min(1, 'كلمة المرور مطلوبة').max(128),
  })
  .strict();

export const quickUnlockPinSchema = z
  .object({
    userId: idSchema,
    pin: z.string().trim().length(4, 'رمز PIN يجب أن يتكون من 4 أرقام').regex(/^\d{4}$/, 'رمز PIN يجب أن يكون أرقاماً فقط'),
  })
  .strict();

export const firstRunSetupSchema = z
  .object({
    clinicName: trimmedStringSchema(120),
    ownerFullName: trimmedStringSchema(100),
    ownerUsername: trimmedStringSchema(50),
    ownerPassword: z.string().min(8, 'كلمة المرور يجب ألا تقل عن 8 خانات').max(128),
    ownerPhone: trimmedStringSchema(30).optional(),
    ownerEmail: z.string().trim().email('البريد الإلكتروني غير صالح').max(100).optional(),
    city: trimmedStringSchema(60).optional(),
    currency: z.string().trim().length(3).default('SAR').optional(),
    taxNumber: z.string().trim().max(30).optional(),
    crNumber: z.string().trim().max(30).optional(),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    userId: idSchema.optional(),
    currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة').max(128).optional(),
    newPassword: z.string().min(8, 'كلمة المرور الجديدة يجب ألا تقل عن 8 خانات').max(128),
  })
  .strict();

export const resetPasswordPayloadSchema = z
  .object({
    userId: idSchema,
    newPass: z.string().min(8).max(128),
  })
  .strict();

export const resetPinPayloadSchema = z
  .object({
    userId: idSchema,
    newPin: z.string().trim().length(4).regex(/^\d{4}$/),
  })
  .strict();

// ==========================================
// 4. Appointments & Calendar Schemas
// ==========================================

export const appointmentWeekFilterSchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
    dentistId: optionalIdSchema,
  })
  .strict();

export const appointmentTodayFilterSchema = z
  .object({
    dentistId: optionalIdSchema,
  })
  .strict();

export const voidInvoicePayloadSchema = z
  .object({
    id: idSchema,
    reason: trimmedStringSchema(255),
  })
  .strict();

// ==========================================
// 5. Insurance & Claims Schemas
// ==========================================

export const claimFiltersSchema = z
  .object({
    patientId: optionalIdSchema,
    companyId: optionalIdSchema,
    status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'appealed', 'settled']).optional(),
    dateFrom: optionalIsoDateSchema,
    dateTo: optionalIsoDateSchema,
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  })
  .strict();

export const transitionClaimStatusPayloadSchema = z
  .object({
    id: idSchema,
    status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'appealed', 'settled']),
    payload: z.record(z.string(), z.any()).optional(),
  })
  .strict();

export const expiringPoliciesFilterSchema = z
  .object({
    daysThreshold: z.number().int().min(1).max(365).optional(),
  })
  .strict();

export const insuranceAuditLogsFilterSchema = z
  .object({
    entityType: z.string().trim().max(50).optional(),
    entityId: optionalIdSchema,
  })
  .strict();

// ==========================================
// 6. Inventory Schemas
// ==========================================

export const inventoryFiltersSchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    category: z.string().trim().max(50).optional(),
    lowStockOnly: z.boolean().optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  })
  .strict();

export const inventoryTransactionFiltersSchema = z
  .object({
    itemId: optionalIdSchema,
    type: z.enum(['in', 'out', 'adjustment', 'waste', 'transfer']).optional(),
    from: optionalIsoDateSchema,
    to: optionalIsoDateSchema,
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  })
  .strict();

export const monthlyConsumptionFilterSchema = z
  .object({
    month: z.string().trim().regex(/^\d{4}-\d{2}$/, 'صيغة الشهر غير صالحة (YYYY-MM)').optional(),
    year: z.number().int().min(2020).max(2099).optional(),
  })
  .strict();

export const updatePurchaseOrderStatusSchema = z
  .object({
    id: idSchema,
    status: z.enum(['draft', 'ordered', 'received', 'partial', 'cancelled']),
  })
  .strict();

export const receivePurchaseOrderPayloadSchema = z
  .object({
    received_at: optionalIsoDateSchema,
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

// ==========================================
// 7. Staff & Leaves Schemas
// ==========================================

export const staffAttendanceFilterSchema = z
  .object({
    userId: optionalIdSchema,
    date: optionalIsoDateSchema,
  })
  .strict();

export const staffLeavesFilterSchema = z
  .object({
    userId: optionalIdSchema,
  })
  .strict();

export const createLeaveSchema = z
  .object({
    user_id: idSchema,
    leave_type: z.enum(['annual', 'sick', 'emergency', 'unpaid', 'other']),
    start_date: isoDateSchema,
    end_date: isoDateSchema,
    days_count: z.number().int().min(1).max(365),
    reason: trimmedStringSchema(500).optional(),
  })
  .strict();

export const updateLeaveStatusSchema = z
  .object({
    id: idSchema,
    status: z.enum(['pending', 'approved', 'rejected']),
    reviewedBy: optionalIdSchema,
  })
  .strict();

export const staffCommissionFilterSchema = z
  .object({
    dentistId: optionalIdSchema,
    month: z.string().trim().max(10).optional(),
    from: optionalIsoDateSchema,
    to: optionalIsoDateSchema,
  })
  .strict();

// ==========================================
// 8. Rooms & Lab Orders Schemas
// ==========================================

export const updateRoomStatusSchema = z
  .object({
    id: idSchema,
    status: z.enum(['free', 'busy', 'maintenance', 'cleaning']),
  })
  .strict();

export const updateLabOrderStatusSchema = z
  .object({
    id: idSchema,
    status: z.enum(['pending', 'sent', 'in_progress', 'ready', 'delivered', 'rejected']),
    received_at: optionalIsoDateSchema,
  })
  .strict();

// ==========================================
// 9. License & System Schemas
// ==========================================

export const licenseTokenSchema = z
  .object({
    token: z.string().trim().min(20, 'رمز الترخيص غير مكتمل').max(1024),
  })
  .strict();

export const licenseCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^EYD-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/i, 'صيغة كود التفعيل غير صحيحة (EYD-XXXXX-XXXXX-XXXXX)'),
  })
  .strict();

export const systemFileOperationSchema = z
  .object({
    title: z.string().trim().max(100).optional(),
    defaultPath: z.string().trim().max(500).optional(),
    filters: z
      .array(
        z
          .object({
            name: z.string().trim().max(50),
            extensions: z.array(z.string().trim().max(10)),
          })
          .strict()
      )
      .optional(),
  })
  .strict();

export const systemRestoreBackupSchema = z
  .object({
    filePath: z.string().trim().min(1, 'مسار ملف النسخة الاحتياطية مطلوب').max(500),
    password: z.string().max(128).optional(),
  })
  .strict();

// ==========================================
// 10. Settings Keys Schemas (Strict)
// ==========================================

export const clinicProfileSettingSchema = z
  .object({
    name: trimmedStringSchema(150),
    logo_url: z.string().trim().max(500).nullable().optional(),
    phone: trimmedStringSchema(30),
    email: z.string().trim().email('البريد الإلكتروني غير صالح').max(100),
    address: trimmedStringSchema(255),
    city: trimmedStringSchema(60),
    tax_number: trimmedStringSchema(30),
    cr_number: trimmedStringSchema(30),
    currency: z.string().trim().length(3).default('SAR'),
    tax_rate_percent: z.number().min(0).max(100).default(15),
  })
  .strict();

export const appearanceSettingSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system']),
    font_size: z.enum(['small', 'normal', 'medium', 'large']),
    numeral_system: z.enum(['arabic', 'latin']),
    calendar_system: z.enum(['gregorian', 'hijri', 'both']),
  })
  .strict();

export const workingHoursSettingSchema = z
  .object({
    default_slot_duration_min: z.number().int().min(5).max(120),
    schedule: z.array(
      z
        .object({
          day_of_week: z.number().int().min(0).max(6),
          day_name_ar: z.string().trim().max(20),
          is_open: z.boolean(),
          shifts: z.array(
            z
              .object({
                id: z.string().trim().max(32),
                name: z.string().trim().max(50),
                start_time: z.string().trim().regex(/^\d{2}:\d{2}$/),
                end_time: z.string().trim().regex(/^\d{2}:\d{2}$/),
              })
              .strict()
          ),
        })
        .strict()
    ),
  })
  .strict();

export const messageTemplateItemSchema = z
  .object({
    id: z.string().trim().max(32),
    type: z.string().trim().max(50),
    title: z.string().trim().max(100),
    description: z.string().trim().max(255),
    channel: z.enum(['whatsapp', 'sms', 'system']),
    content: z.string().trim().max(2000),
    available_variables: z.array(z.string().trim().max(50)),
    updated_at: isoDateSchema.optional(),
  })
  .strict();

export const messageTemplatesSettingSchema = z.array(messageTemplateItemSchema);

export const securityPoliciesSettingSchema = z
  .object({
    receptionist_hide_prices: z.boolean().optional(),
    accountant_hide_clinical_notes: z.boolean().optional(),
    dentist_only_own_patients: z.boolean().optional(),
    restrict_to_own_patients: z.boolean().optional(),
    idle_timeout_minutes: z.number().int().min(1).max(240).optional(),
    idle_timeout_min: z.number().int().min(1).max(240).optional(),
    max_failed_attempts: z.number().int().min(1).max(20).optional(),
    max_login_attempts: z.number().int().min(1).max(20).optional(),
    lockout_duration_minutes: z.number().int().min(1).max(1440).optional(),
    lockout_duration_min: z.number().int().min(1).max(1440).optional(),
  })
  .strict();

export const genericSettingPayloadSchema = z
  .object({
    key: z.string().trim().min(1).max(64),
    value: z.unknown(),
  })
  .strict();
