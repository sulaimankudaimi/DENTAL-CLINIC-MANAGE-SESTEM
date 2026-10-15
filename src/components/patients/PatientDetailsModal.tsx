import React from 'react';
import { PatientDetailsDialog } from '@/features/patients/components/PatientDetailsDialog';

export interface PatientDetailsModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  patientId: string | null;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  isOpen,
  open,
  onClose,
  onOpenChange,
  patientId,
}) => {
  const isShown = open ?? isOpen ?? false;
  const handleOpenChange = (val: boolean) => {
    if (!val && onClose) onClose();
    if (onOpenChange) onOpenChange(val);
  };

  return (
    <PatientDetailsDialog
      open={isShown}
      onOpenChange={handleOpenChange}
      patientId={patientId}
    />
  );
};

export default PatientDetailsModal;
