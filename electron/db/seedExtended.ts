import {
  CLINIC_ID,
  seedUsers,
  seedPatients,
  seedProcedures,
} from './seedData';
import {
  DEFAULT_CLINIC_PROFILE,
  DEFAULT_BRANCHES,
  DEFAULT_ROOMS,
  DEFAULT_WORKING_HOURS,
  DEFAULT_PRICE_TIERS,
  DEFAULT_MESSAGE_TEMPLATES,
  DEFAULT_ALERT_RULES,
  DEFAULT_APPEARANCE,
  DEFAULT_BACKUP_SETTINGS,
  DEFAULT_ABOUT_INFO,
} from '../../src/features/settings/defaultSettings';

// ============================================================================
// 1. TEETH REGISTRY (32 Permanent + 20 Primary FDI)
// ============================================================================
export interface SeedToothRegistryItem {
  id: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  fdi_number: number;
  universal_number: string;
  quadrant: number;
  type: 'incisor' | 'canine' | 'premolar' | 'molar';
  is_primary: boolean;
  name_ar: string;
  name_en: string;
}

export const seedTeethRegistry: SeedToothRegistryItem[] = [];

// 32 Permanent Teeth (Quadrants 1 to 4)
const permanentTeethDef = [
  // Quadrant 1 (Upper Right: 18 -> 11)
  { fdi: 18, uni: '1', type: 'molar', ar: 'ضرس العقل العلوي الأيمن', en: 'Maxillary Right Third Molar' },
  { fdi: 17, uni: '2', type: 'molar', ar: 'الضرس الثاني العلوي الأيمن', en: 'Maxillary Right Second Molar' },
  { fdi: 16, uni: '3', type: 'molar', ar: 'الضرس الأول العلوي الأيمن', en: 'Maxillary Right First Molar' },
  { fdi: 15, uni: '4', type: 'premolar', ar: 'الضاحك الثاني العلوي الأيمن', en: 'Maxillary Right Second Premolar' },
  { fdi: 14, uni: '5', type: 'premolar', ar: 'الضاحك الأول العلوي الأيمن', en: 'Maxillary Right First Premolar' },
  { fdi: 13, uni: '6', type: 'canine', ar: 'الناب العلوي الأيمن', en: 'Maxillary Right Canine' },
  { fdi: 12, uni: '7', type: 'incisor', ar: 'القاطع الجانبي العلوي الأيمن', en: 'Maxillary Right Lateral Incisor' },
  { fdi: 11, uni: '8', type: 'incisor', ar: 'القاطع المركزي العلوي الأيمن', en: 'Maxillary Right Central Incisor' },

  // Quadrant 2 (Upper Left: 21 -> 28)
  { fdi: 21, uni: '9', type: 'incisor', ar: 'القاطع المركزي العلوي الأيسر', en: 'Maxillary Left Central Incisor' },
  { fdi: 22, uni: '10', type: 'incisor', ar: 'القاطع الجانبي العلوي الأيسر', en: 'Maxillary Left Lateral Incisor' },
  { fdi: 23, uni: '11', type: 'canine', ar: 'الناب العلوي الأيسر', en: 'Maxillary Left Canine' },
  { fdi: 24, uni: '12', type: 'premolar', ar: 'الضاحك الأول العلوي الأيسر', en: 'Maxillary Left First Premolar' },
  { fdi: 25, uni: '13', type: 'premolar', ar: 'الضاحك الثاني العلوي الأيسر', en: 'Maxillary Left Second Premolar' },
  { fdi: 26, uni: '14', type: 'molar', ar: 'الضرس الأول العلوي الأيسر', en: 'Maxillary Left First Molar' },
  { fdi: 27, uni: '15', type: 'molar', ar: 'الضرس الثاني العلوي الأيسر', en: 'Maxillary Left Second Molar' },
  { fdi: 28, uni: '16', type: 'molar', ar: 'ضرس العقل العلوي الأيسر', en: 'Maxillary Left Third Molar' },

  // Quadrant 3 (Lower Left: 38 -> 31)
  { fdi: 38, uni: '17', type: 'molar', ar: 'ضرس العقل السفلي الأيسر', en: 'Mandibular Left Third Molar' },
  { fdi: 37, uni: '18', type: 'molar', ar: 'الضرس الثاني السفلي الأيسر', en: 'Mandibular Left Second Molar' },
  { fdi: 36, uni: '19', type: 'molar', ar: 'الضرس الأول السفلي الأيسر', en: 'Mandibular Left First Molar' },
  { fdi: 35, uni: '20', type: 'premolar', ar: 'الضاحك الثاني السفلي الأيسر', en: 'Mandibular Left Second Premolar' },
  { fdi: 34, uni: '21', type: 'premolar', ar: 'الضاحك الأول السفلي الأيسر', en: 'Mandibular Left First Premolar' },
  { fdi: 33, uni: '22', type: 'canine', ar: 'الناب السفلي الأيسر', en: 'Mandibular Left Canine' },
  { fdi: 32, uni: '23', type: 'incisor', ar: 'القاطع الجانبي السفلي الأيسر', en: 'Mandibular Left Lateral Incisor' },
  { fdi: 31, uni: '24', type: 'incisor', ar: 'القاطع المركزي السفلي الأيسر', en: 'Mandibular Left Central Incisor' },

  // Quadrant 4 (Lower Right: 41 -> 48)
  { fdi: 41, uni: '25', type: 'incisor', ar: 'القاطع المركزي السفلي الأيمن', en: 'Mandibular Right Central Incisor' },
  { fdi: 42, uni: '26', type: 'incisor', ar: 'القاطع الجانبي السفلي الأيمن', en: 'Mandibular Right Lateral Incisor' },
  { fdi: 43, uni: '27', type: 'canine', ar: 'الناب السفلي الأيمن', en: 'Mandibular Right Canine' },
  { fdi: 44, uni: '28', type: 'premolar', ar: 'الضاحك الأول السفلي الأيمن', en: 'Mandibular Right First Premolar' },
  { fdi: 45, uni: '29', type: 'premolar', ar: 'الضاحك الثاني السفلي الأيمن', en: 'Mandibular Right Second Premolar' },
  { fdi: 46, uni: '30', type: 'molar', ar: 'الضرس الأول السفلي الأيمن', en: 'Mandibular Right First Molar' },
  { fdi: 47, uni: '31', type: 'molar', ar: 'الضرس الثاني السفلي الأيمن', en: 'Mandibular Right Second Molar' },
  { fdi: 48, uni: '32', type: 'molar', ar: 'ضرس العقل السفلي الأيمن', en: 'Mandibular Right Third Molar' },
] as const;

for (const t of permanentTeethDef) {
  const quad = Math.floor(t.fdi / 10);
  seedTeethRegistry.push({
    id: `tooth-${t.fdi}`,
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    fdi_number: t.fdi,
    universal_number: t.uni,
    quadrant: quad,
    type: t.type,
    is_primary: false,
    name_ar: t.ar,
    name_en: t.en,
  });
}

