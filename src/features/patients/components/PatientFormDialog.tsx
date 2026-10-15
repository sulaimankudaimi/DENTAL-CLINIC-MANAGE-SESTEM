import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  User,
  Phone,
  HeartPulse,
  Shield,
  AlertTriangle,
  Upload,
  Trash2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Plus,
} from 'lucide-react';
import type {
  Patient,
  CreatePatient,
  UpdatePatient,
  MedicalConditionKey,
  AllergySeverity,
} from '@shared/contracts';
import {
  BLOOD_TYPES,
  BLOOD_TYPE_AR,
  MARITAL_STATUSES,
  MARITAL_STATUS_AR,
  MEDICAL_CONDITION_KEYS,
  MEDICAL_CONDITION_KEY_AR,
  ALLERGY_SEVERITIES,
  ALLERGY_SEVERITY_AR,
} from '@shared/contracts';
import {
  useCreatePatient,
  useUpdatePatient,
  useDentists,
  useInsuranceCompanies,
  useCheckPatientDuplicate,
  useNextPatientCode,
} from '../hooks/usePatients';

// Common nationalities for dental clinics in Saudi Arabia
const NATIONALITIES = [
  'سعودي',
  'مصري',
  'يمني',
  'سوري',
  'أردني',
  'سوداني',
  'لبناني',
  'فلسطيني',
  'باكستاني',
  'هندي',
  'فلبيني',
  'أخرى',
];

// Common allergies in dental practice
const COMMON_ALLERGIES = [
  'البنسلين ومشتقاته (Penicillin)',
  'المخدر الموضعي (Local Anesthetics)',
  'الأسبرين (Aspirin)',
  'أدوية السلفا (Sulfa Drugs)',
  'اللاتكس والمطاط (Latex)',
  'مضادات الالتهاب غير الستيرويدية (NSAIDs)',
  'الكودايين (Codeine)',
  'الإريثروميسين (Erythromycin)',
];

const DRAFT_STORAGE_KEY = 'eyadati_patient_form_draft';

// Age calculation helper
function getAgeFromBirthDate(birthDateStr?: string | null): number | null {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

// Multi-step validation schema with Arabic error messages
const patientFormSchema = z.object({
  // Step 1: Personal Information
  first_name: z
    .string()
    .trim()
    .min(2, { message: 'الاسم الأول مطلوب ويجب ألا يقل عن حرفين' }),
  father_name: z.string().trim().optional(),
  grandfather_name: z.string().trim().optional(),
  family_name: z
    .string()
    .trim()
    .min(2, { message: 'اسم العائلة مطلوب ويجب ألا يقل عن حرفين' }),
  gender: z.enum(['male', 'female'] as const, {
    required_error: 'يرجى تحديد الجنس',
  }),
  birth_date: z.string().optional(),
  national_id: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^[12]\d{9}$/.test(val),
      { message: 'رقم الهوية الوطنية أو الإقامة يجب أن يبدأ بـ 1 أو 2 ويتكون من 10 أرقام' }
    )
    .optional(),
  nationality: z.string().default('سعودي'),
  blood_type: z.enum(BLOOD_TYPES).default('unknown'),
  marital_status: z.enum(MARITAL_STATUSES).default('single'),

  // Step 2: Contact & Emergency
  phone: z
    .string()
    .trim()
    .refine((val) => /^05\d{8}$/.test(val), {
      message: 'رقم الجوال يجب أن يبدأ بـ 05 ويتكوّن من 10 أرقام (مثال: 0501234567)',
    }),
  phone_alt: z
    .string()
    .trim()
    .refine((val) => !val || /^05\d{8}$/.test(val), {
      message: 'رقم الجوال الإضافي يجب أن يبدأ بـ 05 ويتكون من 10 أرقام',
    })
    .optional(),
  email: z
    .string()
    .trim()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: 'البريد الإلكتروني غير صحيح',
    })
    .optional(),
  city: z.string().trim().default('الرياض'),
  address: z.string().trim().optional(),
  occupation: z.string().trim().optional(),
  emergency_contact_name: z.string().trim().optional(),
  emergency_contact_phone: z
    .string()
    .trim()
    .refine((val) => !val || /^05\d{8}$/.test(val), {
      message: 'رقم هاتف الطوارئ يجب أن يتكون من 10 أرقام ويبدأ بـ 05',
    })
    .optional(),
  emergency_contact_relation: z.string().trim().optional(),

  // Step 3: Medical History & Allergies
  conditions: z.record(
    z.string(),
    z.object({
      has_condition: z.boolean(),
      details: z.string().optional(),
    })
  ),
  allergies: z.array(
    z.object({
      allergen: z.string(),
      severity: z.enum(ALLERGY_SEVERITIES),
      notes: z.string().optional(),
    })
  ),
  current_medications: z.string().optional(),
  medical_notes: z.string().optional(),

  // Step 4: Insurance, Dentist, Referral & Photo
  code: z.string().min(2, { message: 'كود المريض مطلوب' }),
  primary_dentist_id: z.string().optional(),
  insurance_company_id: z.string().optional(),
  insurance_policy_no: z.string().optional(),
  insurance_expiry: z.string().optional(),
  referral_source: z.string().optional(),
  photo_path: z.string().optional(),
  is_active: z.boolean().default(true),
});

