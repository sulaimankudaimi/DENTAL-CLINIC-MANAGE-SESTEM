import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Select';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatCurrency, formatDateAr } from '@/lib/formatters';
import { PatientFormDialog } from './components/PatientFormDialog';
import { PatientDetailsDialog } from './components/PatientDetailsDialog';
import { AppointmentFormModal } from '@/components/appointments/AppointmentFormModal';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Patient, CreateAppointment, UpdateAppointment } from '@shared/contracts';
import {
  usePatients,
  useDeletePatient,
  useDentists,
  useInsuranceCompanies,
  ExtendedPatientFilters,
} from './hooks/usePatients';
import {
  UserPlus,
  Users,
  Filter,
  Printer,
  CalendarPlus,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Phone,
  FileSpreadsheet,
  HeartPulse,
  DollarSign,
} from 'lucide-react';

export const PatientsListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Search & Filter State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [dentistFilter, setDentistFilter] = useState<string>('all');
  const [insuranceFilter, setInsuranceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'due' | 'clear'>('all');
  const [lastVisitFilter, setLastVisitFilter] = useState<
    'all' | 'week' | 'month' | '3months' | '6months' | 'never'
  >('all');

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Filters object for query
  const queryFilters: ExtendedPatientFilters = useMemo(() => {
    return {
      search: debouncedSearch,
      page,
      limit: pageSize,
      sort_order: 'desc',
      gender: genderFilter !== 'all' ? (genderFilter as any) : undefined,
      primary_dentist_id: dentistFilter !== 'all' ? dentistFilter : undefined,
      insurance_company_id:
        insuranceFilter !== 'all' && insuranceFilter !== 'none'
          ? insuranceFilter
          : undefined,
      has_insurance:
        insuranceFilter === 'none'
          ? false
          : insuranceFilter !== 'all'
          ? true
          : undefined,
      is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      lastVisitFilter: lastVisitFilter !== 'all' ? lastVisitFilter : undefined,
    };
  }, [
    debouncedSearch,
    page,
    pageSize,
    genderFilter,
    dentistFilter,
    insuranceFilter,
    statusFilter,
    lastVisitFilter,
  ]);

  // Hook query
  const {
    patients,
    total,
    totalPages,
    isLoading,
    isFetching,
    balancesByPatientId,
    lastVisitByPatientId,
  } = usePatients(queryFilters);

  const { data: dentists } = useDentists();
  const { data: insuranceCompanies } = useInsuranceCompanies();
  const deletePatientMutation = useDeletePatient();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatientId, setViewingPatientId] = useState<string | null>(null);
  const [appointmentPatient, setAppointmentPatient] = useState<Patient | null>(null);

  // Delete dialog state
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Filter items client-side by balance if required
  const displayedPatients = useMemo(() => {
    if (balanceFilter === 'all') return patients;
    return patients.filter((p) => {
      const balance = balancesByPatientId.get(p.id) || 0;
      if (balanceFilter === 'due') return balance > 0;
      if (balanceFilter === 'clear') return balance <= 0;
      return true;
    });
  }, [patients, balanceFilter, balancesByPatientId]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = total || patients.length;
    let withBalanceCount = 0;
    let totalDueHalalas = 0;

    for (const [_, bal] of balancesByPatientId) {
      if (bal > 0) {
        withBalanceCount++;
        totalDueHalalas += bal;
      }
    }

    const activeCount = patients.filter((p) => p.is_active).length;

    return {
      totalCount,
      activeCount,
      withBalanceCount,
      totalDueHalalas,
    };
  }, [total, patients, balancesByPatientId]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setGenderFilter('all');
    setDentistFilter('all');
    setInsuranceFilter('all');
    setStatusFilter('active');
    setBalanceFilter('all');
    setLastVisitFilter('all');
    setPage(1);
  };

  const hasActiveFilters =
    debouncedSearch !== '' ||
    genderFilter !== 'all' ||
    dentistFilter !== 'all' ||
    insuranceFilter !== 'all' ||
    statusFilter !== 'active' ||
    balanceFilter !== 'all' ||
    lastVisitFilter !== 'all';

  // Export to Excel (CSV with UTF-8 BOM)
  const handleExportCSV = () => {
    if (displayedPatients.length === 0) {
      alert('لا توجد بيانات مرضى للتصدير.');
      return;
    }

    const headers = [
      'كود المريض',
      'الاسم الأول',
      'اسم العائلة',
      'الجنس',
      'رقم الجوال',
      'رقم الهوية',
      'المدينة',
      'فصيلة الدم',
      'الحالة الاجتماعية',
      'الرصيد المستحق (ريال)',
      'حالة الملف',
    ];

    const rows = displayedPatients.map((p) => {
      const balance = (balancesByPatientId.get(p.id) || 0) / 100;
      return [
        `"${p.code}"`,
        `"${p.first_name}"`,
        `"${p.family_name}"`,
        `"${p.gender === 'male' ? 'ذكر' : 'أنثى'}"`,
        `"${p.phone}"`,
        `"${p.national_id || ''}"`,
        `"${p.city || ''}"`,
        `"${p.blood_type || ''}"`,
        `"${p.marital_status || ''}"`,
        `"${balance}"`,
        `"${p.is_active ? 'نشط' : 'مؤرشف'}"`,
      ].join(',');
    });

    // \uFEFF ensures Excel recognizes Arabic UTF-8 without garbled characters
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date().toISOString().slice(0, 10);
    a.download = `مرضى_عيادتي_${now}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print / PDF View
  const handlePrint = () => {
    window.print();
  };

  // Handle Delete / Archive Confirmation
  const confirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      await deletePatientMutation.mutateAsync(patientToDelete.id);
      setPatientToDelete(null);
    } catch (err) {
      console.error('Failed to delete patient:', err);
    }
  };

  // Dentists lookup map
  const dentistMap = useMemo(() => {
    const map = new Map<string, string>();
    if (dentists) {
      for (const d of dentists) {
        map.set(d.id, d.full_name);
      }
    }
    return map;
  }, [dentists]);

  // Insurance companies lookup map
  const insuranceMap = useMemo(() => {
    const map = new Map<string, string>();
    if (insuranceCompanies) {
      for (const c of insuranceCompanies) {
        map.set(c.id, c.name);
      }
    }
    return map;
  }, [insuranceCompanies]);

  // Table Columns Definition
  const columns: Column<Patient>[] = [
    {
      key: 'code',
      header: 'الرمز',
      width: '90px',
      render: (item) => (
        <Badge variant="neutral" className="font-mono text-brand-blue border-brand-blue/30 bg-brand-blue/5">
          {item.code}
        </Badge>
      ),
    },
    {
      key: 'name',
      header: 'المريض',
      render: (item) => {
        const hasAlert = item.notes && (item.notes.includes('حساسية') || item.notes.includes('تنبيه') || item.notes.includes('السكري'));
        return (
          <div className="flex items-center gap-3">
            <Avatar
              src={item.photo_path || undefined}
              fallback={item.first_name.charAt(0)}
              size="md"
              className="border border-surface-border shadow-xs"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-text-primary text-xs hover:text-brand-blue transition-colors">
                  {item.first_name} {item.father_name || ''} {item.family_name}
                </span>
                {hasAlert && (
                  <span title="تنبيه سريري / حساسية" className="text-status-danger-fg">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <span className="text-[11px] text-text-muted">{item.city || 'الرياض'}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'الجوال',
      width: '130px',
      render: (item) => (
        <span className="font-mono text-xs text-text-secondary flex items-center gap-1" dir="ltr">
          <Phone className="w-3 h-3 text-text-muted shrink-0" />
          {item.phone}
        </span>
      ),
    },
    {
      key: 'age_gender',
      header: 'العمر / الجنس',
      width: '110px',
      render: (item) => {
        let ageStr = '—';
        if (item.birth_date) {
          const birth = new Date(item.birth_date);
          if (!isNaN(birth.getTime())) {
            const age = new Date().getFullYear() - birth.getFullYear();
            ageStr = `${age} سنة`;
          }
        }
        return (
          <div className="text-xs">
            <span className="text-text-primary font-medium">{ageStr}</span>
            <span className="text-text-muted block text-[11px]">
              {item.gender === 'male' ? 'ذكر' : 'أنثى'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'dentist',
      header: 'الطبيب المعالج',
      render: (item) => {
        const dentistName = item.primary_dentist_id ? dentistMap.get(item.primary_dentist_id) : null;
        return (
          <span className="text-xs text-text-secondary">
            {dentistName ? `د. ${dentistName}` : '—'}
          </span>
        );
      },
    },
    {
      key: 'insurance',
      header: 'التأمين',
      width: '130px',
      render: (item) => {
        const companyName = item.insurance_company_id ? insuranceMap.get(item.insurance_company_id) : null;
        return companyName ? (
          <Badge variant="info" className="truncate max-w-[120px]" title={companyName}>
            {companyName}
          </Badge>
        ) : (
          <Badge variant="neutral">نقدي (كاش)</Badge>
        );
      },
    },
    {
      key: 'balance',
      header: 'الرصيد المستحق',
      width: '120px',
      render: (item) => {
        const balanceHalalas = balancesByPatientId.get(item.id) || 0;
        const isDue = balanceHalalas > 0;
        return (
          <span
            className={`font-bold text-xs ${
              isDue ? 'text-status-danger-fg flex items-center gap-1' : 'text-status-success-fg'
            }`}
          >
            {isDue && <DollarSign className="w-3 h-3" />}
            {formatCurrency(balanceHalalas)}
          </span>
        );
      },
    },
    {
      key: 'last_visit',
      header: 'آخر زيارة',
      width: '120px',
      render: (item) => {
        const lastVisit = lastVisitByPatientId.get(item.id);
        if (!lastVisit) {
          return <span className="text-xs text-text-muted">لم يزر بعد</span>;
        }
        const d = new Date(lastVisit);
        return (
          <span className="text-xs text-text-secondary" title={formatDateAr(d)}>
            {d.toISOString().slice(0, 10)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      align: 'end',
      width: '140px',
      render: (item) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="عرض الملف الطبي الكامل"
            onClick={() => navigate(`/patients/${item.id}`)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-brand-blue hover:bg-surface-hover transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="حجز موعد جديد"
            onClick={() => setAppointmentPatient(item)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-status-success-fg hover:bg-surface-hover transition-colors"
          >
            <CalendarPlus className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="تعديل بيانات المريض"
            onClick={() => {
              setEditingPatient(item);
              setIsFormOpen(true);
            }}
            className="p-1.5 rounded-lg text-text-secondary hover:text-brand-blue hover:bg-surface-hover transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="أرشفة / حذف المريض"
            onClick={() => setPatientToDelete(item)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-status-danger-fg hover:bg-surface-hover transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="سجل المرضى"
        description="إدارة السجلات الطبية والملفات الإلكترونية للمرضى، متابعة الأرصدة، وسجل المواعيد."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-status-success-fg" />}
              onClick={handleExportCSV}
              title="تصدير ملف إكسل CSV"
            >
              تصدير Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Printer className="w-4 h-4 text-text-secondary" />}
              onClick={handlePrint}
              title="طباعة التقرير"
            >
              طباعة
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => {
                setEditingPatient(null);
                setIsFormOpen(true);
              }}
            >
              مريض جديد
            </Button>
          </div>
        }
      />

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="إجمالي المرضى المسجلين"
          value={stats.totalCount}
          icon={<Users className="w-5 h-5" />}
          tone="blue"
        />
        <StatCard
          label="المرضى النشطين"
          value={stats.activeCount}
          icon={<CheckCircle2 className="w-5 h-5" />}
          tone="green"
        />
        <StatCard
          label="مرضى عليهم مديونيات"
          value={stats.withBalanceCount}
          icon={<DollarSign className="w-5 h-5" />}
          tone="rose"
          trend={{
            value: formatCurrency(stats.totalDueHalalas),
            isPositive: false,
            label: 'إجمالي المستحق',
          }}
        />
        <StatCard
          label="مستحق الدفع قريباً"
          value={displayedPatients.length}
          icon={<HeartPulse className="w-5 h-5" />}
          tone="amber"
          trend={{
            value: `صفحة ${page} من ${totalPages || 1}`,
            isPositive: true,
            label: 'العرض الحالي',
          }}
        />
      </div>

      {/* Search & Advanced Filters Bar */}
      <div className="p-4 bg-surface-card rounded-card border border-surface-border shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Main Search Input */}
          <div className="md:col-span-5">
            <SearchInput
              placeholder="البحث بالاسم، رقم الجوال (05x)، رقم الهوية، أو كود المريض..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput('')}
            />
          </div>

          {/* Gender Filter */}
          <div className="md:col-span-2">
            <Select
              value={genderFilter}
              onValueChange={setGenderFilter}
              options={[
                { label: 'كافة الأجناس', value: 'all' },
                { label: 'ذكر فقط', value: 'male' },
                { label: 'أنثى فقط', value: 'female' },
              ]}
            />
          </div>

          {/* Dentist Filter */}
          <div className="md:col-span-3">
            <Select
              value={dentistFilter}
              onValueChange={setDentistFilter}
              options={[
                { label: 'جميع الأطباء المعالجين', value: 'all' },
                ...(dentists || []).map((d) => ({
                  label: `د. ${d.full_name}`,
                  value: d.id,
                })),
              ]}
            />
          </div>

          {/* Insurance Filter */}
          <div className="md:col-span-2">
            <Select
              value={insuranceFilter}
              onValueChange={setInsuranceFilter}
              options={[
                { label: 'التأمين (الكل)', value: 'all' },
                { label: 'دفع نقدي (كاش)', value: 'none' },
                ...(insuranceCompanies || []).map((c) => ({
                  label: c.name,
                  value: c.id,
                })),
              ]}
            />
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-border/50 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-text-secondary font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              تصفية سريعة:
            </span>

            {/* Balance status filter */}
            <div className="flex items-center rounded-lg bg-surface-hover p-0.5 border border-surface-border">
              <button
                type="button"
                onClick={() => setBalanceFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  balanceFilter === 'all'
                    ? 'bg-surface-card text-brand-blue font-bold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setBalanceFilter('due')}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  balanceFilter === 'due'
                    ? 'bg-surface-card text-status-danger-fg font-bold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                عليهم مستحقات
              </button>
              <button
                type="button"
                onClick={() => setBalanceFilter('clear')}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  balanceFilter === 'clear'
                    ? 'bg-surface-card text-status-success-fg font-bold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                مسددين
              </button>
            </div>

            {/* Last visit filter */}
            <div className="w-40">
              <Select
                value={lastVisitFilter}
                onValueChange={(val) => setLastVisitFilter(val as any)}
                options={[
                  { label: 'آخر زيارة: الكل', value: 'all' },
                  { label: 'خلال هذا الأسبوع', value: 'week' },
                  { label: 'خلال هذا الشهر', value: 'month' },
                  { label: 'منذ أكثر من 3 أشهر', value: '3months' },
                  { label: 'منذ أكثر من 6 أشهر', value: '6months' },
                  { label: 'لم يزوروا بعد', value: 'never' },
                ]}
              />
            </div>

            {/* Status Filter */}
            <div className="w-32">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={[
                  { label: 'نشط فقط', value: 'active' },
                  { label: 'مؤرشف فقط', value: 'archived' },
                  { label: 'جميع الحالات', value: 'all' },
                ]}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleResetFilters}
              className="text-text-muted hover:text-text-primary"
            >
              إعادة ضبط الفلاتر
            </Button>
          )}
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={displayedPatients}
        keyExtractor={(item) => item.id}
        loading={isLoading || isFetching}
        emptyMessage="لم يتم العثور على أي مرضى مطابقين لمعايير البحث الحالية."
        emptyAction={
          <Button
            variant="primary"
            size="sm"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => {
              setEditingPatient(null);
              setIsFormOpen(true);
            }}
          >
            تسجيل مريض جديد
          </Button>
        }
        page={page}
        pageSize={pageSize}
        totalCount={total}
        onPageChange={setPage}
        onRowClick={(item) => navigate(`/patients/${item.id}`)}
      />

      {/* Patient Create / Edit Stepper Dialog */}
      <PatientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        patient={editingPatient}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingPatient(null);
        }}
      />

      {/* Full Patient Details Modal */}
      <PatientDetailsDialog
        open={!!viewingPatientId}
        onOpenChange={(open) => {
          if (!open) setViewingPatientId(null);
        }}
        patientId={viewingPatientId}
        onEditPatient={(p) => {
          setViewingPatientId(null);
          setEditingPatient(p);
          setIsFormOpen(true);
        }}
        onBookAppointment={(p) => {
          setViewingPatientId(null);
          setAppointmentPatient(p);
        }}
      />

      {/* Appointment Booking Modal */}
      {appointmentPatient && (
        <AppointmentFormModal
          isOpen={!!appointmentPatient}
          onClose={() => setAppointmentPatient(null)}
          defaultPatientId={appointmentPatient.id}
          onSubmit={async (payload: CreateAppointment | UpdateAppointment) => {
            const res = await api.appointments.create(payload as CreateAppointment);
            if (res.ok) {
              queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
              setAppointmentPatient(null);
            } else {
              const err = res.error as any;
              throw new Error(typeof err === 'string' ? err : err?.message || 'فشل حجز الموعد');
            }
          }}
        />
      )}

      {/* Delete / Archive Confirmation Dialog */}
      <ConfirmDialog
        open={!!patientToDelete}
        onOpenChange={(open) => {
          if (!open) setPatientToDelete(null);
        }}
        title={`هل أنت متأكد من حذف أو أرشفة ملف المريض؟`}
        description={`سيتم حذف ملف المريض "${patientToDelete?.first_name} ${patientToDelete?.family_name}" (كود: ${patientToDelete?.code}). لن يتم حذف الفواتير الصادرة لأغراض المحاسبة القانونية.`}
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPatientToDelete(null)}
      />
    </div>
  );
};

export default PatientsListPage;