// 20 Primary / Deciduous Teeth (Quadrants 5 to 8)
const primaryTeethDef = [
  // Quadrant 5 (Upper Right: 55 -> 51)
  { fdi: 55, uni: 'A', type: 'molar', ar: 'الضرس اللبني الثاني العلوي الأيمن', en: 'Primary Maxillary Right Second Molar' },
  { fdi: 54, uni: 'B', type: 'molar', ar: 'الضرس اللبني الأول العلوي الأيمن', en: 'Primary Maxillary Right First Molar' },
  { fdi: 53, uni: 'C', type: 'canine', ar: 'الناب اللبني العلوي الأيمن', en: 'Primary Maxillary Right Canine' },
  { fdi: 52, uni: 'D', type: 'incisor', ar: 'القاطع اللبني الجانبي العلوي الأيمن', en: 'Primary Maxillary Right Lateral Incisor' },
  { fdi: 51, uni: 'E', type: 'incisor', ar: 'القاطع اللبني المركزي العلوي الأيمن', en: 'Primary Maxillary Right Central Incisor' },

  // Quadrant 6 (Upper Left: 61 -> 65)
  { fdi: 61, uni: 'F', type: 'incisor', ar: 'القاطع اللبني المركزي العلوي الأيسر', en: 'Primary Maxillary Left Central Incisor' },
  { fdi: 62, uni: 'G', type: 'incisor', ar: 'القاطع اللبني الجانبي العلوي الأيسر', en: 'Primary Maxillary Left Lateral Incisor' },
  { fdi: 63, uni: 'H', type: 'canine', ar: 'الناب اللبني العلوي الأيسر', en: 'Primary Maxillary Left Canine' },
  { fdi: 64, uni: 'I', type: 'molar', ar: 'الضرس اللبني الأول العلوي الأيسر', en: 'Primary Maxillary Left First Molar' },
  { fdi: 65, uni: 'J', type: 'molar', ar: 'الضرس اللبني الثاني العلوي الأيسر', en: 'Primary Maxillary Left Second Molar' },

  // Quadrant 7 (Lower Left: 75 -> 71)
  { fdi: 75, uni: 'K', type: 'molar', ar: 'الضرس اللبني الثاني السفلي الأيسر', en: 'Primary Mandibular Left Second Molar' },
  { fdi: 74, uni: 'L', type: 'molar', ar: 'الضرس اللبني الأول السفلي الأيسر', en: 'Primary Mandibular Left First Molar' },
  { fdi: 73, uni: 'M', type: 'canine', ar: 'الناب اللبني السفلي الأيسر', en: 'Primary Mandibular Left Canine' },
  { fdi: 72, uni: 'N', type: 'incisor', ar: 'القاطع اللبني الجانبي السفلي الأيسر', en: 'Primary Mandibular Left Lateral Incisor' },
  { fdi: 71, uni: 'O', type: 'incisor', ar: 'القاطع اللبني المركزي السفلي الأيسر', en: 'Primary Mandibular Left Central Incisor' },

  // Quadrant 8 (Lower Right: 81 -> 85)
  { fdi: 81, uni: 'P', type: 'incisor', ar: 'القاطع اللبني المركزي السفلي الأيمن', en: 'Primary Mandibular Right Central Incisor' },
  { fdi: 82, uni: 'Q', type: 'incisor', ar: 'القاطع اللبني الجانبي السفلي الأيمن', en: 'Primary Mandibular Right Lateral Incisor' },
  { fdi: 83, uni: 'R', type: 'canine', ar: 'الناب اللبني السفلي الأيمن', en: 'Primary Mandibular Right Canine' },
  { fdi: 84, uni: 'S', type: 'molar', ar: 'الضرس اللبني الأول السفلي الأيمن', en: 'Primary Mandibular Right First Molar' },
  { fdi: 85, uni: 'T', type: 'molar', ar: 'الضرس اللبني الثاني السفلي الأيمن', en: 'Primary Mandibular Right Second Molar' },
] as const;

for (const t of primaryTeethDef) {
  const quad = Math.floor(t.fdi / 10);
  seedTeethRegistry.push({
    id: `tooth-${t.fdi}`,
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    fdi_number: t.fdi,
    universal_number: t.uni,
    quadrant: quad,
    type: t.type,
    is_primary: true,
    name_ar: t.ar,
    name_en: t.en,
  });
}

// ============================================================================
// 2. ROLE PERMISSIONS MATRIX (5 Roles x Resources x Actions)
// ============================================================================
export interface SeedRolePermissionItem {
  id: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  role: 'owner' | 'admin' | 'dentist' | 'accountant' | 'receptionist';
  resource: string;
  action: 'view' | 'create' | 'update' | 'delete' | 'export';
}

export const seedRolePermissions: SeedRolePermissionItem[] = [];

const RESOURCES = [
  'patients',
  'appointments',
  'treatments',
  'clinical_notes',
  'prescriptions',
  'dental_chart',
  'invoices',
  'payments',
  'expenses',
  'reports',
  'settings',
  'staff',
  'inventory',
  'labs',
] as const;

const ACTIONS = ['view', 'create', 'update', 'delete', 'export'] as const;

// Rules according to user prompt:
// 1. Owner: Everything.
// 2. Admin: Full except critical audit deletion.
// 3. Dentist: Full clinical, invoices/payments view only, no settings/staff/expenses.
// 4. Accountant: Full financial (invoices, payments, expenses, reports), patients/appointments view/export, NO clinical notes/treatments/prescriptions.
// 5. Receptionist: Patients/appointments/invoices/payments (view, create, update, export), NO delete anywhere.

const isActionAllowed = (
  role: 'owner' | 'admin' | 'dentist' | 'accountant' | 'receptionist',
  resource: typeof RESOURCES[number],
  action: typeof ACTIONS[number]
): boolean => {
  if (role === 'owner') return true;

  if (role === 'admin') {
    if (resource === 'settings' && action === 'delete') return false;
    return true;
  }

  if (role === 'dentist') {
    const isClinical = ['patients', 'appointments', 'treatments', 'clinical_notes', 'prescriptions', 'dental_chart', 'labs'].includes(resource);
    if (isClinical) {
      return action !== 'delete'; // Dentist does not delete records
    }
    if (['invoices', 'payments'].includes(resource)) {
      return action === 'view';
    }
    if (resource === 'inventory') {
      return action === 'view';
    }
    return false; // No access to expenses, staff, settings, reports
  }

  if (role === 'accountant') {
    // المحاسب لا يرى الملاحظات السريرية ولا خطط العلاج
    if (['clinical_notes', 'treatments', 'dental_chart', 'prescriptions'].includes(resource)) {
      return false;
    }
    if (['invoices', 'payments', 'expenses', 'reports'].includes(resource)) {
      return true; // Full financial power
    }
    if (['patients', 'appointments'].includes(resource)) {
      return action === 'view' || action === 'export';
    }
    if (['inventory', 'labs'].includes(resource)) {
      return action === 'view' || action === 'update' || action === 'export';
    }
    if (resource === 'settings' || resource === 'staff') {
      return action === 'view';
    }
    return false;
  }

  if (role === 'receptionist') {
    // الاستقبال لا يحذف أي سجل
    if (action === 'delete') return false;

    if (['patients', 'appointments'].includes(resource)) {
      return action === 'view' || action === 'create' || action === 'update' || action === 'export';
    }
    if (['invoices', 'payments'].includes(resource)) {
      return action === 'view' || action === 'create' || action === 'export';
    }
    if (['dental_chart', 'treatments', 'labs', 'inventory'].includes(resource)) {
      return action === 'view';
    }
    // No access to clinical_notes, prescriptions, expenses, settings, staff, reports
    return false;
  }

  return false;
};

let permCounter = 1;
for (const role of ['owner', 'admin', 'dentist', 'accountant', 'receptionist'] as const) {
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      if (isActionAllowed(role, resource, action)) {
        seedRolePermissions.push({
          id: `perm-${String(permCounter++).padStart(4, '0')}`,
          clinic_id: CLINIC_ID,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          deleted_at: null,
          role,
          resource,
          action,
        });
      }
    }
  }
}

// ============================================================================
// 3. SETTINGS (Defaults from defaultSettings.ts)
// ============================================================================
export interface SeedSettingItem {
  id: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  key: string;
  value: unknown;
  scope: string;
}

