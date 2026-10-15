import React, { useState } from 'react';
import {
  GitFork,
  DoorOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Wrench,
  Sparkles,
  Radio,
  MapPin,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { BranchItem, DentalRoomItem } from '../types';

interface BranchesRoomsTabProps {
  branches: BranchItem[];
  rooms: DentalRoomItem[];
  onSaveBranches: (branches: BranchItem[]) => void;
  onSaveRooms: (rooms: DentalRoomItem[]) => void;
}

export const BranchesRoomsTab: React.FC<BranchesRoomsTabProps> = ({
  branches,
  rooms,
  onSaveBranches,
  onSaveRooms,
}) => {
  const { showToast } = useToast();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // Branch Modal
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchAddress, setBranchAddress] = useState('');

  // Room Modal
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<DentalRoomItem | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomBranchId, setRoomBranchId] = useState(branches[0]?.id || 'branch-1');
  const [roomStatus, setRoomStatus] = useState<'free' | 'busy' | 'maintenance'>('free');
  const [chairModel, setChairModel] = useState('');
  const [hasXray, setHasXray] = useState(false);
  const [hasBleaching, setHasBleaching] = useState(false);

  // Filtered rooms
  const filteredRooms =
    selectedBranchId === 'all'
      ? rooms
      : rooms.filter((r) => r.branch_id === selectedBranchId);

  // Open Branch Modal
  const openBranchModal = (branch?: BranchItem) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchName(branch.name);
      setBranchCode(branch.code);
      setBranchPhone(branch.phone);
      setBranchAddress(branch.address);
    } else {
      setEditingBranch(null);
      setBranchName('');
      setBranchCode(`BR-${Math.floor(100 + Math.random() * 900)}`);
      setBranchPhone('');
      setBranchAddress('');
    }
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;

    if (editingBranch) {
      const updated = branches.map((b) =>
        b.id === editingBranch.id
          ? {
              ...b,
              name: branchName,
              code: branchCode,
              phone: branchPhone,
              address: branchAddress,
            }
          : b
      );
      onSaveBranches(updated);
      showToast({ title: 'تم التعديل', description: 'تم تحديث بيانات الفرع بنجاح', variant: 'success' });
    } else {
      const newBranch: BranchItem = {
        id: `branch-${Date.now()}`,
        name: branchName,
        code: branchCode,
        phone: branchPhone,
        address: branchAddress,
        is_main: branches.length === 0,
        is_active: true,
      };
      onSaveBranches([...branches, newBranch]);
      showToast({ title: 'تمت الإضافة', description: 'تمت إضافة الفرع الجديد بنجاح', variant: 'success' });
    }
    setIsBranchModalOpen(false);
  };

  // Open Room Modal
  const openRoomModal = (room?: DentalRoomItem) => {
    if (room) {
      setEditingRoom(room);
      setRoomName(room.name);
      setRoomNumber(room.number);
      setRoomBranchId(room.branch_id);
      setRoomStatus(room.status);
      setChairModel(room.chair_model || '');
      setHasXray(!!room.has_xray);
      setHasBleaching(!!room.has_bleaching);
    } else {
      setEditingRoom(null);
      setRoomName('');
      setRoomNumber(String(rooms.length + 101));
      setRoomBranchId(selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || 'branch-1');
      setRoomStatus('free');
      setChairModel('Sirona Dentsply 2024');
      setHasXray(true);
      setHasBleaching(false);
    }
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    let eqCount = 2;
    if (hasXray) eqCount += 1;
    if (hasBleaching) eqCount += 1;

    if (editingRoom) {
      const updated = rooms.map((r) =>
        r.id === editingRoom.id
          ? {
              ...r,
              name: roomName,
              number: roomNumber,
              branch_id: roomBranchId,
              status: roomStatus,
              chair_model: chairModel,
              has_xray: hasXray,
              has_bleaching: hasBleaching,
              equipment_count: eqCount,
            }
          : r
      );
      onSaveRooms(updated);
      showToast({ title: 'تم التعديل', description: 'تم تحديث بيانات العيادة / الغرفة بنجاح', variant: 'success' });
    } else {
      const newRoom: DentalRoomItem = {
        id: `room-${Date.now()}`,
        branch_id: roomBranchId,
        name: roomName,
        number: roomNumber,
        status: roomStatus,
        chair_model: chairModel,
        has_xray: hasXray,
        has_bleaching: hasBleaching,
        equipment_count: eqCount,
        is_active: true,
      };
      onSaveRooms([...rooms, newRoom]);
      showToast({ title: 'تمت الإضافة', description: 'تمت إضافة عيادة الأسنان الجديدة بنجاح', variant: 'success' });
    }
    setIsRoomModalOpen(false);
  };

  const handleDeleteRoom = (roomId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الغرفة من النظام؟')) return;
    const updated = rooms.filter((r) => r.id !== roomId);
    onSaveRooms(updated);
    showToast({ title: 'تم الحذف', description: 'تم حذف الغرفة بنجاح', variant: 'success' });
  };

  const handleToggleRoomStatus = (roomId: string, newStatus: 'free' | 'busy' | 'maintenance') => {
    const updated = rooms.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r));
    onSaveRooms(updated);
    showToast({
      title: 'حالة العيادة',
      description: `تم تغيير حالة العيادة إلى: ${
        newStatus === 'free' ? 'متاحة' : newStatus === 'busy' ? 'مشغولة' : 'تحت الصيانة'
      }`,
      variant: 'info',
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Branches Section */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">فروع العيادة والمراكز الطبية</h2>
              <p className="text-xs text-text-secondary">إدارة فروع المؤسسة وتوزيع الغرف والكراسي عليها</p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 self-start sm:self-auto"
            onClick={() => openBranchModal()}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة فرع جديد</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {branches.map((branch) => {
            const branchRoomsCount = rooms.filter((r) => r.branch_id === branch.id).length;
            const isSelected = selectedBranchId === branch.id;
            return (
              <div
                key={branch.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-brand-navy bg-brand-navy/5 shadow-xs'
                    : 'border-surface-border bg-surface-ground hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-text-primary">{branch.name}</span>
                      {branch.is_main && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                          الفرع الرئيسي
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-text-secondary flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="text-[11px] text-text-secondary flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{branch.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openBranchModal(branch)}
                      className="p-1.5 text-text-secondary hover:text-brand-navy rounded-lg hover:bg-white"
                      title="تعديل الفرع"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-surface-border/40 flex items-center justify-between text-xs">
                  <span className="text-text-secondary">عدد العيادات / الكراسي:</span>
                  <span className="font-bold text-brand-navy">{branchRoomsCount} عيادات</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Dental Rooms & Chairs Section */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">غرف وكراسي علاج الأسنان</h2>
              <p className="text-xs text-text-secondary">
                إجمالي {rooms.length} عيادات موزعة • متابعة الجاهزية والأجهزة الملحقة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Branch Filter */}
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="text-xs h-9 px-3 rounded-xl border border-surface-border bg-surface-card"
            >
              <option value="all">كافة الفروع ({rooms.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              variant="primary"
              className="gap-1.5"
              onClick={() => openRoomModal()}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة عيادة / كرسي</span>
            </Button>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => {
            const branch = branches.find((b) => b.id === room.branch_id);

            return (
              <div
                key={room.id}
                className="bg-surface-ground rounded-xl border border-surface-border p-4 space-y-3 hover:shadow-xs transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-brand-navy">#{room.number}</span>
                      <h3 className="text-xs font-bold text-text-primary">{room.name}</h3>
                    </div>
                    <span className="text-[10px] text-text-secondary block">
                      {branch ? branch.name : 'الفرع الرئيسي'}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {room.status === 'free' && (
                    <Badge variant="ok" className="gap-1 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      متاحة
                    </Badge>
                  )}
                  {room.status === 'busy' && (
                    <Badge variant="warning" className="gap-1 text-[10px]">
                      <Clock className="w-3 h-3 text-amber-600" />
                      مشغولة
                    </Badge>
                  )}
                  {room.status === 'maintenance' && (
                    <Badge variant="danger" className="gap-1 text-[10px]">
                      <Wrench className="w-3 h-3 text-red-600" />
                      صيانة
                    </Badge>
                  )}
                </div>

                {/* Chair Model & Equipment */}
                <div className="text-[11px] space-y-1.5 bg-white p-2.5 rounded-lg border border-surface-border/50">
                  <div className="flex justify-between text-text-secondary">
                    <span>طراز الكرسي:</span>
                    <span className="font-semibold text-text-primary">{room.chair_model || 'Standard Unit'}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-[10px]">
                    {room.has_xray && (
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        <Radio className="w-2.5 h-2.5" />
                        أشعة سينية
                      </span>
                    )}
                    {room.has_bleaching && (
                      <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                        <Sparkles className="w-2.5 h-2.5" />
                        تبييض Zoom
                      </span>
                    )}
                    <span className="text-text-secondary mr-auto">
                      {room.equipment_count} أجهزة
                    </span>
                  </div>
                </div>

                {/* Actions & Quick Status Switcher */}
                <div className="pt-2 border-t border-surface-border/40 flex items-center justify-between gap-1">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleRoomStatus(room.id, 'free')}
                      className={`px-2 py-1 text-[10px] rounded font-bold transition-colors ${
                        room.status === 'free'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-emerald-100'
                      }`}
                      title="تعيين كمتاحة"
                    >
                      متاحة
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleRoomStatus(room.id, 'busy')}
                      className={`px-2 py-1 text-[10px] rounded font-bold transition-colors ${
                        room.status === 'busy'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-amber-100'
                      }`}
                      title="تعيين كمشغولة"
                    >
                      مشغولة
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleRoomStatus(room.id, 'maintenance')}
                      className={`px-2 py-1 text-[10px] rounded font-bold transition-colors ${
                        room.status === 'maintenance'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-red-100'
                      }`}
                      title="تعيين للصيانة"
                    >
                      صيانة
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openRoomModal(room)}
                      className="p-1.5 text-text-secondary hover:text-brand-navy rounded hover:bg-white"
                      title="تعديل العيادة"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="p-1.5 text-text-secondary hover:text-red-600 rounded hover:bg-white"
                      title="حذف العيادة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Branch Modal */}
      <Modal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        title={editingBranch ? 'تعديل بيانات الفرع' : 'إضافة فرع طبي جديد'}
      >
        <form onSubmit={handleSaveBranch} className="space-y-4">
          <Input
            label="اسم الفرع *"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="مثال: فرع التخصصي الرئيسي"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="رمز الفرع (الكود)"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              placeholder="BR-001"
            />
            <Input
              label="رقم الهاتف"
              value={branchPhone}
              onChange={(e) => setBranchPhone(e.target.value)}
              placeholder="011XXXXXXX"
            />
          </div>
          <Input
            label="العنوان الجغرافي"
            value={branchAddress}
            onChange={(e) => setBranchAddress(e.target.value)}
            placeholder="الشارع، الحي، المدينة"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-surface-border">
            <Button type="button" variant="outline" onClick={() => setIsBranchModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary">
              {editingBranch ? 'تحديث الفرع' : 'حفظ الفرع'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Room Modal */}
      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        title={editingRoom ? 'تعديل بيانات العيادة / الكرسي' : 'إضافة عيادة / كرسي أسنان جديد'}
      >
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="اسم العيادة *"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="مثال: عيادة الجراحة والزراعة 1"
              required
            />
            <Input
              label="رقم العيادة *"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="101"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">الفرع التابع له *</label>
              <select
                value={roomBranchId}
                onChange={(e) => setRoomBranchId(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-surface-border bg-surface-card"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">الحالة المبدئية</label>
              <select
                value={roomStatus}
                onChange={(e) => setRoomStatus(e.target.value as any)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-surface-border bg-surface-card"
              >
                <option value="free">متاحة لاستقبال المرضى</option>
                <option value="busy">مشغولة حالياً</option>
                <option value="maintenance">تحت الصيانة الدورية</option>
              </select>
            </div>
          </div>

          <Input
            label="طراز كرسي الأسنان (Dental Chair Model)"
            value={chairModel}
            onChange={(e) => setChairModel(e.target.value)}
            placeholder="مثال: Sirona Intego Pro 2024"
          />

          <div className="p-3 bg-surface-ground rounded-xl border border-surface-border space-y-2">
            <span className="text-xs font-bold text-text-primary block">تجهيزات ومعدات إضافية في الغرفة:</span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasXray}
                  onChange={(e) => setHasXray(e.target.checked)}
                  className="rounded text-brand-navy focus:ring-brand-navy"
                />
                <span>جهاز أشعة سينية داخل الغرفة (Intraoral X-Ray)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasBleaching}
                  onChange={(e) => setHasBleaching(e.target.checked)}
                  className="rounded text-brand-navy focus:ring-brand-navy"
                />
                <span>جهاز تبييض ضوئي (Zoom Bleaching Light)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-surface-border">
            <Button type="button" variant="outline" onClick={() => setIsRoomModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary">
              {editingRoom ? 'تحديث العيادة' : 'حفظ وإضافة'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
