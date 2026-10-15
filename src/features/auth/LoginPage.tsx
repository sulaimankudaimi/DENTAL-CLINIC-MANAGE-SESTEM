import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Lock,
  User,
  ShieldAlert,
  Eye,
  EyeOff,
  Stethoscope,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { DEV_CREDENTIALS } from '@shared/devCredentials';

interface DemoUser {
  username: string;
  name: string;
  role: 'owner' | 'dentist' | 'receptionist' | 'accountant';
  roleName: string;
  specialty: string;
  color: string;
  pin: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    username: 'dr.ahmed',
    name: 'د. أحمد الراشد',
    role: 'owner',
    roleName: 'مالك العيادة',
    specialty: 'استشاري جراحة وزراعة (كامل الصلاحيات)',
    color: '#1E4E9C',
    pin: '1111',
  },
  {
    username: 'dr.layla',
    name: 'د. ليلى القحطاني',
    role: 'dentist',
    roleName: 'طبيبة أسنان',
    specialty: 'علاج جذور (مرضاها فقط)',
    color: '#2BB39A',
    pin: '2222',
  },
  {
    username: 'dr.sara',
    name: 'د. سارة حسن',
    role: 'dentist',
    roleName: 'طبيبة أسنان',
    specialty: 'طب وتجميل أسنان',
    color: '#E11D48',
    pin: '3333',
  },
  {
    username: 'sara.rec',
    name: 'سارة العمري',
    role: 'receptionist',
    roleName: 'استقبال',
    specialty: 'مواعيد واستقبال (حجب الأسعار)',
    color: '#2563C9',
    pin: '4444',
  },
  {
    username: 'khaled.acc',
    name: 'خالد الدوسري',
    role: 'accountant',
    roleName: 'محاسب مالي',
    specialty: 'فواتير وتقارير (حجب السجلات السريرية)',
    color: '#153C7C',
    pin: '5555',
  },
];

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await login({ username: username.trim(), password });
      if (res.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setErrorMessage(res.error || 'فشل تسجيل الدخول');
      }
    } catch {
      setErrorMessage('حدث خطأ غير متوقع أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemoUser = (demo: DemoUser) => {
    setUsername(demo.username);
    if (typeof window !== 'undefined' && Boolean((window as any).eyadati)) {
      const cred = DEV_CREDENTIALS[demo.username];
      setPassword(cred ? cred.password : '');
    } else {
      setPassword('password123');
    }
    setErrorMessage(null);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A0F1D] flex items-center justify-center p-4 md:p-6 select-none"
      dir="rtl"
    >
      <div
        className={`w-full ${
          import.meta.env.DEV ? 'max-w-4xl grid-cols-1 lg:grid-cols-12' : 'max-w-md'
        } bg-white rounded-3xl shadow-2xl overflow-hidden grid border border-slate-700/30`}
      >
        {/* Right column: Login Form */}
        <div
          className={`${
            import.meta.env.DEV ? 'lg:col-span-7' : 'col-span-1'
          } p-8 md:p-10 flex flex-col justify-between`}
        >
          <div>
            {/* Header branding */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-brand-blue flex items-center justify-center text-white shadow-md shadow-brand-blue/30">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-text-primary tracking-tight">
                  عيادتي <span className="text-brand-blue text-sm font-bold">PRO</span>
                </h1>
                <p className="text-xs text-text-secondary">نظام إدارة عيادات الأسنان المتقدم</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-text-primary mb-1">تسجيل الدخول المحلي</h2>
              <p className="text-xs text-text-secondary">
                نظام حماية وتشفير متوافق مع معايير الأمان المحلية (Bcrypt 12 Rounds + قفل تلقائي)
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-status-danger-bg/60 border border-status-danger-fg/30 flex items-start gap-2.5 text-xs text-status-danger-fg leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  اسم المستخدم أو البريد الإلكتروني
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: dr.ahmed"
                    className="pe-9 h-11"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                  <User className="w-4 h-4 text-text-muted absolute start-3 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-text-primary">كلمة المرور</label>
                  <span className="text-[11px] text-text-muted">تشفير Bcrypt 12</span>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pe-9 h-11"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute start-3 top-3.5 text-text-muted hover:text-text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-surface-hover/80 rounded-xl border border-border text-[11px] text-text-secondary space-y-1">
                <div className="flex items-center gap-1.5 text-brand-navy font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-brand-blue" />
                  <span>معايير الأمان المفعلة:</span>
                </div>
                <p>• قفل الحساب تلقائياً بعد 5 محاولات خاطئة متتالية لمدة 15 دقيقة.</p>
                <p>• قفل سريع للشاشة برمز PIN (4 أرقام) للحماية بين مراجعات المرضى.</p>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 font-bold text-sm shadow-md shadow-brand-blue/20 gap-2 mt-2"
                loading={isLoading}
              >
                <Lock className="w-4 h-4" />
                <span>دخول للنظام</span>
              </Button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
            <span>النسخة المحلية المكتبية v1.0</span>
            <span>جميع الحقوق محفوظة © عيادتي</span>
          </div>
        </div>

        {/* Left column: Quick Demo Switcher (5 cols) - DEV ONLY */}
        {import.meta.env.DEV ? (
          <div className="lg:col-span-5 bg-slate-50 border-s border-border p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* شارة وضع التطوير */}
              <div className="mb-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  وضع التطوير — لا يظهر في النسخة المثبّتة
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2 text-brand-navy">
                <Sparkles className="w-4 h-4 text-brand-blue" />
                <h3 className="text-sm font-bold">تجربة سريعة للأدوار (RBAC)</h3>
              </div>
              <p className="text-xs text-text-muted mb-4 leading-relaxed">
                اختر أي حساب بنقرة واحدة لتجربة مصفوفة الصلاحيات وقواعد الحجب الصارمة:
              </p>

              <div className="space-y-2.5">
                {DEMO_USERS.map((demo) => {
                  const isSelected = username === demo.username;
                  return (
                    <button
                      key={demo.username}
                      type="button"
                      onClick={() => handleSelectDemoUser(demo)}
                      className={`w-full text-right p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-brand-blue bg-brand-blue/5 shadow-xs ring-1 ring-brand-blue'
                          : 'border-border bg-white hover:border-brand-blue/40 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: demo.color }}
                        >
                          {demo.name.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-text-primary truncate">
                              {demo.name}
                            </span>
                            <Badge
                              variant={demo.role === 'owner' ? 'primary' : 'neutral'}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {demo.roleName}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-text-muted truncate">{demo.specialty}</p>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                        ) : (
                          <span className="text-[11px] text-brand-blue font-medium hover:underline">
                            اختر
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 p-3 bg-white rounded-xl border border-dashed border-border text-[11px] text-text-secondary space-y-1">
                <span className="font-bold text-text-primary block">كلمة المرور لجميع الحسابات:</span>
                <code className="text-brand-navy bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">
                  {typeof window !== 'undefined' && Boolean((window as any).eyadati)
                    ? 'كلمات المرور الخاصة ببيئة التطوير (تعبئة تلقائية)'
                    : 'password123'}
                </code>
              </div>
            </div>

            <div className="mt-6 text-[11px] text-text-muted leading-relaxed">
              ملاحظة: يمكنك ضبط مهلة القفل وتخصيص صلاحيات كل دور بالتفصيل من صفحة الإعدادات &gt; الأمان
              والصلاحيات.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default LoginPage;
