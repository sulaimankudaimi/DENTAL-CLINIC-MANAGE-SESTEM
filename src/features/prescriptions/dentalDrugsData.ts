import type { Allergy, MedicalHistory } from '@shared/contracts';

export interface DentalDrug {
  id: string;
  nameAr: string;
  nameEn: string;
  genericName: string;
  category: 'antibiotic' | 'analgesic' | 'nsaid' | 'antiseptic' | 'antifungal' | 'corticosteroid' | 'hemostatic';
  categoryAr: string;
  tradeNames: string[];
  defaultDose: string;
  defaultFrequency: string;
  defaultDurationDays: number;
  defaultInstructions: string;
  drugFamily: 'penicillin' | 'nsaid' | 'macrolide' | 'lincosamide' | 'nitroimidazole' | 'antiseptic' | 'antifungal' | 'analgesic' | 'corticosteroid' | 'hemostatic';
  allergens: string[];
  allergyWarningAr: string;
  contraindications: string[];
}

export const DENTAL_DRUGS_DATABASE: DentalDrug[] = [
  {
    id: 'drug-amoxicillin-500',
    nameAr: 'أموكسيسيلين 500 ملغ',
    nameEn: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin',
    category: 'antibiotic',
    categoryAr: 'مضاد حيوي (بنسلين)',
    tradeNames: ['أموكسيل Amoxil', 'جولفاموكس Julphamox', 'هايكونسييل Hiconcil'],
    defaultDose: '500 ملغ (كبسولة واحدة)',
    defaultFrequency: 'كل 8 ساعات (3 مرات يومياً)',
    defaultDurationDays: 7,
    defaultInstructions: 'يؤخذ بعد الأكل مع كوب ماء وفير. استكمل الكورس العلاجي كاملاً حتى مع زوال الألم.',
    drugFamily: 'penicillin',
    allergens: ['penicillin', 'بنسلين', 'amoxicillin', 'أموكسيسيلين', 'amoxil', 'beta-lactam', 'بيتالاكتام'],
    allergyWarningAr: 'تحذير حرج: ينتمي هذا الدواء لعائلة البنسلينات! المريض مسجل لديه حساسية من البنسلين قد تؤدي لصدمة حساسية مفرطة مهددة للحياة (Anaphylaxis).',
    contraindications: ['حساسية البنسلين ومضادات البيتا لاكتام', 'داء وحيدات النواة الإنتاني'],
  },
  {
    id: 'drug-augmentin-1g',
    nameAr: 'أوجمنتين 1 غرام (أموكسيسيلين + كلافولانات)',
    nameEn: 'Augmentin 1g (Amoxicillin / Clavulanate)',
    genericName: 'Amoxicillin + Clavulanic Acid',
    category: 'antibiotic',
    categoryAr: 'مضاد حيوي واسع الطيف (بنسلين معزز)',
    tradeNames: ['أوجمنتين Augmentin', 'كلافوكس Klavox', 'ميجاموكس Megamox', 'كلاموكسيل Clamoxyl'],
    defaultDose: '1 غرام (قرص واحد 1000 ملغ)',
    defaultFrequency: 'كل 12 ساعة (مرتين يومياً)',
    defaultDurationDays: 7,
    defaultInstructions: 'يؤخذ في بداية الوجبة لتفادي اضطرابات المعدة وتحسين الامتصاص. لا تقطع العلاج مبكراً.',
    drugFamily: 'penicillin',
    allergens: ['penicillin', 'بنسلين', 'augmentin', 'أوجمنتين', 'amoxicillin', 'أموكسيسيلين', 'klavox', 'كلافوكس', 'beta-lactam'],
    allergyWarningAr: 'تحذير حرج: أوجمنتين يحتوي على أموكسيسيلين (بنسلين)! المريض لديه حساسية مسجلة من البنسلين وممنوع استخدامه قطعياً.',
    contraindications: ['حساسية البنسلين', 'قصور كبدي سابق مرتبط بالكلافولانات'],
  },
  {
    id: 'drug-augmentin-625',
    nameAr: 'أوجمنتين 625 ملغ',
    nameEn: 'Augmentin 625mg',
    genericName: 'Amoxicillin + Clavulanic Acid',
    category: 'antibiotic',
    categoryAr: 'مضاد حيوي واسع الطيف',
    tradeNames: ['أوجمنتين 625', 'كلافوكس 625', 'ميجاموكس 625'],
    defaultDose: '625 ملغ (قرص واحد)',
    defaultFrequency: 'كل 8 ساعات (3 مرات يومياً)',
    defaultDurationDays: 5,
    defaultInstructions: 'يؤخذ مع بداية الطعام. لا يجوز إيقاف العلاج قبل إتمام المدة.',
    drugFamily: 'penicillin',
    allergens: ['penicillin', 'بنسلين', 'augmentin', 'أوجمنتين', 'amoxicillin', 'أموكسيسيلين'],
    allergyWarningAr: 'تحذير حرج: يحتوي على مشتقات البنسلين ويتعارض كلياً مع حساسية البنسلين لدى المريض.',
    contraindications: ['حساسية البنسلين'],
  },
  {
    id: 'drug-metronidazole-500',
    nameAr: 'ميترونيدازول 500 ملغ (فلاجيل)',
    nameEn: 'Metronidazole 500mg (Flagyl)',
    genericName: 'Metronidazole',
    category: 'antibiotic',
    categoryAr: 'مضاد حيوي للجراثيم اللاهوائية',
    tradeNames: ['فلاجيل Flagyl', 'أنازول Anazole', 'دوموزول Dumazole'],
    defaultDose: '500 ملغ (قرص واحد)',
    defaultFrequency: 'كل 8 ساعات (3 مرات يومياً)',
    defaultDurationDays: 5,
    defaultInstructions: 'يؤخذ مع الطعام أو بعده مباشرة مع كوب ماء كامل. يمنع تناول أي مشروبات كحولية أو أدوية تحوي إيثانول طوال فترة العلاج.',
    drugFamily: 'nitroimidazole',
    allergens: ['metronidazole', 'ميترونيدازول', 'flagyl', 'فلاجيل', 'nitroimidazole'],
    allergyWarningAr: 'تحذير طبي: المريض يعاني من حساسية تجاه الميترونيدازول / فلاجيل.',
    contraindications: ['الأشهر الثلاثة الأولى من الحمل', 'أمراض عصبية نشطة', 'تناول الكحول'],
  },
  {
    id: 'drug-clindamycin-300',
    nameAr: 'كليندامايسين 300 ملغ (دالاسين سي)',
    nameEn: 'Clindamycin 300mg (Dalacin C)',
    genericName: 'Clindamycin',
    category: 'antibiotic',
    categoryAr: 'مضاد حيوي للخراجات والبديل الأول للبنسلين',
    tradeNames: ['دالاسين Dalacin C', 'كلينداسين Clindacin', 'كليندام Clindam'],
    defaultDose: '300 ملغ (كبسولة واحدة)',
    defaultFrequency: 'كل 6 إلى 8 ساعات (3-4 مرات يومياً)',
    defaultDurationDays: 5,
    defaultInstructions: 'الخيار الأفضل لمرضى حساسية البنسلين. تؤخذ الكبسولة مع كوب كامل من الماء ويبقى المريض جالساً 15 دقيقة لمنع تهيج المريء.',
    drugFamily: 'lincosamide',
    allergens: ['clindamycin', 'كليندامايسين', 'dalacin', 'دالاسين', 'lincosamide'],
    allergyWarningAr: 'تحذير طبي: المريض يعاني من حساسية مسجلة تجاه الكليندامايسين (دالاسين).',
    contraindications: ['تاريخ التهاب القولون التقرحي المرتبط بالمضادات الحيوية (C. difficile)'],
  },
  {
    id: 'drug-ibuprofen-400',
    nameAr: 'آيبوبروفين 400 ملغ (بروفين)',
    nameEn: 'Ibuprofen 400mg (Brufen)',
    genericName: 'Ibuprofen',
    category: 'nsaid',
    categoryAr: 'مسكن ومضاد للالتهاب والتورم (NSAID)',
    tradeNames: ['بروفين Brufen', 'أدفيل Advil', 'بروفينال Profinal', 'سابوفين Sapofen'],
    defaultDose: '400 ملغ (قرص واحد)',
    defaultFrequency: 'عند اللزوم كل 8 ساعات (بحد أقصى 3 مرات يومياً)',
    defaultDurationDays: 3,
    defaultInstructions: 'يؤخذ بعد الأكل مباشرة لحماية المعدة. تجنب استخدامه إذا كان لديك قرحة معدية نشطة أو ربو تحسسي.',
    drugFamily: 'nsaid',
    allergens: ['nsaid', 'مضادات الالتهاب غير الستيرويدية', 'ibuprofen', 'ايبوبروفين', 'آيبوبروفين', 'brufen', 'بروفين', 'aspirin', 'أسبرين'],
    allergyWarningAr: 'تحذير حرج: المريض يعاني من حساسية تجاه مضادات الالتهاب غير الستيرويدية (NSAIDs) أو الأسبرين! قد يسبب أزمة ربو حادة أو صدمة تحسسية.',
    contraindications: ['قرحة المعدة الهضمية النشطة', 'قصور كلوي حاد', 'الربو المحفز بالأسبرين', 'الثلث الأخير من الحمل'],
  },
  {
    id: 'drug-ibuprofen-600',
    nameAr: 'آيبوبروفين 600 ملغ (بروفين فورت)',
    nameEn: 'Ibuprofen 600mg (Brufen Forte)',
    genericName: 'Ibuprofen',
    category: 'nsaid',
    categoryAr: 'مسكن قوي ومضاد للالتهاب',
    tradeNames: ['بروفين 600 Brufen', 'سابوفين 600 Sapofen'],
    defaultDose: '600 ملغ (قرص واحد)',
    defaultFrequency: 'كل 8 ساعات بعد الوجبات',
    defaultDurationDays: 3,
    defaultInstructions: 'يؤخذ بعد وجبة دسمة. مسكن فعال للألم الشديد بعد الجراحة وخلع أضراس العقل.',
    drugFamily: 'nsaid',
    allergens: ['nsaid', 'ibuprofen', 'ايبوبروفين', 'آيبوبروفين', 'brufen', 'aspirin', 'أسبرين'],
    allergyWarningAr: 'تحذير حرج: يتعارض مع حساسية المسكنات ومضادات الالتهاب غير الستيرويدية المسجلة للمريض.',
    contraindications: ['نزف هضمي', 'قصور كلوي', 'ربو الأسبرين'],
  },
  {
    id: 'drug-paracetamol-500',
    nameAr: 'باراسيتامول 500 ملغ (بنادول)',
    nameEn: 'Paracetamol 500mg (Panadol)',
    genericName: 'Paracetamol / Acetaminophen',
    category: 'analgesic',
    categoryAr: 'مسكن ألم وخافض حرارة آمن',
    tradeNames: ['بنادول Panadol', 'فيفادول Fevadol', 'أدول Adol', 'ريفانين Revanin'],
    defaultDose: '1000 ملغ (قرصان 500 ملغ)',
    defaultFrequency: 'كل 6 إلى 8 ساعات عند اللزوم',
    defaultDurationDays: 4,
    defaultInstructions: 'آمن للمعدة والنساء الحوامل ومرضى الربو وقرحة المعدة. لا تتجاوز 4000 ملغ (8 أقراص) في الـ 24 ساعة لتفادي سمية الكبد.',
    drugFamily: 'analgesic',
    allergens: ['paracetamol', 'باراسيتامول', 'acetaminophen', 'اسيتامينوفين', 'panadol', 'بنادول'],
    allergyWarningAr: 'تحذير طبي: المريض يعاني من حساسية مسجلة تجاه الباراسيتامول.',
    contraindications: ['قصور كبدي حاد أو التهاب كبدي متقدم'],
  },
  {
    id: 'drug-chlorhexidine-mouthwash',
    nameAr: 'كلورهيكسيدين غسول فم 0.12%',
    nameEn: 'Chlorhexidine 0.12% Oral Rinse',
    genericName: 'Chlorhexidine Gluconate',
    category: 'antiseptic',
    categoryAr: 'غسول فموي مطهر ومضاد للبكتيريا',
    tradeNames: ['أوروفكس Orovex', 'كورسوديل Corsodyl', 'بيرودكس Peridex', 'كين Kin'],
    defaultDose: '15 مل (غطاء العبوة)',
    defaultFrequency: 'مرتين يومياً (صباحاً ومساءً)',
    defaultDurationDays: 10,
    defaultInstructions: 'مضمضة لمدة دقيقة كاملة ثم يبصق ولا يبتلع. يفضل بعد تفريش الأسنان بـ 30 دقيقة، مع الامتناع عن الأكل والشرب لمدة نصف ساعة.',
    drugFamily: 'antiseptic',
    allergens: ['chlorhexidine', 'كلورهيكسيدين', 'orovex', 'corsodyl'],
    allergyWarningAr: 'تحذير طبي: المريض يعاني من حساسية تجاه مادة الكلورهيكسيدين.',
    contraindications: ['فرط الحساسية للكلورهيكسيدين'],
  },
  {
    id: 'drug-diclofenac-potassium-50',
    nameAr: 'ديكلوفيناك البوتاسيوم 50 ملغ (كاتافلام)',
    nameEn: 'Diclofenac Potassium 50mg (Cataflam)',
    genericName: 'Diclofenac Potassium',
    category: 'nsaid',
    categoryAr: 'مسكن سريع المفعول لآلام الأسنان الحادة',
    tradeNames: ['كاتافلام Cataflam', 'كتافاست فوار Catafast', 'أوفلام Oflam', 'فولتارين ك Rapid'],
    defaultDose: '50 ملغ (قرص أو كيس فوار)',
    defaultFrequency: 'كل 8 ساعات عند اللزوم بعد الأكل',
    defaultDurationDays: 3,
    defaultInstructions: 'سريع المفعول في تخفيف ألم الأسنان الحاد والتهاب العصب. يؤخذ بعد الأكل مع كوب ماء وافر.',
    drugFamily: 'nsaid',
    allergens: ['nsaid', 'diclofenac', 'ديكلوفيناك', 'cataflam', 'كاتافلام', 'voltaren', 'فولتارين', 'aspirin', 'أسبرين'],
    allergyWarningAr: 'تحذير حرج: ينتمي لمجموعة مضادات الالتهاب غير الستيرويدية (NSAIDs) ويتعارض مع حساسية المريض المسجلة.',
    contraindications: ['قرحة المعدة أو الاثني عشر', 'قصور قلبي شديد', 'قصور كلوي أو كبدي حاد'],
  },
  {
    id: 'drug-celecoxib-200',
    nameAr: 'سيلبريكس 200 ملغ (سيليكوكسيب)',
    nameEn: 'Celecoxib 200mg (Celebrex)',
    genericName: 'Celecoxib',
    category: 'nsaid',
    categoryAr: 'مضاد التهاب انتقائي COX-2 خفيف على المعدة',
    tradeNames: ['سيلبريكس Celebrex', 'سيلوكسيب Celoxib', 'سيليبركس'],
    defaultDose: '200 ملغ (كبسولة واحدة)',
    defaultFrequency: 'مرة واحدة أو مرتين يومياً',
    defaultDurationDays: 5,
    defaultInstructions: 'خيار ممتاز لتسكين الألم بعد العمليات الجراحية للمرضى ذوي المعدة الحساسة. يحتوي على مجموعة سلفوناميد.',
    drugFamily: 'nsaid',
    allergens: ['celecoxib', 'سيلبريكس', 'sulfa', 'سلفا', 'sulfonamide', 'nsaid'],
    allergyWarningAr: 'تحذير طبي: يحتوي على مجموعة السلفوناميد وقد يتعارض مع حساسية السلفا أو المسكنات.',
    contraindications: ['حساسية السلفا', 'أمراض نقص التروية القلبية', 'قصور كلوي حاد'],
  },
  {
    id: 'drug-dexamethasone-4',
    nameAr: 'ديكساميثازون 4 ملغ',
    nameEn: 'Dexamethasone 4mg',
    genericName: 'Dexamethasone',
    category: 'corticosteroid',
    categoryAr: 'كورتيكوستيرويد للحد من الوذمة والتورم الجراحي',
    tradeNames: ['ديكساميثازون Dexamethasone', 'ديكسازون Dexazone'],
    defaultDose: '4 ملغ (قرص واحد)',
    defaultFrequency: 'مرة يومياً في الصباح بعد الإفطار',
    defaultDurationDays: 2,
    defaultInstructions: 'يستخدم فقط لمدة 1-2 يوم للحد من انتفاخ الخد والفكين بعد جراحة قلع أضراس العقل المنطمرة وجراحة الفكين.',
    drugFamily: 'corticosteroid',
    allergens: ['dexamethasone', 'ديكساميثازون', 'corticosteroid', 'كورتيزون'],
    allergyWarningAr: 'تحذير طبي: المريض يعاني من حساسية تجاه الكورتيزون ومشتقاته.',
    contraindications: ['السكري غير المنضبط (يرفع سكر الدم بشدة)', 'العدوى الفطرية الجهازية النشطة'],
  },
  {
    id: 'drug-miconazole-oral-gel',
    nameAr: 'ميكونازول جل فموي 2% (دكتارين)',
    nameEn: 'Miconazole 2% Oral Gel (Daktarin)',
    genericName: 'Miconazole',
    category: 'antifungal',
    categoryAr: 'مضاد فطريات لعلاج القلاع وفطريات الفم',
    tradeNames: ['دكتارين جل فموي Daktarin Oral Gel', 'ميكوناز Miconaz'],
    defaultDose: 'نصف ملعقة قياس (موضعي داخل الفم)',
    defaultFrequency: '4 مرات يومياً بعد الوجبات',
    defaultDurationDays: 7,
    defaultInstructions: 'يوضع الجل على المناطق المصابة بالفطريات داخل الفم ويبقى لأطول فترة ممكنة قبل ابتلاعه. يستمر العلاج 48 ساعة بعد اختفاء الأعراض.',
    drugFamily: 'antifungal',
    allergens: ['miconazole', 'ميكونازول', 'daktarin', 'دكتارين', 'imidazole'],
    allergyWarningAr: 'تحذير طبي: المريض مسجل لديه حساسية تجاه مضادات الفطريات الإيميدازولية.',
    contraindications: ['مرضى يتناولون مميعات الدم مثل الوارفارين (تداخل دوائي خطير يزيد النزف)'],
  },
  {
    id: 'drug-tranexamic-acid-500',
    nameAr: 'حمض الترانيكساميك 500 ملغ (لوقف النزف)',
    nameEn: 'Tranexamic Acid 500mg (Cyklokapron)',
    genericName: 'Tranexamic Acid',
    category: 'hemostatic',
    categoryAr: 'مرقئ لوقف نزف ما بعد خلع الأسنان والجراحة',
    tradeNames: ['سايكلوكابرون Cyklokapron', 'ترانكسام Tranxam'],
    defaultDose: '500 ملغ (قرص واحد)',
    defaultFrequency: 'كل 8 ساعات أو يذاب في ماء كمضمضة موضعية',
    defaultDurationDays: 2,
    defaultInstructions: 'يمكن سحق القرص وإذابته في 10 مل ماء واستخدامه كمضمضة موضعية لوقف النزف الفموي دون امتصاص جهازي.',
    drugFamily: 'hemostatic',
    allergens: ['tranexamic', 'ترانيكساميك', 'cyklokapron'],
    allergyWarningAr: 'تحذير طبي: حساسية تجاه حمض الترانيكساميك.',
    contraindications: ['تاريخ خثار وريدي عميق أو جلطات نشطة'],
  },
  {
    id: 'drug-azithromycin-500',
    nameAr: 'أزيثرومايسين 500 ملغ (زيثروماكس)',
    nameEn: 'Azithromycin 500mg (Zithromax)',
    genericName: 'Azithromycin',
    category: 'antibiotic',
    categoryAr: 'مضاد حيوي ماكروليد (كورس سريع 3 أيام)',
    tradeNames: ['زيثروماكس Zithromax', 'أزيماك Azimax', 'زوسين Zocin'],
    defaultDose: '500 ملغ (قرص واحد)',
    defaultFrequency: 'مرة واحدة يومياً',
    defaultDurationDays: 3,
    defaultInstructions: 'بديل ممتاز للبنسلين. يؤخذ قرص واحد يومياً لمدة 3 أيام فقط قبل الأكل بساعة أو بعده بساعتين.',
    drugFamily: 'macrolide',
    allergens: ['azithromycin', 'أزيثرومايسين', 'zithromax', 'macrolide', 'ماكروليد', 'erythromycin', 'إريثرومايسين'],
    allergyWarningAr: 'تحذير طبي: حساسية مسجلة تجاه مجموعة الماكروليد (أزيثرومايسين / إريثرومايسين).',
    contraindications: ['قصور كبدي حاد', 'متلازمة استطالة كيو تي (QT prolongation)'],
  },
  {
    id: 'drug-ciprofloxacin-500',
    nameAr: 'سيبروفلوكساسين 500 ملغ (سيبرو)',
    nameEn: 'Ciprofloxacin 500mg (Cipro)',
    genericName: 'Ciprofloxacin',
    category: 'antibiotic',
    categoryAr: 'مضاد حيوي فلوروكينولون للإنتانات المعقدة',
    tradeNames: ['سيبرو Cipro', 'سيبرودار Ciprodar', 'سيبروفلوكس'],
    defaultDose: '500 ملغ (قرص واحد)',
    defaultFrequency: 'كل 12 ساعة (مرتين يومياً)',
    defaultDurationDays: 5,
    defaultInstructions: 'يؤخذ مع كوب ماء وافر مع تجنب منتجات الألبان ومكملات الكالسيوم أو الحديد لمدة ساعتين قبل وبعد الجرعة.',
    drugFamily: 'antibiotic' as unknown as 'penicillin',
    allergens: ['ciprofloxacin', 'سيبروفلوكساسين', 'cipro', 'quinolone', 'كينولون'],
    allergyWarningAr: 'تحذير طبي: حساسية تجاه عائلة الكينولونات.',
    contraindications: ['الحمل والإرضاع', 'الوهن العضلي الوبيل (Myasthenia gravis)'],
  },
];

