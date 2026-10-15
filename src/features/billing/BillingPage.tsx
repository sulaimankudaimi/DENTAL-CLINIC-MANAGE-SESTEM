import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Invoice, CreatePayment, Payment } from '@shared/contracts';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { BillingKpiCards } from './components/BillingKpiCards';
import { InvoicesTable } from './components/InvoicesTable';
import { InsuranceSidebar } from './components/InsuranceSidebar';
import { FinancialChartsRow } from './components/FinancialChartsRow';
import { InvoiceDetailsDrawer } from './components/InvoiceDetailsDrawer';
import { PaymentDialog } from './components/PaymentDialog';
import { InstallmentsPlanDialog } from './components/InstallmentsPlanDialog';
import { VoidInvoiceDialog } from './components/VoidInvoiceDialog';
import { PrintableInvoice } from './components/PrintableInvoice';
import { PrintableReceipt } from './components/PrintableReceipt';
import { formatCurrency, formatDateAr } from '@/lib/formatters';
import { renderMessageTemplate } from '@/lib/messageTemplates';
import { RefreshCw, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UnifiedPrintModal } from '@/features/printing/UnifiedPrintModal';

export const BillingPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Dialog & Drawer States
  const [selectedInvoiceForDrawer, setSelectedInvoiceForDrawer] = useState<Invoice | null>(null);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<Invoice | null>(null);
  const [selectedInvoiceForInstallments, setSelectedInvoiceForInstallments] = useState<Invoice | null>(null);
  const [selectedInvoiceForVoid, setSelectedInvoiceForVoid] = useState<Invoice | null>(null);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<{ payment: Payment; invoice?: Invoice | null } | null>(null);
  const [isGeneralPrintModalOpen, setIsGeneralPrintModalOpen] = useState(false);

  // 1. Fetch Invoices
  const { data: invoicesData, refetch: refetchInvoices } = useQuery({
    queryKey: queryKeys.invoices.all,
    queryFn: async () => {
      const res = await api.invoices.list({ limit: 100 });
      return res.ok ? res.data.items : [];
    },
  });

  // 2. Fetch Patients
  const { data: patientsData } = useQuery({
    queryKey: queryKeys.patients.all,
    queryFn: async () => {
      const res = await api.patients.list({ limit: 200 });
      return res.ok ? res.data.items : [];
    },
  });

  // 3. Fetch Insurance Claims & Companies
  const { data: claimsData } = useQuery({
    queryKey: queryKeys.insurance.claims(),
    queryFn: async () => {
      const res = await api.insurance.getClaims();
      return res.ok ? res.data : [];
    },
  });

  const { data: companiesData } = useQuery({
    queryKey: queryKeys.insurance.companies,
    queryFn: async () => {
      const res = await api.insurance.getCompanies();
      return res.ok ? res.data : [];
    },
  });

  // 4. Fetch Staff (Dentists / Users)
  const { data: staffData } = useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: async () => {
      const res = await api.staff.list();
      return res.ok ? res.data.items : [];
    },
  });

  // 5. Fetch Financials Report & Charts Data
  const { data: financialsData, isLoading: isLoadingFinancials } = useQuery({
    queryKey: queryKeys.reports.financials(),
    queryFn: async () => {
      const res = await api.reports.getFinancials();
      return res.ok ? res.data : null;
    },
  });

  // 6. Fetch Clinic Settings
  const { data: clinicData } = useQuery({
    queryKey: queryKeys.settings.clinic,
    queryFn: async () => {
      const res = await api.settings.getClinic();
      return res.ok ? res.data : null;
    },
  });

  // 7. Fetch Full Invoice Details when Drawer is Open
  const drawerInvoiceId = selectedInvoiceForDrawer?.id;
  const { data: fullDrawerInvoice } = useQuery({
    queryKey: queryKeys.invoices.detail(drawerInvoiceId || ''),
    queryFn: async () => {
      if (!drawerInvoiceId) return null;
      const res = await api.invoices.getById(drawerInvoiceId);
      return res.ok ? res.data : null;
    },
    enabled: !!drawerInvoiceId,
  });

  // 7. Fetch Installments for Selected Drawer Invoice
  const { data: drawerInstallments } = useQuery({
    queryKey: queryKeys.invoices.installments(drawerInvoiceId || ''),
    queryFn: async () => {
      if (!drawerInvoiceId || !api.invoices.getInstallments) return [];
      const res = await api.invoices.getInstallments(drawerInvoiceId);
      return res.ok ? res.data : [];
    },
    enabled: !!drawerInvoiceId,
  });

  // 8. Mutations
  // Record Payment
  const paymentMutation = useMutation({
    mutationFn: async ({
      payload,
      shouldPrint,
    }: {
      payload: CreatePayment;
      shouldPrint?: boolean;
    }) => {
      const res = await api.payments.create(payload);
      if (!res.ok) throw new Error(res.error);
      return { payment: res.data, shouldPrint };
    },
    onSuccess: ({ payment, shouldPrint }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.financials() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todaySummary });
      if (selectedInvoiceForPay) {
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(selectedInvoiceForPay.id) });
      }

      const inv = selectedInvoiceForPay;
      setSelectedInvoiceForPay(null);

      if (shouldPrint) {
        setReceiptToPrint({ payment, invoice: inv });
      }
    },
  });

  // Create Installments
  const installmentsMutation = useMutation({
    mutationFn: async ({
      invoiceId,
      installments,
    }: {
      invoiceId: string;
      installments: Array<{ due_date: string; amount_halalas: number }>;
    }) => {
      if (!api.invoices.createInstallments) throw new Error('خاصية التقسيط غير مدعومة');
      const res = await api.invoices.createInstallments(invoiceId, installments);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.installments(vars.invoiceId) });
      setSelectedInvoiceForInstallments(null);
    },
  });

  // Void Invoice
  const voidMutation = useMutation({
    mutationFn: async ({ invoiceId, reason }: { invoiceId: string; reason: string }) => {
      if (!api.invoices.voidInvoice) throw new Error('خاصية الإلغاء غير مدعومة');
      const res = await api.invoices.voidInvoice(invoiceId, reason);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(vars.invoiceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.financials() });
      setSelectedInvoiceForVoid(null);
      if (selectedInvoiceForDrawer?.id === vars.invoiceId) {
        setSelectedInvoiceForDrawer(null);
      }
    },
  });

  // WhatsApp helper
  const handleWhatsApp = (invoice: Invoice) => {
    const patient = (patientsData || []).find((p) => p.id === invoice.patient_id);
    const patientName = patient ? `${patient.first_name} ${patient.family_name}` : 'عزيزي المريض';
    const rawPhone = patient?.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');

    const messageText = renderMessageTemplate(
      'invoice_notification',
      {
        patient_name: patientName,
        clinic: 'عيادة النخبة لطب الأسنان',
        clinic_name: 'عيادة النخبة لطب الأسنان',
        date: formatDateAr(invoice.issue_date),
        time: '',
        invoice_number: invoice.number,
        invoice_amount: (invoice.total_halalas / 100).toLocaleString('ar-SA'),
        invoice_link: `https://eyadati.app/i/${invoice.id}`,
      },
      `مرحباً ${patientName}،\nيسر عيادات د. أحمد لطب الأسنان تزويدكم بتفاصيل فاتورتكم رقم ${invoice.number}.\nالمبلغ الإجمالي: ${formatCurrency(
        invoice.total_halalas
      )}\nالمسدد: ${formatCurrency(invoice.paid_halalas)}\nالمتبقي: ${formatCurrency(
        invoice.balance_halalas
      )}\nتاريخ الإصدار: ${formatDateAr(invoice.issue_date)}\n\nنشكركم لاختياركم عيادتنا!`
    );

    const message = encodeURIComponent(messageText);

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith('966') ? cleanPhone : '966' + cleanPhone.replace(/^0/, '')}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(waUrl, '_blank');
  };

  const invoices = invoicesData || [];
  const patients = patientsData || [];
  const claims = claimsData || [];
  const companies = companiesData || [];
  const staff = staffData || [];

  const getPatientName = (patientId: string) => {
    const p = patients.find((x) => x.id === patientId);
    return p ? `${p.first_name} ${p.family_name}` : 'مريض غير مسجل';
  };

  return (
    <div className="space-y-5 p-2 sm:p-4 max-w-[1600px] mx-auto text-slate-800" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">الفواتير والمحاسبة</h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1E4E9C] border border-blue-100">
              عيادة الأسنان الاحترافية
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة الفواتير، التحصيل المالي، متابعة مطالبات التأمين، والتقارير النقدية الفورية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsGeneralPrintModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/5"
          >
            <Printer className="w-3.5 h-3.5" />
            طباعة المستندات والنماذج
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchInvoices()}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <BillingKpiCards
        monthlyRevenueHalalas={financialsData?.summary?.monthlyRevenueHalalas || 120000}
        pendingInvoicesCount={financialsData?.summary?.pendingInvoicesCount || 25}
        refundedHalalas={financialsData?.summary?.refundedHalalas || 0}
        insuranceStatusText="حالة التأمين"
        insuranceApprovedPercent={financialsData?.summary?.insuranceApprovedPercent || 94}
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Right / Center Column: Invoices Table + Charts Row (8 or 9 cols) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {/* Invoices Table */}
          <InvoicesTable
            invoices={invoices}
            patients={patients}
            onView={(inv) => setSelectedInvoiceForDrawer(inv)}
            onPrint={(inv) => setSelectedInvoiceForPrint(inv)}
            onPay={(inv) => setSelectedInvoiceForPay(inv)}
            onInstallments={(inv) => setSelectedInvoiceForInstallments(inv)}
            onWhatsApp={handleWhatsApp}
            onVoid={(inv) => setSelectedInvoiceForVoid(inv)}
          />

          {/* Bottom Charts Row (Recharts: Donut, Bar, Area) */}
          <FinancialChartsRow data={financialsData} isLoading={isLoadingFinancials} />
        </div>

        {/* Left Column: Insurance Sidebar (4 or 3 cols) */}
        <div className="lg:col-span-4 xl:col-span-3">
          <InsuranceSidebar
            claims={claims}
            companies={companies}
            patients={patients}
            dentists={staff}
          />
        </div>
      </div>

      {/* Invoice Details Drawer */}
      <InvoiceDetailsDrawer
        isOpen={!!selectedInvoiceForDrawer}
        onClose={() => setSelectedInvoiceForDrawer(null)}
        invoice={fullDrawerInvoice || selectedInvoiceForDrawer}
        items={fullDrawerInvoice?.items || []}
        payments={fullDrawerInvoice?.payments || []}
        installments={drawerInstallments || []}
        patient={patients.find((p) => p.id === selectedInvoiceForDrawer?.patient_id)}
        onPay={() => {
          if (selectedInvoiceForDrawer) {
            setSelectedInvoiceForPay(selectedInvoiceForDrawer);
          }
        }}
        onInstallments={() => {
          if (selectedInvoiceForDrawer) {
            setSelectedInvoiceForInstallments(selectedInvoiceForDrawer);
          }
        }}
        onPrint={() => {
          if (selectedInvoiceForDrawer) {
            setSelectedInvoiceForPrint(selectedInvoiceForDrawer);
          }
        }}
        onWhatsApp={() => {
          if (selectedInvoiceForDrawer) {
            handleWhatsApp(selectedInvoiceForDrawer);
          }
        }}
        onVoid={() => {
          if (selectedInvoiceForDrawer) {
            setSelectedInvoiceForVoid(selectedInvoiceForDrawer);
          }
        }}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={!!selectedInvoiceForPay}
        onClose={() => setSelectedInvoiceForPay(null)}
        invoice={selectedInvoiceForPay}
        patientName={selectedInvoiceForPay ? getPatientName(selectedInvoiceForPay.patient_id) : ''}
        isSubmitting={paymentMutation.isPending}
        onSuccess={(payload, shouldPrint) => {
          paymentMutation.mutate({ payload, shouldPrint });
        }}
      />

      {/* Installments Plan Dialog */}
      <InstallmentsPlanDialog
        isOpen={!!selectedInvoiceForInstallments}
        onClose={() => setSelectedInvoiceForInstallments(null)}
        invoice={selectedInvoiceForInstallments}
        patientName={
          selectedInvoiceForInstallments
            ? getPatientName(selectedInvoiceForInstallments.patient_id)
            : ''
        }
        isSaving={installmentsMutation.isPending}
        onSave={(installments) => {
          if (selectedInvoiceForInstallments) {
            installmentsMutation.mutate({
              invoiceId: selectedInvoiceForInstallments.id,
              installments,
            });
          }
        }}
      />

      {/* Void Invoice Dialog */}
      <VoidInvoiceDialog
        isOpen={!!selectedInvoiceForVoid}
        onClose={() => setSelectedInvoiceForVoid(null)}
        invoice={selectedInvoiceForVoid}
        patientName={selectedInvoiceForVoid ? getPatientName(selectedInvoiceForVoid.patient_id) : ''}
        isSubmitting={voidMutation.isPending}
        onConfirmVoid={(invoiceId, reason) => {
          voidMutation.mutate({ invoiceId, reason });
        }}
      />

      {/* Printable Tax Invoice Modal */}
      {selectedInvoiceForPrint && (
        <PrintableInvoice
          invoice={selectedInvoiceForPrint}
          items={
            fullDrawerInvoice && fullDrawerInvoice.id === selectedInvoiceForPrint.id
              ? fullDrawerInvoice.items
              : []
          }
          payments={
            fullDrawerInvoice && fullDrawerInvoice.id === selectedInvoiceForPrint.id
              ? fullDrawerInvoice.payments
              : []
          }
          patient={patients.find((p) => p.id === selectedInvoiceForPrint.patient_id)}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}

      {/* Printable Payment Receipt Modal */}
      {receiptToPrint && (
        <PrintableReceipt
          payment={receiptToPrint.payment}
          invoice={receiptToPrint.invoice}
          patient={
            receiptToPrint.invoice
              ? patients.find((p) => p.id === receiptToPrint.invoice?.patient_id)
              : null
          }
          onClose={() => setReceiptToPrint(null)}
        />
      )}
      {/* General Unified Document Printing Modal */}
      <UnifiedPrintModal
        isOpen={isGeneralPrintModalOpen}
        onClose={() => setIsGeneralPrintModalOpen(false)}
        clinic={clinicData}
      />
    </div>
  );
};

export default BillingPage;
