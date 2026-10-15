import type {
  Clinic,
  Branch,
  User,
  Room,
  Procedure,
  Patient,
  Appointment,
  Invoice,
  InvoiceItem,
  Payment,
  InsuranceCompany,
  ToothRecord,
  InventoryItem,
  Supplier,
  Allergy,
  MedicalHistory,
  ProcedureCategory,
} from '@shared/contracts';

export const CLINIC_ID = 'c1000000-0000-0000-0000-000000000001';
export const BRANCH_ID = 'b1000000-0000-0000-0000-000000000001';

export const seedClinic: Clinic = {
  id: CLINIC_ID,
  clinic_id: CLINIC_ID,
  created_at: '2024-01-01T08:00:00.000Z',
  updated_at: '2024-01-01T08:00:00.000Z',
  deleted_at: null,
  name: 'عيادة أفق لطب وجراحة وتجميل الأسنان',
  logo_path: null,
  phone: '0114567890',
  email: 'info@ofodental.sa',
  address: 'طريق الملك فهد، حي الملقا، الرياض',
  city: 'الرياض',
  tax_number: '310123456700003',
  cr_number: '1010789456',
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
  working_hours: [
    { day_of_week: 0, is_open: true, open_time: '09:00', close_time: '21:00' },
    { day_of_week: 1, is_open: true, open_time: '09:00', close_time: '21:00' },
    { day_of_week: 2, is_open: true, open_time: '09:00', close_time: '21:00' },
    { day_of_week: 3, is_open: true, open_time: '09:00', close_time: '21:00' },
    { day_of_week: 4, is_open: true, open_time: '09:00', close_time: '21:00' },
    { day_of_week: 5, is_open: false, open_time: '14:00', close_time: '21:00' },
    { day_of_week: 6, is_open: true, open_time: '09:00', close_time: '21:00' },
  ],
  slot_duration_min: 30,
};

export const seedBranch: Branch = {
  id: BRANCH_ID,
  clinic_id: CLINIC_ID,
  created_at: '2024-01-01T08:00:00.000Z',
  updated_at: '2024-01-01T08:00:00.000Z',
  deleted_at: null,
  name: 'الفرع الرئيسي - الملقا',
  phone: '0114567891',
  address: 'برج الأفق الطبي، الطابق الثالث',
  is_active: true,
};

export const seedUsers: User[] = [
  {
    id: 'u1000000-0000-0000-0000-000000000001',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    full_name: 'د. أحمد خالد الراشد',
    username: 'dr.ahmed',
    password_hash: 'hash_ahmed_123',
    role: 'owner',
    specialty: 'استشاري جراحة وزراعة الأسنان',
    license_number: 'SCHS-2018-D-8891',
    phone: '0501112233',
    email: 'dr.ahmed@eyadati.local',
    avatar_path: null,
    color: '#1E4E9C',
    commission_percent: 40,
    is_active: true,
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
    password_hash: 'hash_layla_123',
    role: 'dentist',
    specialty: 'أخصائية علاج جذور وعصب الأسنان',
    license_number: 'SCHS-2020-D-4521',
    phone: '0502223344',
    email: 'dr.layla@eyadati.local',
    avatar_path: null,
    color: '#2BB39A',
    commission_percent: 35,
    is_active: true,
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
    password_hash: 'hash_sara_h_123',
    role: 'dentist',
    specialty: 'طبيبة أسنان عامة وتجميل',
    license_number: 'SCHS-2021-D-5120',
    phone: '0505556677',
    email: 'dr.sara@eyadati.local',
    avatar_path: null,
    color: '#E11D48',
    commission_percent: 35,
    is_active: true,
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
    password_hash: 'hash_sara_123',
    role: 'receptionist',
    specialty: 'مسؤولة الاستقبال وتنسيق المواعيد',
    license_number: null,
    phone: '0503334455',
    email: 'sara@eyadati.local',
    avatar_path: null,
    color: '#2563C9',
    commission_percent: 0,
    is_active: true,
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
    password_hash: 'hash_khaled_123',
    role: 'accountant',
    specialty: 'مدير الحسابات والفوترة',
    license_number: null,
    phone: '0504445566',
    email: 'khaled@eyadati.local',
    avatar_path: null,
    color: '#153C7C',
    commission_percent: 0,
    is_active: true,
    last_login_at: '2026-09-19T16:45:00.000Z',
  },
];

export const seedRooms: Room[] = [
  {
    id: 'r1000000-0000-0000-0000-000000000001',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    branch_id: BRANCH_ID,
    name: 'غرفة 1',
    number: '1',
    status: 'free',
    equipment: [
      { id: 'eq-101', name: 'كرسي أسنان متطور A-dec 500' },
      { id: 'eq-102', name: 'وحدة جراحة زراعة Surgic Pro' },
      { id: 'eq-103', name: 'كاميرا فموية داخلية' },
    ],
  },
  {
    id: 'r1000000-0000-0000-0000-000000000002',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    branch_id: BRANCH_ID,
    name: 'غرفة 2',
    number: '2',
    status: 'busy',
    equipment: [
      { id: 'eq-201', name: 'ميكروسكوب جراحي Leica' },
      { id: 'eq-202', name: 'جهاز تحديد ذروة الجذر Apex Locator' },
      { id: 'eq-203', name: 'موتور إندو Dentsply' },
    ],
  },
  {
    id: 'r1000000-0000-0000-0000-000000000003',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    branch_id: BRANCH_ID,
    name: 'غرفة 3',
    number: '3',
    status: 'busy',
    equipment: [
      { id: 'eq-301', name: 'جهاز تقليح وتلميع بالموجات فوق الصوتية EMS' },
      { id: 'eq-302', name: 'ضوء تصليب كوزمو' },
    ],
  },
  {
    id: 'r1000000-0000-0000-0000-000000000004',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    branch_id: BRANCH_ID,
    name: 'غرفة 4',
    number: '4',
    status: 'free',
    equipment: [
      { id: 'eq-401', name: 'أوتوكلاف فئة B Melag' },
      { id: 'eq-402', name: 'جهاز تنظيف بالموجات فوق الصوتية' },
      { id: 'eq-403', name: 'جهاز تغليف حراري' },
    ],
  },
  {
    id: 'r1000000-0000-0000-0000-000000000005',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    branch_id: BRANCH_ID,
    name: 'غرفة 5',
    number: '5',
    status: 'free',
    equipment: [
      { id: 'eq-501', name: 'جهاز أشعة CBCT مقطعي ثلاثي الأبعاد Vatech Pax-i3D' },
      { id: 'eq-502', name: 'أشعة بانوراما وسيفالومتريك' },
    ],
  },
];

