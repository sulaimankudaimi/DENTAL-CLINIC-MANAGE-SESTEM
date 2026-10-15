import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Repeat,
  FileSpreadsheet,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Upload,
  Receipt,
  AlertCircle,
  Tag,
  Building,
  DollarSign,
} from 'lucide-react';
import type {
  Expense,
  ExpenseCategory,
  CreateExpense,
  UpdateExpense,
  PaymentMethod,
} from '@shared/contracts';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_AR } from '@shared/contracts';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { formatCurrencyHalalas } from '@/lib/formatters';
import { exportToCsv } from '@/features/reports/components/ExportUtils';

const CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; text: string; border: string }> = {
  rent: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
  salaries: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  supplies: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  materials: { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
  lab_fees: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  utilities: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  maintenance: { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  marketing: { bg: 'bg-pink-50 dark:bg-pink-950/40', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
  licenses: { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
  other: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-700 dark:text-zinc-300', border: 'border-zinc-200 dark:border-zinc-700' },
};

const PAYMENT_METHOD_AR: Record<string, string> = {
  cash: 'نقدي (Cash)',
  mada: 'بطاقة مدى (Mada)',
  card: 'بطاقة ائتمانية (Credit Card)',
  transfer: 'تحويل بنكي (Bank)',
  credit_card: 'بطاقة ائتمانية (Credit Card)',
  bank_transfer: 'تحويل بنكي (Bank)',
  insurance: 'تأمين',
  apple_pay: 'Apple Pay',
};

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [onlyRecurring, setOnlyRecurring] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('supplies');
  const [formAmountSAR, setFormAmountSAR] = useState('');
  const [formVatPercent, setFormVatPercent] = useState<'0' | '15' | 'custom'>('15');
  const [formCustomVatSAR, setFormCustomVatSAR] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMethod, setFormMethod] = useState<PaymentMethod>('mada');
  const [formPayee, setFormPayee] = useState('');
  const [formReference, setFormReference] = useState('');
  const [formReceiptUrl, setFormReceiptUrl] = useState<string | null>(null);
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formRecurringDay, setFormRecurringDay] = useState('1');
  const [formNotes, setFormNotes] = useState('');

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await api.expenses.list();
      if (res.ok) {
        setExpenses(res.data);
      }
    } catch (e) {
      console.error('Failed to load expenses', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return expenses.filter((e) => {
      // Category filter
      if (selectedCategory !== 'all' && e.category !== selectedCategory) {
        return false;
      }

      // Recurring filter
      if (onlyRecurring && !e.is_recurring) {
        return false;
      }

      // Period filter
      if (periodFilter === 'today' && e.expense_date !== todayStr) {
        return false;
      }
      if (periodFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
        if (e.expense_date < weekAgo || e.expense_date > todayStr) return false;
      }
      if (periodFilter === 'month') {
        const curMonth = todayStr.substring(0, 7);
        if (!e.expense_date.startsWith(curMonth)) return false;
      }
      if (periodFilter === 'year') {
        const curYear = todayStr.substring(0, 4);
        if (!e.expense_date.startsWith(curYear)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesPayee = e.payee?.toLowerCase().includes(q);
        const matchesRef = e.reference?.toLowerCase().includes(q);
        const matchesNotes = e.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesPayee && !matchesRef && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, selectedCategory, onlyRecurring, periodFilter, searchQuery]);

  // Aggregate metrics
  const totalAmountHalalas = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount_halalas, 0);
  }, [filteredExpenses]);

  const totalVatHalalas = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.vat_halalas, 0);
  }, [filteredExpenses]);

  const recurringCount = useMemo(() => {
    return expenses.filter((e) => e.is_recurring).length;
  }, [expenses]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setFormTitle('');
    setFormCategory('supplies');
    setFormAmountSAR('');
    setFormVatPercent('15');
    setFormCustomVatSAR('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormMethod('mada');
    setFormPayee('');
    setFormReference('');
    setFormReceiptUrl(null);
    setFormIsRecurring(false);
    setFormRecurringDay('1');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setFormTitle(exp.title);
    setFormCategory(exp.category);
    setFormAmountSAR((exp.amount_halalas / 100).toFixed(2));
    if (exp.vat_halalas === 0) {
      setFormVatPercent('0');
      setFormCustomVatSAR('0');
    } else {
      const standardVat = Math.round((exp.amount_halalas * 0.15) / 1.15);
      if (Math.abs(exp.vat_halalas - standardVat) < 50) {
        setFormVatPercent('15');
        setFormCustomVatSAR('');
      } else {
        setFormVatPercent('custom');
        setFormCustomVatSAR((exp.vat_halalas / 100).toFixed(2));
      }
    }
    setFormDate(exp.expense_date);
    setFormMethod(exp.payment_method);
    setFormPayee(exp.payee || '');
    setFormReference(exp.reference || '');
    setFormReceiptUrl(exp.receipt_url);
    setFormIsRecurring(exp.is_recurring);
    setFormRecurringDay(exp.recurring_day ? String(exp.recurring_day) : '1');
    setFormNotes(exp.notes || '');
    setIsModalOpen(true);
  };

  // Receipt File upload to DataURL
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormReceiptUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formAmountSAR);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    const totalHalalas = Math.round(amountVal * 100);
    let vatHalalas = 0;
    if (formVatPercent === '15') {
      // 15% inclusive
      vatHalalas = Math.round((totalHalalas * 0.15) / 1.15);
    } else if (formVatPercent === 'custom') {
      const customVal = parseFloat(formCustomVatSAR) || 0;
      vatHalalas = Math.round(customVal * 100);
    }

    const payload: CreateExpense = {
      title: formTitle.trim(),
      category: formCategory,
      amount_halalas: totalHalalas,
      vat_halalas: vatHalalas,
      expense_date: formDate,
      payment_method: formMethod,
      reference: formReference.trim() || null,
      payee: formPayee.trim() || null,
      receipt_url: formReceiptUrl,
      is_recurring: formIsRecurring,
      recurring_day: formIsRecurring ? parseInt(formRecurringDay, 10) || 1 : null,
      notes: formNotes.trim() || null,
      recorded_by: 'خالد المدير المالي',
    };

    if (editingExpense) {
      const res = await api.expenses.update(editingExpense.id, payload as UpdateExpense);
      if (res.ok) {
        setActionMessage('تم تحديث المصروف بنجاح');
        loadExpenses();
        setIsModalOpen(false);
      }
    } else {
      const res = await api.expenses.create(payload);
      if (res.ok) {
        setActionMessage('تم تسجيل المصروف بنجاح');
        loadExpenses();
        setIsModalOpen(false);
      }
    }

    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDeleteExpense = async (id: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف مصروف: "${title}"؟`)) {
      return;
    }
    const res = await api.expenses.delete(id);
    if (res.ok) {
      setActionMessage('تم حذف المصروف بنجاح');
      loadExpenses();
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // Process Recurring Expenses
  const handleProcessRecurring = async () => {
    const res = await api.expenses.processRecurring();
    if (res.ok) {
      if (res.data.length > 0) {
        setActionMessage(`تم بنجاح توليد ${res.data.length} مصروف دوري (إيجار/رواتب) للشهر الحالي!`);
        loadExpenses();
      } else {
        setActionMessage('جميع المصروفات الشهرية الدورية مسجلة مسبقاً لهذا الشهر.');
      }
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const headers = [
      'التاريخ',
      'بند المصروف',
      'الفئة',
      'المستفيد / المورد',
      'طريقة الدفع',
      'المبلغ قبل الضريبة (SAR)',
      'الضريبة (SAR)',
      'الإجمالي (SAR)',
      'متكرر شهرياً',
      'المرجع',
      'ملاحظات',
    ];

    const rows = filteredExpenses.map((e) => {
      const baseSAR = ((e.amount_halalas - e.vat_halalas) / 100).toFixed(2);
      const vatSAR = (e.vat_halalas / 100).toFixed(2);
      const totalSAR = (e.amount_halalas / 100).toFixed(2);
      return [
        e.expense_date,
        e.title,
        EXPENSE_CATEGORY_AR[e.category] || e.category,
        e.payee || '-',
        PAYMENT_METHOD_AR[e.payment_method] || e.payment_method,
        baseSAR,
        vatSAR,
        totalSAR,
        e.is_recurring ? `نعم (يوم ${e.recurring_day})` : 'لا',
        e.reference || '-',
        e.notes || '-',
      ];
    });

    exportToCsv(`سجل_المصروفات_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{actionMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-zinc-800/80 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">إدارة المصروفات والتكاليف</h1>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            تسجيل المصروفات التشغيلية، إرفاق إيصالات السداد، وإدارة الدفعات الدورية كالإيجارات والرواتب
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessRecurring}
            className="h-9 px-3 gap-1.5 text-xs font-medium rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
          >
            <Repeat className="w-4 h-4 text-indigo-600" />
            <span>معالجة التكرار الشهري</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-9 px-3 gap-1.5 text-xs font-medium rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="h-9 px-3.5 gap-1.5 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مصروف جديد</span>
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span>إجمالي المصروفات (الفترة)</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 dark:bg-rose-950/40 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrencyHalalas(totalAmountHalalas)}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            عدد السجلات: {filteredExpenses.length} مصروف
          </div>
        </div>

        {/* Input VAT */}
        <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span>ضريبة المشتريات المستردة (VAT)</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 dark:bg-blue-950/40 rounded-lg">
              <Tag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
            {formatCurrencyHalalas(totalVatHalalas)}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            تخصم من ضريبة المخرجات عند الإقرار
          </div>
        </div>

        {/* Active Recurring Expenses */}
        <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span>مصروفات دورية ثابتة</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 rounded-lg">
              <Repeat className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {recurringCount} بنود
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            رواتب، إيجار المقر، فواتير دورية
          </div>
        </div>

        {/* Major Category */}
        <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span>أعلى فئة صرف</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 dark:bg-amber-950/40 rounded-lg">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-zinc-900 dark:text-white truncate">
            {EXPENSE_CATEGORY_AR.salaries}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            تشكل الحصة الأكبر من المصروفات التشغيلية
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="البحث باسم المصروف، المورد، الرقم المرجعي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-primary"
            />
          </div>

          {/* Period Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
            {[
              { id: 'today', label: 'اليوم' },
              { id: 'week', label: 'الأسبوع' },
              { id: 'month', label: 'الشهر الحالي' },
              { id: 'year', label: 'هذا العام' },
              { id: 'all', label: 'كل الفترات' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriodFilter(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  periodFilter === tab.id
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar & Only Recurring Checkbox */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-700/60">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white font-semibold shadow-2xs'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              جميع الفئات
            </button>
            {EXPENSE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-2xs font-semibold'
                      : `${CATEGORY_COLORS[cat].bg} ${CATEGORY_COLORS[cat].text} ${CATEGORY_COLORS[cat].border} hover:opacity-80`
                  }`}
                >
                  {EXPENSE_CATEGORY_AR[cat]}
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyRecurring}
              onChange={(e) => setOnlyRecurring(e.target.checked)}
              className="rounded-sm border-zinc-300 text-primary focus:ring-primary h-4 w-4"
            />
            <Repeat className="w-3.5 h-3.5 text-indigo-500" />
            <span>المصروفات المتكررة فقط</span>
          </label>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-700/60">
              <tr>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">بند المصروف</th>
                <th className="py-3 px-4">الفئة</th>
                <th className="py-3 px-4">المستفيد / المورد</th>
                <th className="py-3 px-4">طريقة السداد</th>
                <th className="py-3 px-4 text-left">المبلغ الأساسي</th>
                <th className="py-3 px-4 text-left">الضريبة</th>
                <th className="py-3 px-4 text-left">الإجمالي</th>
                <th className="py-3 px-4 text-center">الإيصال</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-zinc-400">
                    <p className="text-sm font-medium">جاري تحميل المصروفات...</p>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-zinc-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                    <p className="text-sm">لا توجد مصروفات مسجلة تطابق هذه الفلاتر</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const catStyle = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.other;
                  const baseHalalas = exp.amount_halalas - exp.vat_halalas;
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-700/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        {exp.expense_date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{exp.title}</span>
                          {exp.is_recurring && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                              <Repeat className="w-2.5 h-2.5" />
                              شهري ({exp.recurring_day})
                            </span>
                          )}
                        </div>
                        {exp.reference && (
                          <span className="block text-[11px] text-zinc-400 font-mono mt-0.5">
                            مرجع: {exp.reference}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                        >
                          {EXPENSE_CATEGORY_AR[exp.category]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                        {exp.payee || '-'}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        {PAYMENT_METHOD_AR[exp.payment_method]}
                      </td>
                      <td className="py-3 px-4 text-left font-mono text-zinc-600 dark:text-zinc-300">
                        {formatCurrencyHalalas(baseHalalas)}
                      </td>
                      <td className="py-3 px-4 text-left font-mono text-blue-600 dark:text-blue-400">
                        {exp.vat_halalas > 0 ? formatCurrencyHalalas(exp.vat_halalas) : '-'}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-zinc-900 dark:text-white">
                        {formatCurrencyHalalas(exp.amount_halalas)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {exp.receipt_url ? (
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptUrl(exp.receipt_url)}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="معاينة صورة الإيصال"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600 text-[11px]">بدون</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(exp)}
                            className="p-1.5 text-zinc-500 hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id, exp.title)}
                            className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot className="bg-zinc-50 dark:bg-zinc-900/60 font-bold border-t border-zinc-200 dark:border-zinc-700/60 text-zinc-900 dark:text-white">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-zinc-700 dark:text-zinc-300">
                    الإجمالي الكلي للسجلات المفلترة ({filteredExpenses.length} مصروف)
                  </td>
                  <td className="py-3 px-4 text-left font-mono">
                    {formatCurrencyHalalas(totalAmountHalalas - totalVatHalalas)}
                  </td>
                  <td className="py-3 px-4 text-left font-mono text-blue-600 dark:text-blue-400">
                    {formatCurrencyHalalas(totalVatHalalas)}
                  </td>
                  <td className="py-3 px-4 text-left font-mono text-rose-600 dark:text-rose-400 text-sm">
                    {formatCurrencyHalalas(totalAmountHalalas)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Create / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-800 w-full max-w-xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                  {editingExpense ? 'تعديل بيانات المصروف' : 'تسجيل مصروف جديد'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  بند المصروف / البيان <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شراء مواد تخدير موضعي وحشوات كمبوزيت"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    فئة المصروف <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-hidden focus:border-primary"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {EXPENSE_CATEGORY_AR[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    تاريخ الصرف <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-hidden focus:border-primary"
                  >
                  </input>
                </div>
              </div>

              {/* Amount & VAT calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    المبلغ الإجمالي (شامل الضريبة إن وجدت) بالريال <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formAmountSAR}
                    onChange={(e) => setFormAmountSAR(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    ضريبة القيمة المضافة (VAT)
                  </label>
                  <select
                    value={formVatPercent}
                    onChange={(e) => setFormVatPercent(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-hidden focus:border-primary"
                  >
                    <option value="15">مشمول بالضريبة القياسية (15%)</option>
                    <option value="0">بدون ضريبة / معفى (0%) كالإيجار والرواتب</option>
                    <option value="custom">مبلغ ضريبة مخصص</option>
                  </select>
                </div>
              </div>

              {formVatPercent === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    قيمة الضريبة المخصصة (بالريال)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formCustomVatSAR}
                    onChange={(e) => setFormCustomVatSAR(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white"
                  />
                </div>
              )}

              {/* Payment Method & Payee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    طريقة الدفع
                  </label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-hidden focus:border-primary"
                  >
                    <option value="mada">بطاقة مدى (Mada)</option>
                    <option value="bank_transfer">تحويل بنكي (Bank Transfer)</option>
                    <option value="cash">نقداً (Cash)</option>
                    <option value="credit_card">بطاقة ائتمانية (Credit Card)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    المستفيد / المورد / الجهة
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: شركة التوريدات الطبية / المالك"
                    value={formPayee}
                    onChange={(e) => setFormPayee(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  الرقم المرجعي / رقم الفاتورة الخارجية
                </label>
                <input
                  type="text"
                  placeholder="مثال: INV-98124 / SADAD-1029"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Monthly Recurring Option */}
              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                <label className="flex items-center gap-2.5 text-xs font-bold text-indigo-950 dark:text-indigo-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsRecurring}
                    onChange={(e) => setFormIsRecurring(e.target.checked)}
                    className="rounded-sm border-indigo-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <Repeat className="w-4 h-4 text-indigo-600" />
                  <span>تكرار شهري تلقائي (مثل الإيجار، الرواتب، الاشتراكات)</span>
                </label>

                {formIsRecurring && (
                  <div className="flex items-center gap-2 pt-1 pr-6">
                    <span className="text-xs text-zinc-600 dark:text-zinc-300">يوم الاستحقاق الشهري:</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formRecurringDay}
                      onChange={(e) => setFormRecurringDay(e.target.value)}
                      className="w-16 text-xs text-center py-1 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800 rounded-lg font-bold"
                    />
                    <span className="text-[11px] text-zinc-400">(من كل شهر ميلادي)</span>
                  </div>
                )}
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  صورة الإيصال أو الفاتورة الضريبية
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 border border-dashed border-zinc-300 dark:border-zinc-600 transition-all">
                    <Upload className="w-4 h-4 text-zinc-500" />
                    <span>رفع صورة الإيصال</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>
                  {formReceiptUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={formReceiptUrl}
                        alt="Receipt preview"
                        className="w-9 h-9 object-cover rounded-lg border border-zinc-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormReceiptUrl(null)}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        إزالة
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  ملاحظات إضافية
                </label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات توثيقية حول الدفعة أو البند..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-700">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 px-4"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="h-9 px-6 bg-primary hover:bg-primary/90 text-white font-semibold"
                >
                  {editingExpense ? 'حفظ التعديلات' : 'تسجيل المصروف'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Image Preview Modal */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl p-4 text-center">
            <button
              type="button"
              onClick={() => setPreviewReceiptUrl(null)}
              className="absolute top-4 left-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-3">
              معاينة إيصال المصروف المرفق
            </h3>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center">
              <img
                src={previewReceiptUrl}
                alt="Receipt"
                className="max-h-full max-w-full rounded-xl object-contain border border-zinc-200 dark:border-zinc-700"
              />
            </div>
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewReceiptUrl(null)}
                className="h-8 px-4"
              >
                إغلاق المعاينة
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
