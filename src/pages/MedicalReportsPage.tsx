import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateAr } from '@/lib/formatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import type { Patient, User, MedicalReport, MedicalReportType } from '@shared/contracts';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Calendar,
  User as UserIcon,
  Trash2,
  QrCode,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface ReportTemplate {
  id: MedicalReportType;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  templateText: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'dental_report',
    title: 'تقرير حالة سريرية وفحص مفصل',
    description: 'تقرير طبي رسمي يوثق تشخيص الحالة، الإجراءات المنجزة، والتوصيات السريرية',
    badge: 'تقرير حالة',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    templateText: `تقرير طبي وفحص سني مفصل

إلى من يهمه الأمر،
يفيد مجمع {clinic_name} لطب وجراحة الأسنان بأن المريض/ة {patient_name} (رقم الهوية/الإقامة: {patient_national_id}، رقم الملف الطبي: {patient_code}) قد راجع/ت العيادة بتاريخ {today_date} تحت إشراف الطبيب المعالج د. {doctor_name}.

الموجودات السريرية والفحص الشعاعي:
- التشخيص السريري: {diagnosis}
- الإجراءات والعلاجات المنفذة: {procedures}
- تم إجراء صور أشعة تشخيصية للأسنان المعالجة والتأكد من نجاح الإجراء السريري والانطباق التام.

التوصيات الطبية:
- الالتزام بتناول الأدوية الموصوفة حسب الجرعات المحددة.
- تجنب مضغ الأطعمة الصلبة على الجانب المعالج خلال الـ 24 ساعة الأولى.
- مراجعة العيادة للمتابعة الدورية بعد 6 أشهر، أو فوراً في حال حدوث أي طارئ.

صدر هذا التقرير الطبي بناءً على طلب المريض لتقديمه للجهات المعنية.`,
  },
  {
    id: 'referral',
    title: 'خطاب إحالة إلى طبيب أخصائي',
    description: 'تحويل المريض لاستشارة تخصصية (جراحة وجه وفكين، تقويم، علاج عصب، لثة...)',
    badge: 'خطاب إحالة',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    templateText: `خطاب إحالة واستشارة طبية تخصصية

سعادة الزميل الاستشاري/ الأخصائي في {specialty} المحترم،
تحية طيبة وبعد،

نحيل إلى عنايتكم الكريمة المريض/ة: {patient_name}
العمر: {patient_age} سنة | الجنس: {patient_gender} | رقم الملف: {patient_code} | هاتف: {patient_phone}

سبب الإحالة والموجودات السريرية:
- سبب الإحالة الرئيسي: {referral_reason}
- التشخيص الأولي: {diagnosis}
- الإجراءات السابقة المنفذة في عيادتنا: {procedures}

المرفقات التشخيصية:
- الأشعة الرقمية والفحوصات متوفرة بنظام العيادة ومرفقة مع المريض.

نرجو التكرم بالتقييم التخصصي وإجراء ما يلزم سريرياً وإفادتنا بخطة العلاج المعتمدة.
شاكرين ومقدرين حسن تعاونكم الدائم لما فيه مصلحة المريض.`,
  },
  {
    id: 'sick_leave',
    title: 'إجازة مرضية معتمدة',
    description: 'تقرير منح إجازة مرضية محددة بالأيام مع حساب تلقائي لتاريخ العودة للعمل',
    badge: 'إجازة مرضية',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    templateText: `تقرير إجازة مرضية معتمدة

يفيد مجمع {clinic_name} بأن المريض/ة: {patient_name}
رقم الهوية / الإقامة: {patient_national_id}
رقم الملف الطبي: {patient_code}

قد راجع العيادة وأجري له/لها تدخل سني جراحي / علاجي بتاريخ: {today_date}
الحالة الطبية والتشخيص: {diagnosis}

القرار الطبي:
نظراً للحالة الطبية وما تتطلبه من راحة سريرية وفترة تعافي، فقد تقرر منح المريض إجازة مرضية لمدة ({leave_days}) أيام:
- تاريخ بدء الإجازة: {start_date}
- تاريخ مباشرة والعودة للعمل: {return_date}

يُوصى المريض بالراحة التامة وتجنب الإجهاد البدني والالتزام بالتعليمات الطبية المرفقة.
صدر هذا التقرير الطبي إلكترونياً لتقديمه لجهة العمل الرسمية.`,
  },
  {
    id: 'estimate',
    title: 'عرض سعر وخطة علاجية مالية',
    description: 'تقدير مالي تفصيلي للإجراءات المقترحة مع إجمالي التكلفة والخصومات',
    badge: 'عرض سعر',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    templateText: `عرض سعر وخطة علاجية تقديرية

المريض/ة الكريم/ة: {patient_name} (رقم الملف: {patient_code})
التاريخ: {today_date} | الطبيب المعالج: د. {doctor_name}

بناءً على الفحص السريري والشعاعي الشامل، نرفق لكم تفصيل الخطة العلاجية والتكاليف التقديرية:

التشخيص والخطة المقترحة:
- التشخيص: {diagnosis}
- الإجراءات العلاجية المشمولة: {procedures}

التكلفة المالية الإجمالية:
- إجمالي قيمة الخطة العلاجية: {total_cost} ريال سعودي
- شامل الكشفية والفحوصات الشعاعية اللازمة.
- إمكانية السداد على دفعات ميسرة متزامنة مع مراحل العلاج.

الشروط والأحكام:
1. يسري هذا العرض لمدة 30 يوماً من تاريخ إصداره.
2. لا يشمل العرض أي إجراءات إضافية غير متوقعة قد تطرأ أثناء المعالجة وتتطلب موافقة خطية مسبقة.`,
  },
];