export const seedInsuranceCompanies: InsuranceCompany[] = [
  {
    id: 'ins-001',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'شركة بوبا العربية للتأمين التعاوني',
    contact: 'قسم مطالبات الأسنان',
    phone: '8002440307',
    email: 'dental-claims@bupa.com.sa',
    coverage_percent_default: 80,
    requires_preapproval: true,
    notes: 'تغطية شبكة VIP والذهبية للأسنان، تحتاج موافقة مسبقة للإجراءات فوق 1000 ريال',
  },
  {
    id: 'ins-002',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'شركة التعاونية للتأمين',
    contact: 'إدارة التأمين الطبي - أطباء الأسنان',
    phone: '920019990',
    email: 'provider-claims@tawuniya.com.sa',
    coverage_percent_default: 80,
    requires_preapproval: true,
    notes: 'حد تغطية سنوي حتى 3500 ريال لمعظم الفئات',
  },
  {
    id: 'ins-003',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'شركة المتوسط والخليج للتأمين (ميدغلف)',
    contact: 'خدمات المزودين الطبية',
    phone: '8004414442',
    email: 'dental.portal@medgulf.com.sa',
    coverage_percent_default: 75,
    requires_preapproval: true,
    notes: 'تحمّل مريض 20% بحد أقصى 100 ريال للكشف والاستشارة',
  },
];