export interface AllergyConflictResult {
  hasConflict: boolean;
  isPenicillinConflict: boolean;
  isNsaidConflict: boolean;
  conflictingAllergen: string;
  conflictingSeverity?: string;
  warningTitle: string;
  warningDetails: string;
  recommendedAlternative: string;
}

/**
 * Checks if a proposed medication conflicts with the patient's recorded allergies
 * or medical history (e.g. penicillin allergy).
 */
export function checkDrugAllergyConflict(
  drug: { name: string; allergens?: string[]; drugFamily?: string },
  patientAllergies: Allergy[] = [],
  patientMedicalHistory: MedicalHistory[] = []
): AllergyConflictResult {
  const cleanDrugName = drug.name.toLowerCase();

  // 1. Check patient medical condition key: 'allergy_penicillin'
  const hasPenicillinCondition = patientMedicalHistory.some(
    (h) => h.condition_key === 'allergy_penicillin' && h.has_condition
  );

  // 2. Check patient allergies list
  const activeAllergies = patientAllergies.map((a) => ({
    allergen: (a.allergen || '').toLowerCase().trim(),
    severity: a.severity || 'severe',
    notes: a.notes || '',
  }));

  // Identify matching allergens
  const isPenicillinFamilyDrug =
    drug.drugFamily === 'penicillin' ||
    cleanDrugName.includes('amox') ||
    cleanDrugName.includes('أموكس') ||
    cleanDrugName.includes('augmentin') ||
    cleanDrugName.includes('أوجمنتين') ||
    cleanDrugName.includes('penicillin') ||
    cleanDrugName.includes('بنسلين') ||
    cleanDrugName.includes('klavox') ||
    cleanDrugName.includes('كلافوكس');

  const isNsaidFamilyDrug =
    drug.drugFamily === 'nsaid' ||
    cleanDrugName.includes('ibuprofen') ||
    cleanDrugName.includes('بروفين') ||
    cleanDrugName.includes('ايبوبروفين') ||
    cleanDrugName.includes('آيبوبروفين') ||
    cleanDrugName.includes('cataflam') ||
    cleanDrugName.includes('كاتافلام') ||
    cleanDrugName.includes('diclofenac') ||
    cleanDrugName.includes('ديكلوفيناك') ||
    cleanDrugName.includes('celebrex') ||
    cleanDrugName.includes('سيلبريكس') ||
    cleanDrugName.includes('aspirin') ||
    cleanDrugName.includes('أسبرين');

  // Check Penicillin conflict
  if (isPenicillinFamilyDrug) {
    if (hasPenicillinCondition) {
      return {
        hasConflict: true,
        isPenicillinConflict: true,
        isNsaidConflict: false,
        conflictingAllergen: 'حساسية البنسلين ومضاداته (مسجلة في التاريخ المرضي)',
        conflictingSeverity: 'severe',
        warningTitle: '⚠️ تعارض حرج: حساسية بنسلين مؤكدة!',
        warningDetails: `المريض لديه حساسية مسجلة تجاه البنسلين ومضاداته. الدواء المختار (${drug.name}) ينتمي لعائلة البنسلين، واستخدامه قد يؤدي لحدوث صدمة حساسية مفرطة مهددة للحياة (Anaphylactic Shock) وتشنج قصبي حاد.`,
        recommendedAlternative: 'البديل الآمن الموصى به: كليندامايسين 300 ملغ (دالاسين سي) أو أزيثرومايسين 500 ملغ (زيثروماكس).',
      };
    }

    const matchedAllergy = activeAllergies.find(
      (a) =>
        a.allergen.includes('بنسلين') ||
        a.allergen.includes('penicillin') ||
        a.allergen.includes('amox') ||
        a.allergen.includes('أموكس') ||
        a.allergen.includes('augmentin') ||
        a.allergen.includes('أوجمنتين') ||
        a.allergen.includes('بيتالاكتام') ||
        a.allergen.includes('beta-lactam')
    );

    if (matchedAllergy) {
      return {
        hasConflict: true,
        isPenicillinConflict: true,
        isNsaidConflict: false,
        conflictingAllergen: matchedAllergy.allergen,
        conflictingSeverity: matchedAllergy.severity,
        warningTitle: '⚠️ تعارض حرج: حساسية بنسلين مسجلة في ملف المريض!',
        warningDetails: `المريض يعاني من حساسية مسجلة تجاه (${matchedAllergy.allergen}) بدرجة (${matchedAllergy.severity === 'severe' ? 'شديدة وخطيرة' : matchedAllergy.severity === 'moderate' ? 'متوسطة' : 'طفيفة'}). الدواء الموصوف (${drug.name}) يتعارض طبياً ويشكل خطورة مباشرة.`,
        recommendedAlternative: 'البديل الآمن الموصى به: كليندامايسين 300 ملغ أو أزيثرومايسين 500 ملغ.',
      };
    }
  }

  // Check NSAID conflict
  if (isNsaidFamilyDrug) {
    const matchedAllergy = activeAllergies.find(
      (a) =>
        a.allergen.includes('nsaid') ||
        a.allergen.includes('مسكنات') ||
        a.allergen.includes('بروفين') ||
        a.allergen.includes('ibuprofen') ||
        a.allergen.includes('ايبوبروفين') ||
        a.allergen.includes('آيبوبروفين') ||
        a.allergen.includes('aspirin') ||
        a.allergen.includes('أسبرين') ||
        a.allergen.includes('ديكلوفيناك') ||
        a.allergen.includes('diclofenac')
    );

    if (matchedAllergy) {
      return {
        hasConflict: true,
        isPenicillinConflict: false,
        isNsaidConflict: true,
        conflictingAllergen: matchedAllergy.allergen,
        conflictingSeverity: matchedAllergy.severity,
        warningTitle: '⚠️ تعارض حرج: حساسية مسكنات NSAIDs والأسبرين!',
        warningDetails: `المريض لديه حساسية مسجلة تجاه المسكنات ومضادات الالتهاب غير الستيرويدية (${matchedAllergy.allergen}). الدواء المختار (${drug.name}) قد يحفز وذمة حنجرية أو تفاقم ربو تحسسي شديد.`,
        recommendedAlternative: 'البديل الآمن الموصى به: باراسيتامول 500 ملغ / 1000 ملغ (بنادول) كمسكن آمن للمعدة والحساسية.',
      };
    }
  }

  // Generic direct allergen match
  const drugAllergens = drug.allergens || [];
  for (const a of activeAllergies) {
    const directMatch = drugAllergens.some((allg) => a.allergen.includes(allg.toLowerCase()));
    const nameMatch = cleanDrugName.includes(a.allergen) || a.allergen.includes(cleanDrugName);
    if (directMatch || nameMatch) {
      return {
        hasConflict: true,
        isPenicillinConflict: false,
        isNsaidConflict: false,
        conflictingAllergen: a.allergen,
        conflictingSeverity: a.severity,
        warningTitle: `⚠️ تنبيه تعارض: حساسية المريض من (${a.allergen})`,
        warningDetails: `الدواء المختار (${drug.name}) يتعارض مباشرة مع حساسية المريض المسجلة تجاه (${a.allergen}).`,
        recommendedAlternative: 'يرجى مراجعة الصنف الدوائي واستبداله بدواء آمن لا يتعارض مع التاريخ التحسسي للمريض.',
      };
    }
  }

  return {
    hasConflict: false,
    isPenicillinConflict: false,
    isNsaidConflict: false,
    conflictingAllergen: '',
    warningTitle: '',
    warningDetails: '',
    recommendedAlternative: '',
  };
}
