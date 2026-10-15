import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { ToastContextProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/features/auth/AuthContext';
import { RbacProvider } from '@/features/auth/RbacContext';
import { api } from '@/lib/api';

function applyAppearanceStyles(app: any) {
  if (!app) return;
  if (app.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  if (app.font_size === 'large') {
    document.documentElement.style.fontSize = '18px';
  } else if (app.font_size === 'medium') {
    document.documentElement.style.fontSize = '16px';
  } else {
    document.documentElement.style.fontSize = '14px';
  }

  if (app.numeral_system) {
    document.documentElement.setAttribute('data-numeral-system', app.numeral_system);
  }
}

function SettingsBootstrap() {
  useEffect(() => {
    // 1. Cold start immediate style from localStorage
    try {
      const savedAppearance = localStorage.getItem('appearance_settings');
      if (savedAppearance) {
        applyAppearanceStyles(JSON.parse(savedAppearance));
      }
    } catch {}

    // 2. Fetch from backend settings API
    api.settings.getSettings().then((res) => {
      if (res.ok && res.data) {
        const data = res.data;
        if (data.appearance && typeof data.appearance === 'object') {
          localStorage.setItem('appearance_settings', JSON.stringify(data.appearance));
          applyAppearanceStyles(data.appearance);
        }
        if (data.working_hours) {
          localStorage.setItem('clinic_working_hours', JSON.stringify(data.working_hours));
        }
        if (data.clinic_profile) {
          localStorage.setItem('clinic_profile_settings', JSON.stringify(data.clinic_profile));
        }
      }
    }).catch(() => {});
  }, []);

  return null;
}

export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsBootstrap />
      <ToastContextProvider>
        <AuthProvider>
          <RbacProvider>
            <RouterProvider router={router} />
          </RbacProvider>
        </AuthProvider>
      </ToastContextProvider>
    </QueryClientProvider>
  );
}

export default App;
