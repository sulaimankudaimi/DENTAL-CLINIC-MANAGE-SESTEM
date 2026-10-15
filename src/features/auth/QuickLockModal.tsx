import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Lock, Delete, LogOut, ShieldAlert, KeyRound } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { USER_ROLE_AR } from '@shared/contracts';

export const QuickLockModal: React.FC = () => {
  const { user, isLocked, unlockWithPin, switchUser } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset PIN input when locked state changes
  useEffect(() => {
    if (isLocked) {
      setPin('');
      setError(null);
    }
  }, [isLocked]);

  // Handle keyboard numbers
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 6) {
          handleDigit(e.key);
        }
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        setPin('');
        setError(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, pin]);

  if (!isLocked || !user) {
    return null;
  }

  const handleDigit = (digit: string) => {
    if (pin.length >= 6 || isSubmitting) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(null);

    // Auto-attempt unlock if 4 digits entered
    if (newPin.length >= 4) {
      submitPin(newPin);
    }
  };

  const handleBackspace = () => {
    if (isSubmitting) return;
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    if (isSubmitting) return;
    setPin('');
    setError(null);
  };

  const submitPin = async (candidatePin: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await unlockWithPin(candidatePin);
      if (!res.success) {
        setError(res.error || 'رمز PIN غير صحيح');
        setPin('');
      }
    } catch {
      setError('حدث خطأ أثناء فك القفل');
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/85 backdrop-blur-md p-4 select-none animate-fadeIn"
      dir="rtl"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-border p-6 flex flex-col items-center text-center">
        {/* Lock Icon Header */}
        <div className="w-12 h-12 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-4">
          <Lock className="w-6 h-6" />
        </div>

        {/* User Card */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div
            className="w-16 h-16 rounded-full p-1 border-2"
            style={{ borderColor: user.color || '#1E4E9C' }}
          >
            <Avatar
              size="lg"
              fallback={user.full_name.substring(0, 2)}
              className="w-full h-full text-lg font-bold text-white"
              style={{ backgroundColor: user.color || '#1E4E9C' }}
            />
          </div>
          <h3 className="text-base font-bold text-text-primary leading-tight">
            {user.full_name}
          </h3>
          <div className="flex items-center gap-1.5">
            <Badge variant="primary" className="text-[11px] px-2 py-0.5">
              {USER_ROLE_AR[user.role] || user.role}
            </Badge>
            {user.specialty && (
              <span className="text-[11px] text-text-secondary truncate max-w-[180px]">
                {user.specialty}
              </span>
            )}
          </div>
          <span className="text-xs text-text-muted mt-1">
            الشاشة مقفلة للحفاظ على خصوصية بيانات المرضى
          </span>
        </div>

        {/* PIN Dots Display */}
        <div className="flex items-center justify-center gap-3 mb-4 h-8" dir="ltr">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  isFilled
                    ? 'bg-brand-blue border-brand-blue scale-110'
                    : 'border-border bg-surface-hover'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-status-danger-fg bg-status-danger-bg/50 px-3 py-1.5 rounded-lg mb-4">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              disabled={isSubmitting}
              className="h-12 rounded-2xl bg-surface hover:bg-surface-hover active:bg-brand-blue active:text-white border border-border text-lg font-bold text-text-primary transition-colors flex items-center justify-center shadow-xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            disabled={isSubmitting || pin.length === 0}
            className="h-12 rounded-2xl bg-surface hover:bg-surface-hover border border-border text-xs font-medium text-text-muted transition-colors flex items-center justify-center"
          >
            مسح
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            disabled={isSubmitting}
            className="h-12 rounded-2xl bg-surface hover:bg-surface-hover active:bg-brand-blue active:text-white border border-border text-lg font-bold text-text-primary transition-colors flex items-center justify-center shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            disabled={isSubmitting || pin.length === 0}
            className="h-12 rounded-2xl bg-surface hover:bg-surface-hover border border-border text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
            aria-label="مسح رقم"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Hint */}
        <div className="text-[11px] text-text-muted mb-4 flex items-center gap-1">
          <KeyRound className="w-3.5 h-3.5" />
          <span>رمز PIN الافتراضي للعيادة: {user.pin || '1234'}</span>
        </div>

        {/* Switch User Footer */}
        <div className="w-full pt-4 border-t border-border flex items-center justify-between">
          <button
            type="button"
            onClick={switchUser}
            className="text-xs text-status-danger-fg hover:underline flex items-center gap-1.5 px-2 py-1 rounded-md"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الدخول بمستخدم آخر</span>
          </button>

          <span className="text-[11px] text-text-muted">
            عيادتي v1.0
          </span>
        </div>
      </div>
    </div>
  );
};
