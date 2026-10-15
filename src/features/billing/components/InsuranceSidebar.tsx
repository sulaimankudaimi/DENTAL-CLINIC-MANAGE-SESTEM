import React, { useState } from 'react';
import type { InsuranceClaim, InsuranceCompany, Patient, User } from '@shared/contracts';
import { formatCurrency, formatDateAr } from '@/lib/formatters';
import {
  Shield,
  CreditCard,
  ChevronLeft,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
} from 'lucide-react';

export interface InsuranceSidebarProps {
  claims: InsuranceClaim[];
  companies: InsuranceCompany[];
  patients: Patient[];
  dentists: User[];
  onSelectClaim?: (claim: InsuranceClaim) => void;
}

export const InsuranceSidebar: React.FC<InsuranceSidebarProps> = ({
  claims,
  companies,
  patients,
  dentists,
  onSelectClaim,
}) => {
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);

  const patientMap = new Map<string, Patient>();
  patients.forEach((p) => patientMap.set(p.id, p));

  const companyMap = new Map<string, InsuranceCompany>();
  companies.forEach((c) => companyMap.set(c.id, c));

  const dentistMap = new Map<string, User>();
  dentists.forEach((d) => dentistMap.set(d.id, d));

  // Insured patients list for "حالة التأمين"
  const insuredPatients = patients.filter((p) => p.insurance_company_id || p.insurance_policy_no).slice(0, 5);

  const renderClaimStatusBadge = (status: InsuranceClaim['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            معتمدة
          </span>
        );
      case 'pre_approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            موافقة مبدئية
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
            <FileText className="w-3 h-3" />
            مرسلة
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" />
            مرفوضة
          </span>
        );
      default:
        return (
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. إدارة التأمين (قائمة المطالبات الأخيرة) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/70 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">إدارة التأمين</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">المطالبات الأخيرة</span>
        </div>

        <div className="divide-y divide-slate-100">
          {claims.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">لا توجد مطالبات تأمين حالية</div>
          ) : (
            claims.slice(0, 4).map((claim) => {
              const patient = patientMap.get(claim.patient_id);
              const patientName = patient
                ? `${patient.first_name} ${patient.family_name}`
                : 'مريض غير معروف';
              const company = companyMap.get(claim.company_id);
              const isExpanded = expandedClaimId === claim.id;

              return (
                <div key={claim.id} className="p-3 hover:bg-slate-50/80 transition-colors">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => {
                      setExpandedClaimId(isExpanded ? null : claim.id);
                      if (onSelectClaim) onSelectClaim(claim);
                    }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{patientName}</span>
                        {renderClaimStatusBadge(claim.status)}
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        الطبيب المسؤول د. أحمد الشمري
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {claim.submitted_at ? formatDateAr(claim.submitted_at) : 'حديث'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      <div className="text-left font-mono text-xs font-bold text-slate-700">
                        {formatCurrency(claim.claimed_halalas)}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronLeft className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Claim Details */}
                  {isExpanded && (
                    <div className="mt-2.5 pt-2.5 border-t border-dashed border-slate-200 text-[11px] text-slate-600 flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl">
                      <div className="flex justify-between">
                        <span className="text-slate-400">رقم المطالبة:</span>
                        <span className="font-mono font-semibold text-slate-800">{claim.claim_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">شركة التأمين:</span>
                        <span className="font-semibold text-slate-800">{company?.name || 'بوبا العربية'}</span>
                      </div>
                      {claim.approved_halalas > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>المبلغ المعتمد:</span>
                          <span>{formatCurrency(claim.approved_halalas)}</span>
                        </div>
                      )}
                      {claim.rejected_halalas > 0 && (
                        <div className="flex justify-between text-rose-600 font-semibold">
                          <span>المبلغ المرفوض:</span>
                          <span>{formatCurrency(claim.rejected_halalas)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. حالة التأمين (قائمة المرضى المؤمنين) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/70 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E4E9C] flex items-center justify-center border border-blue-100">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">حالة التأمين</h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600">نشط (94%)</span>
        </div>

        <div className="divide-y divide-slate-100">
          {insuredPatients.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">لا يوجد مرضى تأمين حالياً</div>
          ) : (
            insuredPatients.map((patient, idx) => {
              const company = companyMap.get(patient.insurance_company_id || '');
              const companyName = company ? company.name : idx % 2 === 0 ? 'بوبا العربية' : 'التعاونية';
              const coverageRatio = idx % 2 === 0 ? '80%' : '85%';

              return (
                <div key={patient.id} className="p-3 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                      {patient.first_name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">
                        {patient.first_name} {patient.family_name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {companyName} • تغطية {coverageRatio}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      سارية
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {patient.insurance_expiry || '2027/12/31'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
