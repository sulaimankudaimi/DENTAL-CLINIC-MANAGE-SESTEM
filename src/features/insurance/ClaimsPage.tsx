import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { InsuranceClaim, InsuranceClaimStatus, Patient, Invoice, InsuranceCompany } from '@shared/contracts';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Eye,
  Edit3,
} from 'lucide-react';
import { InsuranceStatsCards } from './components/InsuranceStatsCards';
import { ClaimStatusTransitionModal } from './components/ClaimStatusTransitionModal';
import { ClaimDetailsDrawer } from './components/ClaimDetailsDrawer';
import { PrintableClaimForm } from './components/PrintableClaimForm';
import { ClaimFormDialog } from './components/ClaimFormDialog';
import { CLAIM_STATUS_MAP } from './types';

export const ClaimsPage: React.FC = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals & Drawers state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClaimForTransition, setSelectedClaimForTransition] = useState<InsuranceClaim | null>(null);
  const [selectedClaimForDrawer, setSelectedClaimForDrawer] = useState<InsuranceClaim | null>(null);
  const [selectedClaimForPrint, setSelectedClaimForPrint] = useState<InsuranceClaim | null>(null);

  // Queries
  const { data: claims = [], isLoading } = useQuery<InsuranceClaim[]>({
    queryKey: queryKeys.insurance.claims({
      companyId: selectedCompanyId !== 'all' ? selectedCompanyId : undefined,
      status: selectedStatus !== 'all' ? (selectedStatus as InsuranceClaimStatus) : undefined,
      period: selectedPeriod,
      search: searchTerm,
    }),
    queryFn: async () => {
      const res = await api.insurance.getClaims({
        companyId: selectedCompanyId !== 'all' ? selectedCompanyId : undefined,
        status: selectedStatus !== 'all' ? (selectedStatus as InsuranceClaimStatus) : undefined,
        period: selectedPeriod,
        search: searchTerm,
      });
      return res.ok ? res.data : [];
    },
  });

  const { data: companies = [] } = useQuery<InsuranceCompany[]>({
    queryKey: queryKeys.insurance.companies,
    queryFn: async () => {
      const res = await api.insurance.getCompanies();
      return res.ok ? res.data : [];
    },
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: queryKeys.patients.all,
    queryFn: async () => {
      const res = await api.patients.list({});
      return res.ok ? res.data.items : [];
    },
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: queryKeys.invoices.all,
    queryFn: async () => {
      const res = await api.invoices.list({});
      return res.ok ? res.data.items : [];
    },
  });

  const getPatient = (patientId: string) => patients.find((p: Patient) => p.id === patientId);
  const getCompany = (companyId: string) => companies.find((c: InsuranceCompany) => c.id === companyId);
  const getInvoice = (invoiceId: string) => invoices.find((i: Invoice) => i.id === invoiceId);

  const formatSAR = (halalas?: number | null) => {
    if (halalas === null || halalas === undefined) return '0.00 ر.س';
    return `${(halalas / 100).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س`;
  };

  return (
    <div className="space-y-6">
      {/* 1. KPI Stats Cards */}
      <InsuranceStatsCards claims={claims} />

      {/* 2. Filters & Actions Row */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute right-3.5 top-3 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم المطالبة، اسم المريض، أو الجوال..."
              className="w-full rounded-xl border border-zinc-200 bg-white pr-10 pl-4 py-2 text-xs sm:text-sm text-zinc-900 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Period filter buttons */}
          <div className="flex items-center rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800 text-xs font-semibold">
            {[
              { id: 'all', label: 'كل الفترات' },
              { id: 'today', label: 'اليوم' },
              { id: 'week', label: 'هذا الأسبوع' },
              { id: 'month', label: 'هذا الشهر' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id as any)}
                className={`rounded-lg px-3 py-1.5 transition ${
                  selectedPeriod === p.id
                    ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Create Claim Button */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" />
            إنشاء مطالبة جديدة
          </button>
        </div>

        {/* Company & Status Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          {/* Company filter */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-medium">الشركة:</span>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="all">جميع الشركات ({companies.length})</option>
              {companies.map((c: InsuranceCompany) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-medium">الحالة:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="all">جميع الحالات</option>
              {(Object.keys(CLAIM_STATUS_MAP) as InsuranceClaimStatus[]).map((key) => (
                <option key={key} value={key}>
                  {CLAIM_STATUS_MAP[key].label}
                </option>
              ))}
            </select>
          </div>

          {(selectedCompanyId !== 'all' || selectedStatus !== 'all' || selectedPeriod !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedCompanyId('all');
                setSelectedStatus('all');
                setSelectedPeriod('all');
                setSearchTerm('');
              }}
              className="text-xs text-rose-600 hover:underline mr-auto font-medium"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* 3. Claims Data Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
                <th className="py-3 px-4 font-semibold">رقم المطالبة</th>
                <th className="py-3 px-4 font-semibold">تاريخ التقديم</th>
                <th className="py-3 px-4 font-semibold">المريض</th>
                <th className="py-3 px-4 font-semibold">شركة التأمين</th>
                <th className="py-3 px-4 font-semibold text-left">المطالب به</th>
                <th className="py-3 px-4 font-semibold text-left">المعتمد</th>
                <th className="py-3 px-4 font-semibold text-center">الحالة</th>
                <th className="py-3 px-4 font-semibold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    جاري تحميل المطالبات...
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <FileText className="mx-auto h-10 w-10 text-zinc-400" />
                    <p className="mt-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      لا توجد مطالبات تطابق شروط البحث
                    </p>
                    <p className="text-xs text-zinc-500">
                      قم بإنشاء مطالبة جديدة أو تعديل خيارات التصفية
                    </p>
                  </td>
                </tr>
              ) : (
                claims.map((claim: InsuranceClaim) => {
                  const patient = getPatient(claim.patient_id);
                  const company = getCompany(claim.company_id);
                  const statusInfo = CLAIM_STATUS_MAP[claim.status] || {
                    label: claim.status,
                    tone: 'neutral',
                  };

                  return (
                    <tr
                      key={claim.id}
                      className="hover:bg-zinc-50/70 transition dark:hover:bg-zinc-800/40"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        <button
                          onClick={() => setSelectedClaimForDrawer(claim)}
                          className="hover:text-primary hover:underline text-right"
                        >
                          {claim.claim_number}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {new Date(claim.submitted_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {patient ? `${patient.first_name} ${patient.family_name}` : '—'}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {patient?.code || ''} {patient?.phone ? `• ${patient.phone}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-800 dark:text-zinc-200">
                          {company ? company.name : '—'}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {patient?.insurance_policy_no || 'بدون بوليصة'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-300 text-left">
                        {formatSAR(claim.claimed_halalas)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-300 text-left">
                        {claim.approved_halalas > 0 ? formatSAR(claim.approved_halalas) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            statusInfo.tone === 'green' || statusInfo.tone === 'emerald'
                              ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300'
                              : statusInfo.tone === 'rose'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : statusInfo.tone === 'amber'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : statusInfo.tone === 'purple'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedClaimForDrawer(claim)}
                            title="عرض تفاصيل المطالبة"
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setSelectedClaimForTransition(claim)}
                            title="تحديث مسار الحالة"
                            className="rounded-lg p-1.5 text-primary hover:bg-primary/10"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setSelectedClaimForPrint(claim)}
                            title="طباعة نموذج المطالبة"
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modals and Drawers */}
      <ClaimFormDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onClaimCreated={(newClaim: InsuranceClaim) => {
          setSelectedClaimForPrint(newClaim);
        }}
      />

      <ClaimStatusTransitionModal
        claim={selectedClaimForTransition}
        isOpen={!!selectedClaimForTransition}
        onClose={() => setSelectedClaimForTransition(null)}
        patientName={
          selectedClaimForTransition
            ? (() => {
                const pt = getPatient(selectedClaimForTransition.patient_id);
                return pt ? `${pt.first_name} ${pt.family_name}` : '';
              })()
            : ''
        }
      />

      <ClaimDetailsDrawer
        claim={selectedClaimForDrawer}
        isOpen={!!selectedClaimForDrawer}
        onClose={() => setSelectedClaimForDrawer(null)}
        onOpenTransition={(c: InsuranceClaim) => {
          setSelectedClaimForDrawer(null);
          setSelectedClaimForTransition(c);
        }}
        onOpenPrint={(c: InsuranceClaim) => {
          setSelectedClaimForPrint(c);
        }}
      />

      {selectedClaimForPrint && (
        <PrintableClaimForm
          claim={selectedClaimForPrint}
          patient={getPatient(selectedClaimForPrint.patient_id)}
          company={getCompany(selectedClaimForPrint.company_id)}
          invoice={getInvoice(selectedClaimForPrint.invoice_id)}
          onClose={() => setSelectedClaimForPrint(null)}
        />
      )}
    </div>
  );
};
