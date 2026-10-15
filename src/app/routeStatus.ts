// Remove a path from this list when its real page replaces PlaceholderPage.
export const NOT_IMPLEMENTED_ROUTES: readonly string[] = [
  '/procurement',
  '/procurement/pr',
  '/procurement/rfq',
  '/procurement/po',
  '/procurement/contracts',
  '/admin',
  '/admin/users',
  '/admin/roles',
  '/admin/audit',
  '/admin/settings',
] as const;

export function isRouteImplemented(path: string): boolean {
  if (!path) return false;
  const cleanPath = path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  for (const notImp of NOT_IMPLEMENTED_ROUTES) {
    if (cleanPath === notImp || cleanPath.startsWith(notImp + '/')) {
      return false;
    }
  }
  return true;
}

export function shouldRenderDevRoute(demoModeEnv: string | boolean | undefined, hasSysView: boolean): boolean {
  const isDemo = String(demoModeEnv) === 'true';
  return isDemo && hasSysView;
}
