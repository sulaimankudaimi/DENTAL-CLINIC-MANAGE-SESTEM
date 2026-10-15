import React from 'react';
import { ChevronRight, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'لا توجد بيانات متاحة حالياً',
  emptyAction,
  sortColumn,
  sortDirection,
  onSort,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onRowClick,
  className,
}: DataTableProps<T>): React.ReactElement {
  const totalPages =
    page && pageSize && totalCount !== undefined ? Math.ceil(totalCount / pageSize) : undefined;

  return (
    <div
      className={cn(
        'w-full bg-surface-card rounded-card border border-surface-border shadow-card overflow-hidden flex flex-col',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse" role="table">
          <thead>
            <tr className="bg-surface-hover border-b border-surface-divider text-text-secondary text-xs font-semibold select-none">
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    className={cn(
                      'px-4 py-3 text-xs tracking-wide',
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'end'
                        ? 'text-left'
                        : 'text-right'
                    )}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue rounded px-1 -mx-1"
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-brand-blue" aria-label="ترتيب تصاعدي" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-brand-blue" aria-label="ترتيب تنازلي" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-text-muted" aria-label="فرز" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pageSize || 5 }).map((_, rowIndex) => (
                <tr
                  key={`skeleton-row-${rowIndex}`}
                  className="h-[44px] border-b border-surface-divider last:border-0"
                >
                  {columns.map((_, colIndex) => (
                    <td key={`skeleton-col-${colIndex}`} className="px-4 py-2">
                      <div className="h-4 bg-surface-divider animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-48 text-center py-12 text-text-secondary"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-medium">{emptyMessage}</p>
                    {emptyAction && <div className="mt-2">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={keyExtractor(item, index)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={cn(
                    'h-[44px] border-b border-surface-divider last:border-0 text-xs text-text-primary transition-colors hover:bg-surface-hover',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-2 whitespace-nowrap',
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'end'
                          ? 'text-left'
                          : 'text-right'
                      )}
                    >
                      {col.render ? col.render(item, index) : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {page !== undefined && pageSize !== undefined && totalCount !== undefined && onPageChange && (
        <footer className="flex items-center justify-between px-4 py-3 border-t border-surface-divider text-xs text-text-secondary bg-surface-card">
          <span>
            إجمالي السجلات:{' '}
            <strong className="stat-number font-bold text-text-primary">{totalCount}</strong>
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </Button>

            <span className="px-2 py-1 font-medium text-text-primary">
              صفحة {page} من {totalPages || 1}
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={totalPages === undefined || page >= totalPages}
              aria-label="الصفحة التالية"
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