export const MedicalReportsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTabType, setActiveTabType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeReportForPrint, setActiveReportForPrint] = useState<(MedicalReport & { patient_name?: string; doctor_name?: string }) | null>(null);

  // Form states for creating report
  const [selectedTemplateId, setSelectedTemplateId] = useState<MedicalReportType>('dental_report');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [editorContent, setEditorContent] = useState<string>('');

  // Dynamic variable parameters
  const [diagnosisParam, setDiagnosisParam] = useState('التهاب سني حاد ونخر بالرحى العلوية مع حاجة لتدخل علاجي');
  const [proceduresParam, setProceduresParam] = useState('معالجة لبية (علاج عصب) ثلاثية الأبعاد وتنظيف القنوات وتتويج بتاج زيركون');
  const [leaveDaysParam, setLeaveDaysParam] = useState<number>(3);
  const [specialtyParam, setSpecialtyParam] = useState('جراحة الفم والوجه والفكين');
  const [referralReasonParam, setReferralReasonParam] = useState('قلع جراحي لضرس العقل السفلي الأيمن المنطمر أفقياً لقربه من القناة العصبية');
  const [totalCostParam, setTotalCostParam] = useState('3,450');

  // 1. Fetch Reports
  const { data: reportsResult, isLoading: isReportsLoading } = useQuery({
    queryKey: ['medicalReports', 'list'],
    queryFn: () => api.medicalReports.list({ limit: 100 }),
  });
  const reports = (reportsResult?.ok ? reportsResult.data.items : []) as Array<MedicalReport & { patient_name?: string; doctor_name?: string }>;

  // 2. Fetch Patients
  const { data: patientsResult } = useQuery({
    queryKey: ['patients', 'all'],
    queryFn: () => api.patients.list({ limit: 200 }),
  });
  const patients = (patientsResult?.ok ? patientsResult.data.items : []) as Patient[];

  // 3. Fetch Staff
  const { data: staffResult } = useQuery({
    queryKey: ['staff', 'dentists'],
    queryFn: () => api.staff.list({ role: 'dentist', limit: 50 }),
  });
  const dentists = (staffResult?.ok ? staffResult.data.items : []) as User[];

  // 4. Fetch Clinic
  const { data: clinicResult } = useQuery({
    queryKey: ['clinic'],
    queryFn: () => api.settings.getClinic(),
  });
  const clinic = clinicResult?.ok ? clinicResult.data : null;

  // Selected patient object
  const currentPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0] || null;
  }, [patients, selectedPatientId]);

  // Selected dentist object
  const currentDoctor = useMemo(() => {
    return dentists.find((d) => d.id === selectedDoctorId) || dentists[0] || null;
  }, [dentists, selectedDoctorId]);

  // Interpolate placeholders
  const evaluateTemplate = (
    tplText: string,
    pt: Patient | null,
    dr: User | null,
    overrides?: {
      diagnosis?: string;
      procedures?: string;
      leaveDays?: number;
      specialty?: string;
      referralReason?: string;
      totalCost?: string;
    }
  ) => {
    if (!pt) return tplText;
    const now = new Date();
    const todayStr = formatDateAr(now.toISOString());
    const startDateStr = now.toISOString().split('T')[0];

    const days = overrides?.leaveDays ?? leaveDaysParam;
    const returnDateObj = new Date(now.getTime() + days * 86400000);
    const returnDateStr = returnDateObj.toISOString().split('T')[0];

    const patientAge = pt.birth_date
      ? String(now.getFullYear() - new Date(pt.birth_date).getFullYear())
      : '32';

    const replacements: Record<string, string> = {
      '{patient_name}': `${pt.first_name} ${pt.father_name ? `${pt.father_name} ` : ''}${pt.family_name}`,
      '{patient_code}': pt.code,
      '{patient_national_id}': pt.national_id || '1099887766',
      '{patient_age}': patientAge,
      '{patient_gender}': pt.gender === 'male' ? 'ذكر' : 'أنثى',
      '{patient_phone}': pt.phone,
      '{today_date}': todayStr,
      '{start_date}': startDateStr,
      '{return_date}': returnDateStr,
      '{leave_days}': String(days),
      '{doctor_name}': dr?.full_name || 'طبيب الأسنان المعالج',
      '{doctor_license}': dr?.license_number || 'MED-SA-44910',
      '{clinic_name}': clinic?.name || 'مجمع عيادتي لطب الأسنان',
      '{clinic_phone}': clinic?.phone || '0114002233',
      '{diagnosis}': overrides?.diagnosis ?? diagnosisParam,
      '{procedures}': overrides?.procedures ?? proceduresParam,
      '{specialty}': overrides?.specialty ?? specialtyParam,
      '{referral_reason}': overrides?.referralReason ?? referralReasonParam,
      '{total_cost}': overrides?.totalCost ?? totalCostParam,
    };

    let result = tplText;
    for (const [key, val] of Object.entries(replacements)) {
      result = result.split(key).join(val);
    }
    return result;
  };

  // Switch template
  const handleSelectTemplate = (tplId: MedicalReportType) => {
    setSelectedTemplateId(tplId);
    const tpl = REPORT_TEMPLATES.find((t) => t.id === tplId);
    if (tpl) {
      const generated = evaluateTemplate(tpl.templateText, currentPatient, currentDoctor);
      setEditorContent(generated);
    }
  };

  // Re-generate text when patient, doctor, or parameters change
  const handleRegenerateFromParams = () => {
    const tpl = REPORT_TEMPLATES.find((t) => t.id === selectedTemplateId);
    if (tpl && currentPatient) {
      const generated = evaluateTemplate(tpl.templateText, currentPatient, currentDoctor);
      setEditorContent(generated);
    }
  };

  // Insert a specific variable into editor
  const handleInsertVariable = (varKey: string) => {
    setEditorContent((prev) => prev + ` ${varKey} `);
  };

  // Open modal
  const handleOpenCreateModal = () => {
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].id);
    }
    if (dentists.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(dentists[0].id);
    }

    const tpl = REPORT_TEMPLATES.find((t) => t.id === selectedTemplateId) || REPORT_TEMPLATES[0];
    const generated = evaluateTemplate(tpl.templateText, currentPatient || patients[0], currentDoctor || dentists[0]);
    setEditorContent(generated);
    setIsCreateModalOpen(true);
  };

  // Save report
  const handleSaveReport = async () => {
    if (!currentPatient || !editorContent.trim()) {
      alert('يرجى ملء محتوى التقرير واختيار المريض');
      return;
    }

    try {
      const res = await api.medicalReports.create({
        clinic_id: currentPatient.clinic_id,
        patient_id: currentPatient.id,
        type: selectedTemplateId,
        content: editorContent.trim(),
        issued_at: new Date().toISOString(),
        issued_by: currentDoctor?.id || dentists[0]?.id || 'u-001',
      });

      if (res.ok) {
        toast({
          title: 'تم إصدار التقرير الطبي بنجاح',
          description: 'تم حفظ التقرير في سجلات المريض وأصبح جاهزاً للطباعة والتصدير.',
          variant: 'success',
        });
        setIsCreateModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['medicalReports'] });
      } else {
        toast({
          title: 'تعذر الحفظ',
          description: res.error,
          variant: 'error',
        });
      }
    } catch {
      toast({
        title: 'خطأ غير متوقع',
        variant: 'error',
      });
    }
  };

  // Delete report
  const handleDeleteReport = async (id: string) => {
    if (!confirm('هل تريد بالتأكيد أرشفة هذا التقرير الطبي؟')) return;
    try {
      const res = await api.medicalReports.delete(id);
      if (res.ok) {
        toast({ title: 'تمت أرشفة التقرير' });
        queryClient.invalidateQueries({ queryKey: ['medicalReports'] });
      }
    } catch {
      toast({ title: 'خطأ أثناء الحذف', variant: 'error' });
    }
  };

  // Print report
  const handlePrintReport = (report: MedicalReport & { patient_name?: string; doctor_name?: string }) => {
    setActiveReportForPrint(report);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesType = activeTabType === 'all' || r.type === activeTabType;
      const q = searchQuery.toLowerCase().trim();
      const ptName = (r.patient_name || '').toLowerCase();
      const content = r.content.toLowerCase();
      const matchesSearch = !q || ptName.includes(q) || content.includes(q);
      return matchesType && matchesSearch;
    });
  }, [reports, activeTabType, searchQuery]);

  return (
    <div className="space-y-6" id="medical-reports-page">
      <PageHeader
        title="التقارير الطبية والإحالات"
        description="إصدار تقارير الحالات السريرية، خطابات الإحالة للأخصائيين، الإجازات المرضية، وعروض الأسعار مع قوالب جاهزة وحقول متغيرة تلقائية"
        actions={
          <Button
            variant="primary"
            onClick={handleOpenCreateModal}
            className="text-xs gap-1.5"
          >
            <Plus className="w-4 h-4" />
            إنشاء تقرير جديد
          </Button>
        }
      />

      {/* 4 Ready Templates Preview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORT_TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => {
              setSelectedTemplateId(tpl.id);
              handleOpenCreateModal();
            }}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-brand-blue/60 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${tpl.badgeColor}`}>
                  {tpl.badge}
                </span>
                <Sparkles className="w-4 h-4 text-slate-300 group-hover:text-brand-blue transition-colors" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 leading-snug">
                {tpl.title}
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                {tpl.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-blue group-hover:underline">
              <span>استخدام القالب</span>
              <Plus className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: 'all', label: 'جميع التقارير' },
            { id: 'dental_report', label: 'تقارير الحالات' },
            { id: 'referral', label: 'خطابات الإحالة' },
            { id: 'sick_leave', label: 'الإجازات المرضية' },
            { id: 'estimate', label: 'عروض الأسعار' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabType(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTabType === tab.id
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم المريض أو نص التقرير..."
            className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:bg-white text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Reports List */}
      {isReportsLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Spinner size="lg" className="text-brand-blue mx-auto" />
          <p className="text-xs text-slate-400 mt-2">جاري تحميل التقارير الطبية...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">لا توجد تقارير طبية مسجلة</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            اختر أحد القوالب الجاهزة أعلاه لإنشاء تقرير حالة سريرية، خطاب إحالة، أو إجازة مرضية.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCreateModal}
            className="text-xs mt-2"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            إنشاء تقرير جديد الآن
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => {
            const tplInfo = REPORT_TEMPLATES.find((t) => t.id === report.type);

            return (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${tplInfo?.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                      {tplInfo?.badge || 'تقرير طبي'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      #{report.id.slice(0, 8)}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {report.patient_name || 'المريض'}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        د. {report.doctor_name || 'الطبيب المعالج'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDateAr(report.issued_at)}
                      </span>
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 whitespace-pre-line line-clamp-4 font-sans leading-relaxed">
                    {report.content}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintReport(report)}
                    className="text-xs gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    طباعة التقرير الرسمي
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReport(report.id)}
                    className="text-xs text-red-500 hover:text-red-700 p-1.5"
                    title="أرشفة التقرير"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Medical Report Modal with Live Editor & Variable Fields */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="محرر التقارير الطبية التفاعلي (Medical Reports Generator)"
          className="max-w-4xl max-h-[92vh] overflow-y-auto"
        >
          <div className="space-y-5 text-xs text-slate-800">
            {/* Template Selector Pills */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                1. اختر قالب التقرير المطلوب:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {REPORT_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`p-2.5 rounded-lg border text-right transition-all flex flex-col justify-between ${
                      selectedTemplateId === tpl.id
                        ? 'border-brand-blue bg-blue-50/60 ring-2 ring-brand-blue/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 block truncate">
                      {tpl.badge}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      {tpl.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Patient and Doctor Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المريض المستهدف *
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    setSelectedPatientId(e.target.value);
                    const pt = patients.find((p) => p.id === e.target.value) || null;
                    const tpl = REPORT_TEMPLATES.find((t) => t.id === selectedTemplateId);
                    if (tpl) {
                      setEditorContent(evaluateTemplate(tpl.templateText, pt, currentDoctor));
                    }
                  }}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.family_name} ({p.code}) — {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الطبيب الموقع *
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    const dr = dentists.find((d) => d.id === e.target.value) || null;
                    const tpl = REPORT_TEMPLATES.find((t) => t.id === selectedTemplateId);
                    if (tpl) {
                      setEditorContent(evaluateTemplate(tpl.templateText, currentPatient, dr));
                    }
                  }}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  {dentists.map((d) => (
                    <option key={d.id} value={d.id}>
                      د. {d.full_name} ({d.specialty || 'طبيب أسنان'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Template Specific Dynamic Inputs Panel */}
            <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-brand-navy flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-blue" />
                  حقول المتغيرات المخصصة للقالب (تُملأ وتُدمج تلقائياً في النص)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateFromParams}
                  className="text-xs h-7 py-0 px-2 bg-white"
                >
                  إعادة توليد النص
                </Button>
              </div>

              {selectedTemplateId === 'sick_leave' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      عدد أيام الإجازة المرضية: ({leaveDaysParam} أيام)
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={14}
                      value={leaveDaysParam}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLeaveDaysParam(val);
                        const tpl = REPORT_TEMPLATES.find((t) => t.id === selectedTemplateId);
                        if (tpl) {
                          setEditorContent(
                            evaluateTemplate(tpl.templateText, currentPatient, currentDoctor, {
                              leaveDays: val,
                            })
                          );
                        }
                      }}
                      className="w-full accent-brand-blue"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      التشخيص الطبي / سبب الإجازة:
                    </label>
                    <input
                      type="text"
                      value={diagnosisParam}
                      onChange={(e) => {
                        setDiagnosisParam(e.target.value);
                        const tpl = REPORT_TEMPLATES.find((t) => t.id === selectedTemplateId);
                        if (tpl) {
                          setEditorContent(
                            evaluateTemplate(tpl.templateText, currentPatient, currentDoctor, {
                              diagnosis: e.target.value,
                            })
                          );
                        }
                      }}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>
                </div>
              )}

              {selectedTemplateId === 'referral' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      التخصص المحال إليه:
                    </label>
                    <select
                      value={specialtyParam}
                      onChange={(e) => {
                        setSpecialtyParam(e.target.value);
                        const tpl = REPORT_TEMPLATES.find((t) => t.id === selectedTemplateId);
                        if (tpl) {
                          setEditorContent(
                            evaluateTemplate(tpl.templateText, currentPatient, currentDoctor, {
                              specialty: e.target.value,
                            })
                          );
                        }
                      }}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-brand-blue"
                    >
                      <option value="جراحة الفم والوجه والفكين (Oral & Maxillofacial Surgery)">
                        جراحة الفم والوجه والفكين
                      </option>
                      <option value="معالجة لبية وجذور الأسنان (Endodontics)">
                        معالجة لبية وجذور الأسنان
                      </option>
                      <option value="تقويم الأسنان والفكين (Orthodontics)">
                        تقويم الأسنان والفكين
                      </option>
                      <option value="طب أسنان الأطفال (Pedodontics)">
                        طب أسنان الأطفال
                      </option>
                      <option value="أمراض اللثة وزراعة الأسنان (Periodontics)">
                        أمراض اللثة وزراعة الأسنان
                      </option>
                      <option value="تركيبات وتجميل الأسنان (Prosthodontics)">
                        تركيبات وتجميل الأسنان
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      سبب الإحالة بالتحديد:
                    </label>
                    <input
                      type="text"
                      value={referralReasonParam}
                      onChange={(e) => {
                        setReferralReasonParam(e.target.value);
                        const tpl = REPORT_TEMPLATES.find((t) => t.id === selectedTemplateId);
                        if (tpl) {
                          setEditorContent(
                            evaluateTemplate(tpl.templateText, currentPatient, currentDoctor, {
                              referralReason: e.target.value,
                            })
                          );
                        }
                      }}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>
                </div>
              )}

              {selectedTemplateId === 'estimate' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      إجمالي التكلفة التقديرية (ر.س):
                    </label>
                    <input
                      type="text"
                      value={totalCostParam}
                      onChange={(e) => {
                        setTotalCostParam(e.target.value);
                        const tpl = REPORT_TEMPLATES.find((t) => t.id === selectedTemplateId);
                        if (tpl) {
                          setEditorContent(
                            evaluateTemplate(tpl.templateText, currentPatient, currentDoctor, {
                              totalCost: e.target.value,
                            })
                          );
                        }
                      }}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      الإجراءات المقترحة:
                    </label>
                    <input
                      type="text"
                      value={proceduresParam}
                      onChange={(e) => {
                        setProceduresParam(e.target.value);
                        const tpl = REPORT_TEMPLATES.find((t) => t.id === selectedTemplateId);
                        if (tpl) {
                          setEditorContent(
                            evaluateTemplate(tpl.templateText, currentPatient, currentDoctor, {
                              procedures: e.target.value,
                            })
                          );
                        }
                      }}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>
                </div>
              )}

              {selectedTemplateId === 'dental_report' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      التشخيص السريري:
                    </label>
                    <input
                      type="text"
                      value={diagnosisParam}
                      onChange={(e) => {
                        setDiagnosisParam(e.target.value);
                        const tpl = REPORT_TEMPLATES.find((t) => t.id === selectedTemplateId);
                        if (tpl) {
                          setEditorContent(
                            evaluateTemplate(tpl.templateText, currentPatient, currentDoctor, {
                              diagnosis: e.target.value,
                            })
                          );
                        }
                      }}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      العلاجات والإجراءات المنفذة:
                    </label>
                    <input
                      type="text"
                      value={proceduresParam}
                      onChange={(e) => {
                        setProceduresParam(e.target.value);
                        const tpl = REPORT_TEMPLATES.find((t) => t.id === selectedTemplateId);
                        if (tpl) {
                          setEditorContent(
                            evaluateTemplate(tpl.templateText, currentPatient, currentDoctor, {
                              procedures: e.target.value,
                            })
                          );
                        }
                      }}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Variable Tag Inserters Toolbar */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-600">
                إدراج حقول متغيرة سريعة بالنص (انقر للإضافة لمكان المؤشر):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: '{patient_name}', label: 'اسم المريض' },
                  { tag: '{patient_code}', label: 'رقم الملف' },
                  { tag: '{patient_national_id}', label: 'الهوية/الإقامة' },
                  { tag: '{patient_age}', label: 'عمر المريض' },
                  { tag: '{doctor_name}', label: 'اسم الطبيب' },
                  { tag: '{today_date}', label: 'تاريخ اليوم' },
                  { tag: '{leave_days}', label: 'أيام الإجازة' },
                  { tag: '{return_date}', label: 'تاريخ العودة' },
                  { tag: '{diagnosis}', label: 'التشخيص' },
                  { tag: '{procedures}', label: 'الإجراءات' },
                ].map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertVariable(v.tag)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-brand-blue hover:text-white rounded text-[10px] text-slate-700 transition-colors border border-slate-200"
                  >
                    + {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Area */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                نص التقرير النهائي (يمكنك تعديل أي جزء مباشرة قبل الحفظ والطباعة):
              </label>
              <textarea
                rows={11}
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-blue shadow-inner"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                إلغاء
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSaveReport}
                className="gap-1.5 px-6"
              >
                <CheckCircle2 className="w-4 h-4" />
                حفظ وإصدار التقرير الطبي
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Official Print Report View (A4 layout visible during window.print()) */}
      {activeReportForPrint && (
        <div className="hidden print:block fixed inset-0 bg-white p-12 z-50 text-slate-900 font-sans">
          {/* Header */}
          <div className="border-b-2 border-brand-navy pb-5 mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-brand-navy">مجمع عيادتي التخصصي لطب وجراحة الأسنان</h1>
              <p className="text-xs text-slate-600 mt-1">
                قسم التقارير الطبية واللجان العلاجية · ترخيص وزارة الصحة: MED-2026-99014 · الرياض، المملكة العربية السعودية
              </p>
            </div>
            <div className="text-left">
              <div className="w-16 h-16 border-2 border-brand-navy/30 rounded-lg flex items-center justify-center p-1 bg-slate-50">
                <FileText className="w-10 h-10 text-brand-navy" />
              </div>
            </div>
          </div>

          {/* Meta Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-4 mb-8 text-xs">
            <div className="space-y-1.5">
              <p>
                <span className="font-bold text-slate-700">اسم المريض: </span>
                <span className="font-bold text-sm text-slate-900">
                  {activeReportForPrint.patient_name || 'المريض'}
                </span>
              </p>
              <p>
                <span className="font-bold text-slate-700">نوع التقرير: </span>
                <span className="font-semibold text-brand-blue">
                  {REPORT_TEMPLATES.find((t) => t.id === activeReportForPrint.type)?.title || 'تقرير طبي'}
                </span>
              </p>
            </div>

            <div className="text-left space-y-1.5">
              <p>
                <span className="font-bold text-slate-700">تاريخ الإصدار: </span>
                {formatDateAr(activeReportForPrint.issued_at)}
              </p>
              <p>
                <span className="font-bold text-slate-700">الطبيب المعالج: </span>
                د. {activeReportForPrint.doctor_name || 'طبيب المركز'}
              </p>
              <p>
                <span className="font-bold text-slate-700">الرقم المرجعي: </span>
                <span className="font-mono">REP-{activeReportForPrint.id.slice(0, 10)}</span>
              </p>
            </div>
          </div>

          {/* Content Body */}
          <div className="text-sm font-sans whitespace-pre-line leading-loose text-slate-900 min-h-[450px] p-2">
            {activeReportForPrint.content}
          </div>

          {/* Official Signatures & Stamp */}
          <div className="border-t-2 border-slate-200 pt-8 mt-12 flex justify-between items-end text-xs">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 border border-slate-300 p-1.5 rounded bg-slate-50 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-slate-800" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-800">وثيقة طبية صادرة ومعتمدة إلكترونياً</p>
                <p className="text-[11px] text-slate-500">تم التحقق من صحة التقرير عبر البوابة الرقمية للمركز</p>
                <p className="text-[10px] text-slate-400">أي كشط أو تعديل يدوي يلغي صلاحية هذا التقرير</p>
              </div>
            </div>

            <div className="flex gap-12 text-center">
              <div className="space-y-2">
                <p className="font-bold text-slate-800">توقيع الطبيب المعالج</p>
                <div className="w-36 border-b border-dashed border-slate-400 h-10 flex items-end justify-center pb-1">
                  <span className="text-[11px] text-slate-500">د. {activeReportForPrint.doctor_name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800">ختم المركز الطبي</p>
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-brand-navy/40 flex items-center justify-center text-[10px] text-brand-navy/60 font-bold rotate-12">
                  ختم معتمد
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalReportsPage;