type PatientFormData = z.infer<typeof patientFormSchema>;

export interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient | null;
  onSuccess?: (patient: Patient) => void;
}

export const PatientFormDialog: React.FC<PatientFormDialogProps> = ({
  open,
  onOpenChange,
  patient,
  onSuccess,
}) => {
  const isEdit = !!patient;
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);

  // Queries & Mutations
  const { data: dentists } = useDentists();
  const { data: insuranceCompanies } = useInsuranceCompanies();
  const { checkDuplicate } = useCheckPatientDuplicate();
  const generatedCode = useNextPatientCode();
  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();

  // Custom allergy addition state
  const [customAllergenName, setCustomAllergenName] = useState('');
  const [customAllergenSeverity, setCustomAllergenSeverity] = useState<AllergySeverity>('moderate');

  // Photo preview state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize initial conditions map
  const defaultConditions = useMemo(() => {
    const map: Record<string, { has_condition: boolean; details: string }> = {};
    for (const key of MEDICAL_CONDITION_KEYS) {
      map[key] = { has_condition: false, details: '' };
    }
    return map;
  }, []);

  const defaultValues: PatientFormData = useMemo(() => {
    if (patient) {
      return {
        first_name: patient.first_name || '',
        father_name: patient.father_name || '',
        grandfather_name: '',
        family_name: patient.family_name || '',
        gender: patient.gender || 'male',
        birth_date: patient.birth_date || '',
        national_id: patient.national_id || '',
        nationality: 'سعودي',
        blood_type: patient.blood_type || 'unknown',
        marital_status: patient.marital_status || 'single',
        phone: patient.phone || '',
        phone_alt: patient.phone_alt || '',
        email: patient.email || '',
        city: patient.city || 'الرياض',
        address: patient.address || '',
        occupation: patient.occupation || '',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
        emergency_contact_relation: '',
        conditions: defaultConditions,
        allergies: [],
        current_medications: '',
        medical_notes: patient.notes || '',
        code: patient.code,
        primary_dentist_id: patient.primary_dentist_id || '',
        insurance_company_id: patient.insurance_company_id || '',
        insurance_policy_no: patient.insurance_policy_no || '',
        insurance_expiry: patient.insurance_expiry || '',
        referral_source: patient.referral_source || '',
        photo_path: patient.photo_path || '',
        is_active: patient.is_active ?? true,
      };
    }
    return {
      first_name: '',
      father_name: '',
      grandfather_name: '',
      family_name: '',
      gender: 'male',
      birth_date: '',
      national_id: '',
      nationality: 'سعودي',
      blood_type: 'unknown',
      marital_status: 'single',
      phone: '',
      phone_alt: '',
      email: '',
      city: 'الرياض',
      address: '',
      occupation: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: '',
      conditions: defaultConditions,
      allergies: [],
      current_medications: '',
      medical_notes: '',
      code: generatedCode || 'P-1001',
      primary_dentist_id: '',
      insurance_company_id: '',
      insurance_policy_no: '',
      insurance_expiry: '',
      referral_source: '',
      photo_path: '',
      is_active: true,
    };
  }, [patient, defaultConditions, generatedCode]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    trigger,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Reset form or load draft when opening
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setPhotoPreview(null);
      return;
    }

    if (patient) {
      reset(defaultValues);
      setPhotoPreview(patient.photo_path || null);
    } else {
      // Check if draft exists in sessionStorage
      const savedDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          reset(parsed);
          setHasDraftNotice(true);
          if (parsed.photo_path) setPhotoPreview(parsed.photo_path);
          return;
        } catch {
          // ignore corrupted draft
        }
      }
      reset(defaultValues);
      if (generatedCode) setValue('code', generatedCode);
    }
  }, [open, patient, reset, defaultValues, generatedCode, setValue]);

  // Watched fields for dynamic UI
  const watchedBirthDate = watch('birth_date');
  const watchedGender = watch('gender');
  const watchedPhone = watch('phone');
  const watchedNationalId = watch('national_id');
  const watchedInsuranceId = watch('insurance_company_id');
  const watchedAllergies = watch('allergies') || [];

  // Real-time Age calculation
  const calculatedAge = useMemo(() => {
    return getAgeFromBirthDate(watchedBirthDate);
  }, [watchedBirthDate]);

  // Real-time duplicate check warning
  const duplicateWarning = useMemo(() => {
    return checkDuplicate(watchedPhone, watchedNationalId, patient?.id);
  }, [watchedPhone, watchedNationalId, patient?.id, checkDuplicate]);

  // Auto-save draft on change when creating
  useEffect(() => {
    if (!isEdit && isDirty && open) {
      const subscription = watch((value) => {
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(value));
      });
      return () => subscription.unsubscribe();
    }
  }, [isEdit, isDirty, open, watch]);

  // Handle Accidental Close
  const handleRequestClose = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardAndClose = () => {
    if (!isEdit) {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    }
    setShowConfirmClose(false);
    onOpenChange(false);
  };

  const handleSaveDraftAndClose = () => {
    const currentValues = watch();
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(currentValues));
    setShowConfirmClose(false);
    onOpenChange(false);
  };

  // Step validation before proceeding
  const handleNextStep = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await trigger(['first_name', 'family_name', 'gender', 'national_id', 'birth_date']);
    } else if (currentStep === 2) {
      isValid = await trigger(['phone', 'phone_alt', 'email', 'emergency_contact_phone']);

      // Clinical/legal rule: For minors under 18, guardian details are mandatory
      if (calculatedAge !== null && calculatedAge < 18) {
        const guardianName = watch('emergency_contact_name');
        const guardianPhone = watch('emergency_contact_phone');
        if (!guardianName || !guardianName.trim()) {
          setError('emergency_contact_name', { message: 'اسم ولي الأمر مطلوب للمرضى القُصّر (أقل من 18 عاماً)' });
          isValid = false;
        }
        if (!guardianPhone || !guardianPhone.trim()) {
          setError('emergency_contact_phone', { message: 'رقم هاتف ولي الأمر مطلوب للمرضى القُصّر' });
          isValid = false;
        }
      }
    } else if (currentStep === 3) {
      isValid = true; // Medical history is optional
    }

    if (isValid && currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  // Image Upload Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        setValue('photo_path', base64, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setValue('photo_path', '', { shouldDirty: true });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Allergy list toggle
  const toggleCommonAllergy = (allergen: string) => {
    const existingIndex = watchedAllergies.findIndex((a) => a.allergen === allergen);
    if (existingIndex >= 0) {
      const updated = watchedAllergies.filter((_, idx) => idx !== existingIndex);
      setValue('allergies', updated, { shouldDirty: true });
    } else {
      const updated = [...watchedAllergies, { allergen, severity: 'moderate' as const }];
      setValue('allergies', updated, { shouldDirty: true });
    }
  };

  const addCustomAllergy = () => {
    if (!customAllergenName.trim()) return;
    const updated = [
      ...watchedAllergies,
      { allergen: customAllergenName.trim(), severity: customAllergenSeverity },
    ];
    setValue('allergies', updated, { shouldDirty: true });
    setCustomAllergenName('');
  };

  const removeAllergy = (index: number) => {
    const updated = watchedAllergies.filter((_, idx) => idx !== index);
    setValue('allergies', updated, { shouldDirty: true });
  };

  // Form Submission
  const onSubmit = async (data: PatientFormData) => {
    try {
      // Build father_name with grandfather_name if provided
      let composedFatherName = data.father_name || '';
      if (data.grandfather_name) {
        composedFatherName = `${composedFatherName} ${data.grandfather_name}`.trim();
      }

      // Compile notes with medical condition details and medications
      const medicalDetailsList: string[] = [];
      for (const [key, val] of Object.entries(data.conditions || {})) {
        if (val.has_condition) {
          const label = MEDICAL_CONDITION_KEY_AR[key as MedicalConditionKey] || key;
          medicalDetailsList.push(`${label}: ${val.details || 'نعم'}`);
        }
      }

      if (data.current_medications?.trim()) {
        medicalDetailsList.push(`الأدوية الحالية: ${data.current_medications.trim()}`);
      }

      if (data.medical_notes?.trim()) {
        medicalDetailsList.push(`ملاحظات سريرية: ${data.medical_notes.trim()}`);
      }

      const compiledNotes = medicalDetailsList.join('\n') || null;

      if (isEdit && patient) {
        const payload: UpdatePatient = {
          first_name: data.first_name,
          father_name: composedFatherName || null,
          family_name: data.family_name,
          gender: data.gender,
          birth_date: data.birth_date || null,
          national_id: data.national_id || null,
          phone: data.phone,
          phone_alt: data.phone_alt || null,
          email: data.email || null,
          address: data.address || null,
          city: data.city || 'الرياض',
          blood_type: data.blood_type,
          marital_status: data.marital_status,
          occupation: data.occupation || null,
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
          primary_dentist_id: data.primary_dentist_id || null,
          insurance_company_id: data.insurance_company_id || null,
          insurance_policy_no: data.insurance_policy_no || null,
          insurance_expiry: data.insurance_expiry || null,
          referral_source: data.referral_source || null,
          notes: compiledNotes,
          photo_path: data.photo_path || null,
          is_active: data.is_active,
        };

        const updated = await updatePatientMutation.mutateAsync({ id: patient.id, data: payload });
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        onOpenChange(false);
        if (onSuccess) onSuccess(updated);
      } else {
        const payload: CreatePatient = {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          code: data.code || generatedCode,
          first_name: data.first_name,
          father_name: composedFatherName || null,
          family_name: data.family_name,
          gender: data.gender,
          birth_date: data.birth_date || null,
          national_id: data.national_id || null,
          phone: data.phone,
          phone_alt: data.phone_alt || null,
          email: data.email || null,
          address: data.address || null,
          city: data.city || 'الرياض',
          blood_type: data.blood_type,
          marital_status: data.marital_status,
          occupation: data.occupation || null,
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
          primary_dentist_id: data.primary_dentist_id || null,
          insurance_company_id: data.insurance_company_id || null,
          insurance_policy_no: data.insurance_policy_no || null,
          insurance_expiry: data.insurance_expiry || null,
          referral_source: data.referral_source || null,
          notes: compiledNotes,
          photo_path: data.photo_path || null,
          is_active: data.is_active,
        };

        const created = await createPatientMutation.mutateAsync(payload);
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        onOpenChange(false);
        if (onSuccess) onSuccess(created);
      }
    } catch (err) {
      console.error('Failed to save patient:', err);
    }
  };

  const STEPS = [
    { id: 1, title: 'البيانات الشخصية', desc: 'الاسم، العمر، والهوية', icon: User },
    { id: 2, title: 'بيانات الاتصال والعنوان', desc: 'الجوال، السكن، والطوارئ', icon: Phone },
    { id: 3, title: 'التاريخ الطبي', desc: 'الأمراض المزمنة والحساسيات', icon: HeartPulse },
    { id: 4, title: 'التأمين والإحالة', desc: 'الطبيب، البوليصة، والصورة', icon: Shield },
  ];

  return (
    <>
      <Modal open={open} onOpenChange={handleRequestClose}>
        <ModalContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-surface-card border border-surface-border shadow-2xl">
          {/* Header */}
          <ModalHeader className="px-6 py-4 border-b border-surface-border bg-surface-hover/50 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <ModalTitle className="text-base font-bold text-text-primary">
                    {isEdit ? `تعديل ملف المريض: ${patient.first_name} ${patient.family_name}` : 'تسجيل ملف مريض جديد'}
                  </ModalTitle>
                  <ModalDescription className="text-xs text-text-secondary">
                    {isEdit
                      ? `كود المريض: ${patient.code} — يرجى مراجعة البيانات بعناية وتحديثها`
                      : 'أدخل البيانات المطلوبة لفتح سجل طبي إلكتروني معتمد للمريض'}
                  </ModalDescription>
                </div>
              </div>

              {!isEdit && (
                <Badge variant="neutral" className="text-brand-blue border-brand-blue/30 bg-brand-blue/5 font-mono">
                  {watch('code') || generatedCode}
                </Badge>
              )}
            </div>

            {/* Stepper Navigator */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-surface-border/60">
              {STEPS.map((step) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (isCompleted || isEdit) setCurrentStep(step.id as any);
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-lg text-right transition-all select-none ${
                      isActive
                        ? 'bg-brand-blue text-white shadow-xs'
                        : isCompleted
                        ? 'bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/15'
                        : 'text-text-muted hover:bg-surface-hover opacity-70'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : isCompleted
                          ? 'bg-brand-blue text-white'
                          : 'bg-surface-border text-text-secondary'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold truncate">{step.title}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive ? 'text-white/80' : isCompleted ? 'text-brand-blue/80' : 'text-text-muted'
                        }`}
                      >
                        {step.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ModalHeader>

          {/* Draft recovery banner */}
          {hasDraftNotice && !isEdit && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-800">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                تم استعادة البيانات تلقائياً من آخر مسودة محفوظة غير مكتملة.
              </span>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem(DRAFT_STORAGE_KEY);
                  reset(defaultValues);
                  setHasDraftNotice(false);
                }}
                className="text-amber-900 underline font-semibold hover:text-amber-950"
              >
                مسح المسودة والبدء من جديد
              </button>
            </div>
          )}

          {/* Duplicate phone / national ID warning */}
          {duplicateWarning.isDuplicate && (
            <div className="bg-status-warning-bg border-b border-status-warning-border px-6 py-2 flex items-center gap-2 text-xs text-status-warning-fg font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {duplicateWarning.field === 'phone'
                  ? `تنبيه: رقم الجوال (${watchedPhone}) مسجل مسبقاً باسم المريض "${duplicateWarning.existingPatient?.first_name} ${duplicateWarning.existingPatient?.family_name}" (كود: ${duplicateWarning.existingPatient?.code})`
                  : `تنبيه: رقم الهوية (${watchedNationalId}) مسجل مسبقاً باسم المريض "${duplicateWarning.existingPatient?.first_name} ${duplicateWarning.existingPatient?.family_name}" (كود: ${duplicateWarning.existingPatient?.code})`}
              </span>
            </div>
          )}

          {/* Form Content Area */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-6 space-y-6"
            id="patient-stepper-form"
          >
            {/* STEP 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    label="الاسم الأول"
                    required
                    placeholder="مثال: محمد"
                    {...register('first_name')}
                    error={errors.first_name?.message}
                  />
                  <Input
                    label="اسم الأب"
                    placeholder="مثال: عبد الله"
                    {...register('father_name')}
                  />
                  <Input
                    label="اسم الجد"
                    placeholder="مثال: إبراهيم"
                    {...register('grandfather_name')}
                  />
                  <Input
                    label="اسم العائلة / اللقب"
                    required
                    placeholder="مثال: القحطاني"
                    {...register('family_name')}
                    error={errors.family_name?.message}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Gender Select */}
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <Select
                        label="الجنس"
                        required
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[
                          { label: 'ذكر', value: 'male' },
                          { label: 'أنثى', value: 'female' },
                        ]}
                        error={errors.gender?.message}
                      />
                    )}
                  />

                  {/* Birth Date with Auto Age */}
                  <div>
                    <Input
                      type="date"
                      label="تاريخ الميلاد"
                      {...register('birth_date')}
                      error={errors.birth_date?.message}
                      helperText={
                        calculatedAge !== null
                          ? `العمر المحسوب: ${calculatedAge} سنة`
                          : 'أدخل تاريخ الميلاد لحساب العمر تلقائياً'
                      }
                    />
                  </div>

                  {/* National ID / Iqama */}
                  <Input
                    label="رقم الهوية الوطنية / الإقامة"
                    placeholder="10 أرقام تبدأ بـ 1 أو 2"
                    {...register('national_id')}
                    error={errors.national_id?.message}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Nationality */}
                  <Controller
                    control={control}
                    name="nationality"
                    render={({ field }) => (
                      <Select
                        label="الجنسية"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={NATIONALITIES.map((n) => ({ label: n, value: n }))}
                      />
                    )}
                  />

                  {/* Blood Type */}
                  <Controller
                    control={control}
                    name="blood_type"
                    render={({ field }) => (
                      <Select
                        label="فصيلة الدم"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={BLOOD_TYPES.map((b) => ({
                          label: BLOOD_TYPE_AR[b],
                          value: b,
                        }))}
                      />
                    )}
                  />

                  {/* Marital Status */}
                  <Controller
                    control={control}
                    name="marital_status"
                    render={({ field }) => (
                      <Select
                        label="الحالة الاجتماعية"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={MARITAL_STATUSES.map((m) => ({
                          label: MARITAL_STATUS_AR[m],
                          value: m,
                        }))}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Contact & Emergency */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="رقم الجوال الأساسي"
                    required
                    placeholder="05XXXXXXXX"
                    {...register('phone')}
                    error={errors.phone?.message}
                    helperText="مخصص لإرسال تذكيرات المواعيد عبر الرسائل"
                  />
                  <Input
                    label="رقم جوال إضافي / أرضي"
                    placeholder="05XXXXXXXX"
                    {...register('phone_alt')}
                    error={errors.phone_alt?.message}
                  />
                  <Input
                    type="email"
                    label="البريد الإلكتروني"
                    placeholder="example@domain.com"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="المدينة"
                    defaultValue="الرياض"
                    {...register('city')}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="العنوان السكني / الوطني"
                      placeholder="الحي، اسم الشارع، رقم المبنى..."
                      {...register('address')}
                    />
                  </div>
                </div>

                <Input
                  label="المهنة / جهة العمل"
                  placeholder="مثال: معلم، مهندس، طالب، موظف حكومي..."
                  {...register('occupation')}
                />

                {/* Emergency Contact & Guardian Card */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  calculatedAge !== null && calculatedAge < 18
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-surface-hover/70 border-surface-border'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                    <Phone className={`w-4 h-4 ${calculatedAge !== null && calculatedAge < 18 ? 'text-amber-500' : 'text-status-warning-fg'}`} />
                    <span>
                      {calculatedAge !== null && calculatedAge < 18
                        ? 'بيانات ولي الأمر / المسؤول النظامي (المريض قاصر أقل من 18 عاماً - إلزامي)'
                        : 'جهة الاتصال في حالات الطوارئ (Emergency Contact)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      label={calculatedAge !== null && calculatedAge < 18 ? 'اسم ولي الأمر (مطلوب)' : 'اسم شخص مقرب'}
                      placeholder={calculatedAge !== null && calculatedAge < 18 ? 'الاسم الثلاثي لولي الأمر' : 'مثال: فهد عبد الله (الأخ)'}
                      required={calculatedAge !== null && calculatedAge < 18}
                      {...register('emergency_contact_name')}
                      error={errors.emergency_contact_name?.message}
                    />
                    <Input
                      label={calculatedAge !== null && calculatedAge < 18 ? 'رقم هاتف ولي الأمر (مطلوب)' : 'رقم هاتف الطوارئ'}
                      placeholder="05XXXXXXXX"
                      required={calculatedAge !== null && calculatedAge < 18}
                      {...register('emergency_contact_phone')}
                      error={errors.emergency_contact_phone?.message}
                    />
                    <Input
                      label={calculatedAge !== null && calculatedAge < 18 ? 'صلة القرابة (الوالد / الوالدة / الوصي)' : 'صلة القرابة'}
                      placeholder="مثال: الوالد / الوالدة"
                      {...register('emergency_contact_relation')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Medical History & Allergies */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Chronic Conditions Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-status-danger-fg" />
                      <span className="text-xs font-bold text-text-primary">
                        التاريخ المرضي والحالات السريرية الخاصة
                      </span>
                    </div>
                    <span className="text-[11px] text-text-muted">
                      اختر &quot;نعم&quot; في حال وجود الحالة وأدخل التفاصيل اللازمة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {MEDICAL_CONDITION_KEYS.map((key) => {
                      // Filter pregnancy if male
                      if (key === 'pregnancy' && watchedGender === 'male') {
                        return null;
                      }

                      const label = MEDICAL_CONDITION_KEY_AR[key];
                      const isChecked = watch(`conditions.${key}.has_condition` as any);

                      return (
                        <div
                          key={key}
                          className={`p-3 rounded-xl border transition-all ${
                            isChecked
                              ? 'bg-status-danger-bg/20 border-status-danger-fg/40 shadow-xs'
                              : 'bg-surface-card border-surface-border hover:bg-surface-hover/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-text-primary">{label}</span>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                                <input
                                  type="radio"
                                  value="no"
                                  checked={!isChecked}
                                  onChange={() => {
                                    setValue(`conditions.${key}.has_condition` as any, false, {
                                      shouldDirty: true,
                                    });
                                  }}
                                  className="text-brand-blue"
                                />
                                <span>لا</span>
                              </label>

                              <label className="flex items-center gap-1.5 text-xs cursor-pointer font-bold text-status-danger-fg select-none">
                                <input
                                  type="radio"
                                  value="yes"
                                  checked={!!isChecked}
                                  onChange={() => {
                                    setValue(`conditions.${key}.has_condition` as any, true, {
                                      shouldDirty: true,
                                    });
                                  }}
                                  className="text-status-danger-fg"
                                />
                                <span>نعم</span>
                              </label>
                            </div>
                          </div>

                          {/* Conditional Details Input */}
                          {isChecked && (
                            <div className="mt-2.5 pt-2 border-t border-status-danger-fg/20">
                              <input
                                type="text"
                                placeholder="اكتب تفاصيل إضافية (الدرجة، مدة الإصابة، أدوية الضبط)..."
                                className="w-full text-xs px-2.5 py-1.5 rounded bg-surface-card border border-status-danger-fg/30 focus:outline-none focus:ring-1 focus:ring-status-danger-fg text-text-primary"
                                {...register(`conditions.${key}.details` as any)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Allergies Section */}
                <div className="space-y-3 pt-3 border-t border-surface-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-status-warning-fg" />
                      الحساسيات الدوائية والتحسس المفرط (Allergies)
                    </span>
                    <span className="text-[11px] text-text-muted">حدد الحساسيات إن وجدت لحماية المريض</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-surface-hover/50 p-3 rounded-xl border border-surface-border">
                    {COMMON_ALLERGIES.map((allergen) => {
                      const isSelected = watchedAllergies.some((a) => a.allergen === allergen);
                      return (
                        <label
                          key={allergen}
                          className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-surface-card transition-colors select-none text-xs text-text-primary"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCommonAllergy(allergen)}
                          />
                          <span>{allergen}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Custom Allergy Adder */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="أضف مادة أو دواء مسبب لحساسية أخرى..."
                      value={customAllergenName}
                      onChange={(e) => setCustomAllergenName(e.target.value)}
                    />
                    <div className="w-40 shrink-0">
                      <Select
                        value={customAllergenSeverity}
                        onValueChange={(val) => setCustomAllergenSeverity(val as AllergySeverity)}
                        options={ALLERGY_SEVERITIES.map((s) => ({
                          label: ALLERGY_SEVERITY_AR[s],
                          value: s,
                        }))}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addCustomAllergy}
                      icon={<Plus className="w-4 h-4" />}
                    >
                      إضافة
                    </Button>
                  </div>

                  {/* Selected Allergies Badges */}
                  {watchedAllergies.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {watchedAllergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1.5 text-xs bg-status-danger-bg text-status-danger-fg px-2.5 py-1 rounded-full border border-status-danger-fg/20"
                        >
                          <span>{allergy.allergen}</span>
                          <span className="text-[10px] opacity-75">
                            ({ALLERGY_SEVERITY_AR[allergy.severity]})
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAllergy(index)}
                            className="hover:text-status-danger-fg/70 ms-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current Medications & Clinical Warnings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-surface-border">
                  <Textarea
                    label="الأدوية الحالية التي يتناولها المريض"
                    placeholder="مثال: أسبرين 81 ملغ يومياً، ميتفورمين 500 ملغ..."
                    rows={3}
                    {...register('current_medications')}
                  />
                  <Textarea
                    label="تحذيرات وملاحظات سريرية عامة"
                    placeholder="عمليات جراحية سابقة، فوبيا من إبر التخدير، رغبة في التجميل..."
                    rows={3}
                    {...register('medical_notes')}
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Insurance, Dentist, Referral & Photo */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Doctor & Patient Code */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    control={control}
                    name="primary_dentist_id"
                    render={({ field }) => (
                      <Select
                        label="الطبيب المعالج الأساسي"
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        placeholder="اختر الطبيب المعالج المشرف..."
                        options={[
                          { label: '— بدون طبيب محدد حالياً —', value: '' },
                          ...(dentists || []).map((d) => ({
                            label: `د. ${d.full_name} (${d.specialty || 'طبيب أسنان'})`,
                            value: d.id,
                          })),
                        ]}
                      />
                    )}
                  />

                  <Input
                    label="كود المريض الطبي"
                    required
                    {...register('code')}
                    error={errors.code?.message}
                    helperText="يتم توليده تلقائياً ويمكن تعديله حسب نظام ترقيم العيادة"
                  />
                </div>

                {/* Insurance Information Card */}
                <div className="p-4 rounded-xl bg-surface-hover/70 border border-surface-border space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                    <Shield className="w-4 h-4 text-brand-blue" />
                    <span>التأمين الطبي والشركات المعتمدة</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Controller
                      control={control}
                      name="insurance_company_id"
                      render={({ field }) => (
                        <Select
                          label="شركة التأمين"
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          options={[
                            { label: 'بدون تأمين (كاش / دفع ذاتي)', value: '' },
                            ...(insuranceCompanies || []).map((c) => ({
                              label: c.name,
                              value: c.id,
                            })),
                          ]}
                        />
                      )}
                    />

                    <Input
                      label="رقم بوليصة / بطاقة التأمين"
                      placeholder="مثال: POL-1029384"
                      disabled={!watchedInsuranceId}
                      {...register('insurance_policy_no')}
                    />

                    <Input
                      type="date"
                      label="تاريخ انتهاء وثيقة التأمين"
                      disabled={!watchedInsuranceId}
                      {...register('insurance_expiry')}
                    />
                  </div>
                </div>

                {/* Referral Source */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    control={control}
                    name="referral_source"
                    render={({ field }) => (
                      <Select
                        label="مصدر الإحالة / كيف سمعت عنا؟"
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        options={[
                          { label: '— اختر المصدر —', value: '' },
                          { label: 'توصية من صديق أو قريب', value: 'صديق أو قريب' },
                          { label: 'إعلانات وسائل التواصل الاجتماعي (Instagram / TikTok / X)', value: 'سوشيال ميديا' },
                          { label: 'بحث جوجل والخرائط (Google Maps)', value: 'بحث جوجل' },
                          { label: 'لافتة العيادة والموقع الجغرافي', value: 'الموقع المباشر' },
                          { label: 'تحويل من طبيب أو مركز آخر', value: 'تحويل طبي' },
                          { label: 'أخرى', value: 'أخرى' },
                        ]}
                      />
                    )}
                  />

                  <div className="flex items-center justify-between p-3 rounded-lg border border-surface-border bg-surface-card self-end">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-text-primary">حالة الملف الطبي</span>
                      <span className="text-[11px] text-text-muted">الملفات النشطة تظهر في جداول المواعيد السريعة</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-text-primary">
                      <input
                        type="checkbox"
                        {...register('is_active')}
                        className="rounded text-brand-blue focus:ring-brand-blue"
                      />
                      <span>نشط</span>
                    </label>
                  </div>
                </div>

                {/* Patient Photo Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-primary">
                    الصورة الشخصية للمريض
                  </label>

                  <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-surface-border bg-surface-hover/30">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-hover border border-surface-border flex items-center justify-center shrink-0">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="معاينة الصورة"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-text-muted" />
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          icon={<Upload className="w-4 h-4" />}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          اختيار صورة
                        </Button>
                        {photoPreview && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4" />}
                            onClick={handleRemovePhoto}
                          >
                            حذف الصورة
                          </Button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </div>
                      <p className="text-[11px] text-text-muted">
                        الصيغ المدعومة: JPG, PNG, WEBP — الحد الأقصى للحجم 5 ميجابايت.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 border-t border-surface-border bg-surface-hover/40 flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePrevStep}
                  icon={<ChevronRight className="w-4 h-4" />}
                >
                  السابق
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={handleRequestClose}>
                إلغاء
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNextStep}
                  icon={<ChevronLeft className="w-4 h-4" />}
                >
                  التالي
                </Button>
              ) : (
                <Button
                  type="submit"
                  form="patient-stepper-form"
                  variant="primary"
                  loading={isSubmitting || createPatientMutation.isPending || updatePatientMutation.isPending}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  {isEdit ? 'حفظ التعديلات' : 'إتمام وتسجيل المريض'}
                </Button>
              )}
            </div>
          </div>
        </ModalContent>
      </Modal>

      {/* Accidental Close Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmClose}
        onOpenChange={setShowConfirmClose}
        title="حفظ التغييرات كمسودة؟"
        description="لديك بيانات غير محفوظة في النموذج. يمكنك حفظها كمسودة لاسترجاعها لاحقاً، أو تجاهل التغييرات."
        confirmText="حفظ كمسودة وإغلاق"
        cancelText="تجاهل التغييرات"
        tone="primary"
        onConfirm={handleSaveDraftAndClose}
        onCancel={handleDiscardAndClose}
      />
    </>
  );
};

export default PatientFormDialog;
