import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateAr } from '@/lib/formatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import type {
  Patient,
  Lab,
  LabOrder,
  LabOrderStatus,
  LabOrderType,
  Appointment,
} from '@shared/contracts';
import {
  LAB_ORDER_TYPES,
  LAB_ORDER_TYPE_AR,
  LAB_ORDER_STATUS_AR,
} from '@shared/contracts';
import {
  FlaskConical,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building,
  RotateCcw,
  Package,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Trash2,
  Phone,
} from 'lucide-react';

interface LabOrderWithDetails extends LabOrder {
  patient_name?: string;
  patient_phone?: string;
  lab_name?: string;
  is_overdue?: boolean;
}

// FDI Teeth numbering scheme for visual selector
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const COMMON_SHADES = [
  'A1', 'A2', 'A3', 'A3.5', 'A4',
  'B1', 'B2', 'B3', 'B4',
  'C1', 'C2', 'C3', 'C4',
  'D2', 'D3', 'D4',
  'BL1', 'BL2', 'BL3', 'BL4',
];

export const LabOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTabStatus, setActiveTabStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabFilter, setSelectedLabFilter] = useState<string>('all');
  const [onlyOverdueFilter, setOnlyOverdueFilter] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNewLabModalOpen, setIsNewLabModalOpen] = useState(false);

  // Form State for creating Lab Order
  const [formPatientId, setFormPatientId] = useState('');
  const [formLabId, setFormLabId] = useState('');
  const [formType, setFormType] = useState<LabOrderType>('crown');
  const [formWorkDescription, setFormWorkDescription] = useState('');
  const [formToothNumbers, setFormToothNumbers] = useState<number[]>([]);
  const [formShade, setFormShade] = useState('A2');
  const [formDeliveryDate, setFormDeliveryDate] = useState(() => {
    const d = new Date(Date.now() + 5 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [formCostSAR, setFormCostSAR] = useState('350');
  const [formNotes, setFormNotes] = useState('');
  const [formAppointmentId, setFormAppointmentId] = useState<string>('');

  // New Lab Form State
  const [newLabName, setNewLabName] = useState('');
  const [newLabPhone, setNewLabPhone] = useState('');
  const [newLabAddress, setNewLabAddress] = useState('');

  // 1. Fetch Lab Orders
  const { data: ordersResult, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['labOrders', 'list'],
    queryFn: () => api.labOrders.list({ limit: 100 }),
  });
  const orders = (ordersResult?.ok ? ordersResult.data.items : []) as LabOrderWithDetails[];

  // 2. Fetch Labs
  const { data: labsResult } = useQuery({
    queryKey: ['labs', 'all'],
    queryFn: () => api.labs.list(),
  });
  const labs = (labsResult?.ok ? labsResult.data : []) as Lab[];

  // 3. Fetch Patients
  const { data: patientsResult } = useQuery({
    queryKey: ['patients', 'all'],
    queryFn: () => api.patients.list({ limit: 200 }),
  });
  const patients = (patientsResult?.ok ? patientsResult.data.items : []) as Patient[];

  // 4. Fetch Appointments for the selected patient
  const { data: appointmentsResult } = useQuery({
    queryKey: ['appointments', formPatientId],
    queryFn: () => api.appointments.list({ patient_id: formPatientId, limit: 20 }),
    enabled: !!formPatientId,
  });
  const patientAppointments = (appointmentsResult?.ok ? appointmentsResult.data.items : []) as Appointment[];

  // Compute stats
  const now = new Date();
  const overdueOrders = useMemo(() => {
    return orders.filter(
      (o) => !!o.due_at && new Date(o.due_at) < now && o.status !== 'received' && o.status !== 'fitted'
    );
  }, [orders, now]);

  const inProgressCount = useMemo(() => {
    return orders.filter((o) => o.status === 'in_progress' || o.status === 'sent').length;
  }, [orders]);

  const readyCount = useMemo(() => {
    return orders.filter((o) => o.status === 'ready').length;
  }, [orders]);

  const receivedCount = useMemo(() => {
    return orders.filter((o) => o.status === 'received' || o.status === 'fitted').length;
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Overdue filter
      if (onlyOverdueFilter && !o.is_overdue) return false;

      // Status filter
      if (activeTabStatus !== 'all' && o.status !== activeTabStatus) return false;

      // Lab filter
      if (selectedLabFilter !== 'all' && o.lab_id !== selectedLabFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pt = (o.patient_name || '').toLowerCase();
        const lb = (o.lab_name || '').toLowerCase();
        const desc = (o.work_description || '').toLowerCase();
        const notes = (o.notes || '').toLowerCase();
        const teeth = (o.tooth_numbers || []).join(' ');
        if (!pt.includes(q) && !lb.includes(q) && !desc.includes(q) && !notes.includes(q) && !teeth.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [orders, onlyOverdueFilter, activeTabStatus, selectedLabFilter, searchQuery]);

  // Toggle tooth in FDI selector
  const toggleTooth = (num: number) => {
    setFormToothNumbers((prev) =>
      prev.includes(num) ? prev.filter((t) => t !== num) : [...prev, num].sort((a, b) => a - b)
    );
  };

  // Create Lab Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId) {
      alert('يرجى اختيار المريض');
      return;
    }
    if (!formLabId) {
      alert('يرجى اختيار المعمل أو المختبر');
      return;
    }

    const costHalalas = Math.round((parseFloat(formCostSAR) || 0) * 100);

    try {
      const res = await api.labOrders.create({
        clinic_id: patients.find((p) => p.id === formPatientId)?.clinic_id || 'c-001',
        patient_id: formPatientId,
        lab_id: formLabId,
        treatment_id: null,
        appointment_id: formAppointmentId || null,
        type: formType,
        work_description: formWorkDescription.trim() || LAB_ORDER_TYPE_AR[formType],
        tooth_numbers: formToothNumbers,
        shade: formShade.trim() || null,
        sent_at: new Date().toISOString(),
        due_at: formDeliveryDate ? `${formDeliveryDate}T16:00:00.000Z` : null,
        received_at: null,
        status: 'sent', // Initially sent to lab
        cost_halalas: costHalalas,
        notes: formNotes.trim() || null,
      });

      if (res.ok) {
        toast({
          title: 'تم إنشاء أمر المختبر بنجاح',
          description: `تم إرسال الطلب للمعمل مع موعد تسليم ${formatDateAr(formDeliveryDate)}.`,
          variant: 'success',
        });
        setIsCreateModalOpen(false);
        resetForm();
        queryClient.invalidateQueries({ queryKey: ['labOrders'] });
      } else {
        toast({
          title: 'خطأ أثناء الإنشاء',
          description: res.error,
          variant: 'error',
        });
      }
    } catch {
      toast({
        title: 'خطأ غير متوقع',
        variant: 'error',
      });
    }
  };

  const resetForm = () => {
    setFormToothNumbers([]);
    setFormWorkDescription('');
    setFormNotes('');
    setFormAppointmentId('');
  };

  // Create New Lab
  const handleCreateNewLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabName.trim()) return;

    try {
      const res = await api.labs.create({
        clinic_id: patients[0]?.clinic_id || 'c-001',
        name: newLabName.trim(),
        phone: newLabPhone.trim() || null,
        email: null,
        address: newLabAddress.trim() || null,
      });

      if (res.ok) {
        toast({
          title: 'تم تسجيل المختبر الجديد',
          description: `تمت إضافة ${newLabName} لقائمة المعامل المعتمدة.`,
          variant: 'success',
        });
        setIsNewLabModalOpen(false);
        setNewLabName('');
        setNewLabPhone('');
        setNewLabAddress('');
        queryClient.invalidateQueries({ queryKey: ['labs'] });
        if (res.data) {
          setFormLabId(res.data.id);
        }
      }
    } catch {
      toast({ title: 'تعذر حفظ المختبر', variant: 'error' });
    }
  };

  // Update Status
  const handleUpdateStatus = async (orderId: string, newStatus: LabOrderStatus) => {
    try {
      const res = await api.labOrders.updateStatus(orderId, newStatus);
      if (res.ok) {
        toast({
          title: 'تم تحديث حالة العمل',
          description: `الحالة الحالية: ${LAB_ORDER_STATUS_AR[newStatus]}`,
          variant: 'default',
        });
        queryClient.invalidateQueries({ queryKey: ['labOrders'] });
      }
    } catch {
      toast({ title: 'خطأ في التحديث', variant: 'error' });
    }
  };

  // Delete Order
  const handleDeleteOrder = async (id: string) => {
    if (!confirm('هل تريد أرشفة أمر المختبر هذا؟')) return;
    try {
      const res = await api.labOrders.delete(id);
      if (res.ok) {
        toast({ title: 'تمت أرشفة أمر المختبر' });
        queryClient.invalidateQueries({ queryKey: ['labOrders'] });
      }
    } catch {
      toast({ title: 'تعذر الحذف', variant: 'error' });
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status: LabOrderStatus, isOverdue?: boolean) => {
    if (isOverdue) {
      return (
        <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-red-300 inline-flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          متأخر عن التسليم
        </span>
      );
    }

    switch (status) {
      case 'sent':
        return (
          <span className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-blue-200 inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            أُرسل للمختبر
          </span>
        );
      case 'in_progress':
        return (
          <span className="bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            قيد التنفيذ
          </span>
        );
      case 'ready':
        return (
          <span className="bg-purple-50 text-purple-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-purple-200 inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            جاهز للاستلام
          </span>
        );
      case 'received':
        return (
          <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            مستلم بالعيادة
          </span>
        );
      case 'returned':
        return (
          <span className="bg-rose-50 text-rose-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-rose-200 inline-flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" />
            مُعاد للتعديل
          </span>
        );
      case 'fitted':
        return (
          <span className="bg-teal-50 text-teal-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-teal-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            تم التركيب
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
            {LAB_ORDER_STATUS_AR[status] || status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="lab-orders-page">
      <PageHeader
        title="أوامر المختبر ومعامل الأسنان"
        description="إدارة ومتابعة طلبات التركيبات والتعويضات السنية (زيركون، إيماكس، فينير، أطقم) وتتبع مراحل التصنيع ومواعيد التركيب"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsNewLabModalOpen(true)}
              className="text-xs gap-1.5"
            >
              <Building className="w-4 h-4" />
              إضافة معمل جديد
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (patients.length > 0 && !formPatientId) {
                  setFormPatientId(patients[0].id);
                }
                if (labs.length > 0 && !formLabId) {
                  setFormLabId(labs[0].id);
                }
                setIsCreateModalOpen(true);
              }}
              className="text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" />
              إنشاء أمر مختبر جديد
            </Button>
          </div>
        }
      />

      {/* Overdue Orders Alert Banner (Requirement: تنبيه بالأوامر المتأخرة) */}
      {overdueOrders.length > 0 && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-red-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 text-white rounded-lg shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-red-900">
                تنبيه سريري: يوجد ({overdueOrders.length}) أوامر مختبر متأخرة عن موعد التسليم المطلوب!
              </h4>
              <p className="text-xs text-red-800 mt-0.5">
                تجاوزت هذه الأعمال موعد الاستلام المحدد دون أن يتم تسليمها للعيادة. يرجى التواصل مع المعامل لتحديث الحالة أو إعادة جدولة مواعيد التركيب.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setOnlyOverdueFilter((prev) => !prev)}
            className="text-xs gap-1.5"
          >
            {onlyOverdueFilter ? 'عرض كافة الأوامر' : `تصفية الأوامر المتأخرة فقط (${overdueOrders.length})`}
          </Button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{orders.length}</div>
            <div className="text-xs text-slate-500">إجمالي أوامر المختبر</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{inProgressCount}</div>
            <div className="text-xs text-slate-500">قيد التصنيع بالمختبر</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{readyCount}</div>
            <div className="text-xs text-slate-500">جاهز بانتظار الاستلام</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{receivedCount}</div>
            <div className="text-xs text-slate-500">مستلم وجاهز للتركيب</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Status Filter Tabs (Requirement: أُرسل/قيد التنفيذ/جاهز/مستلم/مُعاد) */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'sent', label: 'أُرسل' },
            { id: 'in_progress', label: 'قيد التنفيذ' },
            { id: 'ready', label: 'جاهز' },
            { id: 'received', label: 'مستلم' },
            { id: 'returned', label: 'مُعاد للتعديل' },
            { id: 'fitted', label: 'تم التركيب' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTabStatus(tab.id);
                setOnlyOverdueFilter(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTabStatus === tab.id && !onlyOverdueFilter
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {overdueOrders.length > 0 && (
            <button
              onClick={() => setOnlyOverdueFilter(true)}
              className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
                onlyOverdueFilter
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              ⚠️ المتأخرة ({overdueOrders.length})
            </button>
          )}
        </div>

        {/* Search and Lab Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-44">
            <select
              value={selectedLabFilter}
              onChange={(e) => setSelectedLabFilter(e.target.value)}
              className="w-full text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="all">جميع المعامل</option>
              {labs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالمريض، المعمل، أو رقم السن..."
              className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Orders Grid / Table */}
      {isOrdersLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Spinner size="lg" className="text-brand-blue mx-auto" />
          <p className="text-xs text-slate-400 mt-2">جاري تحميل أوامر المختبر...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <FlaskConical className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">لا توجد أوامر مختبر مطابقة</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            قم بإنشاء أمر جديد لتتبع تصنيع التيجان، الجسور، والفينير مع المختبرات المعتمدة.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isOverdue = order.is_overdue;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition-all space-y-4 ${
                  isOverdue ? 'border-red-400 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">
                        {order.work_description || LAB_ORDER_TYPE_AR[order.type]}
                      </span>
                      {getStatusBadge(order.status, isOverdue)}
                      <span className="text-xs text-brand-blue bg-blue-50 px-2 py-0.5 rounded font-bold">
                        {LAB_ORDER_TYPE_AR[order.type]}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-4">
                      <span>المريض: <strong className="text-slate-800">{order.patient_name}</strong></span>
                      <span>المعمل: <strong className="text-slate-800">{order.lab_name}</strong></span>
                      {order.patient_phone && (
                        <span className="inline-flex items-center gap-1 font-mono text-slate-400">
                          <Phone className="w-3 h-3" />
                          {order.patient_phone}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Quick Status Transition Dropdown (Requirement: تتبع الحالة) */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600">تحديث الحالة:</label>
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value as LabOrderStatus)}
                      className="text-xs py-1 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 outline-none focus:ring-1 focus:ring-brand-blue"
                    >
                      <option value="sent">أُرسل للمختبر</option>
                      <option value="in_progress">قيد التنفيذ</option>
                      <option value="ready">جاهز للاستلام</option>
                      <option value="received">مستلم بالعيادة</option>
                      <option value="returned">مُعاد للتعديل</option>
                      <option value="fitted">تم التركيب للمريض</option>
                    </select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-xs text-red-500 hover:text-red-700 p-1.5"
                      title="أرشفة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الأسنان (FDI):</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {order.tooth_numbers && order.tooth_numbers.length > 0
                        ? order.tooth_numbers.join('، ')
                        : 'فك كامل / غير محدد'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">درجة اللون (Shade):</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {order.shade ? `VITA ${order.shade}` : 'غير محدد'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">تاريخ التسليم المطلوب:</span>
                    <span className={`font-bold font-mono ${isOverdue ? 'text-red-700' : 'text-slate-900'}`}>
                      {order.due_at ? formatDateAr(order.due_at) : 'غير محدد'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">تكلفة المختبر:</span>
                    <span className="font-bold text-brand-navy">
                      {(order.cost_halalas / 100).toLocaleString()} ر.س
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">موعد التركيب المرتبط:</span>
                    {order.appointment_id ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <LinkIcon className="w-3.5 h-3.5" />
                        موعد مجدول
                      </span>
                    ) : (
                      <span className="text-slate-400">غير مرتبط بموعد</span>
                    )}
                  </div>
                </div>

                {order.notes && (
                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                    <strong className="text-slate-800">ملاحظات وتعليمات الفني: </strong>
                    {order.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Lab Order Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="إنشاء أمر مختبر وتصنيع سني جديد"
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
            {/* Patient and Lab */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">المريض *</label>
                <select
                  required
                  value={formPatientId}
                  onChange={(e) => setFormPatientId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">-- اختر المريض --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.family_name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المعمل / المختبر *</label>
                <select
                  required
                  value={formLabId}
                  onChange={(e) => setFormLabId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">-- اختر المختبر --</option>
                  {labs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type of Work and Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع العمل *</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as LabOrderType)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                >
                  {LAB_ORDER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {LAB_ORDER_TYPE_AR[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تفاصيل العمل / الوصف</label>
                <input
                  type="text"
                  value={formWorkDescription}
                  onChange={(e) => setFormWorkDescription(e.target.value)}
                  placeholder="مثال: تاج زيركون كامل تشريحي عالي الشفافية..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            {/* Interactive Visual FDI Teeth Selector */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">
                  اختيار الأسنان المرتبطة بالطلب (نظام FDI الدولي):
                </label>
                <span className="text-[11px] text-brand-blue font-bold">
                  المحدد: {formToothNumbers.length > 0 ? formToothNumbers.join(', ') : 'لا يوجد'}
                </span>
              </div>

              {/* Upper Arch */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block text-center">الفك العلوي (Upper)</span>
                <div className="flex justify-center gap-1">
                  {UPPER_RIGHT.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => toggleTooth(num)}
                      className={`w-7 h-7 text-[11px] font-bold rounded flex items-center justify-center transition-colors font-mono ${
                        formToothNumbers.includes(num)
                          ? 'bg-brand-blue text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <div className="w-1 bg-slate-300 mx-1 rounded"></div>
                  {UPPER_LEFT.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => toggleTooth(num)}
                      className={`w-7 h-7 text-[11px] font-bold rounded flex items-center justify-center transition-colors font-mono ${
                        formToothNumbers.includes(num)
                          ? 'bg-brand-blue text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lower Arch */}
              <div className="space-y-1 pt-1 border-t border-slate-200">
                <div className="flex justify-center gap-1">
                  {LOWER_RIGHT.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => toggleTooth(num)}
                      className={`w-7 h-7 text-[11px] font-bold rounded flex items-center justify-center transition-colors font-mono ${
                        formToothNumbers.includes(num)
                          ? 'bg-brand-blue text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <div className="w-1 bg-slate-300 mx-1 rounded"></div>
                  {LOWER_LEFT.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => toggleTooth(num)}
                      className={`w-7 h-7 text-[11px] font-bold rounded flex items-center justify-center transition-colors font-mono ${
                        formToothNumbers.includes(num)
                          ? 'bg-brand-blue text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 block text-center">الفك السفلي (Lower)</span>
              </div>
            </div>

            {/* Shade Selection & Delivery Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">درجة اللون (Shade)</label>
                <div className="space-y-1.5">
                  <select
                    value={formShade}
                    onChange={(e) => setFormShade(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue font-mono"
                  >
                    {COMMON_SHADES.map((sh) => (
                      <option key={sh} value={sh}>
                        {sh}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ التسليم المطلوب *</label>
                <input
                  type="date"
                  required
                  value={formDeliveryDate}
                  onChange={(e) => setFormDeliveryDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تكلفة المختبر (ر.س) *</label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  required
                  value={formCostSAR}
                  onChange={(e) => setFormCostSAR(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue font-mono"
                />
              </div>
            </div>

            {/* Link with Installation Appointment (Requirement: ربطها بموعد التركيب) */}
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 space-y-1.5">
              <label className="block font-bold text-emerald-950 flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-emerald-700" />
                ربط أمر المختبر بموعد التركيب للمريض:
              </label>
              <select
                value={formAppointmentId}
                onChange={(e) => setFormAppointmentId(e.target.value)}
                className="w-full p-2 bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
              >
                <option value="">-- لا يوجد موعد مرتبط حالياً (يمكن ربطه لاحقاً) --</option>
                {patientAppointments.map((appt) => (
                  <option key={appt.id} value={appt.id}>
                    موعد {formatDateAr(appt.start_at)} ({appt.status})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-emerald-700">
                ربط أمر المختبر بموعد التركيب يضمن وصول العمل وفحصه قبل حضور المريض للعيادة.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                تعليمات وملاحظات خاصة لفني الأسنان
              </label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="مثال: يرجى مراعاة الإطباق، تشريح الحافة اللثوية، وتفريغ نقطة الاتصال مع السن المجاور..."
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" variant="primary" size="sm">
                حفظ وإرسال الطلب
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add New Lab Modal */}
      {isNewLabModalOpen && (
        <Modal
          isOpen={isNewLabModalOpen}
          onClose={() => setIsNewLabModalOpen(false)}
          title="تسجيل معمل / مختبر أسنان جديد"
          className="max-w-md"
        >
          <form onSubmit={handleCreateNewLab} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم المعمل / المختبر *</label>
              <input
                type="text"
                required
                value={newLabName}
                onChange={(e) => setNewLabName(e.target.value)}
                placeholder="مثال: معمل الدقة الرقمي لصناعة الأسنان..."
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الهاتف / الجوال</label>
              <input
                type="text"
                value={newLabPhone}
                onChange={(e) => setNewLabPhone(e.target.value)}
                placeholder="05xxxxxxxx"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">عنوان المقر / المدينة</label>
              <input
                type="text"
                value={newLabAddress}
                onChange={(e) => setNewLabAddress(e.target.value)}
                placeholder="مثال: الرياض - شارع الضباب..."
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewLabModalOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" variant="primary" size="sm">
                إضافة المختبر
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default LabOrdersPage;
