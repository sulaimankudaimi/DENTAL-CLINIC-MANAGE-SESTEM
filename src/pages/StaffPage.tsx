import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/formatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/AuthContext';
import { Can } from '@/features/auth/Can';
import {
  UserPlus,
  Users,
  Clock,
  CalendarDays,
  Percent,
  Phone,
  Mail,
  Award,
  Palette,
  CheckCircle2,
  XCircle,
  Unlock,
  KeyRound,
  FileText,
  UserCheck,
} from 'lucide-react';
import type {
  User,
  CreateUser,
  UpdateUser,
  UserRole,
  LeaveType,
  LeaveStatus,
  DoctorCommissionSummary,
} from '@shared/contracts';
import { USER_ROLE_AR, LEAVE_TYPE_AR, LEAVE_STATUS_AR } from '@shared/contracts';

type StaffTab = 'users' | 'attendance' | 'leaves' | 'commissions';

const DOCTOR_COLORS = [
  { hex: '#1E4E9C', name: 'أزرق كلاسيكي' },
  { hex: '#2BB39A', name: 'تركواز طبي' },
  { hex: '#E11D48', name: 'ياقوتي أحمر' },
  { hex: '#8B5CF6', name: 'بنفسجي ملكي' },
  { hex: '#F59E0B', name: 'كهرماني ذهبي' },
  { hex: '#0EA5E9', name: 'سماوي زاهي' },
  { hex: '#10B981', name: 'زمردي أخضر' },
  { hex: '#EC4899', name: 'وردي أنيق' },
];