// Helper to generate 60 standard procedures across categories
const procedureDefinitions = [
  // فحص وتشخيص
  { c: 'D0120', nameAr: 'كشف دوري واستشارة عامة', nameEn: 'Periodic Oral Evaluation', cat: 'فحص وتشخيص', price: 15000, dur: 20, tooth: false, surf: false },
  { c: 'D0140', nameAr: 'كشف طارئ ومحدود', nameEn: 'Emergency Oral Evaluation', cat: 'فحص وتشخيص', price: 20000, dur: 20, tooth: true, surf: false },
  { c: 'D0150', nameAr: 'فحص فموي شامل وتخطيط علاجي', nameEn: 'Comprehensive Oral Evaluation', cat: 'فحص وتشخيص', price: 25000, dur: 30, tooth: false, surf: false },
  { c: 'D0210', nameAr: 'سلسلة أشعة داخلية كاملة FMX', nameEn: 'Full Mouth Intraoral Series', cat: 'فحص وتشخيص', price: 30000, dur: 25, tooth: false, surf: false },
  { c: 'D0220', nameAr: 'أشعة ذروية رقمية (سن واحد)', nameEn: 'Periapical Digital X-ray', cat: 'فحص وتشخيص', price: 6000, dur: 10, tooth: true, surf: false },
  { c: 'D0272', nameAr: 'أشعة أجنحة إطباقية (صورتان)', nameEn: 'Bitewing X-rays (2 images)', cat: 'فحص وتشخيص', price: 12000, dur: 15, tooth: false, surf: false },
  { c: 'D0330', nameAr: 'أشعة بانورامية رقمية كاملة', nameEn: 'Panoramic Digital Radiograph', cat: 'فحص وتشخيص', price: 22000, dur: 15, tooth: false, surf: false },
  { c: 'D0367', nameAr: 'أشعة مقطعية ثلاثية الأبعاد CBCT', nameEn: 'Cone Beam CT 3D Scan', cat: 'فحص وتشخيص', price: 65000, dur: 20, tooth: false, surf: false },

  // وقاية وتنظيف
  { c: 'D1110', nameAr: 'تنظيف وتلميع الأسنان وإزالة الجير', nameEn: 'Dental Prophylaxis Adult', cat: 'وقاية وتنظيف', price: 25000, dur: 30, tooth: false, surf: false },
  { c: 'D1120', nameAr: 'تنظيف أسنان أطفال وتلميع', nameEn: 'Child Prophylaxis', cat: 'وقاية وتنظيف', price: 18000, dur: 20, tooth: false, surf: false },
  { c: 'D1206', nameAr: 'تطبيق ورنيش الفلورايد الموضعي', nameEn: 'Fluoride Varnish Application', cat: 'وقاية وتنظيف', price: 12000, dur: 15, tooth: false, surf: false },
  { c: 'D1351', nameAr: 'سادات الحفر والشقوق السنية (سن)', nameEn: 'Pit and Fissure Sealant', cat: 'وقاية وتنظيف', price: 12000, dur: 15, tooth: true, surf: false },
  { c: 'D1354', nameAr: 'تطبيق فلورايد ديامين الفضة SDF', nameEn: 'Silver Diamine Fluoride', cat: 'وقاية وتنظيف', price: 15000, dur: 15, tooth: true, surf: false },
  { c: 'D4341', nameAr: 'تقليح عميق وتسوية الجذور لكل ربع', nameEn: 'Scaling & Root Planing (Quadrant)', cat: 'وقاية وتنظيف', price: 40000, dur: 45, tooth: false, surf: false },
  { c: 'D4910', nameAr: 'جلسة صيانة دورية للثة والجيوب', nameEn: 'Periodontal Maintenance', cat: 'وقاية وتنظيف', price: 30000, dur: 30, tooth: false, surf: false },

  // حشوات وعلاج تحفظي
  { c: 'D2330', nameAr: 'حشوة تجميلية كمبوزيت أمامي سطح 1', nameEn: 'Resin Composite Anterior 1 Surf', cat: 'حشوات', price: 25000, dur: 30, tooth: true, surf: true },
  { c: 'D2331', nameAr: 'حشوة تجميلية كمبوزيت أمامي سطحين', nameEn: 'Resin Composite Anterior 2 Surf', cat: 'حشوات', price: 35000, dur: 35, tooth: true, surf: true },
  { c: 'D2332', nameAr: 'حشوة تجميلية كمبوزيت أمامي 3 أسطح', nameEn: 'Resin Composite Anterior 3 Surf', cat: 'حشوات', price: 45000, dur: 40, tooth: true, surf: true },
  { c: 'D2391', nameAr: 'حشوة كمبوزيت خلفي سطح واحد', nameEn: 'Resin Composite Posterior 1 Surf', cat: 'حشوات', price: 30000, dur: 30, tooth: true, surf: true },
  { c: 'D2392', nameAr: 'حشوة كمبوزيت خلفي سطحين MO/DO', nameEn: 'Resin Composite Posterior 2 Surf', cat: 'حشوات', price: 40000, dur: 40, tooth: true, surf: true },
  { c: 'D2393', nameAr: 'حشوة كمبوزيت خلفي 3 أسطح MOD', nameEn: 'Resin Composite Posterior 3 Surf', cat: 'حشوات', price: 50000, dur: 45, tooth: true, surf: true },
  { c: 'D2394', nameAr: 'حشوة كمبوزيت خلفي 4 أسطح فأكثر', nameEn: 'Resin Composite Posterior 4+ Surf', cat: 'حشوات', price: 60000, dur: 50, tooth: true, surf: true },
  { c: 'D2950', nameAr: 'بناء تاج السن بالكمبوزيت Core Buildup', nameEn: 'Core Buildup with Pins', cat: 'حشوات', price: 40000, dur: 35, tooth: true, surf: false },
  { c: 'D2954', nameAr: 'وتد فايبر بوست مع بناء السن Post & Core', nameEn: 'Fiber Post and Core', cat: 'حشوات', price: 55000, dur: 45, tooth: true, surf: false },
  { c: 'D3110', nameAr: 'تغطية اللب المباشرة Direct Pulp Cap', nameEn: 'Direct Pulp Capping', cat: 'حشوات', price: 15000, dur: 20, tooth: true, surf: false },

  // علاج الجذور والعصب
  { c: 'D3310', nameAr: 'علاج عصب سن أمامي (قناة واحدة)', nameEn: 'Root Canal Anterior 1 Canal', cat: 'علاج الجذور', price: 90000, dur: 45, tooth: true, surf: false },
  { c: 'D3320', nameAr: 'علاج عصب ضاحك (قناتين)', nameEn: 'Root Canal Premolar 2 Canals', cat: 'علاج الجذور', price: 120000, dur: 60, tooth: true, surf: false },
  { c: 'D3330', nameAr: 'علاج عصب ضرس خلفي (3-4 قنوات)', nameEn: 'Root Canal Molar 3-4 Canals', cat: 'علاج الجذور', price: 160000, dur: 75, tooth: true, surf: false },
  { c: 'D3346', nameAr: 'إعادة علاج عصب سن أمامي', nameEn: 'Retreatment Anterior', cat: 'علاج الجذور', price: 110000, dur: 60, tooth: true, surf: false },
  { c: 'D3348', nameAr: 'إعادة علاج عصب ضرس خلفي مولي', nameEn: 'Retreatment Molar', cat: 'علاج الجذور', price: 190000, dur: 90, tooth: true, surf: false },
  { c: 'D3220', nameAr: 'بتر اللب العلاجي للأسنان اللبنية', nameEn: 'Pulpotomy Deciduous Tooth', cat: 'علاج الجذور', price: 35000, dur: 30, tooth: true, surf: false },
  { c: 'D3410', nameAr: 'استئصال ذروة الجذر جراحياً Apicoectomy', nameEn: 'Apicoectomy Anterior', cat: 'علاج الجذور', price: 130000, dur: 60, tooth: true, surf: false },

  // تركيبات وتيجان
  { c: 'D2740', nameAr: 'تاج زيركون كامل مع تظليل عالي', nameEn: 'Full Zirconia Crown', cat: 'تركيبات وتيجان', price: 140000, dur: 45, tooth: true, surf: false },
  { c: 'D2750', nameAr: 'تاج بورسلين مدمج بمعدن PFM', nameEn: 'Porcelain Fused to Metal Crown', cat: 'تركيبات وتيجان', price: 95000, dur: 40, tooth: true, surf: false },
  { c: 'D2799', nameAr: 'تاج مؤقت أولي أكريليك', nameEn: 'Provisional Temporary Crown', cat: 'تركيبات وتيجان', price: 20000, dur: 20, tooth: true, surf: false },
  { c: 'D2962', nameAr: 'عدسة إيماكس تجميلية فينير E-Max', nameEn: 'E-Max Porcelain Veneer', cat: 'تركيبات وتيجان', price: 180000, dur: 45, tooth: true, surf: false },
  { c: 'D6242', nameAr: 'سن دمية جسر زيركون Pontic', nameEn: 'Zirconia Bridge Pontic', cat: 'تركيبات وتيجان', price: 130000, dur: 40, tooth: true, surf: false },
  { c: 'D2910', nameAr: 'إعادة إلصاق تاج أو جسر ساقط', nameEn: 'Recement Crown or Inlay', cat: 'تركيبات وتيجان', price: 15000, dur: 20, tooth: true, surf: false },
  { c: 'D5110', nameAr: 'طقم أسنان متحرك كامل علوي', nameEn: 'Complete Upper Denture', cat: 'تركيبات وتيجان', price: 350000, dur: 45, tooth: false, surf: false },
  { c: 'D5120', nameAr: 'طقم أسنان متحرك كامل سفلي', nameEn: 'Complete Lower Denture', cat: 'تركيبات وتيجان', price: 350000, dur: 45, tooth: false, surf: false },
  { c: 'D5213', nameAr: 'طقم جزئي كروم كوبالت هيكلي علوي', nameEn: 'Cast Metal Partial Upper', cat: 'تركيبات وتيجان', price: 280000, dur: 40, tooth: false, surf: false },

  // جراحة الفم والأسنان
  { c: 'D7140', nameAr: 'خلع سن بسيط غير جراحي', nameEn: 'Simple Tooth Extraction', cat: 'جراحة الفم', price: 25000, dur: 25, tooth: true, surf: false },
  { c: 'D7210', nameAr: 'خلع جراحي مع كشف عظمي وخياطة', nameEn: 'Surgical Tooth Extraction', cat: 'جراحة الفم', price: 55000, dur: 45, tooth: true, surf: false },
  { c: 'D7240', nameAr: 'خلع ضرس عقل مطمور كلياً بالعظم', nameEn: 'Impacted Wisdom Tooth Complete Bone', cat: 'جراحة الفم', price: 95000, dur: 60, tooth: true, surf: false },
  { c: 'D7230', nameAr: 'خلع ضرس عقل مطمور جزئياً بالأنسجة', nameEn: 'Impacted Wisdom Tooth Partial Bone', cat: 'جراحة الفم', price: 75000, dur: 45, tooth: true, surf: false },
  { c: 'D7310', nameAr: 'تسوية سنخية وتشذيب عظام الفك', nameEn: 'Alveoloplasty per Quadrant', cat: 'جراحة الفم', price: 45000, dur: 35, tooth: false, surf: false },
  { c: 'D7510', nameAr: 'شق وتصريف خراج فموي مع خياطة', nameEn: 'Incision & Drainage Abscess', cat: 'جراحة الفم', price: 30000, dur: 25, tooth: true, surf: false },
  { c: 'D7960', nameAr: 'قص لجام الشفة أو اللسان بالليزر', nameEn: 'Frenectomy with Laser', cat: 'جراحة الفم', price: 60000, dur: 30, tooth: false, surf: false },

  // زراعة الأسنان
  { c: 'D6010', nameAr: 'غرسة تيتانيوم جراحية Straumann', nameEn: 'Surgical Implant Placement', cat: 'زراعة الأسنان', price: 350000, dur: 60, tooth: true, surf: false },
  { c: 'D6057', nameAr: 'دعامة زرعة تيتانيوم أو زيركون مخصصة', nameEn: 'Custom Implant Abutment', cat: 'زراعة الأسنان', price: 120000, dur: 30, tooth: true, surf: false },
  { c: 'D6058', nameAr: 'تاج فوق الزرعة زيركون مثبت ببرغي', nameEn: 'Implant Supported Crown Screw', cat: 'زراعة الأسنان', price: 180000, dur: 45, tooth: true, surf: false },
  { c: 'D7953', nameAr: 'طعم عظمي في السنخ بعد الخلع Socket Preservation', nameEn: 'Bone Graft Socket Preservation', cat: 'زراعة الأسنان', price: 120000, dur: 35, tooth: true, surf: false },
  { c: 'D7951', nameAr: 'رفع الجيب الفكي الأنفي الجراحي المفتوح', nameEn: 'Sinus Lift Direct Open Window', cat: 'زراعة الأسنان', price: 400000, dur: 75, tooth: false, surf: false },

  // تبييض وتجميل
  { c: 'D9972', nameAr: 'تبييض أسنان عيادة بجهاز زووم Zoom 4', nameEn: 'In-Office Power Whitening Zoom', cat: 'تجميل وتبييض', price: 120000, dur: 60, tooth: false, surf: false },
  { c: 'D9975', nameAr: 'تبييض منزلي مع قوالب مخصصة ومواد', nameEn: 'Home Bleaching Trays & Gel', cat: 'تجميل وتبييض', price: 70000, dur: 30, tooth: false, surf: false },
  { c: 'D9944', nameAr: 'واقي إطباقي ليلي صلب لعلاج الصرير Night Guard', nameEn: 'Occlusal Guard Nightguard', cat: 'تجميل وتبييض', price: 65000, dur: 30, tooth: false, surf: false },
  { c: 'D9951', nameAr: 'تعديل وتلميع إطباق إطباقي انتقائي', nameEn: 'Occlusal Adjustment Limited', cat: 'تجميل وتبييض', price: 20000, dur: 20, tooth: false, surf: false },

  // تقويم الأسنان
  { c: 'D8080', nameAr: 'جلسة شد ومتابعة تقويم أسنان شهري', nameEn: 'Orthodontic Monthly Adjustment', cat: 'تقويم الأسنان', price: 35000, dur: 30, tooth: false, surf: false },
  { c: 'D8090', nameAr: 'خطة علاج تقويم شفاف كامل وسلسلة قوالب', nameEn: 'Clear Aligners Full Treatment', cat: 'تقويم الأسنان', price: 1400000, dur: 45, tooth: false, surf: false },
  { c: 'D8680', nameAr: 'مثبت تقويم سلكي داخلي ملصق أو شفاف Retainer', nameEn: 'Orthodontic Retainer', cat: 'تقويم الأسنان', price: 45000, dur: 25, tooth: false, surf: false },
];

