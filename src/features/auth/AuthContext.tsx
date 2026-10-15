import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type { AuthUser, ClinicSecurityPolicies } from '@shared/contracts';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isLocked: boolean;
  lockScreen: () => void;
  unlockWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUser: () => void;
  policies: ClinicSecurityPolicies | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [policies, setPolicies] = useState<ClinicSecurityPolicies | null>(null);

  // Inactivity tracking
  const lastActivityRef = useRef<number>(Date.now());

  const fetchSession = useCallback(async () => {
    try {
      const [userRes, policiesRes] = await Promise.all([
        api.auth.getCurrentUser(),
        api.rbac.getPolicies(),
      ]);

      if (userRes.ok && userRes.data) {
        setUser(userRes.data);
      } else {
        setUser(null);
      }

      if (policiesRes.ok && policiesRes.data) {
        setPolicies(policiesRes.data);
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const lockScreen = useCallback(() => {
    if (user) {
      setIsLocked(true);
    }
  }, [user]);

  const switchUser = useCallback(() => {
    setIsLocked(false);
    setUser(null);
    api.auth.logout();
  }, []);

  const unlockWithPin = useCallback(
    async (pin: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: 'لا يوجد مستخدم نشط' };
      try {
        const res = await api.auth.quickUnlockPin({ userId: user.id, pin });
        if (res.ok) {
          setUser(res.data);
          setIsLocked(false);
          lastActivityRef.current = Date.now();
          return { success: true };
        }
        return { success: false, error: res.error || 'رمز PIN غير صحيح' };
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء فك القفل' };
      }
    },
    [user]
  );

  const login = useCallback(
    async (credentials: { username: string; password: string }): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await api.auth.login(credentials);
        if (res.ok) {
          setUser(res.data.user);
          setIsLocked(false);
          lastActivityRef.current = Date.now();
          return { success: true };
        }
        return { success: false, error: res.error || 'اسم المستخدم أو كلمة المرور غير صحيحة' };
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
      setIsLocked(false);
    }
  }, []);

  // Inactivity / Idle timeout listener & Ctrl+L shortcut
  useEffect(() => {
    if (!user || isLocked) return;

    const timeoutMinutes = policies?.idle_timeout_minutes || 10;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setIsLocked(true);
        return;
      }
      resetTimer();
    };

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= timeoutMs && !isLocked) {
        setIsLocked(true);
      }
    }, 10000); // Check every 10 seconds

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [user, isLocked, policies?.idle_timeout_minutes]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        isLocked,
        lockScreen,
        unlockWithPin,
        login,
        logout,
        switchUser,
        policies,
        refreshUser: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