export const StaffPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<StaffTab>('users');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedDoctorCommission, setSelectedDoctorCommission] = useState<DoctorCommissionSummary | null>(null);

  // Form states for User Add/Edit
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('dentist');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [color, setColor] = useState('#1E4E9C');
  const [commissionPercent, setCommissionPercent] = useState<number>(35);
  const [pin, setPin] = useState('1234');
  const [isActive, setIsActive] = useState(true);

  // Attendance form states
  const [attendanceUserId, setAttendanceUserId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('17:00');
  const [attendanceNotes, setAttendanceNotes] = useState('');

  // Leave form states
  const [leaveUserId, setLeaveUserId] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [leaveDaysCount, setLeaveDaysCount] = useState(3);
  const [leaveReason, setLeaveReason] = useState('');

  // Fetch Users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: [...queryKeys.staff.all, roleFilter],
    queryFn: async () => {
      const res = await api.staff.list({
        role: roleFilter !== 'all' ? (roleFilter as UserRole) : undefined,
        page: 1,
        limit: 100,
      });
      return res.ok ? res.data.items : [];
    },
  });

  // Fetch Attendance
  const { data: attendanceList = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: queryKeys.staff.attendance(),
    queryFn: async () => {
      const res = await api.staff.getAttendance();
      return res.ok ? res.data : [];
    },
  });

  // Fetch Leaves
  const { data: leavesList = [], isLoading: isLoadingLeaves } = useQuery({
    queryKey: queryKeys.staff.leaves(),
    queryFn: async () => {
      const res = await api.staff.getLeaves();
      return res?.ok ? res.data : [];
    },
  });

  // Fetch Commissions
  const { data: commissionsList = [], isLoading: isLoadingCommissions } = useQuery({
    queryKey: queryKeys.staff.commissions(),
    queryFn: async () => {
      const res = await api.staff.getCommissions();
      return res?.ok ? res.data : [];
    },
  });

  // Open modal for new user
  const handleOpenNewUser = () => {
    setEditingUser(null);
    setFullName('');
    setUsername('');
    setPassword('');
    setRole('dentist');
    setSpecialty('طب وجراحة الأسنان');
    setPhone('');
    setEmail('');
    setLicenseNumber('');
    setColor('#1E4E9C');
    setCommissionPercent(35);
    setPin('1234');
    setIsActive(true);
    setIsUserModalOpen(true);
  };

  // Open modal for editing user
  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setFullName(u.full_name);
    setUsername(u.username);
    setPassword('');
    setRole(u.role);
    setSpecialty(u.specialty || '');
    setPhone(u.phone || '');
    setEmail(u.email || '');
    setLicenseNumber(u.license_number || '');
    setColor(u.color || '#1E4E9C');
    setCommissionPercent(u.commission_percent || 0);
    setPin(u.pin || '1234');
    setIsActive(u.is_active);
    setIsUserModalOpen(true);
  };

  // Save User Mutation
  const saveUserMutation = useMutation({
    mutationFn: async () => {
      if (editingUser) {
        const payload: UpdateUser = {
          full_name: fullName.trim(),
          role,
          specialty: specialty.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          license_number: licenseNumber.trim() || null,
          color,
          commission_percent: Number(commissionPercent) || 0,
          is_active: isActive,
          pin: pin.trim() || '1234',
        };
        const res = await api.staff.update(editingUser.id, payload);
        if (password.trim()) {
          await api.auth.resetPassword(editingUser.id, password.trim());
        }
        return res;
      } else {
        const payload: CreateUser = {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          full_name: fullName.trim(),
          username: username.trim().toLowerCase(),
          password_hash: password.trim() ? password.trim() : 'ChangeMe@2026',
          role,
          specialty: specialty.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          license_number: licenseNumber.trim() || null,
          avatar_path: null,
          color,
          commission_percent: Number(commissionPercent) || 0,
          is_active: isActive,
          pin: pin.trim() || '1234',
          last_login_at: null,
        };
        const res = await api.staff.create(payload);
        if (res.ok && password.trim()) {
          await api.auth.resetPassword(res.data.id, password.trim());
        }
        return res;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      setIsUserModalOpen(false);
    },
  });

  // Unlock User Mutation
  const unlockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.auth.unlockAccount(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });

  // Check In/Out for today
  const checkInOutMutation = useMutation({
    mutationFn: async (type: 'in' | 'out') => {
      if (!currentUser) return;
      const now = new Date();
      return api.staff.recordAttendance({
        clinic_id: currentUser.clinic_id,
        user_id: currentUser.id,
        date: now.toISOString().split('T')[0],
        check_in: now.toISOString(),
        check_out: type === 'out' ? now.toISOString() : null,
        notes: type === 'in' ? 'تسجيل حضور تلقائي من شريط الكادر' : 'تسجيل انصراف',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.attendance() });
    },
  });

  // Leave Status Review Mutation
  const reviewLeaveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeaveStatus }) => {
      return api.staff.updateLeaveStatus(id, status, currentUser?.full_name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.leaves() });
    },
  });

  // Submit Leave Request Mutation
  const submitLeaveMutation = useMutation({
    mutationFn: async () => {
      const uId = leaveUserId || currentUser?.id || usersData?.[0]?.id || '';
      return api.staff.createLeave({
        user_id: uId,
        type: leaveType,
        start_date: leaveStartDate,
        end_date: leaveEndDate,
        days_count: Number(leaveDaysCount),
        reason: leaveReason.trim() || 'طلب إجازة اعتيادي',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.leaves() });
      setIsLeaveModalOpen(false);
      setLeaveReason('');
    },
  });

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'owner':
        return <Badge variant="primary">مالك العيادة</Badge>;
      case 'dentist':
        return <Badge variant="ok">طبيب أسنان</Badge>;
      case 'assistant':
        return <Badge variant="secondary">مساعد طبيب</Badge>;
      case 'receptionist':
        return <Badge variant="neutral">استقبال</Badge>;
      case 'accountant':
        return <Badge variant="outline">محاسب مالي</Badge>;
      default:
        return <Badge variant="neutral">{r}</Badge>;
    }
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn" dir="rtl">
      {/* Page Header */}
      <PageHeader
        title="إدارة الكادر والموظفين (Staff Management)"
        description="إدارة المستخدمين، الحضور والانصراف، الإجازات، وعمولات الأطباء وألوان التقويم"
      >
        <div className="flex items-center gap-2">
          {/* Quick Check-in button */}
          <Button
            variant="outline"
            onClick={() => checkInOutMutation.mutate('in')}
            loading={checkInOutMutation.isPending}
            className="gap-1.5 text-xs text-brand-navy"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>تسجيل حضوري اليوم</span>
          </Button>

          <Can resource="staff" action="create">
            <Button
              variant="primary"
              onClick={handleOpenNewUser}
              className="gap-2 text-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة مستخدم جديد</span>
            </Button>
          </Can>
        </div>
      </PageHeader>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>المستخدمون والأطباء</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {usersData?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'attendance'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>الحضور والانصراف</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaves')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'leaves'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>الإجازات والمغادرات</span>
            {leavesList.filter((l) => l.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                {leavesList.filter((l) => l.status === 'pending').length} معلق
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('commissions')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'commissions'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>عمولات الأطباء</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS & DOCTORS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Role Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-border">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'owner', label: 'المالك والإدارة' },
              { id: 'dentist', label: 'الأطباء والاستشاريون' },
              { id: 'receptionist', label: 'الاستقبال والمواعيد' },
              { id: 'accountant', label: 'المحاسبة والمالية' },
              { id: 'assistant', label: 'التمريض والمساعدين' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  roleFilter === tab.id
                    ? 'bg-brand-blue text-white shadow-xs'
                    : 'bg-slate-50 text-text-secondary hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Users Grid */}
          {isLoadingUsers ? (
            <div className="p-12 text-center text-text-muted">جاري تحميل بيانات الكادر...</div>
          ) : !usersData || usersData.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-border text-text-muted">
              لا يوجد مستخدمون يطابقون هذا الفلتر
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usersData.map((member) => {
                const isLocked =
                  (member.locked_until && new Date(member.locked_until) > new Date()) ||
                  (member.failed_attempts || 0) >= 5;

                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl border border-border p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    {/* Top Color Bar matching Doctor Calendar Color */}
                    <div
                      className="absolute top-0 start-0 end-0 h-1.5"
                      style={{ backgroundColor: member.color || '#1E4E9C' }}
                    />

                    <div>
                      <div className="flex items-start justify-between mb-3 mt-1">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-full p-0.5 border-2 shrink-0"
                            style={{ borderColor: member.color || '#1E4E9C' }}
                          >
                            <Avatar
                              size="md"
                              fallback={member.full_name.substring(0, 2)}
                              className="w-full h-full text-white font-bold"
                              style={{ backgroundColor: member.color || '#1E4E9C' }}
                            />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-text-primary leading-tight">
                              {member.full_name}
                            </h3>
                            <p className="text-xs text-text-secondary mt-0.5">
                              {member.specialty || USER_ROLE_AR[member.role]}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {getRoleBadge(member.role)}
                          {isLocked && (
                            <Badge variant="danger" className="text-[10px] animate-pulse">
                              مقفل أمنياً
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Details section */}
                      <div className="space-y-1.5 text-xs text-text-secondary border-t border-border/60 pt-3">
                        {member.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-text-muted" />
                            <span dir="ltr">{member.phone}</span>
                          </div>
                        )}
                        {member.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-text-muted" />
                            <span>{member.email}</span>
                          </div>
                        )}
                        {member.license_number && (
                          <div className="flex items-center gap-2 text-brand-navy">
                            <Award className="w-3.5 h-3.5" />
                            <span>ترخيص الهيئة: {member.license_number}</span>
                          </div>
                        )}

                        {/* Calendar Color Swatch */}
                        <div className="flex items-center gap-2 pt-1">
                          <Palette className="w-3.5 h-3.5 text-text-muted" />
                          <span className="text-[11px]">لون التقويم والمواعيد:</span>
                          <span
                            className="w-4 h-4 rounded-full border border-border inline-block shadow-2xs"
                            style={{ backgroundColor: member.color || '#1E4E9C' }}
                            title={`اللون: ${member.color}`}
                          />
                        </div>

                        {/* Doctor Commission */}
                        {(member.role === 'dentist' || member.role === 'owner') && (
                          <div className="flex items-center gap-2">
                            <Percent className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[11px] font-bold text-emerald-700">
                              العمولة: {member.commission_percent || 0}% من العلاجات
                            </span>
                          </div>
                        )}

                        {/* Quick PIN */}
                        <div className="flex items-center gap-2 text-[11px] text-text-muted">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>رمز PIN السريع: {member.pin || '1234'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isLocked ? (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => unlockUserMutation.mutate(member.id)}
                            loading={unlockUserMutation.isPending}
                            className="h-8 text-xs gap-1.5"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>إلغاء القفل</span>
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-status-ok-fg font-medium">
                            <span className="w-2 h-2 rounded-full bg-status-ok-fg" />
                            نشط
                          </span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditUser(member)}
                        className="h-8 text-xs"
                      >
                        تعديل البيانات
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-text-primary">سجل الحضور والانصراف اليومي</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                متابعة أوقات دوام الكادر الطبي والإداري ومطابقتها
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => setIsAttendanceModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Clock className="w-4 h-4" />
              <span>تسجيل دوام يدوي</span>
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-text-secondary border-b border-border font-bold">
                <tr>
                  <th className="py-3.5 px-4">الموظف</th>
                  <th className="py-3.5 px-4">التاريخ</th>
                  <th className="py-3.5 px-4">وقت الحضور</th>
                  <th className="py-3.5 px-4">وقت الانصراف</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoadingAttendance ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted">
                      جاري تحميل بيانات الحضور...
                    </td>
                  </tr>
                ) : attendanceList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted">
                      لا توجد تسجيلات حضور سابقة
                    </td>
                  </tr>
                ) : (
                  attendanceList.map((att) => {
                    const u = usersData?.find((usr) => usr.id === att.user_id);
                    return (
                      <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-text-primary">
                          {u?.full_name || 'موظف العيادة'}
                        </td>
                        <td className="py-3.5 px-4 font-mono">{att.date}</td>
                        <td className="py-3.5 px-4 text-emerald-700 font-mono font-medium">
                          {att.check_in ? new Date(att.check_in).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-amber-700 font-mono font-medium">
                          {att.check_out ? new Date(att.check_out).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'قيد الدوام'}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={att.check_out ? 'neutral' : 'ok'}>
                            {att.check_out ? 'انصرف' : 'حاضر الآن'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-text-muted">
                          {att.notes || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LEAVES */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-text-primary">إدارة الإجازات والمغادرات</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                متابعة أرصدة وطلبات الإجازات السنوية والمرضية والطارئة
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => setIsLeaveModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <CalendarDays className="w-4 h-4" />
              <span>تقديم طلب إجازة</span>
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-text-secondary border-b border-border font-bold">
                <tr>
                  <th className="py-3.5 px-4">الموظف</th>
                  <th className="py-3.5 px-4">نوع الإجازة</th>
                  <th className="py-3.5 px-4">الفترة</th>
                  <th className="py-3.5 px-4">عدد الأيام</th>
                  <th className="py-3.5 px-4">السبب</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">إجراءات المراجعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoadingLeaves ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">
                      جاري تحميل الإجازات...
                    </td>
                  </tr>
                ) : leavesList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">
                      لا توجد طلبات إجازة مسجلة
                    </td>
                  </tr>
                ) : (
                  leavesList.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-text-primary">
                        {leave.user_name || 'موظف العيادة'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="primary" className="text-[11px]">
                          {LEAVE_TYPE_AR[leave.type] || leave.type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {leave.start_date} إلى {leave.end_date}
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono">
                        {leave.days_count} يوم
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary max-w-xs truncate">
                        {leave.reason}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            leave.status === 'approved'
                              ? 'ok'
                              : leave.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {LEAVE_STATUS_AR[leave.status] || leave.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {leave.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reviewLeaveMutation.mutate({ id: leave.id, status: 'approved' })}
                              className="h-7 px-2 text-[11px] gap-1 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>قبول</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => reviewLeaveMutation.mutate({ id: leave.id, status: 'rejected' })}
                              className="h-7 px-2 text-[11px] gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>رفض</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-text-muted">
                            اعتمدها: {leave.reviewed_by || 'المدير'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DOCTOR COMMISSIONS */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-text-primary">عمولات الأطباء والاستشاريين</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                حساب آلي لحصص الأطباء بناءً على نسبة العمولة المحددة لكل طبيب والإجراءات المنفذة
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">الفترة: الشهر الجاري</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingCommissions ? (
              <div className="col-span-3 p-8 text-center text-text-muted">جاري احتساب العمولات...</div>
            ) : commissionsList.map((doc) => (
              <div
                key={doc.doctorId}
                className="bg-white rounded-2xl border border-border p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div
                  className="absolute top-0 start-0 end-0 h-1.5"
                  style={{ backgroundColor: doc.color || '#1E4E9C' }}
                />

                <div>
                  <div className="flex items-start justify-between mb-4 mt-1">
                    <div>
                      <h4 className="font-bold text-text-primary text-base">{doc.doctorName}</h4>
                      <p className="text-xs text-text-secondary">{doc.specialty}</p>
                    </div>
                    <Badge variant="primary" className="text-xs font-bold px-2 py-1">
                      {doc.commissionPercent}% عمولة
                    </Badge>
                  </div>

                  <div className="space-y-2.5 p-3 bg-slate-50 rounded-xl border border-border/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">الإجراءات المكتملة:</span>
                      <span className="font-bold font-mono text-text-primary">{doc.completedTreatmentsCount} إجراء</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">إجمالي الإيراد المنفذ:</span>
                      <span className="font-bold font-mono text-text-primary">
                        {formatCurrency(doc.totalRevenueHalalas)}
                      </span>
                    </div>
                    <div className="border-t border-border pt-2 flex items-center justify-between text-brand-navy font-bold">
                      <span>إجمالي العمولة المستحقة:</span>
                      <span className="font-mono text-emerald-700 text-sm">
                        {formatCurrency(doc.commissionHalalas)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="text-[10px] block text-emerald-600">المصروف والمسدد:</span>
                      <span className="font-bold font-mono">{formatCurrency(doc.paidHalalas)}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      <span className="text-[10px] block text-amber-600">الرصيد المتبقي:</span>
                      <span className="font-bold font-mono">{formatCurrency(doc.balanceHalalas)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedDoctorCommission(doc)}
                    className="w-full text-xs gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>عرض كشف العمليات بالتفصيل</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT USER */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? `تعديل بيانات: ${editingUser.full_name}` : 'إضافة عضو جديد للكادر'}
        className="max-w-xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveUserMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-text-primary font-bold mb-1">الاسم الكامل *</label>
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="د. خالد الراشد"
              />
            </div>

            <div>
              <label className="block text-text-primary font-bold mb-1">اسم المستخدم (Login) *</label>
              <Input
                required
                disabled={!!editingUser}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="dr.khaled"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-text-primary font-bold mb-1">الدور الوظيفي والصلاحيات *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full h-10 rounded-xl border border-border bg-white px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              >
                <option value="dentist">طبيب أسنان</option>
                <option value="owner">مالك العيادة / مدير عام</option>
                <option value="receptionist">موظف استقبال</option>
                <option value="accountant">محاسب مالي</option>
                <option value="assistant">مساعد طبيب أسنان</option>
              </select>
            </div>

            <div>
              <label className="block text-text-primary font-bold mb-1">التخصص الدقيق</label>
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="استشاري جراحة وزراعة الأسنان"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-text-primary font-bold mb-1">رقم الجوال</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0501234567"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-text-primary font-bold mb-1">رقم ترخيص الهيئة (SCHS)</label>
              <Input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="SCHS-2024-D-1234"
                dir="ltr"
              />
            </div>
          </div>

          {/* Calendar Color & Commission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-border">
            <div>
              <label className="block text-text-primary font-bold mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-brand-blue" />
                <span>لون الطبيب في التقويم والمواعيد</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {DOCTOR_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === c.hex ? 'border-text-primary scale-125 shadow-sm' : 'border-white'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-text-primary font-bold mb-1 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                <span>نسبة عمولة الطبيب (%)</span>
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(Number(e.target.value))}
                placeholder="35"
              />
            </div>
          </div>

          {/* Security PIN & Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-border">
            <div>
              <label className="block text-text-primary font-bold mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-brand-blue" />
                <span>رمز PIN السريع (4 أرقام) *</span>
              </label>
              <Input
                required
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1234"
                dir="ltr"
                className="font-mono text-center tracking-widest font-bold"
              />
              <span className="text-[10px] text-text-muted mt-0.5 block">
                يُستخدم لفك قفل الشاشة السريع بين المرضى
              </span>
            </div>

            <div>
              <label className="block text-text-primary font-bold mb-1">
                {editingUser ? 'تغيير كلمة المرور (اختياري)' : 'كلمة المرور (تشفير Bcrypt 12) *'}
              </label>
              <Input
                type="password"
                required={!editingUser}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUserModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saveUserMutation.isPending}
            >
              حفظ وتطبيق
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: RECORD ATTENDANCE */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="تسجيل حضور وانصراف يدوي"
        className="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const uId = attendanceUserId || usersData?.[0]?.id || '';
            api.staff.recordAttendance({
              clinic_id: 'c1000000-0000-0000-0000-000000000001',
              user_id: uId,
              date: attendanceDate,
              check_in: `${attendanceDate}T${checkInTime}:00.000Z`,
              check_out: checkOutTime ? `${attendanceDate}T${checkOutTime}:00.000Z` : null,
              notes: attendanceNotes.trim() || null,
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.staff.attendance() });
              setIsAttendanceModalOpen(false);
            });
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block text-text-primary font-bold mb-1">الموظف *</label>
            <select
              value={attendanceUserId}
              onChange={(e) => setAttendanceUserId(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-white px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            >
              {usersData?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({USER_ROLE_AR[u.role]})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-primary font-bold mb-1">التاريخ *</label>
              <Input
                type="date"
                required
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-text-primary font-bold mb-1">وقت الحضور *</label>
              <Input
                type="time"
                required
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-text-primary font-bold mb-1">وقت الانصراف</label>
            <Input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-text-primary font-bold mb-1">ملاحظات</label>
            <Input
              value={attendanceNotes}
              onChange={(e) => setAttendanceNotes(e.target.value)}
              placeholder="تسجيل يدوي بواسطة الإدارة"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAttendanceModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary">
              تسجيل
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: SUBMIT LEAVE REQUEST */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="تقديم طلب إجازة جديدة"
        className="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitLeaveMutation.mutate();
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block text-text-primary font-bold mb-1">الموظف مقدم الطلب *</label>
            <select
              value={leaveUserId}
              onChange={(e) => setLeaveUserId(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-white px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            >
              {usersData?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({USER_ROLE_AR[u.role]})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-text-primary font-bold mb-1">نوع الإجازة *</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full h-10 rounded-xl border border-border bg-white px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            >
              <option value="annual">إجازة سنوية اعتيادية</option>
              <option value="sick">إجازة مرضية (مرفقة بتقرير)</option>
              <option value="emergency">إجازة طارئة / عارضة</option>
              <option value="unpaid">إجازة بدون راتب</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-primary font-bold mb-1">تاريخ البدء *</label>
              <Input
                type="date"
                required
                value={leaveStartDate}
                onChange={(e) => setLeaveStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-text-primary font-bold mb-1">تاريخ الانتهاء *</label>
              <Input
                type="date"
                required
                value={leaveEndDate}
                onChange={(e) => setLeaveEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-text-primary font-bold mb-1">عدد أيام الإجازة *</label>
            <Input
              type="number"
              min="1"
              required
              value={leaveDaysCount}
              onChange={(e) => setLeaveDaysCount(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-text-primary font-bold mb-1">سبب أو مبرر الإجازة *</label>
            <textarea
              required
              rows={3}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="اكتب تفاصيل ومبررات طلب الإجازة هنا..."
              className="w-full rounded-xl border border-border p-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsLeaveModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary" loading={submitLeaveMutation.isPending}>
              إرسال الطلب
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: DOCTOR COMMISSIONS DETAILS */}
      {selectedDoctorCommission && (
        <Modal
          isOpen={!!selectedDoctorCommission}
          onClose={() => setSelectedDoctorCommission(null)}
          title={`كشف حساب عمولات: ${selectedDoctorCommission.doctorName}`}
          className="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-border space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">التخصص:</span>
                <span className="font-bold text-text-primary">{selectedDoctorCommission.specialty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">نسبة العمولة المعتمدة:</span>
                <span className="font-bold text-emerald-700">{selectedDoctorCommission.commissionPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">إجمالي الإيراد المنفذ:</span>
                <span className="font-bold font-mono text-text-primary">
                  {formatCurrency(selectedDoctorCommission.totalRevenueHalalas)}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-sm text-brand-navy">
                <span>إجمالي العمولة المستحقة:</span>
                <span className="font-mono text-emerald-700">
                  {formatCurrency(selectedDoctorCommission.commissionHalalas)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 text-[11px] leading-relaxed">
              يتم ربط صرف العمولات تلقائياً عند اكتمال جلسات العلاج وصدور الفواتير الضريبية المسددة في العيادة.
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedDoctorCommission(null)}>
                إغلاق
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StaffPage;
