export type SettingsTabId =
  | 'clinic'
  | 'branches_rooms'
  | 'working_hours'
  | 'users_roles'
  | 'price_lists'
  | 'message_templates'
  | 'alert_rules'
  | 'appearance'
  | 'backup'
  | 'about';

export interface ClinicProfileSettings {
  name: string;
  logo_url: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  city: string;
  tax_number: string | null;
  cr_number: string | null;
  currency: string;
  tax_rate_percent: number;
}

export interface BranchItem {
  id: string;
  name: string;
  code: string;
  phone: string;
  address: string;
  is_main: boolean;
  is_active: boolean;
}

export interface DentalRoomItem {
  id: string;
  branch_id: string;
  name: string;
  number: string;
  status: 'free' | 'busy' | 'maintenance';
  chair_model?: string;
  has_xray?: boolean;
  has_bleaching?: boolean;
  equipment_count: number;
  is_active: boolean;
}

export interface DayShift {
  id: string;
  name: string;
  start_time: string; // '09:00'
  end_time: string;   // '13:30'
}

export interface DayWorkingSchedule {
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
  day_name_ar: string;
  is_open: boolean;
  shifts: DayShift[];
}

export interface OfficialHoliday {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  days_count: number;
  recurring_annual: boolean;
}

export interface WorkingHoursSettings {
  schedule: DayWorkingSchedule[];
  holidays: OfficialHoliday[];
  default_slot_duration_min: number; // 15, 20, 30, 45, 60
}

export interface PriceTierItem {
  id: string;
  name: string;
  code: 'cash' | 'insurance' | 'staff' | 'vip' | 'custom';
  description: string;
  discount_multiplier: number; // 1.0 = 100%, 0.85 = 15% discount, 0.50 = 50% discount
  is_default: boolean;
  custom_rates_count: number;
}

export type TemplateType =
  | 'appointment_reminder'
  | 'appointment_confirmation'
  | 'post_treatment'
  | 'birthday'
  | 'invoice';

export interface MessageTemplateItem {
  id: string;
  type: TemplateType;
  title: string;
  description: string;
  channel: 'whatsapp' | 'sms';
  content: string;
  available_variables: string[];
  updated_at: string;
}

export interface AlertRuleItem {
  id: string;
  key: string;
  name: string;
  description: string;
  category: 'appointments' | 'clinical' | 'inventory' | 'financial';
  enabled: boolean;
  value: number;
  unit: 'hours' | 'days' | 'months';
  channels: ('system' | 'whatsapp' | 'sms')[];
}

export interface AppearanceSettings {
  theme: 'light' | 'dark';
  font_size: 'normal' | 'medium' | 'large';
  numeral_system: 'latin' | 'arabic';
  calendar_system: 'gregorian' | 'hijri' | 'both';
}

export interface BackupHistoryRecord {
  id: string;
  filename: string;
  created_at: string;
  size_kb: number;
  is_auto: boolean;
  is_encrypted: boolean;
}

export interface BackupSettings {
  auto_backup_enabled: boolean;
  frequency: 'daily' | 'weekly';
  execution_time: string; // '23:00'
  destination_path: string;
  retention_count: number;
  encryption_enabled: boolean;
  last_backup_time: string | null;
  history: BackupHistoryRecord[];
}

export interface AboutAppInfo {
  app_name: string;
  edition: string;
  version: string;
  build_number: string;
  release_date: string;
  changelog: Array<{
    version: string;
    date: string;
    title: string;
    highlights: string[];
  }>;
}
