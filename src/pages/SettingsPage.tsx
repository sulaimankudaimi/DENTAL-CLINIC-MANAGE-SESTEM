import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { ProceduresCatalogPage } from '@/features/procedures/ProceduresCatalogPage';

import {
  Building2,
  GitFork,
  Clock,
  Users,
  Tag,
  MessageSquare,
  Bell,
  Palette,
  Database,
  Info,
  Stethoscope,
} from 'lucide-react';

import type { SettingsTabId } from '@/features/settings/types';
import {
  DEFAULT_CLINIC_PROFILE,
  DEFAULT_BRANCHES,
  DEFAULT_ROOMS,
  DEFAULT_WORKING_HOURS,
  DEFAULT_PRICE_TIERS,
  DEFAULT_MESSAGE_TEMPLATES,
  DEFAULT_ALERT_RULES,
  DEFAULT_APPEARANCE,
  DEFAULT_BACKUP_SETTINGS,
  DEFAULT_ABOUT_INFO,
} from '@/features/settings/defaultSettings';

import { ClinicTab } from '@/features/settings/components/ClinicTab';
import { BranchesRoomsTab } from '@/features/settings/components/BranchesRoomsTab';
import { WorkingHoursTab } from '@/features/settings/components/WorkingHoursTab';
import { UsersRolesTab } from '@/features/settings/components/UsersRolesTab';
import { PriceListsTab } from '@/features/settings/components/PriceListsTab';
import { MessageTemplatesTab } from '@/features/settings/components/MessageTemplatesTab';
import { AlertRulesTab } from '@/features/settings/components/AlertRulesTab';
import { AppearanceTab } from '@/features/settings/components/AppearanceTab';
import { BackupTab } from '@/features/settings/components/BackupTab';
import { AboutTab } from '@/features/settings/components/AboutTab';

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'clinic';
  const activeTab: SettingsTabId =
    rawTab === 'procedures'
      ? 'price_lists'
      : (rawTab as SettingsTabId);

  const [proceduresSubView, setProceduresSubView] = useState<boolean>(rawTab === 'procedures');

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Load Clinic State
  const { data: clinicData } = useQuery({
    queryKey: queryKeys.settings.clinic,
    queryFn: async () => {
      const res = await api.settings.getClinic();
      return res.ok ? res.data : null;
    },
  });

  // Load All System Settings
  const { data: serverSettings } = useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: async () => {
      const res = await api.settings.getSettings();
      return res.ok ? res.data : null;
    },
  });

  // Local States initialized with storage / server / defaults
  const [clinicSettings, setClinicSettings] = useState(() => {
    const saved = localStorage.getItem('clinic_profile_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_CLINIC_PROFILE;
  });

  const [branches, setBranches] = useState(() => {
    const saved = localStorage.getItem('clinic_branches');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_BRANCHES;
  });

  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem('clinic_rooms');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_ROOMS;
  });

  const [workingHours, setWorkingHours] = useState(() => {
    const saved = localStorage.getItem('clinic_working_hours');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_WORKING_HOURS;
  });

  const [priceTiers, setPriceTiers] = useState(() => {
    const saved = localStorage.getItem('clinic_price_tiers');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_PRICE_TIERS;
  });

  const [messageTemplates, setMessageTemplates] = useState(() => {
    const saved = localStorage.getItem('clinic_message_templates');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_MESSAGE_TEMPLATES;
  });

  const [alertRules, setAlertRules] = useState(() => {
    const saved = localStorage.getItem('clinic_alert_rules');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_ALERT_RULES;
  });

  const [appearance, setAppearance] = useState(() => {
    const saved = localStorage.getItem('appearance_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_APPEARANCE;
  });

  const [backupSettings, setBackupSettings] = useState(() => {
    const saved = localStorage.getItem('clinic_backup_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_BACKUP_SETTINGS;
  });

  // Sync serverSettings when loaded
  useEffect(() => {
    if (serverSettings) {
      if (serverSettings.clinic_profile) setClinicSettings(serverSettings.clinic_profile);
      if (serverSettings.branches) setBranches(serverSettings.branches as any);
      if (serverSettings.rooms) setRooms(serverSettings.rooms as any);
      if (serverSettings.working_hours) setWorkingHours(serverSettings.working_hours as any);
      if (serverSettings.price_tiers) setPriceTiers(serverSettings.price_tiers as any);
      if (serverSettings.message_templates) setMessageTemplates(serverSettings.message_templates as any);
      if (serverSettings.alert_rules) setAlertRules(serverSettings.alert_rules as any);
      if (serverSettings.appearance) setAppearance(serverSettings.appearance as any);
      if (serverSettings.backup_config) setBackupSettings(serverSettings.backup_config as any);
    }
  }, [serverSettings]);

  // Apply appearance on mount & state change
  useEffect(() => {
    if (appearance.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (appearance.font_size === 'large') {
      document.documentElement.style.fontSize = '18px';
    } else if (appearance.font_size === 'medium') {
      document.documentElement.style.fontSize = '16px';
    } else {
      document.documentElement.style.fontSize = '14px';
    }

    if (appearance.numeral_system) {
      document.documentElement.setAttribute('data-numeral-system', appearance.numeral_system);
    }
  }, [appearance]);

  // Sync clinicData when loaded
  useEffect(() => {
    if (clinicData) {
      setClinicSettings((prev: any) => ({
        ...prev,
        name: clinicData.name || prev.name,
        phone: clinicData.phone || prev.phone,
        email: clinicData.email || prev.email,
        address: clinicData.address || prev.address,
        city: clinicData.city || prev.city,
        tax_number: clinicData.tax_number || prev.tax_number,
        cr_number: clinicData.cr_number || prev.cr_number,
        currency: clinicData.currency || prev.currency,
      }));
    }
  }, [clinicData]);

  // Save Mutations
  const updateClinicMutation = useMutation({
    mutationFn: async (payload: any) => {
      // 1. update server clinic
      await api.settings.updateClinic({
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        city: payload.city,
        tax_number: payload.tax_number,
        cr_number: payload.cr_number,
        currency: payload.currency,
      });
      // 2. update key setting
      await api.settings.setSetting('clinic_profile', payload);
      return payload;
    },
    onSuccess: (saved) => {
      setClinicSettings(saved);
      localStorage.setItem('clinic_profile_settings', JSON.stringify(saved));
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.clinic });
      showToast({ title: 'تم الحفظ', description: 'تم تحديث بيانات العيادة بنجاح', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'خطأ', description: 'فشل حفظ إعدادات العيادة', variant: 'error' });
    },
  });

  const handleSaveClinic = (updated: any) => {
    updateClinicMutation.mutate(updated);
  };

  const handleSaveBranches = (newBranches: any[]) => {
    setBranches(newBranches);
    localStorage.setItem('clinic_branches', JSON.stringify(newBranches));
    api.settings.setSetting('branches', newBranches);
    queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    showToast({ title: 'تم الحفظ', description: 'تم تحديث فروع العيادة بنجاح', variant: 'success' });
  };

  const handleSaveRooms = (newRooms: any[]) => {
    setRooms(newRooms);
    localStorage.setItem('clinic_rooms', JSON.stringify(newRooms));
    api.settings.setSetting('rooms', newRooms);
    queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    showToast({ title: 'تم الحفظ', description: 'تم تحديث غرف العيادة والعيادات الفرعية بنجاح', variant: 'success' });
  };

  const handleSaveWorkingHours = (newHours: any) => {
    setWorkingHours(newHours);
    localStorage.setItem('clinic_working_hours', JSON.stringify(newHours));
    api.settings.setSetting('working_hours', newHours);
    queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    showToast({ title: 'تم الحفظ', description: 'تم تحديث جدول أوقات العمل وفترات الدوام بنجاح', variant: 'success' });
  };

  const handleSavePriceTiers = (newTiers: any[]) => {
    setPriceTiers(newTiers);
    localStorage.setItem('clinic_price_tiers', JSON.stringify(newTiers));
    api.settings.setSetting('price_tiers', newTiers);
    queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    showToast({ title: 'تم الحفظ', description: 'تم تحديث قوائم الأسعار بنجاح', variant: 'success' });
  };

  const handleSaveTemplates = (newTemplates: any[]) => {
    setMessageTemplates(newTemplates);
    localStorage.setItem('clinic_message_templates', JSON.stringify(newTemplates));
    api.settings.setSetting('message_templates', newTemplates);
    queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    showToast({ title: 'تم الحفظ', description: 'تم تحديث قوالب الرسائل بنجاح', variant: 'success' });
  };

  const handleSaveAlertRules = (newRules: any[]) => {
    setAlertRules(newRules);
    localStorage.setItem('clinic_alert_rules', JSON.stringify(newRules));
    api.settings.setSetting('alert_rules', newRules);
    queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    showToast({ title: 'تم الحفظ', description: 'تم تحديث قواعد التنبيهات بنجاح', variant: 'success' });
  };

  const handleSaveAppearance = (newAppearance: any) => {
    setAppearance(newAppearance);
    localStorage.setItem('appearance_settings', JSON.stringify(newAppearance));
    api.settings.setSetting('appearance', newAppearance);
    queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    showToast({ title: 'تم الحفظ', description: 'تم حفظ وتطبيق إعدادات المظهر بنجاح', variant: 'success' });
  };

  const handleSaveBackupSettings = (newBackup: any) => {
    setBackupSettings(newBackup);
    localStorage.setItem('clinic_backup_settings', JSON.stringify(newBackup));
    api.settings.setSetting('backup_config', newBackup);
    queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    showToast({ title: 'تم الحفظ', description: 'تم تحديث إعدادات النسخ الاحتياطي بنجاح', variant: 'success' });
  };

  // Tab Definitions
  const tabs = [
    { id: 'clinic', label: 'العيادة والترخيص', icon: Building2 },
    { id: 'branches_rooms', label: 'الفروع والغرف', icon: GitFork },
    { id: 'working_hours', label: 'أوقات العمل', icon: Clock },
    { id: 'users_roles', label: 'المستخدمون والصلاحيات', icon: Users },
    { id: 'price_lists', label: 'الإجراءات وقوائم الأسعار', icon: Tag },
    { id: 'message_templates', label: 'قوالب الرسائل', icon: MessageSquare },
    { id: 'alert_rules', label: 'التنبيهات والأتمتة', icon: Bell },
    { id: 'appearance', label: 'المظهر والتقويم', icon: Palette },
    { id: 'backup', label: 'النسخ الاحتياطي والأمان', icon: Database },
    { id: 'about', label: 'حول البرنامج', icon: Info },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="مركز إعدادات النظام والعيادة"
        description="إدارة كافة خصائص المنشأة، الفروع والغرف، أوقات العمل، الصلاحيات، قوائم الأسعار، الرسائل والنسخ الاحتياطي"
      />

      {/* 10 Navigation Tabs Bar */}
      <div className="border-b border-surface-border bg-surface-card rounded-2xl p-1 shadow-2xs overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSearchParams({ tab: tab.id });
                  if (tab.id !== 'price_lists') {
                    setProceduresSubView(false);
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-brand-navy text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-ground'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Clinic Profile */}
      {activeTab === 'clinic' && (
        <ClinicTab
          settings={clinicSettings}
          onSave={handleSaveClinic}
          isSaving={updateClinicMutation.isPending}
        />
      )}

      {/* Tab 2: Branches & Rooms */}
      {activeTab === 'branches_rooms' && (
        <BranchesRoomsTab
          branches={branches}
          rooms={rooms}
          onSaveBranches={handleSaveBranches}
          onSaveRooms={handleSaveRooms}
        />
      )}

      {/* Tab 3: Working Hours & Holidays */}
      {activeTab === 'working_hours' && (
        <WorkingHoursTab
          settings={workingHours}
          onSave={handleSaveWorkingHours}
          isSaving={false}
        />
      )}

      {/* Tab 4: Users & Roles (RBAC P19) */}
      {activeTab === 'users_roles' && <UsersRolesTab />}

      {/* Tab 5: Price Lists & Procedures Catalog */}
      {activeTab === 'price_lists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-surface-ground p-1.5 rounded-xl border border-surface-border max-w-fit">
            <button
              onClick={() => setProceduresSubView(false)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                !proceduresSubView
                  ? 'bg-white text-brand-navy shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>قوائم الأسعار المتعددة</span>
            </button>
            <button
              onClick={() => setProceduresSubView(true)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                proceduresSubView
                  ? 'bg-white text-brand-navy shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>كتالوج الإجراءات والخدمات (كامل)</span>
            </button>
          </div>

          {proceduresSubView ? (
            <div className="bg-surface-card rounded-2xl border border-surface-border p-4">
              <ProceduresCatalogPage />
            </div>
          ) : (
            <PriceListsTab
              tiers={priceTiers}
              onSaveTiers={handleSavePriceTiers}
              onNavigateToCatalog={() => setProceduresSubView(true)}
            />
          )}
        </div>
      )}

      {/* Tab 6: Message Templates & Live Preview */}
      {activeTab === 'message_templates' && (
        <MessageTemplatesTab
          templates={messageTemplates}
          onSaveTemplates={handleSaveTemplates}
          isSaving={false}
        />
      )}

      {/* Tab 7: Alert Rules */}
      {activeTab === 'alert_rules' && (
        <AlertRulesTab
          rules={alertRules}
          onSaveRules={handleSaveAlertRules}
          isSaving={false}
        />
      )}

      {/* Tab 8: Appearance & Localization */}
      {activeTab === 'appearance' && (
        <AppearanceTab
          settings={appearance}
          onSave={handleSaveAppearance}
          isSaving={false}
        />
      )}

      {/* Tab 9: Backup & Restore */}
      {activeTab === 'backup' && (
        <BackupTab
          settings={backupSettings}
          onSaveSettings={handleSaveBackupSettings}
        />
      )}

      {/* Tab 10: About App & License */}
      {activeTab === 'about' && (
        <AboutTab info={DEFAULT_ABOUT_INFO} />
      )}
    </div>
  );
};

export default SettingsPage;
