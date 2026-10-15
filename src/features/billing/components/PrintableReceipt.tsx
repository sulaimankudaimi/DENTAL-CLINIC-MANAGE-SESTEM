import React from 'react';
import type { Payment, Invoice, Patient } from '@shared/contracts';
import { UnifiedPrintModal } from '@/features/printing/UnifiedPrintModal';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export interface PrintableReceiptProps {
  payment: Payment;
  invoice?: Invoice | null;
  patient?: Patient | null;
  onClose: () => void;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  payment,
  invoice,
  patient,
  onClose,
}) => {
  const { data: clinic } = useQuery({
    queryKey: queryKeys.settings.clinic,
    queryFn: async () => {
      const res = await api.settings.getClinic();
      return res.ok ? res.data : null;
    },
  });

  const fullPatient: Patient = patient || ({
    id: payment.patient_id,
    clinic_id: payment.clinic_id,
    code: 'P-1048',
    first_name: 'مريض',
    family_name: 'غير مسجل',
    gender: 'male',
    phone: '0550000000',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  } as unknown as Patient);

  return (
    <UnifiedPrintModal
      isOpen={true}
      onClose={onClose}
      initialDocumentType="receipt"
      receiptData={{
        payment,
        invoice,
        patient: fullPatient,
      }}
      clinic={clinic}
    />
  );
};
