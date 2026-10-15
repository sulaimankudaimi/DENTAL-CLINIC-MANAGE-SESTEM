import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export const ForceChangePasswordModal: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !user.must_change_password) {
    return null;
  }

  const hasLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const isValid = hasLength && hasLetter && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      if (!hasLength) {
        setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
        return;
      }
      if (!hasLetter || !hasNumber) {
        setError('كلمة المرور يجب أن تحتوي على حرف واحد ورقم واحد على الأقل');
        return;
      }
      if (!passwordsMatch) {
        setError('كلمتا المرور غير متطابقتين');
        return;
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.auth.changePassword({
        userId: user.id,
        newPassword,
      });

      if (res && res.ok) {
        toast({
          title: 'تم تغيير كلمة المرور بنجاح',
          description: 'تم تعيين كلمة المرور الجديدة وتأمين الحساب',
          variant: 'success',
        });
        await refreshUser();
      } else {
        setError(res?.error || 'حدث خطأ أثناء تغيير كلمة المرور');
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/85 backdrop-blur-md p-4 select-none animate-fadeIn"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 md:p-8 flex flex-col text-right">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              تغيير كلمة المرور إلزامي
            </h2>
            <p className="text-xs text-text-secondary">
              هذا أول تسجيل دخول لك. لحماية البيانات الطبية، يرجى تعيين كلمة مرور شخصية قوية.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-status-danger-bg text-status-danger-fg text-xs flex items-start gap-2 border border-status-danger-fg/20">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              كلمة المرور الجديدة
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError(null);
                }}
                placeholder="أدخل كلمة المرور الجديدة"
                className="pe-9"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute start-3 top-2.5 text-text-muted hover:text-text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              تأكيد كلمة المرور الجديدة
            </label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              placeholder="أعد إدخال كلمة المرور"
              disabled={isLoading}
            />
          </div>

          {/* Password Requirements Checklist */}
          <div className="p-3 bg-slate-50 rounded-xl border border-border text-[11px] text-text-secondary space-y-1.5">
            <span className="font-bold text-text-primary block mb-1">شروط كلمة المرور:</span>
            <div className={`flex items-center gap-1.5 ${hasLength ? 'text-status-success-fg font-medium' : 'text-text-muted'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${hasLength ? 'text-status-success-fg' : 'text-slate-300'}`} />
              <span>8 أحرف أو أكثر</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLetter ? 'text-status-success-fg font-medium' : 'text-text-muted'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${hasLetter ? 'text-status-success-fg' : 'text-slate-300'}`} />
              <span>تحتوي على حرف واحد على الأقل</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-status-success-fg font-medium' : 'text-text-muted'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${hasNumber ? 'text-status-success-fg' : 'text-slate-300'}`} />
              <span>تحتوي على رقم واحد على الأقل</span>
            </div>
            <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-status-success-fg font-medium' : 'text-text-muted'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-status-success-fg' : 'text-slate-300'}`} />
              <span>تطابق كلمتي المرور</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              className="flex-1 gap-2"
              loading={isLoading}
              disabled={!isValid || isLoading}
            >
              <Lock className="w-4 h-4" />
              <span>حفظ وتأكيد كلمة المرور</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => logout()}
              disabled={isLoading}
              className="text-text-muted hover:text-status-danger-fg gap-1.5 text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل خروج</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
