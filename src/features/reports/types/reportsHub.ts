import type { ReportPeriod } from '@shared/contracts';

export type ReportCategory = 'patients' | 'appointments' | 'clinical' | 'financial' | 'scheduled';

export type ChartType = 'bar' | 'area' | 'line' | 'pie';

export interface ReportDefinition {
  id: string;
  category: 'patients' | 'appointments' | 'clinical' | 'financial';
  title: string;
  titleEn: string;
  description: string;
  iconName: string;
  badge?: string;
  chartType: ChartType;
  chartXKey: string;
  chartYKeys: Array<{ key: string; name: string; color: string }>;
  secondaryChartType?: ChartType;
}

export interface ReportFilterState {
  period: ReportPeriod;
  from?: string;
  to?: string;
  doctorId: string; // 'all' or doctor UUID
  roomId: string; // 'all' or room UUID
  statusFilter: string; // 'all' or specific status
  searchQuery: string;
}

export interface ReportKpiCard {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  isCurrency?: boolean;
  color?: string;
}

export interface ReportTableColumn {
  key: string;
  header: string;
  align?: 'right' | 'center' | 'left';
  width?: string;
  render?: (row: any) => React.ReactNode;
}

export interface ReportGeneratedData {
  reportId: string;
  kpis: ReportKpiCard[];
  chartData: any[];
  tableColumns: ReportTableColumn[];
  tableRows: any[];
  summaryNote?: string;
  totalRevenueHalalas?: number;
  count?: number;
}