const mapCategory = (cat: string): ProcedureCategory => {
  if (cat.includes('تشخيص') || cat.includes('فحص')) return 'diagnostic';
  if (cat.includes('تنظيف') || cat.includes('وقاية')) return 'preventive';
  if (cat.includes('حشوات') || cat.includes('تحفظي')) return 'restorative';
  if (cat.includes('عصب') || cat.includes('جذور')) return 'endodontics';
  if (cat.includes('لثة')) return 'periodontics';
  if (cat.includes('تركيبات') || cat.includes('تيجان')) return 'prosthodontics';
  if (cat.includes('جراحة') || cat.includes('خلع')) return 'oral_surgery';
  if (cat.includes('زراعة')) return 'implantology';
  if (cat.includes('تبييض') || cat.includes('تجميل')) return 'whitening';
  if (cat.includes('تقويم')) return 'orthodontics';
  if (cat.includes('أطفال')) return 'pediatric';
  return 'restorative';
};

export const seedProcedures: Procedure[] = procedureDefinitions.map((p, idx) => ({
  id: `proc-${String(idx + 1).padStart(3, '0')}`,
  clinic_id: CLINIC_ID,
  created_at: '2024-01-01T08:00:00.000Z',
  updated_at: '2024-01-01T08:00:00.000Z',
  deleted_at: null,
  code: p.c,
  name_ar: p.nameAr,
  name_en: p.nameEn,
  category: mapCategory(p.cat),
  default_price_halalas: p.price,
  default_duration_min: p.dur,
  requires_tooth: p.tooth,
  requires_surface: p.surf,
  is_active: true,
  color: null,
}));

