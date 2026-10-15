/// <reference types="vite/client" />
import type { EyadatiApi } from '@shared/contracts';

let cachedMockApi: EyadatiApi | null = null;

async function getMockApi(): Promise<EyadatiApi> {
  if (import.meta.env.DEV) {
    if (cachedMockApi) return cachedMockApi;

    const mod = await import('./mockAdapter');
    cachedMockApi = mod.mockApi;
    return cachedMockApi;
  } else {
    throw new Error(
      'خطأ حرج: mockApi غير متاح في بيئة الإنتاج لـ Electron. يجب ربط الواجهة بقاعدة بيانات SQLite عبر جسر window.eyadati.'
    );
  }
}

function createProxy(path: string[]): any {
  const handler = async (...args: any[]) => {
    // 1. If inside Electron
    const isElectron =
      typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron');

    if (typeof window !== 'undefined' && window.eyadati) {
      let target: any = window.eyadati;
      for (const segment of path) {
        target = target?.[segment];
      }
      if (typeof target === 'function') {
        return target(...args);
      }
      return target;
    }

    if (isElectron) {
      throw new Error(
        `خطأ حرج: جسر اتصال Electron (window.eyadati) غير متوفر للمسار "${path.join('.')}". ` +
          'تأكد من تحميل ملف الربط preload.cjs بشكل صحيح. تم حظر الرجوع الصامت إلى mockApi في بيئة سطح المكتب.'
      );
    }

    // 2. Browser / DEV mode fallback
    if (import.meta.env.DEV) {
      const mock = await getMockApi();
      let target: any = mock;
      for (const segment of path) {
        target = target?.[segment];
      }
      if (typeof target === 'function') {
        return target(...args);
      }
      return target;
    } else {
      throw new Error(
        `خطأ حرج: جسر اتصال Electron (window.eyadati) غير متوفر للمسار "${path.join('.')}". ` +
          'تأكد من تحميل ملف الربط preload.cjs بشكل صحيح. تم حظر الرجوع الصامت إلى mockApi في بيئة سطح المكتب.'
      );
    }
  };

  return new Proxy(handler, {
    get(_target, prop: string) {
      if (typeof window !== 'undefined' && window.eyadati) {
        let current: any = window.eyadati;
        for (const segment of [...path, prop]) {
          current = current?.[segment];
        }
        return current;
      }
      return createProxy([...path, prop]);
    },
  });
}

export const api: EyadatiApi = createProxy([]);
