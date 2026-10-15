import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  FileText,
  Plus,
  Lock,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PolicyExpiryAlertBanner } from '@/features/insurance/components/PolicyExpiryAlertBanner';
import { ClaimsPage } from '@/features/insurance/ClaimsPage';
import { InsuranceCompaniesPage } from '@/features/insurance/InsuranceCompaniesPage';
import { ClaimFormDialog } from '@/features/insurance/components/ClaimFormDialog';
import { CompanyFormModal } from '@/features/insurance/components/CompanyFormModal';
import { useLicenseStore } from '@/store/useLicenseStore';

export const InsurancePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'companies' ? 'companies' : 'claims';

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [preselectedCompanyId, setPreselectedCompanyId] = useState<string | undefined>(undefined);

  const isLocked = useLicenseStore((s) => s.isFeatureLocked('insurance'));
  const openActivationDialog = useLicenseStore((s) => s.openActivationDialog);

  const handleTabChange = (tab: 'claims' | 'companies') => {
    setSearchParams({ tab });
  };

  const handleOpenCreateClaimForCompany = (companyId?: string) => {
    setPreselectedCompanyId(companyId);
    setIsClaimModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">ميزة التأمين الصحي والمطالبات مقفلة في الباقة الحالية</h4>
              <p className="text-xs text-amber-700">تتطلب إدارة شركات التأمين والمطالبات الترقية إلى الباقة الاحترافية (Pro) أو باقة المنشآت.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openActivationDialog}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            ترقية الباقة الآن
          </button>
        </div>
      )}

      {/* 1. Page Header */}
      <PageHeader
        title="التأمين الصحي والمطالبات"
        description="إدارة شركات التأمين، نسب التغطية والأسقف السنوية، دورة حياة المطالبات والموافقات المسبقة، والتسوية المالية"
        actions={
          <div className="flex items-center gap-2">
            {currentTab === 'claims' ? (
              <button
                onClick={() => {
                  setPreselectedCompanyId(undefined);
                  setIsClaimModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-white shadow hover:bg-primary/90 transition"
              >
                <Plus className="h-4 w-4" />
                إنشاء مطالبة جديدة
              </button>
            ) : (
              <button
                onClick={() => setIsCompanyModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-white shadow hover:bg-primary/90 transition"
              >
                <Plus className="h-4 w-4" />
                إضافة شركة تأمين
              </button>
            )}
          </div>
        }
      />

      {/* 2. Policy Expiry Alert Banner (30 days threshold warning) */}
      <PolicyExpiryAlertBanner />

      {/* 3. Navigation Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex space-x-6 space-x-reverse" aria-label="Tabs">
          <button
            onClick={() => handleTabChange('claims')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-bold transition ${
              currentTab === 'claims'
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            مطالبات التأمين والموافقات
          </button>

          <button
            onClick={() => handleTabChange('companies')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-bold transition ${
              currentTab === 'companies'
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Building2 className="h-4 w-4" />
            شركات التأمين والتغطيات
          </button>
        </nav>
      </div>

      {/* 4. Active Tab View */}
      {currentTab === 'claims' ? (
        <ClaimsPage />
      ) : (
        <InsuranceCompaniesPage onOpenCreateClaim={handleOpenCreateClaimForCompany} />
      )}

      {/* 5. Global Modals */}
      <ClaimFormDialog
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          setPreselectedCompanyId(undefined);
        }}
        initialCompanyId={preselectedCompanyId}
      />

      <CompanyFormModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      />
    </div>
  );
};

export default InsurancePage;