// 40 Realistic Arabic Patients
const arabicPatientsMeta = [
  { first: 'محمد', father: 'عبد الله', family: 'القحطاني', gender: 'male', phone: '0501234567', nid: '1087654321', blood: 'O+', occ: 'معلم', ins: 'ins-001', pol: 'BUPA-78891' },
  { first: 'فاطمة', father: 'سالم', family: 'الحربي', gender: 'female', phone: '0552345678', nid: '1098765432', blood: 'A+', occ: 'مهندسة برمجيات', ins: 'ins-002', pol: 'TAW-55412' },
  { first: 'عمر', father: 'خالد', family: 'الدوسري', gender: 'male', phone: '0543456789', nid: '1012345678', blood: 'B+', occ: 'موظف بنك', ins: null, pol: null },
  { first: 'نورة', father: 'سعد', family: 'العتيبي', gender: 'female', phone: '0564567890', nid: '1023456789', blood: 'O-', occ: 'أستاذة جامعية', ins: 'ins-001', pol: 'BUPA-90812' },
  { first: 'عبد العزيز', father: 'فهد', family: 'الشمري', gender: 'male', phone: '0535678901', nid: '1034567890', blood: 'AB+', occ: 'رجل أعمال', ins: 'ins-002', pol: 'TAW-66711' },
  { first: 'ريم', father: 'إبراهيم', family: 'الغامدي', gender: 'female', phone: '0516789012', nid: '1045678901', blood: 'A-', occ: 'طبيبة بشرية', ins: 'ins-003', pol: 'MED-11029' },
  { first: 'سلطان', father: 'حمد', family: 'الرويلي', gender: 'male', phone: '0587890123', nid: '1056789012', blood: 'O+', occ: 'ضابط عسكري', ins: null, pol: null },
  { first: 'سارة', father: 'منصور', family: 'القرني', gender: 'female', phone: '0598901234', nid: '1067890123', blood: 'B-', occ: 'مصممة جرافيك', ins: 'ins-001', pol: 'BUPA-33214' },
  { first: 'يوسف', father: 'صالح', family: 'الشهري', gender: 'male', phone: '0509012345', nid: '1078901234', blood: 'A+', occ: 'صيدلي', ins: 'ins-003', pol: 'MED-89100' },
  { first: 'هند', father: 'عبد الرحمن', family: 'العنزي', gender: 'female', phone: '0550123456', nid: '1089012345', blood: 'O+', occ: 'محامية', ins: 'ins-002', pol: 'TAW-99014' },
  { first: 'فيصل', father: 'تركي', family: 'السبيعي', gender: 'male', phone: '0541234567', nid: '1090123456', blood: 'B+', occ: 'طيار مدني', ins: 'ins-001', pol: 'BUPA-44123' },
  { first: 'مها', father: 'ناصر', family: 'المالكي', gender: 'female', phone: '0562345678', nid: '1001234567', blood: 'A+', occ: 'مترجمة', ins: null, pol: null },
  { first: 'بدر', father: 'سليمان', family: 'الجهني', gender: 'male', phone: '0533456789', nid: '1011234567', blood: 'O+', occ: 'مبرمج', ins: 'ins-002', pol: 'TAW-12399' },
  { first: 'أروى', father: 'حسن', family: 'الزهراني', gender: 'female', phone: '0514567890', nid: '1021234567', blood: 'AB-', occ: 'أخصائية تغذية', ins: 'ins-003', pol: 'MED-77182' },
  { first: 'عبد الله', father: 'ماجد', family: 'العمري', gender: 'male', phone: '0585678901', nid: '1031234567', blood: 'O-', occ: 'باحث قانوني', ins: 'ins-001', pol: 'BUPA-11209' },
  { first: 'دلال', father: 'عادل', family: 'المطيري', gender: 'female', phone: '0596789012', nid: '1041234567', blood: 'A+', occ: 'مديرة تسويق', ins: 'ins-002', pol: 'TAW-88210' },
  { first: 'راكان', father: 'وليد', family: 'الخالدي', gender: 'male', phone: '0507890123', nid: '1051234567', blood: 'B+', occ: 'رائد أعمال', ins: null, pol: null },
  { first: 'جواهر', father: 'بندر', family: 'الفيفي', gender: 'female', phone: '0558901234', nid: '1061234567', blood: 'O+', occ: 'كاتبة محتوى', ins: 'ins-003', pol: 'MED-33491' },
  { first: 'سعود', father: 'مبارك', family: 'الصاعدي', gender: 'male', phone: '0549012345', nid: '1071234567', blood: 'A-', occ: 'محاسب قانوني', ins: 'ins-001', pol: 'BUPA-99211' },
  { first: 'لطيفة', father: 'حمدان', family: 'البقمي', gender: 'female', phone: '0560123456', nid: '1081234567', blood: 'AB+', occ: 'معلمة لغة إنجليزية', ins: null, pol: null },
  { first: 'ماجد', father: 'فواز', family: 'التميمي', gender: 'male', phone: '0531234567', nid: '1091234567', blood: 'O+', occ: 'محلل نظم', ins: 'ins-002', pol: 'TAW-44588' },
  { first: 'خلود', father: 'طارق', family: 'السديري', gender: 'female', phone: '0512345678', nid: '1002234567', blood: 'B+', occ: 'طبيبة أسنان عامة', ins: 'ins-001', pol: 'BUPA-88432' },
  { first: 'حمد', father: 'سعود', family: 'الشريف', gender: 'male', phone: '0583456789', nid: '1012234567', blood: 'A+', occ: 'مستشار مالي', ins: 'ins-003', pol: 'MED-55612' },
  { first: 'العنود', father: 'مشعل', family: 'الهذلي', gender: 'female', phone: '0594567890', nid: '1022234567', blood: 'O-', occ: 'مديرة مشاريع', ins: null, pol: null },
  { first: 'تركي', father: 'غانم', family: 'البلوي', gender: 'male', phone: '0505678901', nid: '1032234567', blood: 'B-', occ: 'مهندس اتصالات', ins: 'ins-001', pol: 'BUPA-77290' },
  { first: 'منال', father: 'زياد', family: 'اليامي', gender: 'female', phone: '0556789012', nid: '1042234567', blood: 'A+', occ: 'أخصائية موارد بشرية', ins: 'ins-002', pol: 'TAW-77112' },
  { first: 'نايف', father: 'رياض', family: 'الحازمي', gender: 'male', phone: '0547890123', nid: '1052234567', blood: 'O+', occ: 'مطور عقاري', ins: null, pol: null },
  { first: 'شهد', father: 'حسام', family: 'العاصمي', gender: 'female', phone: '0568901234', nid: '1062234567', blood: 'AB+', occ: 'صحفية', ins: 'ins-003', pol: 'MED-99441' },
  { first: 'مشاري', father: 'فيصل', family: 'الرشيدي', gender: 'male', phone: '0539012345', nid: '1072234567', blood: 'B+', occ: 'رئيس قسم مبيعات', ins: 'ins-001', pol: 'BUPA-66110' },
  { first: 'أمل', father: 'عصام', family: 'المحمود', gender: 'female', phone: '0510123456', nid: '1082234567', blood: 'A-', occ: 'باحثة اجتماعية', ins: 'ins-002', pol: 'TAW-33990' },
  { first: 'طلال', father: 'أنور', family: 'السعدون', gender: 'male', phone: '0581234567', nid: '1092234567', blood: 'O+', occ: 'مصرفي', ins: null, pol: null },
  { first: 'لمى', father: 'بشير', family: 'الفيصل', gender: 'female', phone: '0592345678', nid: '1003234567', blood: 'B+', occ: 'مهندسة معمارية', ins: 'ins-001', pol: 'BUPA-22001' },
  { first: 'أحمد', father: 'جمال', family: 'المنيع', gender: 'male', phone: '0503456789', nid: '1013234567', blood: 'O-', occ: 'مدير تنفيذي', ins: 'ins-003', pol: 'MED-12903' },
  { first: 'غادة', father: 'رائد', family: 'الناصر', gender: 'female', phone: '0554567890', nid: '1023234567', blood: 'A+', occ: 'طبيبة أطفال', ins: 'ins-002', pol: 'TAW-55110' },
  { first: 'سامي', father: 'مروان', family: 'المهنا', gender: 'male', phone: '0545678901', nid: '1033234567', blood: 'AB-', occ: 'كابتن طيران', ins: null, pol: null },
  { first: 'نادية', father: 'هيثم', family: 'البابطين', gender: 'female', phone: '0566789012', nid: '1043234567', blood: 'O+', occ: 'مدرسة لغة عربية', ins: 'ins-001', pol: 'BUPA-33012' },
  { first: 'زياد', father: 'مؤيد', family: 'الراشد', gender: 'male', phone: '0537890123', nid: '1053234567', blood: 'B-', occ: 'مدير سلسلة إمداد', ins: 'ins-002', pol: 'TAW-99120' },
  { first: 'عبير', father: 'وجدي', family: 'الحصين', gender: 'female', phone: '0518901234', nid: '1063234567', blood: 'A+', occ: 'محللة مخاطر', ins: 'ins-003', pol: 'MED-66014' },
  { first: 'هيثم', father: 'سامر', family: 'الضحيان', gender: 'male', phone: '0589012345', nid: '1073234567', blood: 'O+', occ: 'مهندس مدني', ins: null, pol: null },
  { first: 'روان', father: 'نزار', family: 'الكثيري', gender: 'female', phone: '0590123456', nid: '1083234567', blood: 'B+', occ: 'مستشارة تقنية', ins: 'ins-001', pol: 'BUPA-77883' },
];

