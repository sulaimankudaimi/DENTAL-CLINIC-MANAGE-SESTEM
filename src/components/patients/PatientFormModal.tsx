import React from 'react';
import { PatientFormDialog } from '@/features/patients/components/PatientFormDialog';
import type { Patient, CreatePatient, UpdatePatient } from '@shared/contracts';

export interface PatientFormModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  patient?: Patient | null;
  onSubmit?: (data: CreatePatient | UpdatePatient) => void | Promise<void>;
  isLoading?: boolean;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  open,
  onClose,
  onOpenChange,
  patient,
  onSubmit,
}) => {
  const isShown = open ?? isOpen ?? false;
  const handleOpenChange = (val: boolean) => {
    if (!val && onClose) onClose();
    if (onOpenChange) onOpenChange(val);
  };

  return (
    <PatientFormDialog
      open={isShown}
      onOpenChange={handleOpenChange}
      patient={patient}
      onSuccess={(saved) => {
        if (onSubmit) onSubmit(saved as any);
        handleOpenChange(false);
      }}
    />
  );
};

export default PatientFormModal;
