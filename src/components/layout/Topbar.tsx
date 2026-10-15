import React, { useState } from 'react';
import { Bell, User, Building2, LogOut, ChevronDown, Check, Lock } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { Avatar } from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';
import { formatDateAr } from '@/lib/formatters';
import { CLINIC_BRANCHES } from '@/lib/constants';
import { useAuth } from '@/features/auth/AuthContext';
import { USER_ROLE_AR } from '@shared/contracts';

export interface TopbarProps {
  onSearch?: (query: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onSearch }) => {
  const { user, logout, lockScreen } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(CLINIC_BRANCHES[0].id);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  // Dynamic today's date formatted in Arabic with Latin numerals
  const todayFormatted = formatDateAr(new Date());

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch?.('');
  };

  const displayName = user?.full_name || 'طبيب النظام';
  const roleName = user?.role ? USER_ROLE_AR[user.role] || user.role : 'مستخدم';
  const avatarFallback = displayName
    .trim()
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('') || 'م';

  return (
    <header
      className="sticky top-0 z-20 h-16 w-full bg-white border-b border-[#E6EDF5] px-6 flex items-center justify-between gap-4 select-none shadow-xs"
      aria-label="شريط التنقل العلوي"
    >
      {/* Right side: Clinic Name & Dynamic Date */}
      <div className="flex flex-col min-w-[200px] shrink-0">
        <h2 className="text-[18px] font-bold text-text-primary leading-tight">
          عيادة النخبة للأسنان
        </h2>
        <span className="text-[12px] font-medium text-[#93A2B8] leading-normal">
          {todayFormatted}
        </span>
      </div>

      {/* Center: Search input with width 380px */}
      <div className="flex-1 max-w-[380px] mx-auto">
        <SearchInput
          placeholder="البحث السريع عن مريض، ملف طبي، أو موعد..."
          value={searchQuery}
          onChange={handleSearchChange}
          onClear={handleClearSearch}
          className="w-full"
        />
      </div>

      {/* Left side: Notifications & User Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick Lock Screen Button (Ctrl+L) */}
        <button
          type="button"
          onClick={() => lockScreen()}
          className="relative p-2 rounded-xl text-text-secondary hover:text-brand-blue hover:bg-brand-blue/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          title="قفل الشاشة السريع (Ctrl+L)"
          aria-label="قفل الشاشة السريع"
        >
          <Lock className="w-5 h-5" />
        </button>

        {/* Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              aria-label="الإشعارات والتنبيهات"
            >
              <Bell className="w-5 h-5" />
              {hasUnreadNotifications && (
                <span
                  className="absolute top-2 end-2 w-2 h-2 rounded-full bg-status-danger-fg ring-2 ring-white"
                  aria-hidden="true"
                />
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80 p-2">
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-surface-divider mb-1">
              <span className="text-xs font-bold text-text-primary">الإشعارات</span>
              <button
                type="button"
                onClick={() => setHasUnreadNotifications(false)}
                className="text-[11px] text-brand-blue hover:underline"
              >
                تحديد الكل كمقروء
              </button>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <div className="p-2 rounded-lg bg-surface-hover/70 hover:bg-surface-hover transition-colors">
                <p className="font-semibold text-text-primary">موعد قادم بعد 15 دقيقة</p>
                <p className="text-[11px] text-text-secondary">المريض: سارة عبد الرحمن (حشو تجميلي)</p>
              </div>
              <div className="p-2 rounded-lg bg-surface-hover/70 hover:bg-surface-hover transition-colors">
                <p className="font-semibold text-text-primary">موافقة تأمين جديدة</p>
                <p className="text-[11px] text-text-secondary">تمت الموافقة على خطة علاج المريض خالد السعيد</p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-[#E6EDF5]" aria-hidden="true" />

        {/* User Profile Chip & Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 p-1 ps-2 pe-1.5 rounded-full hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/20 text-right group"
              aria-label="قائمة المستخدم"
            >
              <div className="flex flex-col text-right leading-tight">
                <span className="text-xs font-bold text-text-primary group-hover:text-brand-navy">
                  {displayName}
                </span>
                <span className="text-[11px] text-text-secondary">
                  {roleName}
                </span>
              </div>

              <Avatar
                size="sm"
                fallback={avatarFallback}
                className="w-9 h-9 border border-[#E6EDF5] shadow-xs text-white"
                style={{ backgroundColor: user?.color || '#1E4E9C' }}
              />

              <ChevronDown className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-transform" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-bold text-text-primary">{displayName}</span>
                <span className="text-[11px] text-text-secondary">{roleName} ({user?.username})</span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="gap-2" onClick={() => lockScreen()}>
              <Lock className="w-4 h-4 text-text-secondary" />
              <span>قفل الشاشة (Ctrl+L)</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="gap-2">
              <User className="w-4 h-4 text-text-secondary" />
              <span>الملف الشخصي</span>
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Building2 className="w-4 h-4 text-text-secondary" />
                <span>تبديل الفرع</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                {CLINIC_BRANCHES.map((branch) => (
                  <DropdownMenuItem
                    key={branch.id}
                    onClick={() => setSelectedBranch(branch.id)}
                    className="flex items-center justify-between"
                  >
                    <span>{branch.name}</span>
                    {selectedBranch === branch.id && (
                      <Check className="w-4 h-4 text-brand-blue" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              danger
              className="gap-2 cursor-pointer"
              onClick={async () => {
                await logout();
              }}
            >
              <LogOut className="w-4 h-4 text-status-danger-fg" />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
