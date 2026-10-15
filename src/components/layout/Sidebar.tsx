import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  Calendar,
  Stethoscope,
  Receipt,
  Wallet,
  ShieldCheck,
  ImageIcon,
  Package,
  BarChart3,
  UserCog,
  Settings,
  ChevronRight,
  ChevronLeft,
  Crown,
  Pill,
  FileText,
  FlaskConical,
  FileSearch,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/useSidebarStore';
import { CURRENT_SUBSCRIPTION } from '@/lib/constants';
import { useLicenseStore } from '@/store/useLicenseStore';
import { useRbac } from '@/features/auth/RbacContext';
import type { ResourceName } from '@shared/contracts';
import { isRouteImplemented } from '@/app/routeStatus';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  resource?: ResourceName;
}

export function isNavItemLocked(item: { id: string }, plan: string): boolean {
  if (plan === 'basic') {
    return item.id === 'insurance' || item.id === 'inventory';
  }
  return false;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', path: '/dashboard', icon: LayoutGrid },
  { id: 'patients', label: 'المرضى', path: '/patients', icon: Users, resource: 'patients' },
  { id: 'appointments', label: 'المواعيد', path: '/appointments', icon: Calendar, resource: 'appointments' },
  { id: 'treatments', label: 'العلاج', path: '/treatments', icon: Stethoscope, resource: 'treatments' },
  { id: 'prescriptions', label: 'الوصفات الطبية', path: '/prescriptions', icon: Pill, resource: 'prescriptions' },
  { id: 'medical-reports', label: 'التقارير الطبية', path: '/medical-reports', icon: FileText, resource: 'medical_reports' },
  { id: 'lab-orders', label: 'أوامر المختبر', path: '/lab-orders', icon: FlaskConical, resource: 'lab_orders' },
  { id: 'billing', label: 'الفواتير', path: '/billing', icon: Receipt, resource: 'invoices' },
  { id: 'expenses', label: 'المصروفات', path: '/expenses', icon: Wallet, resource: 'expenses' },
  { id: 'insurance', label: 'التأمين', path: '/insurance', icon: ShieldCheck, resource: 'invoices' },
  { id: 'imaging', label: 'الأشعة والصور', path: '/imaging', icon: ImageIcon, resource: 'patients' },
  { id: 'inventory', label: 'المخزون', path: '/inventory', icon: Package, resource: 'inventory' },
  { id: 'reports', label: 'التقارير', path: '/reports', icon: BarChart3, resource: 'reports' },
  { id: 'staff', label: 'الموظفون', path: '/staff', icon: UserCog, resource: 'staff' },
  { id: 'settings', label: 'الإعدادات', path: '/settings', icon: Settings, resource: 'settings' },
  { id: 'audit-log', label: 'سجل التدقيق', path: '/audit-log', icon: FileSearch, resource: 'audit_logs' },
];

function ToothIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2BB39A"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C7.5 2 4 4.5 4 8c0 3 1.5 6 2 9.5.5 3 2 4.5 4 4.5s2.5-3 2-6c-.5-3 .5-3 0 0-.5 3 0 6 2 6s3.5-1.5 4-4.5c.5-3.5 2-6.5 2-9.5 0-3.5-3.5-6-8-6z" />
    </svg>
  );
}

export function filterVisibleNavItems<T extends { path: string; resource?: ResourceName }>(
  items: T[],
  canView: (resource: ResourceName) => boolean
): T[] {
  return items.filter((item) => {
    if (!isRouteImplemented(item.path)) return false;
    if (!item.resource) return true;
    return canView(item.resource);
  });
}

