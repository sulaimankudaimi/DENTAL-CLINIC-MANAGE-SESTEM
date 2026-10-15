import React from 'react';
import { ChevronLeft, User, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import type { Patient, User as AppUser } from '@shared/contracts';

export interface RecentPatientsProps {
  patients: Patient[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectPatient: (patientId: string) => void;
  onNewPatientClick?: () => void;
  getDentist: (dentistId: string) => AppUser | undefined;
}

export const RecentPatients: React.FC<RecentPatientsProps> = ({
  patients,
  isLoading,
  isError,
  onRetry,
  onSelectPatient,
  onNewPatientClick,
  getDentist,
}) => {
  return (
    <Card className="p-5 border border-surface-border shadow-card bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-divider">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-brand-blue shrink-0" />
          <h3 className="text-sm font-bold text-text-primary">
            أحدث المرضى المضافين
          </h3>
        </div>
        {onNewPatientClick && (
          <button
            type="button"
            onClick={onNewPatientClick}
            className="text-xs text-brand-blue hover:text-brand-navy-deep font-semibold flex items-center gap-1 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>إضافة</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`recent-pat-skel-${idx}`}
                className="flex items-center justify-between p-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
                <Skeleton className="w-5 h-5 rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-4 text-center space-y-2">
            <AlertCircle className="w-5 h-5 text-status-danger-fg mx-auto" />
            <p className="text-xs text-text-secondary">تعذر تحميل أحدث المرضى</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
              icon={<RefreshCw className="w-3 h-3" />}
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : patients.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">
            لا يوجد مرضى مسجلون حتى الآن.
          </div>
        ) : (
          /* Max 4 visible items, scrollable if more */
          <div className="max-h-[260px] overflow-y-auto space-y-1 pe-1 custom-scrollbar">
            {patients.map((patient) => {
              const fullName = [
                patient.first_name,
                patient.father_name,
                patient.family_name,
              ]
                .filter(Boolean)
                .join(' ');

              const dentist = patient.primary_dentist_id
                ? getDentist(patient.primary_dentist_id)
                : undefined;

              const doctorLabel = dentist
                ? `الطبيب المعالج: د. ${dentist.full_name}`
                : 'طبيب العيادة العام';

              return (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => onSelectPatient(patient.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-hover transition-colors text-right group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue"
                  aria-label={`عرض ملف المريض ${fullName}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      size="sm"
                      fallback={patient.first_name?.charAt(0) || 'م'}
                      className="shrink-0 border border-surface-border shadow-xs"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-text-primary group-hover:text-brand-blue transition-colors truncate">
                        {fullName}
                      </span>
                      <span className="text-[11px] text-text-muted truncate">
                        {doctorLabel}
                      </span>
                    </div>
                  </div>

                  <ChevronLeft className="w-4 h-4 text-text-muted group-hover:text-brand-blue group-hover:-translate-x-0.5 transition-all shrink-0 ms-2" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};
