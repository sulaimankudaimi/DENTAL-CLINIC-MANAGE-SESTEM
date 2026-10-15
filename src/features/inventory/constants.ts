export const INVENTORY_CATEGORIES = [
  'تخدير وأدوية',
  'مواد حشو وترميم',
  'معالجة لبية وجذور',
  'جراحة وزراعة أسنان',
  'مستهلكات طباعة ومقاسات',
  'تعقيم ومكافحة عدوى',
  'وقاية ومستهلكات عامة',
  'أدوات ومستهلكات تقويم',
] as const;

export type InventoryCategoryType = (typeof INVENTORY_CATEGORIES)[number];

export const INVENTORY_UNITS = [
  'علبة',
  'حقنة',
  'قارورة',
  'باكت',
  'طقم',
  'قطعة',
  'لفة',
  'أمبولة',
  'كيس',
  'كرتونة',
] as const;

export const PROCEDURE_MATERIAL_PRESETS = [
  {
    procedureCode: 'REST-001',
    procedureName: 'حشوة كمبوزيت تجميلية (Composite Restoration)',
    category: 'مواد حشو وترميم',
    defaultMaterials: [
      { itemName: 'حشوة كمبوزيت 3M Filtek Z350 XT A2', quantity: 1, unit: 'حقنة 4g', matchSku: 'COMP-3M-A2' },
      { itemName: 'حمض تخريش ومادة رابطة 3M Single Bond Universal', quantity: 1, unit: 'قارورة 5ml', matchSku: 'BOND-3M-UNIV' },
      { itemName: 'قفازات فحص طبية نيتريل خالية من البودرة (حجم M)', quantity: 1, unit: 'علبة 100 قفاز', matchSku: 'GLOVES-NIT-M' },
    ],
  },
  {
    procedureCode: 'ENDO-001',
    procedureName: 'معالجة لبية لأقنية الجذور (Root Canal Treatment)',
    category: 'معالجة لبية وجذور',
    defaultMaterials: [
      { itemName: 'بنج موضعي ليدوكائين 2% مع أدرينالين Septodont', quantity: 1, unit: 'علبة 50 كاربول', matchSku: 'ANES-LIDO-2P' },
      { itemName: 'إبر بنج أسنان مقاس قصير 30G C-K Ject', quantity: 1, unit: 'علبة 100 إبرة', matchSku: 'NEEDLE-30G-SHORT' },
      { itemName: 'مبراد إندو روتاري Dentsply WaveOne Gold', quantity: 1, unit: 'باكيت 3 مبارد', matchSku: 'ENDO-WAVE-GOLD' },
      { itemName: 'أقماع جوتا بيرشا قياس 25 لحشو الجذور DiaDent', quantity: 1, unit: 'علبة 120 قمع', matchSku: 'ENDO-GP-25' },
    ],
  },
  {
    procedureCode: 'SURG-001',
    procedureName: 'خلع جراحي لضرس العقل (Surgical Extraction)',
    category: 'جراحة وزراعة أسنان',
    defaultMaterials: [
      { itemName: 'بنج موضعي ليدوكائين 2% مع أدرينالين Septodont', quantity: 2, unit: 'علبة 50 كاربول', matchSku: 'ANES-LIDO-2P' },
      { itemName: 'إبر بنج أسنان مقاس قصير 30G C-K Ject', quantity: 2, unit: 'علبة 100 إبرة', matchSku: 'NEEDLE-30G-SHORT' },
      { itemName: 'خيوط جراحية حريرية مع إبرة قاطعة Silk 3-0 DemeTECH', quantity: 1, unit: 'علبة 12 خيط', matchSku: 'SURG-SILK-30' },
    ],
  },
  {
    procedureCode: 'PREV-001',
    procedureName: 'تنظيف وتقليح وتلميع أسنان (Scaling & Polishing)',
    category: 'وقاية ومستهلكات عامة',
    defaultMaterials: [
      { itemName: 'محلول تعقيم وتطهير سطوح كافيسيد CaviCide 1L', quantity: 1, unit: 'قارورة 1 لتر', matchSku: 'STER-CAVICIDE-1L' },
      { itemName: 'قفازات فحص طبية نيتريل خالية من البودرة (حجم M)', quantity: 1, unit: 'علبة 100 قفاز', matchSku: 'GLOVES-NIT-M' },
    ],
  },
];