export const Sidebar: React.FC = () => {
  const { isCollapsed, toggleSidebar, setCollapsed } = useSidebarStore();
  const location = useLocation();
  const { can } = useRbac();
  const { plan, planName, expiryDate, daysRemaining, setPlan } = useLicenseStore();

  const visibleNavItems = filterVisibleNavItems(NAV_ITEMS, (res) => can(res, 'view'));

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1280) {
        setCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setCollapsed]);

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          'fixed top-0 right-0 h-screen z-30 flex flex-col justify-between transition-all duration-300 ease-in-out select-none shadow-xl',
          'bg-gradient-to-b from-[#1E4E9C] to-[#153C7C] text-white',
          isCollapsed ? 'w-[76px]' : 'w-[248px]'
        )}
        aria-label="القائمة الجانبية الرئيسية"
      >
        {/* Top: Logo & Brand */}
        <div className="flex flex-col shrink-0">
          <div
            className={cn(
              'h-16 flex items-center border-b border-white/10 transition-all px-4',
              isCollapsed ? 'justify-center px-0' : 'justify-start gap-3'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <ToothIcon className="w-5 h-5" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[22px] font-bold text-white leading-tight tracking-tight">
                  عيادتي
                </span>
                <span className="text-[10px] text-white/70 leading-none">
                  إدارة العيادات السنية
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 py-3 px-3 overflow-y-auto max-h-[calc(100vh-210px)] scrollbar-none">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              const isLocked = isNavItemLocked(item, plan);

              const linkContent = (
                <NavLink
                  to={item.path}
                  className={cn(
                    'relative flex items-center h-11 rounded-[10px] text-xs font-medium transition-all duration-150 group',
                    isCollapsed ? 'justify-center px-0 w-11 mx-auto' : 'px-3 gap-3 w-full',
                    isActive
                      ? 'bg-white/[0.14] text-white font-bold shadow-sm'
                      : 'text-white/[0.78] hover:text-white hover:bg-white/[0.08]',
                    isLocked && 'opacity-90'
                  )}
                >
                  {/* Active Indicator: 3px white bar on right edge */}
                  {isActive && (
                    <span
                      className="absolute right-0 top-1.5 bottom-1.5 w-[3px] bg-white rounded-l"
                      aria-hidden="true"
                    />
                  )}

                  <div className="relative shrink-0 flex items-center justify-center">
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-transform duration-150 group-hover:scale-105',
                        isActive ? 'text-white' : 'text-white/80'
                      )}
                    />
                    {isLocked && (
                      <span
                        className="absolute -top-1 -start-1 bg-amber-500 text-white rounded-full p-0.5 shadow-xs"
                        title="ميزة مقفلة في الباقة الأساسية"
                      >
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <>
                      <span className="truncate text-[13px] flex-1">{item.label}</span>
                      {isLocked && (
                        <span
                          className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-400/20 border border-amber-400/30 px-1.5 py-0.5 rounded-md shrink-0 me-1"
                          title="ميزة مقفلة في الباقة الأساسية"
                          data-testid={`locked-${item.id}`}
                        >
                          <Lock className="w-3 h-3 text-amber-300 shrink-0" aria-label="قفل" />
                          <span className="text-[10px]">مغلق</span>
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="left" className="text-xs font-semibold">
                      <span>{item.label}</span>
                      {isLocked && (
                        <span className="text-amber-300 font-bold ms-1">(مقفل)</span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.id}>{linkContent}</div>;
            })}
          </nav>
        </div>

        {/* Bottom Area: Subscription Card & Collapse Toggle */}
        <div className="shrink-0 p-3 border-t border-white/10 flex flex-col gap-2 bg-black/10">
          {!isCollapsed ? (
            <div className="p-3 rounded-xl bg-white/[0.08] border border-white/10 text-white flex flex-col gap-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Crown className="w-3.5 h-3.5 text-[#2BB39A] shrink-0" />
                  <span className="text-xs font-bold truncate">
                    {planName || CURRENT_SUBSCRIPTION.planName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPlan(plan === 'basic' ? 'pro' : 'basic')}
                  className="text-[10px] font-semibold bg-[#2BB39A] hover:bg-[#259b85] transition-colors px-1.5 py-0.5 rounded-full text-white shrink-0 cursor-pointer"
                  title="التبديل بين الباقات للتجربة"
                >
                  {plan === 'basic' ? 'أساسي (تغيير)' : 'احترافي (تغيير)'}
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/70">
                <span>انتهاء: {expiryDate || CURRENT_SUBSCRIPTION.expiryDate}</span>
                <span className="font-semibold text-white/90">
                  {daysRemaining || CURRENT_SUBSCRIPTION.daysRemaining} يوم
                </span>
              </div>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={() => setPlan(plan === 'basic' ? 'pro' : 'basic')}
                  className="mx-auto w-11 h-11 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/[0.14] transition-colors"
                >
                  <Crown className="w-5 h-5 text-[#2BB39A]" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-right">
                <p className="font-bold">{planName || CURRENT_SUBSCRIPTION.planName}</p>
                <p className="text-[11px] text-white/80">
                  انتهاء: {expiryDate || CURRENT_SUBSCRIPTION.expiryDate}
                </p>
                <p className="text-[10px] text-[#2BB39A]">
                  متبقي {daysRemaining || CURRENT_SUBSCRIPTION.daysRemaining} يوم (انقر للتبديل)
                </p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              'flex items-center h-10 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium',
              isCollapsed ? 'justify-center w-11 mx-auto' : 'justify-between px-3 w-full'
            )}
            title={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
            aria-label={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
          >
            {!isCollapsed && <span>طي القائمة الجانبية</span>}
            {isCollapsed ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
};
