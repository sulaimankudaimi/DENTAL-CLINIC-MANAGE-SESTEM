import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useSidebarStore } from '@/store/useSidebarStore';
import { cn } from '@/lib/utils';
import { QuickLockModal } from '@/features/auth/QuickLockModal';
import { ForceChangePasswordModal } from '@/features/auth/ForceChangePasswordModal';

export const AppLayout: React.FC = () => {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-text-primary flex flex-row-reverse" dir="rtl">
      {/* Fixed Sidebar on the Right */}
      <Sidebar />

      {/* Main Content Area offset by Sidebar width */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out',
          isCollapsed ? 'mr-[76px]' : 'mr-[248px]'
        )}
      >
        {/* Topbar (sticky at top) */}
        <Topbar />

        {/* Scrollable Page Container with 20px padding */}
        <main
          id="main-content"
          className="flex-1 p-[20px] min-h-[calc(100vh-64px)] bg-[#F4F7FB] overflow-y-auto"
        >
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modals for Quick Lock and Forced Password Change */}
      <QuickLockModal />
      <ForceChangePasswordModal />
    </div>
  );
};