export const seedPatients: Patient[] = arabicPatientsMeta.map((p, idx) => {
  const dentistId = idx % 2 === 0 ? seedUsers[0].id : seedUsers[1].id;
  const codeNum = 1001 + idx;
  return {
    id: `pat-${String(idx + 1).padStart(3, '0')}`,
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - (40 - idx) * 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - (40 - idx) * 86400000).toISOString(),
    deleted_at: null,
    code: `P${codeNum}`,
    first_name: p.first,
    father_name: p.father,
    family_name: p.family,
    gender: p.gender as 'male' | 'female',
    birth_date: `19${75 + (idx % 25)}-0${(idx % 9) + 1}-15`,
    national_id: p.nid,
    phone: p.phone,
    phone_alt: `011${4000000 + idx}`,
    email: `${p.first.toLowerCase()}.${p.family.toLowerCase()}@example.com`,
    address: `شارع العليا، حي الملك فهد، مبنى ${12 + idx}`,
    city: 'الرياض',
    blood_type: p.blood as Patient['blood_type'],
    marital_status: idx % 3 === 0 ? 'married' : 'single',
    occupation: p.occ,
    emergency_contact_name: `${p.father} ${p.family}`,
    emergency_contact_phone: `05099988${(idx % 90) + 10}`,
    referral_source: idx % 2 === 0 ? 'توصية صديق' : 'إنستغرام وإعلانات قوقل',
    primary_dentist_id: dentistId,
    insurance_company_id: p.ins,
    insurance_policy_no: p.pol,
    insurance_expiry: p.ins ? '2027-12-31' : null,
    notes: idx % 4 === 0 ? 'المريض يفضل المواعيد المسائية بعد الساعة 5' : null,
    photo_path: null,
    is_active: true,
  };
});

// Seed medical histories and allergies for patients
export const seedMedicalHistories: MedicalHistory[] = [
  { id: 'mh-001', clinic_id: CLINIC_ID, created_at: '2024-01-01T08:00:00.000Z', updated_at: '2024-01-01T08:00:00.000Z', deleted_at: null, patient_id: seedPatients[0].id, condition_key: 'diabetes', has_condition: true, details: 'سكري النوع الثاني، منتظم مع ميتفورمين 500mg' },
  { id: 'mh-002', clinic_id: CLINIC_ID, created_at: '2024-01-01T08:00:00.000Z', updated_at: '2024-01-01T08:00:00.000Z', deleted_at: null, patient_id: seedPatients[0].id, condition_key: 'hypertension', has_condition: true, details: 'ضغط دم خفيف متحكم به' },
  { id: 'mh-003', clinic_id: CLINIC_ID, created_at: '2024-01-01T08:00:00.000Z', updated_at: '2024-01-01T08:00:00.000Z', deleted_at: null, patient_id: seedPatients[3].id, condition_key: 'asthma', has_condition: true, details: 'ربو قصبي تحسسي، يحمل بخاخ فينتولين' },
  { id: 'mh-004', clinic_id: CLINIC_ID, created_at: '2024-01-01T08:00:00.000Z', updated_at: '2024-01-01T08:00:00.000Z', deleted_at: null, patient_id: seedPatients[5].id, condition_key: 'bleeding_disorder', has_condition: false, details: null },
  { id: 'mh-005', clinic_id: CLINIC_ID, created_at: '2024-01-01T08:00:00.000Z', updated_at: '2024-01-01T08:00:00.000Z', deleted_at: null, patient_id: seedPatients[7].id, condition_key: 'cardiac', has_condition: true, details: 'تضيق بسيط في الصمام التاجي' },
];

export const seedAllergies: Allergy[] = [
  { id: 'al-001', clinic_id: CLINIC_ID, created_at: '2024-01-01T08:00:00.000Z', updated_at: '2024-01-01T08:00:00.000Z', deleted_at: null, patient_id: seedPatients[0].id, allergen: 'بنسلين Penicillin', severity: 'severe', notes: 'طفح جلدي وتورم شديد، يمنع استخدام مشتقات الأموكسيسيلين' },
  { id: 'al-002', clinic_id: CLINIC_ID, created_at: '2024-01-01T08:00:00.000Z', updated_at: '2024-01-01T08:00:00.000Z', deleted_at: null, patient_id: seedPatients[3].id, allergen: 'أسبرين ومسكنات NSAIDs', severity: 'moderate', notes: 'يستبدل بالباراسيتامول' },
  { id: 'al-003', clinic_id: CLINIC_ID, created_at: '2024-01-01T08:00:00.000Z', updated_at: '2024-01-01T08:00:00.000Z', deleted_at: null, patient_id: seedPatients[8].id, allergen: 'مطاط اللاتكس Latex', severity: 'mild', notes: 'استخدام قفازات نيتريل خالية من اللاتكس' },
];

// Generate 120 Appointments spread across 2 weeks around now
const appointmentStatuses: Appointment['status'][] = ['completed', 'completed', 'completed', 'in_progress', 'waiting', 'confirmed', 'scheduled', 'cancelled', 'no_show'];

