import React, { useState } from 'react';
import type { Patient, Invoice, Payment, TreatmentPlan } from '@shared/contracts';
import {
  Printer,
  Download,
  Share2,
  X,
  FileText,
  Receipt,
  Pill,
  FileCheck,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { InvoicePrintTemplate } from './templates/InvoicePrintTemplate';
import { ReceiptPrintTemplate } from './templates/ReceiptPrintTemplate';
import { PrescriptionPrintTemplate } from './templates/PrescriptionPrintTemplate';
import { MedicalReportPrintTemplate } from './templates/MedicalReportPrintTemplate';
import { SickLeavePrintTemplate } from './templates/SickLeavePrintTemplate';
import { TreatmentPlanPrintTemplate } from './templates/TreatmentPlanPrintTemplate';
import { LabOrderPrintTemplate } from './templates/LabOrderPrintTemplate';
import type {
  PrintDocumentType,
  InvoicePrintData,
  ReceiptPrintData,
  PrescriptionData,
  MedicalReportData,
  SickLeaveData,
  TreatmentPlanPrintData,
  LabOrderPrintData,
  UnifiedPrintModalProps,
} from './types';

export const UnifiedPrintModal: React.FC<UnifiedPrintModalProps> = ({
  isOpen,
  onClose,
  initialDocumentType = 'invoice',
  invoiceData,
  receiptData,
  prescriptionData,
  medicalReportData,
  sickLeaveData,
  treatmentPlanData,
  labOrderData,
  clinic,
}) => {
  const [currentDocType, setCurrentDocType] = useState<PrintDocumentType>(initialDocumentType);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!isOpen) return null;

  // Fallback Sample Patient
  const fallbackPatient: Patient = ({
    id: 'p-default',
    clinic_id: 'c1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    code: 'P-1048',
    first_name: 'سارة',
    father_name: 'عبدالله',
    family_name: 'العتيبي',
    gender: 'female',
    birth_date: '1995-04-12',
    national_id: '1088765432',
    phone: '0551234567',
    phone_alt: null,
    email: 'sara@example.com',
    address: 'حي النرجس، الرياض',
    city: 'الرياض',
    blood_type: 'O+',
    marital_status: 'single',
    occupation: 'مهندسة برمجيات',
    emergency_contact_name: 'عبدالله العتيبي',
    emergency_contact_phone: '0501112233',
    referral_source: 'صديق',
    primary_dentist_id: null,
    insurance_company_id: null,
    insurance_policy_no: null,
    insurance_expiry: null,
    notes: null,
    photo_path: null,
    is_active: true,
  } as unknown as Patient);

  const defaultInvoiceData: InvoicePrintData = invoiceData || {
    invoice: ({
      id: 'inv-demo',
      clinic_id: 'c1',
      patient_id: fallbackPatient.id,
      branch_id: 'b1',
      insurance_claim_id: null,
      number: 'INV-2026-0042',
      issue_date: new Date().toISOString(),
      due_date: new Date().toISOString(),
      subtotal_halalas: 120000,
      discount_halalas: 10000,
      vat_halalas: 16500,
      total_halalas: 126500,
      paid_halalas: 126500,
      balance_halalas: 0,
      status: 'paid',
      vat_percent: 15,
      zatca_qr: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    } as unknown as Invoice),
    items: [
      {
        id: 'item-1',
        clinic_id: 'c1',
        treatment_id: null,
        invoice_id: 'inv-demo',
        description: 'علاج عصب الأسنان الخلفية متعدد الجذور مع تنظيف الأقنية',
        tooth_number: 46,
        quantity: 1,
        unit_price_halalas: 80000,
        discount_halalas: 10000,
        total_halalas: 70000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      },
      {
        id: 'item-2',
        clinic_id: 'c1',
        treatment_id: null,
        invoice_id: 'inv-demo',
        description: 'حشوة تجميلية كمبوزيت نانوية متعددة الأسطح',
        tooth_number: 46,
        quantity: 1,
        unit_price_halalas: 40000,
        discount_halalas: 0,
        total_halalas: 40000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      },
    ],
    patient: fallbackPatient,
  };

  const defaultReceiptData: ReceiptPrintData = receiptData || {
    payment: {
      id: 'pay-demo-1234',
      clinic_id: 'c1',
      invoice_id: defaultInvoiceData.invoice.id,
      patient_id: fallbackPatient.id,
      amount_halalas: 126500,
      method: 'mada',
      reference: 'MADA-AUTH-9831',
      paid_at: new Date().toISOString(),
      received_by: 'خالد المحاسب',
      notes: 'سداد كامل الفاتورة الضريبية رقم INV-2026-0042 عبر شبكة مدى',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    } as Payment,
    invoice: defaultInvoiceData.invoice,
    patient: fallbackPatient,
  };

  const defaultPrescriptionData: PrescriptionData = prescriptionData || {
    prescriptionNumber: 'RX-2026-091',
    date: new Date().toISOString(),
    patient: fallbackPatient,
    dentistName: 'د. أحمد الشمري',
    dentistSpecialty: 'استشاري جراحة الفم وزراعة الأسنان',
    dentistLicense: 'MOH-DNT-449102',
    diagnosis: 'التهاب دواعم السن الحاد مع خراج سني (Acute Periapical Abscess #46)',
    allergies: ['حساسية البنسلين (Penicillin Allergy)'],
    medications: [
      {
        name: 'Clindamycin 300mg Caps',
        dosage: 'كبسولة واحدة (300 مجم)',
        frequency: 'كل 8 ساعات',
        duration: 'لمدة 5 أيام',
        instructions: 'تؤخذ بعد الوجبات مع كوب ماء كامل',
      },
      {
        name: 'Ibuprofen 600mg Tablets',
        dosage: 'قرص واحد (600 مجم)',
        frequency: 'كل 8 ساعات عند اللزوم',
        duration: 'لمدة 3 أيام',
        instructions: 'مسكن ومضاد للالتهاب - بعد الطعام',
      },
      {
        name: 'Chlorhexidine 0.12% Mouthwash',
        dosage: 'مضمضة 15 مل بدون تخفيف',
        frequency: 'مرتين يومياً صباحاً ومساءً',
        duration: 'لمدة أسبوع',
        instructions: 'مضمضة لمدة دقيقة واحدة وعدم الأكل أو الشرب لمدة 30 دقيقة بعدها',
      },
    ],
    notes: 'يرجى مراجعة العيادة فوراً في حال حدوث أي تورم إضافي أو صعوبة في البلع.',
  };

  const defaultMedicalReportData: MedicalReportData = medicalReportData || {
    reportNumber: 'MED-REP-2026-118',
    date: new Date().toISOString(),
    patient: fallbackPatient,
    dentistName: 'د. أحمد الشمري',
    dentistSpecialty: 'استشاري جراحة وطب الأسنان',
    dentistLicense: 'MOH-DNT-449102',
    chiefComplaint: 'ألم نابض شديد في الفك السفلي الأيمن يزداد مع المضغ والحرارة منذ 3 أيام.',
    clinicalFindings: 'بالفحص السريري والشعاعي (X-Ray)، تبين وجود نخر سني عميق نافذ إلى الحجرة اللبية في الضرس رقم 46 مع آفة ذروية (Periapical radiolucency) وحساسية شديدة للقرع.',
    diagnosis: 'التهاب لب غير ردود مع التهاب دواعم السن الذروي المصحوب بخراج (Irreversible Pulpitis with Periapical Periodontitis #46)',
    proceduresDone: [
      'فتح الحجرة اللبية واستئصال اللب السني الملتهب وتطهير الأقنية الجذرية (Pulpectomy).',
      'حشو الأقنية الجذرية بمادة الجوتا بيركا تحت التخدير الموضعي وتطبيق ضماد مضاد للبكتيريا.',
      'وضع ترميم مؤقت عالي الجودة استعداداً للتاج النهائي.',
    ],
    recommendations: 'ينصح بتركيب تاج خزفي كامل (Zirconia Crown) لحماية الضرس من الكسر، والالتزام بالفحوص الدورية كل 6 أشهر.',
  };

  const defaultSickLeaveData: SickLeaveData = sickLeaveData || {
    leaveNumber: 'SL-2026-074',
    date: new Date().toISOString(),
    patient: fallbackPatient,
    attendingDoctor: 'د. أحمد الشمري',
    doctorSpecialty: 'استشاري جراحة وطب الأسنان',
    doctorLicense: 'MOH-DNT-449102',
    diagnosis: 'جراحة خلع ضرس عقل مطمور مع خياطة جراحية وتورم نسبي يحتاج راحة تامة.',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    daysCount: 3,
    recommendations: 'الراحة التامة وتطبيق كمادات باردة والامتناع عن الأنشطة الشاقة وتناول المسكنات والمضادات الموصوفة.',
  };

  const defaultTreatmentPlanData: TreatmentPlanPrintData = treatmentPlanData || {
    plan: {
      id: 'pln-01',
      clinic_id: 'c1',
      patient_id: fallbackPatient.id,
      dentist_id: 'dentist-01',
      title: 'خطة التأهيل والترميم السني الشامل',
      status: 'accepted',
      total_halalas: 480000,
      discount_halalas: 0,
      patient_consent_at: new Date().toISOString(),
      notes: 'تشمل معالجة العصب، حشوات تجميلية، وتاجين زيركون مع تنظيف وقائي شامل.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    } as TreatmentPlan,
    items: [
      {
        id: 'tpi-1',
        plan_id: 'pln-01',
        procedure_id: 'proc-root',
        phase: 1,
        tooth_number: 46,
        procedure_name: 'علاج جذور وأقنية عصب متقدم',
        unit_price_halalas: 120000,
        discount_halalas: 0,
        status: 'completed',
        notes: 'تم الانتهاء بنجاح',
      },
      {
        id: 'tpi-2',
        plan_id: 'pln-01',
        procedure_id: 'proc-crown',
        phase: 1,
        tooth_number: 46,
        procedure_name: 'تاج خزفي زيركونيا عالي النقاء',
        unit_price_halalas: 150000,
        discount_halalas: 0,
        status: 'pending',
        notes: 'مجدول بعد جلسة البناء',
      },
      {
        id: 'tpi-3',
        plan_id: 'pln-01',
        procedure_id: 'proc-fill',
        phase: 2,
        tooth_number: 14,
        procedure_name: 'حشوة كمبوزيت تجميلية',
        unit_price_halalas: 50000,
        discount_halalas: 0,
        status: 'pending',
        notes: 'سطحين إطباقي ودهليزي',
      },
      {
        id: 'tpi-4',
        plan_id: 'pln-01',
        procedure_id: 'proc-veneer',
        phase: 2,
        tooth_number: 21,
        procedure_name: 'وجه خزفي تجميلي فينير (E.max)',
        unit_price_halalas: 160000,
        discount_halalas: 0,
        status: 'pending',
        notes: 'تجميل الابتسامة',
      },
    ],
    patient: fallbackPatient,
    dentistName: 'د. أحمد الشمري',
  };

  const defaultLabOrderData: LabOrderPrintData = labOrderData || {
    orderNumber: 'LAB-ORD-2026-302',
    orderDate: new Date().toISOString(),
    deliveryDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    labName: 'مختبر ديجيتال دينتال المتقدم (Digital Dental Lab)',
    patient: fallbackPatient,
    dentistName: 'د. أحمد الشمري',
    restorationType: 'تاج زيركون كامل متعدد الطبقات (Monolithic Multilayer Zirconia)',
    teethNumbers: [46],
    shade: 'A2 (VITA Classical)',
    instructions: 'يرجى مراعاة الإطباق التشريحي بدقة مع حواف ملساء (Chamfer margin) وتلميع فائق (High Glaze finish). تم إرسال الطبعة الرقمية STL عبر البريد.',
    materials: 'Zirconia Katana STML (Noritake)',
  };

  // Document types navigation list
  const docTypesList = [
    { id: 'invoice', label: 'فاتورة ضريبية مبسطة', icon: FileText },
    { id: 'receipt', label: 'سند قبض مالي', icon: Receipt },
    { id: 'prescription', label: 'وصفة طبية (Rx)', icon: Pill },
    { id: 'medical_report', label: 'تقرير طبي معتمد', icon: FileCheck },
    { id: 'sick_leave', label: 'إشعار إجازة مرضية', icon: Calendar },
    { id: 'treatment_plan', label: 'خطة علاج المريض', icon: Layers },
    { id: 'lab_order', label: 'أمر تشغيل معمل', icon: Sparkles },
  ] as const;

  // Print Handlers
  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    window.print();
  };

  // WhatsApp Message Generator using predefined message templates
  const handleSendWhatsApp = () => {
    const activePatient =
      invoiceData?.patient ||
      receiptData?.patient ||
      prescriptionData?.patient ||
      medicalReportData?.patient ||
      sickLeaveData?.patient ||
      treatmentPlanData?.patient ||
      labOrderData?.patient ||
      fallbackPatient;

    let phone = (activePatient.phone || '').replace(/\D/g, '');
    if (phone.startsWith('05')) {
      phone = '966' + phone.substring(1);
    } else if (phone.startsWith('5')) {
      phone = '966' + phone;
    }

    const patientName = `${activePatient.first_name} ${activePatient.family_name}`;
    const clinicTitle = clinic?.name || 'مجمع عيادات أفق لطب الأسنان';

    let message = '';
    switch (currentDocType) {
      case 'invoice': {
        const inv = defaultInvoiceData.invoice;
        const total = (inv.total_halalas / 100).toFixed(2);
        message = `مرحباً ${patientName}،\nمرفق تفاصيل فاتورتكم الضريبية المبسطة رقم ${inv.number} بمبلغ إجمالي ${total} ر.س من ${clinicTitle}.\nشاكرين لكم زيارتكم ونتمنى لكم دوام الصحة والعافية.`;
        break;
      }
      case 'receipt': {
        const pay = defaultReceiptData.payment;
        const amt = (pay.amount_halalas / 100).toFixed(2);
        message = `مرحباً ${patientName}،\nتم بنجاح تسجيل دفعة بقيمة ${amt} ر.س بموجب سند قبض رقم REC-${pay.id.slice(0, 8).toUpperCase()} في ${clinicTitle}.\nشكراً لثقتكم.`;
        break;
      }
      case 'prescription': {
        message = `مرحباً ${patientName}،\nنرفق لكم الوصفة الطبية وتعليمات تناول الأدوية المعتمدة من طبيبكم المعالج في ${clinicTitle}.\nمع تمنياتنا لكم بالشفاء العاجل.`;
        break;
      }
      case 'medical_report': {
        message = `مرحباً ${patientName}،\nتم إصدار التقرير الطبي المعتمد الخاص بكم من ${clinicTitle} برقم ${defaultMedicalReportData.reportNumber}.\nنتمنى لكم دوام العافية.`;
        break;
      }
      case 'sick_leave': {
        message = `مرحباً ${patientName}،\nتم إصدار إشعار الإجازة المرضية الخاصة بكم لمدة (${defaultSickLeaveData.daysCount}) أيام من ${clinicTitle}.\nألف سلامة عليكم.`;
        break;
      }
      case 'treatment_plan': {
        message = `مرحباً ${patientName}،\nيسعدنا تزويدكم بخطة علاج وتجميل الأسنان المقترحة في ${clinicTitle}.\nيسعدنا الرد على استفساراتكم وترتيب مواعيدكم القادمة.`;
        break;
      }
      case 'lab_order': {
        message = `مرحباً،\nمرفق أمر عمل وتشغيل معمل أسنان رقم ${defaultLabOrderData.orderNumber} من ${clinicTitle} للمريض ${patientName}.\nيرجى تأكيد الاستلام وموعد التسليم.`;
        break;
      }
    }

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Container */}
      <div className="flex flex-col w-full max-w-5xl h-[94vh] bg-zinc-100 dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-zinc-900 text-white border-b border-zinc-800 shrink-0">
          {/* Title & Document Badge */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">معاينة وطباعة المستندات الرسمية</h2>
              <span className="text-[11px] text-zinc-400">
                قوالب معتمدة متوافقة مع الأنظمة واللوائح وهيئة الزكاة (ZATCA)
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-300 gap-2">
              <button
                onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                className="hover:text-white px-1 font-bold"
                title="تصغير"
              >
                -
              </button>
              <span className="font-mono text-[11px]">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                className="hover:text-white px-1 font-bold"
                title="تكبير"
              >
                +
              </button>
            </div>

            {/* WhatsApp Button */}
            <button
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition"
              title="إرسال عبر واتساب"
            >
              <Share2 className="h-4 w-4" />
              <span>إرسال واتساب</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </button>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-750 hover:bg-zinc-700 border border-zinc-700 px-3.5 py-1.5 text-xs font-bold text-zinc-200 transition"
              title="تصدير وحفظ كملف PDF"
            >
              <Download className="h-4 w-4" />
              <span>تصدير PDF</span>
            </button>

            {/* Print Now Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-4 py-1.5 text-xs font-bold text-white shadow transition"
              title="طباعة المستند عبر الطابعة"
            >
              <Printer className="h-4 w-4" />
              <span>طباعة الآن</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition mr-2"
              title="إغلاق المعاينة"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Templates Selector Tabs Bar (Hidden on Print) */}
        <div className="print:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 bg-zinc-800/90 border-b border-zinc-750 text-xs shrink-0 scrollbar-none">
          {docTypesList.map((doc) => {
            const Icon = doc.icon;
            const isActive = currentDocType === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => setCurrentDocType(doc.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 font-bold transition ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-zinc-400 hover:bg-zinc-750 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{doc.label}</span>
              </button>
            );
          })}
        </div>

        {/* Printable Document Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start print:p-0 print:m-0 print:overflow-visible">
          {/* Actual Print Paper (A4 standard preview) */}
          <div
            id="printable-document-content"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-3xl bg-white text-zinc-900 rounded-xl shadow-lg border border-zinc-200 print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none transition-transform duration-200 overflow-hidden"
          >
            {currentDocType === 'invoice' && (
              <InvoicePrintTemplate
                invoice={defaultInvoiceData.invoice}
                items={defaultInvoiceData.items}
                patient={defaultInvoiceData.patient}
                clinic={clinic}
              />
            )}

            {currentDocType === 'receipt' && (
              <ReceiptPrintTemplate
                payment={defaultReceiptData.payment}
                invoice={defaultReceiptData.invoice}
                patient={defaultReceiptData.patient}
                clinic={clinic}
              />
            )}

            {currentDocType === 'prescription' && (
              <PrescriptionPrintTemplate
                data={defaultPrescriptionData}
                clinic={clinic}
              />
            )}

            {currentDocType === 'medical_report' && (
              <MedicalReportPrintTemplate
                data={defaultMedicalReportData}
                clinic={clinic}
              />
            )}

            {currentDocType === 'sick_leave' && (
              <SickLeavePrintTemplate
                data={defaultSickLeaveData}
                clinic={clinic}
              />
            )}

            {currentDocType === 'treatment_plan' && (
              <TreatmentPlanPrintTemplate
                data={defaultTreatmentPlanData}
                clinic={clinic}
              />
            )}

            {currentDocType === 'lab_order' && (
              <LabOrderPrintTemplate
                data={defaultLabOrderData}
                clinic={clinic}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