export const seedSettings: SeedSettingItem[] = [
  {
    id: 'set-001',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'clinic_profile',
    value: DEFAULT_CLINIC_PROFILE,
    scope: 'clinic',
  },
  {
    id: 'set-002',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'branches',
    value: DEFAULT_BRANCHES,
    scope: 'clinic',
  },
  {
    id: 'set-003',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'rooms',
    value: DEFAULT_ROOMS,
    scope: 'clinic',
  },
  {
    id: 'set-004',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'working_hours',
    value: DEFAULT_WORKING_HOURS,
    scope: 'clinic',
  },
  {
    id: 'set-005',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'price_tiers',
    value: DEFAULT_PRICE_TIERS,
    scope: 'clinic',
  },
  {
    id: 'set-006',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'message_templates',
    value: DEFAULT_MESSAGE_TEMPLATES,
    scope: 'clinic',
  },
  {
    id: 'set-007',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'alert_rules',
    value: DEFAULT_ALERT_RULES,
    scope: 'clinic',
  },
  {
    id: 'set-008',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'appearance',
    value: DEFAULT_APPEARANCE,
    scope: 'clinic',
  },
  {
    id: 'set-009',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'backup',
    value: DEFAULT_BACKUP_SETTINGS,
    scope: 'clinic',
  },
  {
    id: 'set-010',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'about',
    value: DEFAULT_ABOUT_INFO,
    scope: 'clinic',
  },
];

// ============================================================================
// 4. MESSAGE TEMPLATES (5 Core Arabic Clinical Templates)
// ============================================================================
export interface SeedMessageTemplateItem {
  id: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  key: string;
  channel: 'sms' | 'whatsapp';
  body_ar: string;
}

export const seedMessageTemplates: SeedMessageTemplateItem[] = [
  {
    id: 'tmpl-remind-1',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'appointment_reminder',
    channel: 'whatsapp',
    body_ar: 'مرحباً {{patient_name}}، نود تذكيرك بموعدك القادم غداً في {{clinic_name}} لدى د. {{doctor_name}} في تمام الساعة {{appointment_time}}. للتأكيد يرجى الرد بـ (1).',
  },
  {
    id: 'tmpl-confirm-2',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'appointment_confirmation',
    channel: 'whatsapp',
    body_ar: 'عزيزنا {{patient_name}}، تم بنجاح تأكيد حجز موعدك بتاريخ {{appointment_date}} الساعة {{appointment_time}} لدى {{clinic_name}}. نرجو الحضور قبل الموعد بـ 10 دقائق.',
  },
  {
    id: 'tmpl-follow-3',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'post_treatment',
    channel: 'whatsapp',
    body_ar: 'حمداً لله على سلامتك يا {{patient_name}}. نأمل أن تكون بأفضل حال بعد جلسة العلاج اليوم لدى د. {{doctor_name}}. في حال وجود أي ألم أو استفسار يرجى التواصل معنا فوراً.',
  },
  {
    id: 'tmpl-bday-4',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'birthday',
    channel: 'sms',
    body_ar: 'كل عام وأنت بألف خير وصحة يا {{patient_name}}! 🎂 أسرة {{clinic_name}} تهديك جلسة تنظيف وتلميع أسنان مجانية خلال شهر ميلادك. يسعدنا استقبالك.',
  },
  {
    id: 'tmpl-inv-5',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    key: 'invoice',
    channel: 'whatsapp',
    body_ar: 'عزيزنا {{patient_name}}، تم إصدار فاتورتك الضريبية الإلكترونية رقم {{invoice_number}} بقيمة {{invoice_amount}} ر.س من {{clinic_name}}. شكراً لثقتكم بنا.',
  },
];