export const seedAppointments: Appointment[] = Array.from({ length: 120 }).map((_, idx) => {
  const patient = seedPatients[idx % seedPatients.length];
  const dentist = idx % 2 === 0 ? seedUsers[0] : seedUsers[1];
  const room = idx % 2 === 0 ? seedRooms[0] : seedRooms[1];
  const proc = seedProcedures[idx % seedProcedures.length];

  // Distribute across -7 to +7 days
  const dayOffset = Math.floor(idx / 8) - 7;
  const hour = 9 + (idx % 8); // 9am to 5pm
  const dateObj = new Date(Date.now() + dayOffset * 86400000);
  dateObj.setHours(hour, 0, 0, 0);

  const startAt = dateObj.toISOString();
  const endAt = new Date(dateObj.getTime() + 30 * 60000).toISOString();

  let status: Appointment['status'] = appointmentStatuses[idx % appointmentStatuses.length];
  if (dayOffset < 0) {
    status = idx % 10 === 0 ? 'cancelled' : 'completed';
  } else if (dayOffset === 0) {
    status = hour < 11 ? 'completed' : hour === 11 ? 'in_progress' : hour === 12 ? 'waiting' : 'confirmed';
  } else {
    status = idx % 3 === 0 ? 'confirmed' : 'scheduled';
  }

  return {
    id: `apt-${String(idx + 1).padStart(3, '0')}`,
    clinic_id: CLINIC_ID,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    deleted_at: null,
    patient_id: patient.id,
    dentist_id: dentist.id,
    branch_id: BRANCH_ID,
    room_id: room.id,
    start_at: startAt,
    end_at: endAt,
    procedure_ids: [proc.id],
    status,
    source: idx % 3 === 0 ? 'whatsapp' : 'phone',
    color_override: null,
    notes: idx % 5 === 0 ? 'جلسة متابعة بعد العلاج السابق' : null,
    reminder_sent_at: dayOffset >= 0 ? new Date(Date.now() - 3600000).toISOString() : null,
    created_by: seedUsers[2].id, // Sara receptionist
  };
});

// Generate 80 Invoices
export const seedInvoices: Invoice[] = [];
export const seedInvoiceItems: InvoiceItem[] = [];
export const seedPayments: Payment[] = [];

for (let i = 0; i < 80; i++) {
  const patient = seedPatients[i % seedPatients.length];
  const proc1 = seedProcedures[i % seedProcedures.length];
  const proc2 = seedProcedures[(i + 5) % seedProcedures.length];

  const subtotal = proc1.default_price_halalas + (i % 3 === 0 ? proc2.default_price_halalas : 0);
  const discount = i % 5 === 0 ? 5000 : 0;
  const taxable = subtotal - discount;
  const vat = Math.round(taxable * 0.15);
  const total = taxable + vat;

  let status: Invoice['status'] = 'paid';
  let paid = total;
  let balance = 0;

  if (i % 4 === 1) {
    status = 'partial';
    paid = Math.round(total / 2);
    balance = total - paid;
  } else if (i % 4 === 2) {
    status = 'unpaid';
    paid = 0;
    balance = total;
  }

  const invoiceId = `inv-${String(i + 1).padStart(3, '0')}`;
  const invNumber = `INV-2026-${String(1001 + i).padStart(5, '0')}`;
  const issueDate = new Date(Date.now() - (80 - i) * 86400000 * 0.4).toISOString().split('T')[0];

  const inv: Invoice = {
    id: invoiceId,
    clinic_id: CLINIC_ID,
    created_at: `${issueDate}T10:00:00.000Z`,
    updated_at: `${issueDate}T10:00:00.000Z`,
    deleted_at: null,
    number: invNumber,
    patient_id: patient.id,
    branch_id: BRANCH_ID,
    issue_date: issueDate,
    due_date: new Date(new Date(issueDate).getTime() + 14 * 86400000).toISOString().split('T')[0],
    subtotal_halalas: subtotal,
    discount_halalas: discount,
    vat_percent: 15,
    vat_halalas: vat,
    total_halalas: total,
    paid_halalas: paid,
    balance_halalas: balance,
    status,
    insurance_claim_id: null,
    zatca_qr: 'AR4400918239019238ZATCA_SIMULATED_DATA_HASH',
    notes: 'فاتورة ضريبية مبسطة',
  };
  seedInvoices.push(inv);

  // Item 1
  seedInvoiceItems.push({
    id: `item-${String(seedInvoiceItems.length + 1).padStart(4, '0')}`,
    clinic_id: CLINIC_ID,
    created_at: inv.created_at,
    updated_at: inv.updated_at,
    deleted_at: null,
    invoice_id: invoiceId,
    treatment_id: null,
    description: proc1.name_ar,
    tooth_number: proc1.requires_tooth ? 16 : null,
    quantity: 1,
    unit_price_halalas: proc1.default_price_halalas,
    discount_halalas: discount,
    total_halalas: proc1.default_price_halalas - discount,
  });

  // Optional Item 2
  if (i % 3 === 0) {
    seedInvoiceItems.push({
      id: `item-${String(seedInvoiceItems.length + 1).padStart(4, '0')}`,
      clinic_id: CLINIC_ID,
      created_at: inv.created_at,
      updated_at: inv.updated_at,
      deleted_at: null,
      invoice_id: invoiceId,
      treatment_id: null,
      description: proc2.name_ar,
      tooth_number: proc2.requires_tooth ? 26 : null,
      quantity: 1,
      unit_price_halalas: proc2.default_price_halalas,
      discount_halalas: 0,
      total_halalas: proc2.default_price_halalas,
    });
  }

  // Payment if paid > 0
  if (paid > 0) {
    seedPayments.push({
      id: `pay-${String(seedPayments.length + 1).padStart(3, '0')}`,
      clinic_id: CLINIC_ID,
      created_at: inv.created_at,
      updated_at: inv.updated_at,
      deleted_at: null,
      invoice_id: invoiceId,
      patient_id: patient.id,
      amount_halalas: paid,
      method: i % 3 === 0 ? 'mada' : i % 3 === 1 ? 'card' : 'cash',
      reference: `POS-AUTH-${900000 + i}`,
      paid_at: inv.created_at,
      received_by: seedUsers[3].id, // Khaled accountant
      notes: 'تم استلام الدفعة عبر شبكة مدى',
    });
  }
}

// Tooth records for 10 patients
const teethConditions: ToothRecord['condition'][] = ['caries', 'filled', 'crown', 'missing', 'implant', 'root_canal'];

export const seedToothRecords: ToothRecord[] = [];
for (let pIdx = 0; pIdx < 10; pIdx++) {
  const patient = seedPatients[pIdx];
  const sampleTeeth = [11, 16, 21, 26, 36, 46];

  sampleTeeth.forEach((toothNum, tIdx) => {
    seedToothRecords.push({
      id: `tr-${pIdx}-${toothNum}`,
      clinic_id: CLINIC_ID,
      created_at: '2024-01-15T10:00:00.000Z',
      updated_at: '2024-01-15T10:00:00.000Z',
      deleted_at: null,
      patient_id: patient.id,
      tooth_number: toothNum,
      surface: 'O',
      condition: teethConditions[(pIdx + tIdx) % teethConditions.length],
      status: 'existing',
      treatment_id: null,
      note: `سجل تشخيصي للسن ${toothNum}`,
      recorded_at: '2024-01-15T10:00:00.000Z',
      recorded_by: seedUsers[0].id,
    });
  });
}

