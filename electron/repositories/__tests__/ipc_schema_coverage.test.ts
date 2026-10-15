process.env.DATABASE_PATH = ':memory:';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDatabase } from '../../db/connection';
import { registerIpcHandlers, getRegisteredChannels } from '../../ipc/index';
import { settingsRepo } from '../settings.repo';
import {
  appearanceSettingSchema,
  workingHoursSettingSchema,
  clinicProfileSettingSchema,
  messageTemplatesSettingSchema,
  securityPoliciesSettingSchema,
} from '../../../shared/ipcSchemas';

describe('IPC Schema Coverage & Settings Round-Trip Tests (Acceptance Criteria)', () => {
  before(() => {
    closeDatabase();
    const { sqlite } = initDatabase(':memory:');
    const now = new Date().toISOString();
    sqlite.prepare(`
      INSERT INTO clinics (id, clinic_id, created_at, updated_at, name, phone, email, address, city, tax_number, cr_number, currency, timezone, working_hours, slot_duration_min)
      VALUES ('c-test-1', 'c-test-1', ?, ?, 'عيادة النخبة للأسنان', '0501234567', 'info@elite.com', 'الرياض', 'الرياض', '300000000000003', '1010000000', 'SAR', 'Asia/Riyadh', '[]', 30)
    `).run(now, now);
    registerIpcHandlers();
  });

  after(() => {
    closeDatabase();
    delete process.env.DATABASE_PATH;
  });

  // ==============================================================
  // 1. تغطية مخططات Zod لجميع قنوات IPC المؤمّنة (منع التراجع)
  // ==============================================================
  it('الجزء 1: كل قناة مؤمَّنة لها معاملات تمتلك مخطط Zod (hasSchema === true)', () => {
    const channels = getRegisteredChannels();
    assert.ok(channels.length > 100, `عدد القنوات المسجلة (${channels.length}) أقل من المتوقع`);

    // قائمة الاستثناءات الصريحة للقنوات التي لا تتطلب أي معاملات على الإطلاق (Zero Arguments)
    const ZERO_ARGS_EXCEPTIONS = new Set([
      'insurance:getCompanies',
      'inventory:getLowStock',
      'inventory:getSuppliers',
      'inventory:getPurchaseOrders',
      'reports:getAgingReport',
      'reports:getScheduledReports',
      'reports:getReportHistory',
      'settings:getClinic',
      'settings:getSettings',
      'license:getStatus',
      'license:getDeviceCode',
      'license:deactivate',
      'dashboard:getTodaySummary',
      'rooms:list',
      'expenses:list',
      'expenses:processRecurring',
      'prescriptions:list',
      'medicalReports:list',
      'labs:list',
      'labOrders:list',
      'labOrders:getOverdue',
      'rbac:getMatrix',
      'rbac:getPolicies',
      'system:getAppVersion',
      'system:checkForUpdates',
    ]);

    const missingSchemaChannels: string[] = [];

    for (const info of channels) {
      if (info.noArgs || ZERO_ARGS_EXCEPTIONS.has(info.channel)) {
        continue;
      }
      if (!info.hasSchema) {
        missingSchemaChannels.push(info.channel);
      }
    }

    assert.deepEqual(
      missingSchemaChannels,
      [],
      `وُجدت قنوات مؤمنة لها معاملات ولكن ليس لها schema: ${missingSchemaChannels.join(', ')}`
    );
  });

  // ==============================================================
  // 2. Settings Round-Trip: كتابة وقراءة كل مفتاح ورفض النوع الخاطئ
  // ==============================================================
  it('الجزء 2: كتابة وقراءة إعداد الملف التعريفي للعيادة (clinic_profile)', async () => {
    const validProfile = {
      name: 'عيادة النخبة للأسنان المتقدمة',
      phone: '0501234567',
      email: 'info@elite.com',
      address: 'شارع الملك فهد',
      city: 'الرياض',
      tax_number: '300000000000003',
      cr_number: '1010000000',
    };
    const parsed = clinicProfileSettingSchema.safeParse(validProfile);
    assert.equal(parsed.success, true);

    const setRes = await settingsRepo.setSetting('clinic_profile', validProfile);
    assert.equal(setRes.ok, true);

    const getRes = await settingsRepo.getSettings();
    assert.equal(getRes.ok, true);
    if (getRes.ok) {
      assert.deepEqual(getRes.data.clinic_profile, validProfile);
    }
  });

  it('الجزء 2: كتابة وقراءة إعداد المظهر والتقويم (appearance) ورفض القيم غير الصالحة', async () => {
    const validAppearance = {
      theme: 'dark' as const,
      font_size: 'large' as const,
      numeral_system: 'arabic' as const,
      calendar_system: 'both' as const,
    };

    // 1. التحقق من صحة المخطط
    const parsed = appearanceSettingSchema.safeParse(validAppearance);
    assert.equal(parsed.success, true);

    // 2. الحفظ عبر مستودع الإعدادات
    const setRes = await settingsRepo.setSetting('appearance', validAppearance);
    assert.equal(setRes.ok, true);

    // 3. القراءة واسترجاع نفس البيانات بالضبط
    const getRes = await settingsRepo.getSettings();
    assert.equal(getRes.ok, true);
    if (getRes.ok) {
      assert.deepEqual(getRes.data.appearance, validAppearance);
    }

    // 4. رفض قيمة غير صالحة (مثلاً سمة غير معروفة)
    const invalidAppearance = {
      theme: 'neon_pink',
      font_size: 'huge',
      numeral_system: 'latin',
      calendar_system: 'both',
    };
    const invalidParse = appearanceSettingSchema.safeParse(invalidAppearance);
    assert.equal(invalidParse.success, false);
  });

  it('الجزء 2: كتابة وقراءة إعداد ساعات العمل ومدة الفتحة (working_hours) ورفض القيم الشاذة', async () => {
    const validWorkingHours = {
      default_slot_duration_min: 45,
      schedule: [
        {
          day_of_week: 0,
          day_name_ar: 'الأحد',
          is_open: true,
          shifts: [
            { id: 's1', name: 'صباحي', start_time: '09:00', end_time: '13:00' },
          ],
        },
      ],
    };

    const parsed = workingHoursSettingSchema.safeParse(validWorkingHours);
    assert.equal(parsed.success, true);

    const setRes = await settingsRepo.setSetting('working_hours', validWorkingHours);
    assert.equal(setRes.ok, true);

    const getRes = await settingsRepo.getSettings();
    assert.equal(getRes.ok, true);
    if (getRes.ok) {
      assert.deepEqual(getRes.data.working_hours, validWorkingHours);
    }

    // رفض مدة فتحة سالبة أو صفرية
    const invalidHours = {
      default_slot_duration_min: -10,
      schedule: [],
    };
    const invalidParse = workingHoursSettingSchema.safeParse(invalidHours);
    assert.equal(invalidParse.success, false);
  });

  it('الجزء 2: كتابة وقراءة قوالب الرسائل (message_templates) مع المتغيرات', async () => {
    const validTemplates = [
      {
        id: 'tmpl-test-1',
        type: 'appointment_reminder',
        title: 'تذكير موعد',
        description: 'رسالة واتساب للتذكير',
        channel: 'whatsapp' as const,
        content: 'مرحباً {{patient_name}}، موعدك في {{clinic_name}} بتاريخ {{appointment_date}}.',
        available_variables: ['{{patient_name}}', '{{clinic_name}}', '{{appointment_date}}'],
      },
    ];

    const parsed = messageTemplatesSettingSchema.safeParse(validTemplates);
    assert.equal(parsed.success, true);

    const setRes = await settingsRepo.setSetting('message_templates', validTemplates);
    assert.equal(setRes.ok, true);

    const getRes = await settingsRepo.getSettings();
    assert.equal(getRes.ok, true);
    if (getRes.ok) {
      assert.deepEqual(getRes.data.message_templates, validTemplates);
    }
  });

  it('الجزء 2: كتابة وقراءة السياسات الأمنية (security_policies) بما فيها حصر الطبيب ومهلة الخمول', async () => {
    const validPolicies = {
      restrict_to_own_patients: true,
      dentist_only_own_patients: true,
      idle_timeout_minutes: 20,
      max_failed_attempts: 3,
      lockout_duration_minutes: 30,
      receptionist_hide_prices: true,
      accountant_hide_clinical_notes: true,
    };

    const parsed = securityPoliciesSettingSchema.safeParse(validPolicies);
    assert.equal(parsed.success, true);

    const setRes = await settingsRepo.setSetting('security_policies', validPolicies);
    assert.equal(setRes.ok, true);

    const getRes = await settingsRepo.getSettings();
    assert.equal(getRes.ok, true);
    if (getRes.ok) {
      assert.deepEqual(getRes.data.security_policies, validPolicies);
    }

    // رفض مهلة خمول غير منطقية (مثلاً أكبر من 240 دقيقة أو نص)
    const invalidPolicies = {
      idle_timeout_minutes: 9999,
    };
    const invalidParse = securityPoliciesSettingSchema.safeParse(invalidPolicies);
    assert.equal(invalidParse.success, false);
  });
});
