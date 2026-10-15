import { create } from 'zustand';
import type { LicensePlan } from '../../shared/license';
import { api } from '@/lib/api';

export interface LicensePlanInfo {
  plan: LicensePlan;
  planName: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'active' | 'expiring_soon' | 'expired';
}

export const PLAN_NAMES: Record<LicensePlan, string> = {
  basic: 'الباقة الأساسية',
  pro: 'الباقة الاحترافية (السنوية)',
  enterprise: 'باقة المنشآت والمجموعات',
};

function getInitialPlan(): LicensePlan {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlPlan = params.get('plan') as LicensePlan;
      if (urlPlan && (urlPlan === 'basic' || urlPlan === 'pro' || urlPlan === 'enterprise')) {
        return urlPlan;
      }
      const saved = localStorage.getItem('eyadati_license_plan') as LicensePlan;
      if (saved && (saved === 'basic' || saved === 'pro' || saved === 'enterprise')) {
        return saved;
      }
    } catch {}
  }
  // الوضع الافتراضي هو الباقة الأساسية لتحقيق متطلبات العرض مع ظهور القفل
  return 'basic';
}

interface LicenseStoreState {
  plan: LicensePlan;
  planName: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'active' | 'expiring_soon' | 'expired';
  licenseCode: string;
  customerName: string;
  isOnlineAvailable: boolean;
  deviceCode: string;
  isActivationDialogOpen: boolean;
  setPlan: (plan: LicensePlan) => void;
  openActivationDialog: () => void;
  closeActivationDialog: () => void;
  isFeatureLocked: (featureOrId: string) => boolean;
  refreshLicenseStatus: () => Promise<void>;
}

export const useLicenseStore = create<LicenseStoreState>((set, get) => {
  const initialPlan = getInitialPlan();
  return {
    plan: initialPlan,
    planName: PLAN_NAMES[initialPlan],
    expiryDate: '2027-01-15',
    daysRemaining: 117,
    status: 'active',
    licenseCode: 'EYD-PROD-2026-ACTIVE',
    customerName: 'عيادة د. أحمد الراشد لطب الأسنان',
    isOnlineAvailable: true,
    deviceCode: 'A1B2-C3D4-E5F6-0718-293A',
    isActivationDialogOpen: false,
    setPlan: (newPlan: LicensePlan) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('eyadati_license_plan', newPlan);
        } catch {}
      }
      set({
        plan: newPlan,
        planName: PLAN_NAMES[newPlan],
      });
    },
    openActivationDialog: () => set({ isActivationDialogOpen: true }),
    closeActivationDialog: () => set({ isActivationDialogOpen: false }),
    isFeatureLocked: (featureOrId: string) => {
      const currentPlan = get().plan;
      if (currentPlan === 'basic') {
        return featureOrId === 'insurance' || featureOrId === 'inventory';
      }
      return false;
    },
    refreshLicenseStatus: async () => {
      try {
        const res = await api.license.getStatus();
        if (res.ok && res.data) {
          const d = res.data;
          const planKey = (d.plan as LicensePlan) || 'pro';
          set({
            plan: planKey,
            planName: PLAN_NAMES[planKey] || planKey,
            expiryDate: d.expires_at ? d.expires_at.slice(0, 10) : '2027-01-15',
            daysRemaining: d.days_left ?? 117,
            status: d.state === 'active' ? 'active' : d.state === 'grace' ? 'expiring_soon' : 'expired',
            licenseCode: d.license_code || 'EYD-PROD-2026-ACTIVE',
            customerName: d.customer || 'عيادة د. أحمد الراشد لطب الأسنان',
            isOnlineAvailable: d.is_online_available ?? true,
            deviceCode: d.device_code || 'A1B2-C3D4-E5F6-0718-293A',
          });
        }
      } catch {
        // Fallback silently if not available yet
      }
    },
  };
});