// ============================================================================
// 5. LABS (3 Dental Laboratories in Riyadh)
// ============================================================================
export interface SeedLabItem {
  id: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export const seedLabs: SeedLabItem[] = [
  {
    id: 'lab-001',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    name: 'مختبر الرياض الرقمي للتركيبات وزراعة الأسنان',
    phone: '0112345678',
    email: 'info@riyadh-digitallab.sa',
    address: 'طريق الملك عبد العزيز، حي الياسمين، الرياض',
  },
  {
    id: 'lab-002',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    name: 'معمل المدار لتقنيات CAD/CAM وتيجان الزيركون',
    phone: '0114567891',
    email: 'lab@almadar-cadcam.com',
    address: 'شارع الضباب، حي السليمانية، الرياض',
  },
  {
    id: 'lab-003',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
    name: 'مركز النخبة السويسري لعدسات الفينير والابتسامة',
    phone: '0118765432',
    email: 'orders@elitedentallab.sa',
    address: 'طريق العروبة، حي الورود، الرياض',
  },
];

// ============================================================================
// 6. LAB ORDERS (8 Orders across Patients and Labs)
// ============================================================================
export interface SeedLabOrderItem {
  id: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  patient_id: string;
  lab_id: string;
  treatment_id: null;
  type: 'crown' | 'bridge' | 'denture' | 'ortho' | 'implant' | 'night_guard';
  tooth_numbers: number[];
  shade: string;
  sent_at: string;
  due_at: string;
  received_at: string | null;
  status: 'ordered' | 'in_progress' | 'delivered' | 'fitted';
  cost_halalas: number;
  notes: string;
}

export const seedLabOrders: SeedLabOrderItem[] = [
  {
    id: 'lbo-001',
    clinic_id: CLINIC_ID,
    created_at: '2026-08-10T09:00:00.000Z',
    updated_at: '2026-08-15T14:00:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[0].id,
    lab_id: 'lab-001',
    treatment_id: null,
    type: 'crown',
    tooth_numbers: [16],
    shade: 'A2 (VITA 3D Master)',
    sent_at: '2026-08-10T10:00:00.000Z',
    due_at: '2026-08-17T12:00:00.000Z',
    received_at: '2026-08-16T15:30:00.000Z',
    status: 'fitted',
    cost_halalas: 35000,
    notes: 'تاج زيركونيا عالي الشفافية مع تشريح إطباقي متقن ومطابقة الحواف بدقة.',
  },
  {
    id: 'lbo-002',
    clinic_id: CLINIC_ID,
    created_at: '2026-08-20T11:00:00.000Z',
    updated_at: '2026-08-26T12:00:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[1].id,
    lab_id: 'lab-003',
    treatment_id: null,
    type: 'crown',
    tooth_numbers: [11, 21],
    shade: 'BL1 (Bleach White)',
    sent_at: '2026-08-20T12:00:00.000Z',
    due_at: '2026-08-28T10:00:00.000Z',
    received_at: '2026-08-27T14:00:00.000Z',
    status: 'fitted',
    cost_halalas: 90000,
    notes: 'عدسات إيماكس (E.max Veneers) للقواطع المركزية العلوية بتدرج شفاف طبيعي.',
  },
  {
    id: 'lbo-003',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-02T14:00:00.000Z',
    updated_at: '2026-09-08T10:00:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[2].id,
    lab_id: 'lab-002',
    treatment_id: null,
    type: 'bridge',
    tooth_numbers: [35, 36, 37],
    shade: 'A3',
    sent_at: '2026-09-02T16:00:00.000Z',
    due_at: '2026-09-12T12:00:00.000Z',
    received_at: '2026-09-10T11:00:00.000Z',
    status: 'delivered',
    cost_halalas: 110000,
    notes: 'جسر زيركون خلفي ثلاثي التعويض مع دعم قوي لنقاط الاتصال.',
  },
  {
    id: 'lbo-004',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-15T10:00:00.000Z',
    updated_at: '2026-09-20T16:00:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[3].id,
    lab_id: 'lab-001',
    treatment_id: null,
    type: 'implant',
    tooth_numbers: [46],
    shade: 'A3.5',
    sent_at: '2026-09-15T11:00:00.000Z',
    due_at: '2026-09-25T14:00:00.000Z',
    received_at: null,
    status: 'in_progress',
    cost_halalas: 65000,
    notes: 'دعامة زراعة مخصصة (Custom Titanium Abutment) مع تاج زيركون مثبت بالبراغي.',
  },
  {
    id: 'lbo-005',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-22T08:30:00.000Z',
    updated_at: '2026-09-22T09:00:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[4].id,
    lab_id: 'lab-002',
    treatment_id: null,
    type: 'night_guard',
    tooth_numbers: [11, 12, 13, 21, 22, 23],
    shade: 'شفاف صلب-مرن',
    sent_at: '2026-09-22T10:00:00.000Z',
    due_at: '2026-09-29T12:00:00.000Z',
    received_at: null,
    status: 'ordered',
    cost_halalas: 25000,
    notes: 'واقي أسنان ليلي مزدوج الطبقة لعلاج صرير الأسنان (Bruxism).',
  },
  {
    id: 'lbo-006',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-24T12:00:00.000Z',
    updated_at: '2026-09-25T11:00:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[5].id,
    lab_id: 'lab-003',
    treatment_id: null,
    type: 'crown',
    tooth_numbers: [24],
    shade: 'A1',
    sent_at: '2026-09-24T14:00:00.000Z',
    due_at: '2026-10-02T12:00:00.000Z',
    received_at: null,
    status: 'in_progress',
    cost_halalas: 40000,
    notes: 'تاج إيماكس على ضاحك علوي أيسر مع تفاصيل جمالية طبيعية.',
  },
  {
    id: 'lbo-007',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-26T15:00:00.000Z',
    updated_at: '2026-09-26T15:00:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[6].id,
    lab_id: 'lab-001',
    treatment_id: null,
    type: 'denture',
    tooth_numbers: [14, 15, 16, 24, 25, 26],
    shade: 'A2 / Gum 3',
    sent_at: '2026-09-26T17:00:00.000Z',
    due_at: '2026-10-06T14:00:00.000Z',
    received_at: null,
    status: 'ordered',
    cost_halalas: 120000,
    notes: 'طقم جزئي علوي مرن (Valplast Flexible Partial Denture).',
  },
  {
    id: 'lbo-008',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-28T09:30:00.000Z',
    updated_at: '2026-09-28T09:30:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[7].id,
    lab_id: 'lab-002',
    treatment_id: null,
    type: 'ortho',
    tooth_numbers: [11, 12, 13, 21, 22, 23, 31, 32, 41, 42],
    shade: 'Clear Retainer',
    sent_at: '2026-09-28T11:00:00.000Z',
    due_at: '2026-10-05T12:00:00.000Z',
    received_at: null,
    status: 'ordered',
    cost_halalas: 30000,
    notes: 'مثبت تقويم شفاف علوي وسفلي من نوع إيسيكس (Essix Retainers).',
  },
];

// ============================================================================
// 7. PRESCRIPTIONS & PRESCRIPTION ITEMS (10 Prescriptions)
// ============================================================================
export interface SeedPrescriptionItem {
  id: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  patient_id: string;
  dentist_id: string;
  issued_at: string;
  notes: string;
}

export interface SeedPrescriptionDrugItem {
  id: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  prescription_id: string;
  drug_name: string;
  dose: string;
  frequency: string;
  duration_days: number;
  instructions: string;
}

export const seedPrescriptions: SeedPrescriptionItem[] = [];
export const seedPrescriptionItems: SeedPrescriptionDrugItem[] = [];

const rxTemplates = [
  {
    notes: 'وصفة علاجية بعد جراحة خلع ضرس العقل المنطمر والتحكم بالالتهاب والألم.',
    items: [
      { name: 'Augmentin (أوجمنتين)', dose: '1g', freq: 'حبة كل 12 ساعة بعد الأكل', days: 7, inst: 'إكمال الكورس كاملاً حتى نهايته' },
      { name: 'Brufen (بروفين)', dose: '600mg', freq: 'حبة كل 8 ساعات عند اللزوم', days: 5, inst: 'يؤخذ بعد وجبة كاملة مع شرب ماء وفير' },
      { name: 'Chlorhexidine Mouthwash (غسول كلورهيكسيدين)', dose: '0.12%', freq: 'مضمضة مرتين يومياً', days: 10, inst: 'المضمضة برفق وعدم الأكل بعدها لمدة 30 دقيقة' },
    ],
  },
  {
    notes: 'علاج دوائي مسكن ومضاد للالتهاب بعد تنظيف وتطهير قنوات الجذور (علاج عصب).',
    items: [
      { name: 'Cataflam (كاتافلام)', dose: '50mg', freq: 'قرص كل 8 ساعات بعد الطعام', days: 3, inst: 'لتسكين ألم التهاب العصب الحاد' },
      { name: 'Panadol Extra (بانادول إكسترا)', dose: '500mg', freq: 'حبتين كل 6 ساعات عند اللزوم', days: 4, inst: 'الحد الأقصى 8 حبات يومياً' },
    ],
  },
  {
    notes: 'وصفة وقائية بعد جلسة زراعة سنية لضمان التئام العظم واللثة.',
    items: [
      { name: 'Amoxicillin (أموكسيسيلين)', dose: '500mg', freq: 'كبسولة كل 8 ساعات', days: 7, inst: 'تناول الجرعات بانتظام في المواعيد المحددة' },
      { name: 'Solpadeine (سولبادين فوار)', dose: '500mg', freq: 'قرص فوار كل 8 ساعات', days: 3, inst: 'يذاب في نصف كوب ماء بعد الأكل' },
    ],
  },
];

for (let i = 0; i < 10; i++) {
  const rxId = `rx-${String(i + 1).padStart(3, '0')}`;
  const pat = seedPatients[i % seedPatients.length];
  const doc = seedUsers[i % 3]; // Doctors 1, 2, or 3
  const tmpl = rxTemplates[i % rxTemplates.length];
  const date = new Date(2026, 7 + Math.floor(i / 4), 5 + (i * 3)).toISOString();

  seedPrescriptions.push({
    id: rxId,
    clinic_id: CLINIC_ID,
    created_at: date,
    updated_at: date,
    deleted_at: null,
    patient_id: pat.id,
    dentist_id: doc.id,
    issued_at: date,
    notes: tmpl.notes,
  });

  tmpl.items.forEach((it, idx) => {
    seedPrescriptionItems.push({
      id: `rxi-${String(i + 1).padStart(3, '0')}-${idx + 1}`,
      clinic_id: CLINIC_ID,
      created_at: date,
      updated_at: date,
      deleted_at: null,
      prescription_id: rxId,
      drug_name: it.name,
      dose: it.dose,
      frequency: it.freq,
      duration_days: it.days,
      instructions: it.inst,
    });
  });
}

// ============================================================================
// 8. EXPENSES (30 Expenses across 3 Months: July, August, September 2026)
// ============================================================================
export interface SeedExpenseItem {
  id: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  category: 'supplies' | 'rent' | 'salaries' | 'utilities' | 'lab_fees' | 'marketing' | 'maintenance';
  amount_halalas: number;
  date: string;
  payee: string;
  payment_method: 'transfer' | 'cash' | 'card' | 'cheque';
  receipt_path: string | null;
  notes: string;
}

export const seedExpenses: SeedExpenseItem[] = [
  // July 2026 (10 expenses)
  { id: 'exp-01', clinic_id: CLINIC_ID, created_at: '2026-07-01T08:00:00.000Z', updated_at: '2026-07-01T08:00:00.000Z', deleted_at: null, category: 'rent', amount_halalas: 3500000, date: '2026-07-01', payee: 'شركة الأوقاف العقارية', payment_method: 'transfer', receipt_path: null, notes: 'إيجار مبنى العيادة لشهر يوليو 2026' },
  { id: 'exp-02', clinic_id: CLINIC_ID, created_at: '2026-07-04T10:00:00.000Z', updated_at: '2026-07-04T10:00:00.000Z', deleted_at: null, category: 'utilities', amount_halalas: 480000, date: '2026-07-04', payee: 'الشركة السعودية للكهرباء', payment_method: 'transfer', receipt_path: null, notes: 'فاتورة الكهرباء والتكييف المركزي' },
  { id: 'exp-03', clinic_id: CLINIC_ID, created_at: '2026-07-07T11:00:00.000Z', updated_at: '2026-07-07T11:00:00.000Z', deleted_at: null, category: 'supplies', amount_halalas: 850000, date: '2026-07-07', payee: 'مؤسسة التجهيزات السنية المتقدمة', payment_method: 'transfer', receipt_path: null, notes: 'شراء كبسولات حشوات ضوئية 3M ومواد طبعات' },
  { id: 'exp-04', clinic_id: CLINIC_ID, created_at: '2026-07-10T09:00:00.000Z', updated_at: '2026-07-10T09:00:00.000Z', deleted_at: null, category: 'maintenance', amount_halalas: 120000, date: '2026-07-10', payee: 'شركة التقنية السنية للصيانة', payment_method: 'card', receipt_path: null, notes: 'صيانة دورية لجهاز الأوتوكلاف وجهاز ضغط الهواء' },
  { id: 'exp-05', clinic_id: CLINIC_ID, created_at: '2026-07-14T15:00:00.000Z', updated_at: '2026-07-14T15:00:00.000Z', deleted_at: null, category: 'lab_fees', amount_halalas: 1450000, date: '2026-07-14', payee: 'مختبر الرياض الرقمي للأسنان', payment_method: 'transfer', receipt_path: null, notes: 'تسوية مستحقات تيجان وجسور النصف الأول من يوليو' },
  { id: 'exp-06', clinic_id: CLINIC_ID, created_at: '2026-07-18T12:00:00.000Z', updated_at: '2026-07-18T12:00:00.000Z', deleted_at: null, category: 'supplies', amount_halalas: 320000, date: '2026-07-18', payee: 'شركة النخبة للمستلزمات والتعقيم', payment_method: 'card', receipt_path: null, notes: 'أكياس تعقيم وقفازات ومحاليل تطهير الأسطح' },
  { id: 'exp-07', clinic_id: CLINIC_ID, created_at: '2026-07-22T14:00:00.000Z', updated_at: '2026-07-22T14:00:00.000Z', deleted_at: null, category: 'marketing', amount_halalas: 400000, date: '2026-07-22', payee: 'وكالة الرؤية للتسويق الرقمي', payment_method: 'transfer', receipt_path: null, notes: 'حملة إعلانية لموسم الصيف وتبييض الأسنان' },
  { id: 'exp-08', clinic_id: CLINIC_ID, created_at: '2026-07-25T16:00:00.000Z', updated_at: '2026-07-25T16:00:00.000Z', deleted_at: null, category: 'utilities', amount_halalas: 95000, date: '2026-07-25', payee: 'شركة الاتصالات السعودية STC', payment_method: 'card', receipt_path: null, notes: 'اشتراك الألياف البصرية وخدمة هاتف العيادة' },
  { id: 'exp-09', clinic_id: CLINIC_ID, created_at: '2026-07-27T10:00:00.000Z', updated_at: '2026-07-27T10:00:00.000Z', deleted_at: null, category: 'salaries', amount_halalas: 4800000, date: '2026-07-27', payee: 'حساب مسير رواتب الموظفين', payment_method: 'transfer', receipt_path: null, notes: 'رواتب وأجور الكادر الطبي والإداري لشهر يوليو' },
  { id: 'exp-10', clinic_id: CLINIC_ID, created_at: '2026-07-30T13:00:00.000Z', updated_at: '2026-07-30T13:00:00.000Z', deleted_at: null, category: 'supplies', amount_halalas: 210000, date: '2026-07-30', payee: 'مستودع الأدوية والمخدر الطبي', payment_method: 'cash', receipt_path: null, notes: 'دفعة بنج موضعي كربول وإبر معقمة' },

  // August 2026 (10 expenses)
  { id: 'exp-11', clinic_id: CLINIC_ID, created_at: '2026-08-01T08:00:00.000Z', updated_at: '2026-08-01T08:00:00.000Z', deleted_at: null, category: 'rent', amount_halalas: 3500000, date: '2026-08-01', payee: 'شركة الأوقاف العقارية', payment_method: 'transfer', receipt_path: null, notes: 'إيجار مبنى العيادة لشهر أغسطس 2026' },
  { id: 'exp-12', clinic_id: CLINIC_ID, created_at: '2026-08-03T10:00:00.000Z', updated_at: '2026-08-03T10:00:00.000Z', deleted_at: null, category: 'utilities', amount_halalas: 510000, date: '2026-08-03', payee: 'الشركة السعودية للكهرباء', payment_method: 'transfer', receipt_path: null, notes: 'فاتورة الكهرباء ذروة الصيف لشهر أغسطس' },
  { id: 'exp-13', clinic_id: CLINIC_ID, created_at: '2026-08-06T11:00:00.000Z', updated_at: '2026-08-06T11:00:00.000Z', deleted_at: null, category: 'supplies', amount_halalas: 920000, date: '2026-08-06', payee: 'مؤسسة التجهيزات السنية المتقدمة', payment_method: 'transfer', receipt_path: null, notes: 'زرعات تيتانيوم ستراومان ومستلزمات جراحية' },
  { id: 'exp-14', clinic_id: CLINIC_ID, created_at: '2026-08-11T09:30:00.000Z', updated_at: '2026-08-11T09:30:00.000Z', deleted_at: null, category: 'lab_fees', amount_halalas: 1800000, date: '2026-08-11', payee: 'معمل المدار الرقمي لطب الأسنان', payment_method: 'transfer', receipt_path: null, notes: 'مستحقات معمل الأسنان لأعمال الزيركون والجسور' },
  { id: 'exp-15', clinic_id: CLINIC_ID, created_at: '2026-08-15T14:00:00.000Z', updated_at: '2026-08-15T14:00:00.000Z', deleted_at: null, category: 'maintenance', amount_halalas: 75000, date: '2026-08-15', payee: 'مؤسسة أمان لأنظمة السلامة', payment_method: 'card', receipt_path: null, notes: 'فحص وتعبئة طفايات الحريق ونظام الإنذار' },
  { id: 'exp-16', clinic_id: CLINIC_ID, created_at: '2026-08-18T10:00:00.000Z', updated_at: '2026-08-18T10:00:00.000Z', deleted_at: null, category: 'marketing', amount_halalas: 350000, date: '2026-08-18', payee: 'شركة منصات الإعلانية', payment_method: 'card', receipt_path: null, notes: 'إعلانات سناب شات وإنستغرام الموجهة جغرافياً' },
  { id: 'exp-17', clinic_id: CLINIC_ID, created_at: '2026-08-21T12:00:00.000Z', updated_at: '2026-08-21T12:00:00.000Z', deleted_at: null, category: 'supplies', amount_halalas: 460000, date: '2026-08-21', payee: 'شركة النخبة للمستلزمات الطبية', payment_method: 'transfer', receipt_path: null, notes: 'أدوات فحص دورية ومرايا وملاقط معقمة جديدة' },
  { id: 'exp-18', clinic_id: CLINIC_ID, created_at: '2026-08-25T15:00:00.000Z', updated_at: '2026-08-25T15:00:00.000Z', deleted_at: null, category: 'utilities', amount_halalas: 95000, date: '2026-08-25', payee: 'شركة الاتصالات السعودية STC', payment_method: 'transfer', receipt_path: null, notes: 'فاتورة الهاتف والإنترنت المتطور' },
  { id: 'exp-19', clinic_id: CLINIC_ID, created_at: '2026-08-27T10:00:00.000Z', updated_at: '2026-08-27T10:00:00.000Z', deleted_at: null, category: 'salaries', amount_halalas: 4800000, date: '2026-08-27', payee: 'حساب مسير رواتب الموظفين', payment_method: 'transfer', receipt_path: null, notes: 'رواتب وأجور منسوبي العيادة لشهر أغسطس' },
  { id: 'exp-20', clinic_id: CLINIC_ID, created_at: '2026-08-29T11:00:00.000Z', updated_at: '2026-08-29T11:00:00.000Z', deleted_at: null, category: 'lab_fees', amount_halalas: 950000, date: '2026-08-29', payee: 'مركز النخبة السويسري لعدسات الفينير', payment_method: 'transfer', receipt_path: null, notes: 'تكلفة عدسات فينير إيماكس عالية الدقة' },

  // September 2026 (10 expenses)
  { id: 'exp-21', clinic_id: CLINIC_ID, created_at: '2026-09-01T08:00:00.000Z', updated_at: '2026-09-01T08:00:00.000Z', deleted_at: null, category: 'rent', amount_halalas: 3500000, date: '2026-09-01', payee: 'شركة الأوقاف العقارية', payment_method: 'transfer', receipt_path: null, notes: 'إيجار مبنى العيادة لشهر سبتمبر 2026' },
  { id: 'exp-22', clinic_id: CLINIC_ID, created_at: '2026-09-03T10:00:00.000Z', updated_at: '2026-09-03T10:00:00.000Z', deleted_at: null, category: 'utilities', amount_halalas: 440000, date: '2026-09-03', payee: 'الشركة السعودية للكهرباء', payment_method: 'transfer', receipt_path: null, notes: 'فاتورة الكهرباء لشهر سبتمبر' },
  { id: 'exp-23', clinic_id: CLINIC_ID, created_at: '2026-09-06T11:00:00.000Z', updated_at: '2026-09-06T11:00:00.000Z', deleted_at: null, category: 'supplies', amount_halalas: 780000, date: '2026-09-06', payee: 'مؤسسة التجهيزات السنية المتقدمة', payment_method: 'transfer', receipt_path: null, notes: 'مبارد علاج عصب دوارة NiTi وأقماع جوتابركا' },
  { id: 'exp-24', clinic_id: CLINIC_ID, created_at: '2026-09-10T14:00:00.000Z', updated_at: '2026-09-10T14:00:00.000Z', deleted_at: null, category: 'maintenance', amount_halalas: 180000, date: '2026-09-10', payee: 'المهندس لصيانة كراسي الأسنان', payment_method: 'cash', receipt_path: null, notes: 'استبدال خراطيم التوربينات وصمامات مياه كرسي 2' },
  { id: 'exp-25', clinic_id: CLINIC_ID, created_at: '2026-09-15T12:00:00.000Z', updated_at: '2026-09-15T12:00:00.000Z', deleted_at: null, category: 'lab_fees', amount_halalas: 1650000, date: '2026-09-15', payee: 'مختبر الرياض الرقمي للأسنان', payment_method: 'transfer', receipt_path: null, notes: 'تسوية النصف الأول من طلبيات المعمل لشهر سبتمبر' },
  { id: 'exp-26', clinic_id: CLINIC_ID, created_at: '2026-09-19T09:00:00.000Z', updated_at: '2026-09-19T09:00:00.000Z', deleted_at: null, category: 'marketing', amount_halalas: 500000, date: '2026-09-19', payee: 'وكالة مسار الإبداع للدعاية', payment_method: 'transfer', receipt_path: null, notes: 'عروض وحملة اليوم الوطني الـ 96 السعودي' },
  { id: 'exp-27', clinic_id: CLINIC_ID, created_at: '2026-09-22T11:00:00.000Z', updated_at: '2026-09-22T11:00:00.000Z', deleted_at: null, category: 'supplies', amount_halalas: 390000, date: '2026-09-22', payee: 'شركة النخبة للمستلزمات الطبية', payment_method: 'card', receipt_path: null, notes: 'أكياس نفايات طبية خطرة ومستلزمات جراحة اللثة' },
  { id: 'exp-28', clinic_id: CLINIC_ID, created_at: '2026-09-25T16:00:00.000Z', updated_at: '2026-09-25T16:00:00.000Z', deleted_at: null, category: 'utilities', amount_halalas: 95000, date: '2026-09-25', payee: 'شركة الاتصالات السعودية STC', payment_method: 'card', receipt_path: null, notes: 'خدمات الاتصال والرسائل القصيرة' },
  { id: 'exp-29', clinic_id: CLINIC_ID, created_at: '2026-09-27T10:00:00.000Z', updated_at: '2026-09-27T10:00:00.000Z', deleted_at: null, category: 'salaries', amount_halalas: 4800000, date: '2026-09-27', payee: 'حساب مسير رواتب الموظفين', payment_method: 'transfer', receipt_path: null, notes: 'رواتب وأجور الكادر الطبي والإداري لشهر سبتمبر' },
  { id: 'exp-30', clinic_id: CLINIC_ID, created_at: '2026-09-29T15:00:00.000Z', updated_at: '2026-09-29T15:00:00.000Z', deleted_at: null, category: 'supplies', amount_halalas: 180000, date: '2026-09-29', payee: 'مستودع الأدوية والمخدر الطبي', payment_method: 'cash', receipt_path: null, notes: 'معجون تلميع أسنان وشرائط صقل الحشوات' },
];

// ============================================================================
// 9. TREATMENT PLANS & PLAN ITEMS (6 Treatment Plans with Realistic Phases)
// ============================================================================
export interface SeedTreatmentPlanItem {
  id: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  patient_id: string;
  dentist_id: string;
  title: string;
  status: 'draft' | 'presented' | 'accepted' | 'in_progress' | 'completed';
  total_halalas: number;
  discount_halalas: number;
  patient_consent_at: string | null;
  notes: string;
}

export interface SeedTreatmentPlanStepItem {
  id: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  plan_id: string;
  procedure_id: string;
  tooth_number: number | null;
  surface: 'M' | 'O' | 'D' | 'B' | 'L' | 'whole' | null;
  quantity: number;
  unit_price_halalas: number;
  discount_halalas: number;
  priority: number;
  phase: number;
  status: 'planned' | 'in_progress' | 'completed' | 'existing';
  scheduled_date: string | null;
}

export const seedTreatmentPlans: SeedTreatmentPlanItem[] = [
  {
    id: 'plan-001',
    clinic_id: CLINIC_ID,
    created_at: '2026-08-01T09:00:00.000Z',
    updated_at: '2026-08-01T09:00:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[0].id,
    dentist_id: seedUsers[0].id,
    title: 'خطة إعادة تأهيل الفك العلوي وزراعة سنية',
    status: 'in_progress',
    total_halalas: 650000,
    discount_halalas: 50000,
    patient_consent_at: '2026-08-02T10:00:00.000Z',
    notes: 'تشمل تنظيفاً علاجياً، علاج عصب للسن 16، تليها زراعة السن المفقود 14.',
  },
  {
    id: 'plan-002',
    clinic_id: CLINIC_ID,
    created_at: '2026-08-10T11:00:00.000Z',
    updated_at: '2026-08-10T11:00:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[1].id,
    dentist_id: seedUsers[1].id,
    title: 'خطة علاج الجذور وتجميل الابتسامة بالعدسات الخزفية',
    status: 'accepted',
    total_halalas: 820000,
    discount_halalas: 70000,
    patient_consent_at: '2026-08-12T14:30:00.000Z',
    notes: 'علاج عصب القواطع الأمامية المتضررة ثم تركيب عدسات فينير إيماكس.',
  },
  {
    id: 'plan-003',
    clinic_id: CLINIC_ID,
    created_at: '2026-08-20T14:00:00.000Z',
    updated_at: '2026-08-20T14:00:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[2].id,
    dentist_id: seedUsers[2].id,
    title: 'خطة علاج نخر متعدد وحشوات تجميلية خلفية',
    status: 'completed',
    total_halalas: 340000,
    discount_halalas: 20000,
    patient_consent_at: '2026-08-21T09:00:00.000Z',
    notes: 'تم إنجاز كافة الحشوات التجميلية للضروس الخلفية بنجاح.',
  },
  {
    id: 'plan-004',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-01T10:30:00.000Z',
    updated_at: '2026-09-01T10:30:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[3].id,
    dentist_id: seedUsers[0].id,
    title: 'خطة خلع جراحي لأضراس العقل المطمورة',
    status: 'in_progress',
    total_halalas: 280000,
    discount_halalas: 0,
    patient_consent_at: '2026-09-02T16:00:00.000Z',
    notes: 'خلع جراحي دقيق تحت التخدير الموضعي مع غرز جراحية قابلة للامتصاص.',
  },
  {
    id: 'plan-005',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-12T15:00:00.000Z',
    updated_at: '2026-09-12T15:00:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[4].id,
    dentist_id: seedUsers[1].id,
    title: 'خطة علاج اللثة والنسج الداعمة وعلاج صرير الأسنان',
    status: 'accepted',
    total_halalas: 195000,
    discount_halalas: 15000,
    patient_consent_at: '2026-09-14T11:00:00.000Z',
    notes: 'كشط جذور وتنظيف عميق للجيوب اللثوية وتصنيع واقٍ ليلي واقٍ من الاحتكاك.',
  },
  {
    id: 'plan-006',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-20T09:00:00.000Z',
    updated_at: '2026-09-20T09:00:00.000Z',
    deleted_at: null,
    patient_id: seedPatients[5].id,
    dentist_id: seedUsers[2].id,
    title: 'خطة تقويم وقائي ومتابعة أطباق الأسنان للأطفال',
    status: 'draft',
    total_halalas: 450000,
    discount_halalas: 30000,
    patient_consent_at: null,
    notes: 'قيد المراجعة والمناقشة مع ولي أمر المريض.',
  },
];

export const seedTreatmentPlanItems: SeedTreatmentPlanStepItem[] = [
  // Plan 1 items
  { id: 'pli-001', clinic_id: CLINIC_ID, created_at: '2026-08-01T09:00:00.000Z', updated_at: '2026-08-01T09:00:00.000Z', deleted_at: null, plan_id: 'plan-001', procedure_id: seedProcedures[0].id, tooth_number: null, surface: 'whole', quantity: 1, unit_price_halalas: 25000, discount_halalas: 0, priority: 1, phase: 1, status: 'completed', scheduled_date: '2026-08-05' },
  { id: 'pli-002', clinic_id: CLINIC_ID, created_at: '2026-08-01T09:00:00.000Z', updated_at: '2026-08-01T09:00:00.000Z', deleted_at: null, plan_id: 'plan-001', procedure_id: seedProcedures[1].id, tooth_number: 16, surface: 'whole', quantity: 1, unit_price_halalas: 175000, discount_halalas: 15000, priority: 2, phase: 1, status: 'completed', scheduled_date: '2026-08-12' },
  { id: 'pli-003', clinic_id: CLINIC_ID, created_at: '2026-08-01T09:00:00.000Z', updated_at: '2026-08-01T09:00:00.000Z', deleted_at: null, plan_id: 'plan-001', procedure_id: seedProcedures[2].id, tooth_number: 14, surface: 'whole', quantity: 1, unit_price_halalas: 450000, discount_halalas: 35000, priority: 3, phase: 2, status: 'in_progress', scheduled_date: '2026-09-01' },

  // Plan 2 items
  { id: 'pli-004', clinic_id: CLINIC_ID, created_at: '2026-08-10T11:00:00.000Z', updated_at: '2026-08-10T11:00:00.000Z', deleted_at: null, plan_id: 'plan-002', procedure_id: seedProcedures[1].id, tooth_number: 11, surface: 'whole', quantity: 1, unit_price_halalas: 160000, discount_halalas: 10000, priority: 1, phase: 1, status: 'completed', scheduled_date: '2026-08-15' },
  { id: 'pli-005', clinic_id: CLINIC_ID, created_at: '2026-08-10T11:00:00.000Z', updated_at: '2026-08-10T11:00:00.000Z', deleted_at: null, plan_id: 'plan-002', procedure_id: seedProcedures[3].id, tooth_number: 11, surface: 'B', quantity: 1, unit_price_halalas: 330000, discount_halalas: 30000, priority: 2, phase: 2, status: 'in_progress', scheduled_date: '2026-08-25' },
  { id: 'pli-006', clinic_id: CLINIC_ID, created_at: '2026-08-10T11:00:00.000Z', updated_at: '2026-08-10T11:00:00.000Z', deleted_at: null, plan_id: 'plan-002', procedure_id: seedProcedures[3].id, tooth_number: 21, surface: 'B', quantity: 1, unit_price_halalas: 330000, discount_halalas: 30000, priority: 2, phase: 2, status: 'in_progress', scheduled_date: '2026-08-25' },

  // Plan 3 items
  { id: 'pli-007', clinic_id: CLINIC_ID, created_at: '2026-08-20T14:00:00.000Z', updated_at: '2026-08-20T14:00:00.000Z', deleted_at: null, plan_id: 'plan-003', procedure_id: seedProcedures[4].id, tooth_number: 36, surface: 'O', quantity: 1, unit_price_halalas: 170000, discount_halalas: 10000, priority: 1, phase: 1, status: 'completed', scheduled_date: '2026-08-22' },
  { id: 'pli-008', clinic_id: CLINIC_ID, created_at: '2026-08-20T14:00:00.000Z', updated_at: '2026-08-20T14:00:00.000Z', deleted_at: null, plan_id: 'plan-003', procedure_id: seedProcedures[4].id, tooth_number: 46, surface: 'O', quantity: 1, unit_price_halalas: 170000, discount_halalas: 10000, priority: 2, phase: 1, status: 'completed', scheduled_date: '2026-08-28' },

  // Plan 4 items
  { id: 'pli-009', clinic_id: CLINIC_ID, created_at: '2026-09-01T10:30:00.000Z', updated_at: '2026-09-01T10:30:00.000Z', deleted_at: null, plan_id: 'plan-004', procedure_id: seedProcedures[5].id, tooth_number: 38, surface: 'whole', quantity: 1, unit_price_halalas: 140000, discount_halalas: 0, priority: 1, phase: 1, status: 'completed', scheduled_date: '2026-09-08' },
  { id: 'pli-010', clinic_id: CLINIC_ID, created_at: '2026-09-01T10:30:00.000Z', updated_at: '2026-09-01T10:30:00.000Z', deleted_at: null, plan_id: 'plan-004', procedure_id: seedProcedures[5].id, tooth_number: 48, surface: 'whole', quantity: 1, unit_price_halalas: 140000, discount_halalas: 0, priority: 2, phase: 2, status: 'planned', scheduled_date: '2026-10-05' },

  // Plan 5 items
  { id: 'pli-011', clinic_id: CLINIC_ID, created_at: '2026-09-12T15:00:00.000Z', updated_at: '2026-09-12T15:00:00.000Z', deleted_at: null, plan_id: 'plan-005', procedure_id: seedProcedures[6].id, tooth_number: null, surface: 'whole', quantity: 1, unit_price_halalas: 120000, discount_halalas: 10000, priority: 1, phase: 1, status: 'in_progress', scheduled_date: '2026-09-18' },
  { id: 'pli-012', clinic_id: CLINIC_ID, created_at: '2026-09-12T15:00:00.000Z', updated_at: '2026-09-12T15:00:00.000Z', deleted_at: null, plan_id: 'plan-005', procedure_id: seedProcedures[7].id, tooth_number: null, surface: 'whole', quantity: 1, unit_price_halalas: 75000, discount_halalas: 5000, priority: 2, phase: 2, status: 'planned', scheduled_date: '2026-09-28' },

  // Plan 6 items
  { id: 'pli-013', clinic_id: CLINIC_ID, created_at: '2026-09-20T09:00:00.000Z', updated_at: '2026-09-20T09:00:00.000Z', deleted_at: null, plan_id: 'plan-006', procedure_id: seedProcedures[8].id, tooth_number: null, surface: 'whole', quantity: 1, unit_price_halalas: 450000, discount_halalas: 30000, priority: 1, phase: 1, status: 'planned', scheduled_date: '2026-10-15' },
];

// ============================================================================
// 10. NOTIFICATIONS (10 Realistic System Notifications)
// ============================================================================
export interface SeedNotificationItem {
  id: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  user_id: string;
  type: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
}

export const seedNotifications: SeedNotificationItem[] = [
  {
    id: 'notif-001',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-28T08:00:00.000Z',
    updated_at: '2026-09-28T08:00:00.000Z',
    deleted_at: null,
    user_id: seedUsers[0].id,
    type: 'appointment',
    title: 'تأكيد موعد جراحة زراعة سنية',
    body: 'قام المريض عبد الله بن فهد بتأكيد حضور موعده اليوم الساعة 11:30 صباحاً في عيادة 1.',
    entity_type: 'appointment',
    entity_id: 'apt-001',
    read_at: '2026-09-28T08:30:00.000Z',
  },
  {
    id: 'notif-002',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-28T09:15:00.000Z',
    updated_at: '2026-09-28T09:15:00.000Z',
    deleted_at: null,
    user_id: seedUsers[1].id,
    type: 'lab_order',
    title: 'وصول تركيبة معملية جديدة من مختبر الرياض',
    body: 'تم استلام تاج الزيركون للسن 16 الخاص بالمريض فهد السبيعي وهو جاهز للتركيب.',
    entity_type: 'lab_order',
    entity_id: 'lbo-001',
    read_at: null,
  },
  {
    id: 'notif-003',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-28T10:00:00.000Z',
    updated_at: '2026-09-28T10:00:00.000Z',
    deleted_at: null,
    user_id: seedUsers[3].id,
    type: 'patient',
    title: 'تسجيل مريض جديد إلكترونياً',
    body: 'تم فتح ملف طبي جديد برقم P-1041 للمريض سلطان بن عبد العزيز الشريف.',
    entity_type: 'patient',
    entity_id: seedPatients[0].id,
    read_at: '2026-09-28T10:10:00.000Z',
  },
  {
    id: 'notif-004',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-28T11:45:00.000Z',
    updated_at: '2026-09-28T11:45:00.000Z',
    deleted_at: null,
    user_id: seedUsers[4].id,
    type: 'financial',
    title: 'سداد دفعة إلكترونية عبر شبكة مدى',
    body: 'تم تسجيل سند قبض رقم PAY-1081 بمبلغ 1,500.00 ر.س على الفاتورة INV-2026-01050.',
    entity_type: 'payment',
    entity_id: 'pay-001',
    read_at: '2026-09-28T12:00:00.000Z',
  },
  {
    id: 'notif-005',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-28T14:20:00.000Z',
    updated_at: '2026-09-28T14:20:00.000Z',
    deleted_at: null,
    user_id: seedUsers[0].id,
    type: 'inventory',
    title: 'تنبيه انخفاض مخزون مادة التخدير الموضعي (Lidocaine)',
    body: 'تبقت 3 علب فقط من مخدر ليدوكائين 2% في المستودع الرئيسي، وهو دون الحد الأدنى الآمن.',
    entity_type: 'inventory_item',
    entity_id: 'inv-item-001',
    read_at: null,
  },
  {
    id: 'notif-006',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-28T16:00:00.000Z',
    updated_at: '2026-09-28T16:00:00.000Z',
    deleted_at: null,
    user_id: seedUsers[2].id,
    type: 'appointment',
    title: 'طلب تعديل موعد من المريض',
    body: 'طلب المريض تركي بن ناصر تأجيل موعد استكمال الحشوة إلى يوم الخميس القادم.',
    entity_type: 'appointment',
    entity_id: 'apt-002',
    read_at: null,
  },
  {
    id: 'notif-007',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-28T18:30:00.000Z',
    updated_at: '2026-09-28T18:30:00.000Z',
    deleted_at: null,
    user_id: seedUsers[4].id,
    type: 'financial',
    title: 'اكتمال الإغلاق المالي اليومي للصندوق',
    body: 'تم إغلاق حركة النقد والشبكة اليومية بنجاح بإجمالي متحصلات 18,750.00 ر.س ومطابقة الفواتير.',
    entity_type: 'report',
    entity_id: 'closing-20260928',
    read_at: '2026-09-28T19:00:00.000Z',
  },
  {
    id: 'notif-008',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-28T21:00:00.000Z',
    updated_at: '2026-09-28T21:00:00.000Z',
    deleted_at: null,
    user_id: seedUsers[0].id,
    type: 'system',
    title: 'اكتمال النسخ الاحتياطي التلقائي المشفر',
    body: 'تم حفظ نسخة احتياطية محلية مشفرة بنجاح بحجم 4.2 ميغابايت في المجلد الآمن.',
    entity_type: 'backup',
    entity_id: 'bak-20260928',
    read_at: '2026-09-28T22:00:00.000Z',
  },
  {
    id: 'notif-009',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-29T08:15:00.000Z',
    updated_at: '2026-09-29T08:15:00.000Z',
    deleted_at: null,
    user_id: seedUsers[3].id,
    type: 'appointment',
    title: 'تذكير المواعيد الصباحية لعيادة التركيبات',
    body: 'لديك 4 مواعيد مجدولة اليوم في عيادة 2، أول موعد يبدأ الساعة 09:30 صباحاً.',
    entity_type: 'appointment',
    entity_id: 'apt-003',
    read_at: null,
  },
  {
    id: 'notif-010',
    clinic_id: CLINIC_ID,
    created_at: '2026-09-29T09:00:00.000Z',
    updated_at: '2026-09-29T09:00:00.000Z',
    deleted_at: null,
    user_id: seedUsers[1].id,
    type: 'clinical',
    title: 'اكتمال نتائج تقرير أشعة سينية رقمية',
    body: 'تم رفع صورة أشعة بانورامية رقمية جديدة لملف المريضة منى بنت عبد الله.',
    entity_type: 'image',
    entity_id: 'img-001',
    read_at: null,
  },
];
