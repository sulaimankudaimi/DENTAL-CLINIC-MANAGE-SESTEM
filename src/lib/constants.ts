/**
 * System constants for Eyadati Dental Clinic Management System
 */

export interface SubscriptionInfo {
  plan?: 'basic' | 'pro' | 'enterprise';
  planName: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'active' | 'expiring_soon' | 'expired';
}

export interface UserProfile {
  name: string;
  role: string;
  clinicName: string;
  branchName: string;
  avatarUrl?: string;
}

export const CURRENT_SUBSCRIPTION: SubscriptionInfo = {
  plan: 'basic',
  planName: 'الباقة الأساسية',
  expiryDate: '2027-01-15',
  daysRemaining: 117,
  status: 'active',
};

export const CURRENT_USER: UserProfile = {
  name: 'د. أحمد خالد',
  role: 'الطبيب المسؤول',
  clinicName: 'عيادة الأسنان الاحترافية',
  branchName: 'الفرع الرئيسي',
};

export const CLINIC_BRANCHES = [
  { id: 'branch-1', name: 'الفرع الرئيسي — الرياض' },
  { id: 'branch-2', name: 'فرع العليا التخصصي' },
  { id: 'branch-3', name: 'فرع الخبر' },
];