// Seed Inventory Items
export const seedInventoryItems: InventoryItem[] = [
  {
    id: 'inv-item-001',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'حشوة كمبوزيت 3M Filtek Z350 XT A2',
    sku: 'COMP-3M-A2',
    category: 'مواد حشو وترميم',
    unit: 'حقنة 4g',
    quantity: 18,
    min_quantity: 5,
    cost_halalas: 18500,
    supplier_id: 'sup-001',
    expiry_date: '2027-08-30',
    location: 'درج العيادة 1 - الرف العلوي',
  },
  {
    id: 'inv-item-002',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'بنج موضعي ليدوكائين 2% مع أدرينالين Septodont',
    sku: 'ANES-LIDO-2P',
    category: 'تخدير وأدوية',
    unit: 'علبة 50 كاربول',
    quantity: 4,
    min_quantity: 8, // Low stock #1
    cost_halalas: 14000,
    supplier_id: 'sup-003',
    expiry_date: '2026-10-30', // Expiring in 35 days #1
    location: 'غرفة الأدوية - الثلاجة الطبية',
  },
  {
    id: 'inv-item-003',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'قفازات فحص طبية نيتريل خالية من البودرة (حجم M)',
    sku: 'GLOVES-NIT-M',
    category: 'وقاية ومستهلكات عامة',
    unit: 'علبة 100 قفاز',
    quantity: 35,
    min_quantity: 10,
    cost_halalas: 2500,
    supplier_id: 'sup-002',
    expiry_date: '2028-01-01',
    location: 'المستودع الرئيسي - رف A3',
  },
  {
    id: 'inv-item-004',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'مبراد إندو روتاري Dentsply WaveOne Gold',
    sku: 'ENDO-WAVE-GOLD',
    category: 'معالجة لبية وجذور',
    unit: 'باكيت 3 مبارد',
    quantity: 3,
    min_quantity: 6, // Low stock #2
    cost_halalas: 19000,
    supplier_id: 'sup-001',
    expiry_date: '2029-01-01',
    location: 'عيادة 2 - خزانة علاج الجذور',
  },
  {
    id: 'inv-item-005',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'إبر بنج أسنان مقاس قصير 30G C-K Ject',
    sku: 'NEEDLE-30G-SHORT',
    category: 'تخدير وأدوية',
    unit: 'علبة 100 إبرة',
    quantity: 2,
    min_quantity: 5, // Low stock #3
    cost_halalas: 4500,
    supplier_id: 'sup-003',
    expiry_date: '2027-12-15',
    location: 'غرفة الأدوية - رف الإبر',
  },
  {
    id: 'inv-item-006',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'محلول تعقيم وتطهير سطوح كافيسيد CaviCide 1L',
    sku: 'STER-CAVICIDE-1L',
    category: 'تعقيم ومكافحة عدوى',
    unit: 'قارورة 1 لتر',
    quantity: 14,
    min_quantity: 5,
    cost_halalas: 7800,
    supplier_id: 'sup-002',
    expiry_date: '2026-11-15', // Expiring in 51 days #2
    location: 'غرفة التعقيم - الرف السفلي',
  },
  {
    id: 'inv-item-007',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'مادة أخذ طبعة الجينات سريعة التصلب Cavex Alginate',
    sku: 'IMPR-CAVEX-500G',
    category: 'مستهلكات طباعة ومقاسات',
    unit: 'كيس 500 جرام',
    quantity: 20,
    min_quantity: 6,
    cost_halalas: 3800,
    supplier_id: 'sup-001',
    expiry_date: '2027-04-10',
    location: 'مستودع المواد - رف المقاسات C',
  },
  {
    id: 'inv-item-008',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'خيوط جراحية حريرية مع إبرة قاطعة Silk 3-0 DemeTECH',
    sku: 'SURG-SILK-30',
    category: 'جراحة وزراعة أسنان',
    unit: 'علبة 12 خيط',
    quantity: 12,
    min_quantity: 4,
    cost_halalas: 9500,
    supplier_id: 'sup-001',
    expiry_date: '2028-06-30',
    location: 'عيادة الجراحة - خزانة B',
  },
  {
    id: 'inv-item-009',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'حمض تخريش ومادة رابطة 3M Single Bond Universal',
    sku: 'BOND-3M-UNIV',
    category: 'مواد حشو وترميم',
    unit: 'قارورة 5ml',
    quantity: 9,
    min_quantity: 3,
    cost_halalas: 24000,
    supplier_id: 'sup-001',
    expiry_date: '2027-09-20',
    location: 'درج العيادة 1 - الرف الأوسط',
  },
  {
    id: 'inv-item-010',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'أقماع جوتا بيرشا قياس 25 لحشو الجذور DiaDent',
    sku: 'ENDO-GP-25',
    category: 'معالجة لبية وجذور',
    unit: 'علبة 120 قمع',
    quantity: 11,
    min_quantity: 4,
    cost_halalas: 3200,
    supplier_id: 'sup-001',
    expiry_date: '2029-03-01',
    location: 'عيادة 2 - خزانة علاج الجذور',
  },
];

export const seedSuppliers: Supplier[] = [
  {
    id: 'sup-001',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'مؤسسة التجهيزات السنية المتقدمة',
    phone: '0551122334',
    email: 'sales@advanceddental-sa.com',
    notes: 'المورد المعتمد لمواد 3M ودنتسبلاي وأدوات الجذور والجراحة السنية. دفع آجل 30 يوماً.',
  },
  {
    id: 'sup-002',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'شركة النخبة للمستلزمات الطبية والتعقيم',
    phone: '0509988776',
    email: 'info@elitemedical.com.sa',
    notes: 'مورد مواد الوقاية ومكافحة العدوى، القفازات، ومحاليل كافيسيد وأكياس التعقيم.',
  },
  {
    id: 'sup-003',
    clinic_id: CLINIC_ID,
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2024-01-01T08:00:00.000Z',
    deleted_at: null,
    name: 'مستودع الأدوية والمخدر الطبي السعودي',
    phone: '0543322110',
    email: 'orders@saudidental-pharma.com',
    notes: 'مورد معتمد للبنج الموضعي والإبر الدقيقة والمضادات الحيوية الخاصة بجراحة الفم.',
  },
];

