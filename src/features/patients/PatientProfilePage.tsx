import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { PatientProfileBanner } from './components/profile/PatientProfileBanner';
import { PatientStatusCards } from './components/profile/PatientStatusCards';
import { PatientOdontogramSection } from './components/profile/PatientOdontogramSection';
import { PatientTreatmentPlanTab } from './components/profile/PatientTreatmentPlanTab';
import { PatientAppointmentsTab } from './components/profile/PatientAppointmentsTab';
import { PatientBillingTab } from './components/profile/PatientBillingTab';
import { PatientImagingTab } from './components/profile/PatientImagingTab';
import { PatientPrescriptionsTab } from './components/profile/PatientPrescriptionsTab';
import { PatientMedicalHistoryTab } from './components/profile/PatientMedicalHistoryTab';
import { PatientNotesTab } from './components/profile/PatientNotesTab';
import { AppointmentFormModal } from '@/components/appointments/AppointmentFormModal';
import { InvoiceFormModal } from '@/components/billing/InvoiceFormModal';
import { InvoiceDetailsModal } from '@/components/billing/InvoiceDetailsModal';
import { PatientFormDialog } from './components/PatientFormDialog';
import type {
  ToothCondition,
  ToothSurface,
  Appointment,
  TreatmentPlan,
  Image,
  AppointmentStatus,
  MedicalConditionKey,
  AllergySeverity,
} from '@shared/contracts';
import {
  LayoutDashboard,
  Activity,
  Stethoscope,
  Calendar,
  Receipt,
  Camera,
  Pill,
  HeartPulse,
  MessageSquare,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

type ProfileTab =
  | 'overview'
  | 'odontogram'
  | 'treatment_plans'
  | 'appointments'
  | 'billing'
  | 'imaging'
  | 'prescriptions'
  | 'medical_history'
  | 'notes';

export const PatientProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  // Modals state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);

  // 1. Fetch Patient
  const {
    data: patientResult,
    isLoading: isPatientLoading,
  } = useQuery({
    queryKey: queryKeys.patients.detail(id || ''),
    queryFn: () => api.patients.getById(id!),
    enabled: !!id,
  });

  const patient = patientResult?.ok ? patientResult.data : null;

  // 2. Fetch Dentists
  const { data: dentistsResult } = useQuery({
    queryKey: ['staff', { role: 'dentist' }],
    queryFn: () => api.staff.list({ role: 'dentist', page: 1, limit: 100, sort_order: 'desc' }),
  });
  const dentists = dentistsResult?.ok ? dentistsResult.data.items : [];
  const attendingDentist = dentists.find((d) => d.id === patient?.primary_dentist_id) || null;

  // 3. Fetch Insurance Companies
  const { data: insuranceResult } = useQuery({
    queryKey: queryKeys.insurance.companies,
    queryFn: () => api.insurance.getCompanies(),
  });
  const insuranceCompanies = insuranceResult?.ok ? insuranceResult.data : [];
  const insuranceCompany =
    insuranceCompanies.find((c) => c.id === patient?.insurance_company_id) || null;

  // 4. Fetch Medical History & Allergies
  const { data: medicalHistoryResult } = useQuery({
    queryKey: ['medicalHistory', id],
    queryFn: () => api.patients.getMedicalHistory(id!),
    enabled: !!id,
  });
  const medicalHistory = medicalHistoryResult?.ok ? medicalHistoryResult.data : [];

  const { data: allergiesResult } = useQuery({
    queryKey: ['allergies', id],
    queryFn: () => api.patients.getAllergies(id!),
    enabled: !!id,
  });
  const allergies = allergiesResult?.ok ? allergiesResult.data : [];

  // 5. Fetch Tooth Records
  const { data: toothRecordsResult } = useQuery({
    queryKey: ['toothRecords', id],
    queryFn: () => api.toothRecords.getByPatient(id!),
    enabled: !!id,
  });
  const toothRecords = toothRecordsResult?.ok ? toothRecordsResult.data : [];

  // 6. Fetch Treatments & Plans & Procedures
  const { data: treatmentsResult } = useQuery({
    queryKey: ['treatments', { patient_id: id }],
    queryFn: () => api.treatments.list({ patient_id: id, page: 1, limit: 100, sort_order: 'desc' }),
    enabled: !!id,
  });
  const treatments = treatmentsResult?.ok ? treatmentsResult.data.items : [];

  const { data: plansResult } = useQuery({
    queryKey: ['treatmentPlans', id],
    queryFn: () => api.treatments.getPlansByPatient(id!),
    enabled: !!id,
  });
  const treatmentPlans = plansResult?.ok ? plansResult.data : [];

  const { data: proceduresResult } = useQuery({
    queryKey: queryKeys.treatments.procedures(),
    queryFn: () => api.treatments.getProcedures(),
  });
  const procedures = proceduresResult?.ok ? proceduresResult.data.items : [];

  // 7. Fetch Invoices & Payments
  const { data: invoicesResult } = useQuery({
    queryKey: ['invoices', { patient_id: id }],
    queryFn: () => api.invoices.list({ patient_id: id, page: 1, limit: 100, sort_order: 'desc' }),
    enabled: !!id,
  });
  const invoices = invoicesResult?.ok ? invoicesResult.data.items : [];

  // 8. Fetch Appointments
  const { data: appointmentsResult } = useQuery({
    queryKey: ['appointments', { patient_id: id }],
    queryFn: () => api.appointments.list({ patient_id: id, page: 1, limit: 100, sort_order: 'desc' }),
    enabled: !!id,
  });
  const appointments = appointmentsResult?.ok ? appointmentsResult.data.items : [];

  // 9. Fetch Images
  const { data: imagesResult } = useQuery({
    queryKey: ['images', id],
    queryFn: () => api.images.getByPatient(id!),
    enabled: !!id,
  });
  const images = imagesResult?.ok ? imagesResult.data : [];

  // Mutations
  const updateToothMutation = useMutation({
    mutationFn: (data: {
      tooth_number: number;
      condition: ToothCondition;
      surface?: ToothSurface;
      note?: string;
    }) =>
      api.toothRecords.saveRecord({
        clinic_id: patient?.clinic_id || 'c1000000-0000-0000-0000-000000000001',
        patient_id: id!,
        tooth_number: data.tooth_number,
        condition: data.condition,
        surface: data.surface || 'whole',
        status: 'existing',
        treatment_id: null,
        note: data.note || null,
        recorded_at: new Date().toISOString(),
        recorded_by: patient?.primary_dentist_id || 'u1000000-0000-0000-0000-000000000002',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toothRecords', id] });
      toast({
        title: 'تم تحديث حالة السن',
        description: 'تم حفظ التشخيص الجديد في مخطط الأسنان بنجاح',
        variant: 'success',
      });
    },
  });

  const saveHistoryMutation = useMutation({
    mutationFn: (data: { condition_key: MedicalConditionKey; has_condition: boolean; details?: string }) =>
      api.patients.saveMedicalHistory({
        clinic_id: patient?.clinic_id || 'c1000000-0000-0000-0000-000000000001',
        patient_id: id!,
        condition_key: data.condition_key,
        has_condition: data.has_condition,
        details: data.details || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicalHistory', id] });
      toast({
        title: 'تم تحديث السجل الطبي',
        variant: 'success',
      });
    },
  });

  const addAllergyMutation = useMutation({
    mutationFn: (data: { allergen: string; severity: AllergySeverity; reaction: string | null }) =>
      api.patients.saveAllergy({
        clinic_id: patient?.clinic_id || 'c1000000-0000-0000-0000-000000000001',
        patient_id: id!,
        allergen: data.allergen,
        severity: data.severity,
        notes: data.reaction,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allergies', id] });
      toast({
        title: 'تم تسجيل الحساسية',
        variant: 'success',
      });
    },
  });

  const deleteAllergyMutation = useMutation({
    mutationFn: (allergyId: string) => api.patients.deleteAllergy(allergyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allergies', id] });
      toast({
        title: 'تم حذف الحساسية',
        variant: 'success',
      });
    },
  });

  const updateAppointmentStatusMutation = useMutation({
    mutationFn: ({ apptId, status }: { apptId: string; status: AppointmentStatus }) =>
      api.appointments.updateStatus(apptId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', { patient_id: id }] });
      toast({
        title: 'تم تغيير حالة الموعد',
        variant: 'success',
      });
    },
  });

  // Loading state
  if (isPatientLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Spinner size="lg" className="text-brand-blue" />
        <span className="text-sm font-semibold text-slate-600">
          جاري تحميل ملف المريض ومخطط الأسنان...
        </span>
      </div>
    );
  }

  // Not Found State
  if (!patient) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">الملف الطبي غير موجود</h2>
        <p className="text-xs text-slate-500">
          لم يتم العثور على مريض بالمعرف المطلوب، قد يكون تم حذفه أو أن الرابط غير صحيح.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate('/patients')}
          icon={<ArrowRight className="w-4 h-4" />}
          className="text-xs"
        >
          العودة لقائمة المرضى
        </Button>
      </div>
    );
  }

  const tabsConfig = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    {
      id: 'odontogram',
      label: 'مخطط الأسنان',
      icon: Activity,
      count: toothRecords.length,
    },
    {
      id: 'treatment_plans',
      label: 'الخطة العلاجية',
      icon: Stethoscope,
      count: treatmentPlans.length,
    },
    {
      id: 'appointments',
      label: 'المواعيد والزيارات',
      icon: Calendar,
      count: appointments.length,
    },
    {
      id: 'billing',
      label: 'الفواتير والمالية',
      icon: Receipt,
      count: invoices.length,
    },
    {
      id: 'imaging',
      label: 'الأشعة والصور',
      icon: Camera,
      count: images.length,
    },
    {
      id: 'prescriptions',
      label: 'الوصفات الدوائية',
      icon: Pill,
    },
    {
      id: 'medical_history',
      label: 'السجل الطبي والحساسية',
      icon: HeartPulse,
      count: allergies.length > 0 ? allergies.length : undefined,
      badgeColor: allergies.some((a: { severity: string }) => a.severity === 'severe') ? 'bg-rose-600 text-white' : undefined,
    },
    {
      id: 'notes',
      label: 'الملاحظات السريرية',
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Gradient Banner */}
      <PatientProfileBanner
        patient={patient}
        attendingDentist={attendingDentist}
        medicalHistory={medicalHistory}
        allergies={allergies}
        onBookAppointment={() => setIsAppointmentModalOpen(true)}
        onCreateInvoice={() => setIsInvoiceModalOpen(true)}
        onEditPatient={() => setIsEditPatientOpen(true)}
      />

      {/* 2. Key Status Metrics Cards */}
      <PatientStatusCards
        patient={patient}
        invoices={invoices}
        appointments={appointments}
        insuranceCompany={insuranceCompany}
      />

      {/* 3. Navigation Tabs Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Active Tab Content */}
      <div className="transition-all">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Interactive Odontogram Section */}
            <PatientOdontogramSection
              records={toothRecords}
              treatments={treatments}
              patientId={id}
              onUpdateCondition={(toothNum, cond, surfaces, note) => {
                updateToothMutation.mutate({
                  tooth_number: toothNum,
                  condition: cond,
                  surface: surfaces?.[0] || 'whole',
                  note,
                });
              }}
            />

            {/* Quick Two-Column: Treatment Plans & Appointments Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Treatment Plans Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-brand-navy" />
                    الخطة العلاجية الحالية
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setActiveTab('treatment_plans')}
                  >
                    عرض التفاصيل
                  </Button>
                </div>

                {treatmentPlans.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    لا توجد خطة علاجية مقترحة حالياً
                  </p>
                ) : (
                  <div className="space-y-3">
                    {treatmentPlans.slice(0, 2).map((plan: TreatmentPlan) => (
                      <div
                        key={plan.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">{plan.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            الحالة: {plan.status}
                          </p>
                        </div>
                        <Badge variant="info" className="text-xs font-mono font-bold">
                          {plan.total_halalas / 100} ر.س
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Appointments Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    المواعيد والزيارات
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setActiveTab('appointments')}
                  >
                    عرض كل المواعيد
                  </Button>
                </div>

                {appointments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    لا توجد مواعيد مسجلة للمريض
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {appointments.slice(0, 3).map((appt: Appointment) => (
                      <div
                        key={appt.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">
                            {new Date(appt.start_at).toLocaleDateString('ar-SA')} -{' '}
                            {new Date(appt.start_at).toLocaleTimeString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-[11px] text-slate-500">{appt.notes || 'كشف ومتابعة'}</p>
                        </div>
                        <Badge
                          variant={appt.status === 'completed' ? 'success' : 'default'}
                          className="text-[10px]"
                        >
                          {appt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Imaging Preview Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-brand-navy" />
                  أحدث صور وأشعة المريض (X-Rays)
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setActiveTab('imaging')}
                >
                  معرض الأشعة الكامل
                </Button>
              </div>

              {images.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">لا توجد صور أو أشعة مرفوعة</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.slice(0, 4).map((img: Image) => (
                    <div
                      key={img.id}
                      onClick={() => setActiveTab('imaging')}
                      className="group cursor-pointer rounded-xl overflow-hidden border border-slate-200 aspect-video relative bg-slate-900"
                    >
                      <img
                        src={img.file_path || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80'}
                        alt="Preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      {img.tooth_number && (
                        <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-brand-navy/90 text-white font-mono text-[10px] font-bold">
                          #{img.tooth_number}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'odontogram' && (
          <PatientOdontogramSection
            records={toothRecords}
            treatments={treatments}
            patientId={id}
            onUpdateCondition={(toothNum, cond, surfaces, note) => {
              updateToothMutation.mutate({
                tooth_number: toothNum,
                condition: cond,
                surface: surfaces?.[0] || 'whole',
                note,
              });
            }}
          />
        )}

        {activeTab === 'treatment_plans' && (
          <PatientTreatmentPlanTab
            patient={patient}
            plans={treatmentPlans}
            treatments={treatments}
            procedures={procedures}
          />
        )}

        {activeTab === 'appointments' && (
          <PatientAppointmentsTab
            appointments={appointments}
            dentists={dentists}
            onBookAppointment={() => setIsAppointmentModalOpen(true)}
            onUpdateStatus={(apptId, status) =>
              updateAppointmentStatusMutation.mutate({ apptId, status })
            }
          />
        )}

        {activeTab === 'billing' && (
          <PatientBillingTab
            invoices={invoices}
            onCreateInvoice={() => setIsInvoiceModalOpen(true)}
            onViewInvoice={(invoiceId) => {
              setViewingInvoiceId(invoiceId);
            }}
          />
        )}

        {activeTab === 'imaging' && (
          <PatientImagingTab
            images={images}
            patientId={patient.id}
            patientName={`${patient.first_name} ${patient.family_name}`}
          />
        )}

        {activeTab === 'prescriptions' && (
          <PatientPrescriptionsTab
            patient={patient}
            dentists={dentists}
            allergies={allergies}
            medicalHistory={medicalHistory}
          />
        )}

        {activeTab === 'medical_history' && (
          <PatientMedicalHistoryTab
            patientId={patient.id}
            medicalHistory={medicalHistory}
            allergies={allergies}
            onSaveHistory={(key, hasCondition, details) => {
              saveHistoryMutation.mutate({
                condition_key: key as MedicalConditionKey,
                has_condition: hasCondition,
                details,
              });
            }}
            onAddAllergy={(allergy) => {
              addAllergyMutation.mutate(allergy);
            }}
            onDeleteAllergy={(allergyId) => {
              deleteAllergyMutation.mutate(allergyId);
            }}
          />
        )}

        {activeTab === 'notes' && (
          <PatientNotesTab patientId={patient.id} dentists={dentists} />
        )}
      </div>

      {/* Appointment Modal */}
      {isAppointmentModalOpen && (
        <AppointmentFormModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          defaultPatientId={patient.id}
          onSubmit={async (data) => {
            await api.appointments.create(data as any);
            setIsAppointmentModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['appointments', { patient_id: id }] });
            toast({
              title: 'تم حجز الموعد بنجاح',
              variant: 'success',
            });
          }}
        />
      )}

      {/* Invoice Form Modal */}
      {isInvoiceModalOpen && (
        <InvoiceFormModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          defaultPatientId={patient.id}
          onSubmit={async (data) => {
            await api.invoices.create(data);
            setIsInvoiceModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['invoices', { patient_id: id }] });
            toast({
              title: 'تم إصدار الفاتورة الضريبية',
              variant: 'success',
            });
          }}
        />
      )}

      {/* Invoice Details Modal */}
      {viewingInvoiceId && (
        <InvoiceDetailsModal
          isOpen={!!viewingInvoiceId}
          onClose={() => setViewingInvoiceId(null)}
          invoiceId={viewingInvoiceId}
        />
      )}

      {/* Edit Patient Dialog */}
      {isEditPatientOpen && (
        <PatientFormDialog
          open={isEditPatientOpen}
          onOpenChange={setIsEditPatientOpen}
          patient={patient}
          onSuccess={() => {
            setIsEditPatientOpen(false);
            queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(id!) });
            toast({
              title: 'تم تحديث بيانات المريض',
              variant: 'success',
            });
          }}
        />
      )}
    </div>
  );
};

export default PatientProfilePage;
