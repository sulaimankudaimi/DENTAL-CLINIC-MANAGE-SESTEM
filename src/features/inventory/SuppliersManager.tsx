import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/SearchInput';
import type { Supplier, CreateSupplier } from '@shared/contracts';
import {
  Plus,
  Phone,
  Mail,
  Edit2,
  Trash2,
  AlertTriangle,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export const SuppliersManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: queryKeys.inventory.suppliers,
    queryFn: async () => {
      const res = await api.inventory.getSuppliers();
      return res?.ok ? res.data : [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateSupplier) => {
      if (editingSupplier) {
        return api.inventory.updateSupplier(editingSupplier.id, payload);
      }
      return api.inventory.createSupplier(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.suppliers });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.inventory.deleteSupplier(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.suppliers });
    },
  });

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setEditingSupplier(null);
    setErrorMsg(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setPhone(sup.phone || '');
    setEmail(sup.email || '');
    setNotes(sup.notes || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم المورد أو الشركة');
      return;
    }
    saveMutation.mutate({
      clinic_id: 'c1000000-0000-0000-0000-000000000001',
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      notes: notes.trim() || null,
    });
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search)) ||
      (s.notes && s.notes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4 text-xs">
      {/* Header & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="w-72">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المورد، الهاتف، أو الملاحظات..."
          />
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          إضافة مورد جديد
        </Button>
      </div>

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="bg-white p-12 text-center text-slate-500 rounded-xl border border-slate-200">
          جاري تحميل قائمة الموردين...
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
          لا يوجد موردون مسجلون مطابقون للبحث
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-brand-navy/30 transition-all flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-navy/10 flex items-center justify-center text-brand-navy font-bold shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{supplier.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        كود: {supplier.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(supplier)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-brand-navy hover:bg-slate-100 transition-colors"
                      title="تعديل المورد"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف المورد "${supplier.name}"؟`)) {
                          deleteMutation.mutate(supplier.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="حذف المورد"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-600 pt-2 border-t border-slate-100">
                  {supplier.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{supplier.phone}</span>
                    </div>
                  )}

                  {supplier.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px] truncate">{supplier.email}</span>
                    </div>
                  )}

                  {supplier.notes && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 pt-1 leading-relaxed">
                      {supplier.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  مورد معتمد
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit Supplier */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'تعديل بيانات المورد' : 'إضافة شركة أو مورد طبي جديد'}
        description="تسجيل بيانات الاتصال، شروط الدفع، والمواد التي يوردها للعيادة"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="اسم الشركة أو المورد *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: مؤسسة التجهيزات السنية المتقدمة"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="رقم الهاتف / الجوال"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
            />

            <Input
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="orders@supplier.com"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              ملاحظات وشروط التوريد / السداد
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: يورد مواد 3M وأدوات الجذور، شروط الدفع آجل 30 يوماً، التوصيل خلال 48 ساعة..."
              className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'جاري الحفظ...' : editingSupplier ? 'حفظ التعديلات' : 'إضافة المورد'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
