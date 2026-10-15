import { isRouteImplemented } from '@/app/routeStatus';

export interface TCodeResolution {
  success: boolean;
  path?: string;
  message?: string;
}

export const T_CODES: Record<string, string> = {
  ME21N: '/procurement/po',
  ME51N: '/procurement/pr',
  MM03: '/inventory',
  BP: '/patients',
  FBL5N: '/billing',
  VA01: '/appointments',
};

export class TCodeService {
  static resolve(code: string): TCodeResolution {
    const upper = code.trim().toUpperCase();
    const targetPath = T_CODES[upper];
    if (!targetPath) {
      return { success: false, message: 'رمز T-code غير معروف' };
    }
    if (!isRouteImplemented(targetPath)) {
      return { success: false, message: 'هذه الشاشة غير متاحة بعد في هذا الإصدار' };
    }
    return { success: true, path: targetPath };
  }

  static getAutocomplete(query: string): Array<{ code: string; path: string }> {
    const q = query.trim().toUpperCase();
    return Object.entries(T_CODES)
      .filter(([code, path]) => code.includes(q) && isRouteImplemented(path))
      .map(([code, path]) => ({ code, path }));
  }
}
