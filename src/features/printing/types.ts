import type {
  Invoice,
  InvoiceItem,
  Payment,
  Patient,
  Clinic,
  TreatmentPlan,
  TreatmentPlanItem,
} from '@shared/contracts';

export type PrintDocumentType =
  | 'invoice'
  | 'receipt'
  | 'prescription'
  | 'medical_report'
  | 'sick_leave'
  | 'treatment_plan'
  | 'lab_order';

export interface PrescriptionItem {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
}

export interface PrescriptionData {
  prescriptionNumber: string;
  date: string;
  patient: Patient;
  dentistName: string;
  dentistSpecialty?: string;
  dentistLicense?: string;
  diagnosis: string;
  allergies?: string[];
  medications: PrescriptionItem[];
  notes?: string;
}

export interface MedicalReportData {
  reportNumber: string;
  date: string;
  patient: Patient;
  dentistName: string;
  dentistSpecialty?: string;
  dentistLicense?: string;
  chiefComplaint: string;
  clinicalFindings: string;
  diagnosis: string;
  proceduresDone: string[];
  recommendations: string;
  notes?: string;
}

export interface SickLeaveData {
  leaveNumber: string;
  date: string;
  patient: Patient;
  attendingDoctor: string;
  doctorSpecialty?: string;
  doctorLicense?: string;
  diagnosis: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  recommendations?: string;
}

export interface PrintableTreatmentPlanItem {
  id?: string;
  plan_id?: string;
  procedure_id?: string;
  procedure_name?: string;
  tooth_number?: number | null;
  phase?: number;
  unit_price_halalas?: number;
  discount_halalas?: number;
  status?: string;
  notes?: string;
}

export interface TreatmentPlanPrintData {
  plan: TreatmentPlan;
  items: (TreatmentPlanItem | PrintableTreatmentPlanItem)[];
  patient: Patient;
  dentistName: string;
  notes?: string;
}

export interface LabOrderPrintData {
  orderNumber: string;
  orderDate: string;
  deliveryDate: string;
  labName: string;
  patient: Patient;
  dentistName: string;
  restorationType: string;
  teethNumbers: number[];
  shade: string;
  instructions: string;
  materials?: string;
}

export interface InvoicePrintData {
  invoice: Invoice;
  items: InvoiceItem[];
  payments?: Payment[];
  patient: Patient;
}

export interface ReceiptPrintData {
  payment: Payment;
  invoice?: Invoice | null;
  patient: Patient;
}

export interface UnifiedPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDocumentType?: PrintDocumentType;
  invoiceData?: InvoicePrintData;
  receiptData?: ReceiptPrintData;
  prescriptionData?: PrescriptionData;
  medicalReportData?: MedicalReportData;
  sickLeaveData?: SickLeaveData;
  treatmentPlanData?: TreatmentPlanPrintData;
  labOrderData?: LabOrderPrintData;
  clinic?: Clinic | null;
}
