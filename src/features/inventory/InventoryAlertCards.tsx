import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  ChevronLeft,
} from 'lucide-react';

interface InventoryAlertCardsProps {
  onFilterLowStock?: () => void;
  onFilterExpiring?: () => void;
  isDashboardWidget?: boolean;
}

export const InventoryAlertCards: React.FC<InventoryAlertCardsProps> = ({
  onFilterLowStock,
  onFilterExpiring,
  isDashboardWidget,
}) => {
  const navigate = useNavigate();
  void isDashboardWidget;

  // Fetch low stock items
  const { data: lowStockItems = [] } = useQuery({
    queryKey: queryKeys.inventory.lowStock,
    queryFn: async () => {
      const res = await api.inventory.getLowStock();
      return res.ok ? res.data : [];
    },
  });

  // Fetch expiring items within 60 days
  const { data: expiringItems = [] } = useQuery({
    queryKey: queryKeys.inventory.expiringItems(60),
    queryFn: async () => {
      const res = await api.inventory.getExpiringItems(60);
      return res?.ok ? res.data : [];
    },
  });

  const lowStockCount = lowStockItems.length;
  const expiringCount = expiringItems.length;

  if (lowStockCount === 0 && expiringCount === 0) {
    return null;
  }

  const handleLowStockClick = () => {
    if (onFilterLowStock) {
      onFilterLowStock();
    } else {
      navigate('/inventory?filter=low_stock');
    }
  };

  const handleExpiringClick = () => {
    if (onFilterExpiring) {
      onFilterExpiring();
    } else {
      navigate('/inventory?filter=expiring');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Low Stock Alert Card */}
      {lowStockCount > 0 ? (
        <div
          onClick={handleLowStockClick}
          className="bg-gradient-to-l from-rose-50 to-white border border-rose-200 rounded-xl p-4 shadow-2xs hover:shadow-sm hover:border-rose-300 transition-all cursor-pointer group flex flex-col justify-between gap-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {lowStockCount === 1
                      ? 'صنف واحد قارب على النفاد'
                      : lowStockCount === 2
                      ? 'صنفان قاربا على النفاد'
                      : `${lowStockCount} أصناف قاربت النفاد`}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                    حد الطلب الأدنى
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  وصلت كمياتها بالمستودع إلى حد إعادة الطلب الأدنى أو أقل
                </p>
              </div>
            </div>

            <div className="w-7 h-7 rounded-lg bg-rose-100/60 group-hover:bg-rose-200 text-rose-700 flex items-center justify-center transition-colors shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </div>
          </div>

          {/* Preview of item names */}
          <div className="bg-white/80 rounded-lg p-2.5 border border-rose-100/80 space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {lowStockItems.slice(0, 3).map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-rose-50 text-rose-800 font-medium border border-rose-200/60"
                >
                  <span className="font-bold">{item.name}</span>
                  <span className="font-mono text-[10px] text-rose-600 font-bold">
                    ({item.quantity}/{item.min_quantity} {item.unit})
                  </span>
                </span>
              ))}
              {lowStockItems.length > 3 && (
                <span className="text-[11px] text-slate-500 font-medium self-center">
                  +{lowStockItems.length - 3} مواد أخرى
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. Expiring Items Alert Card */}
      {expiringCount > 0 ? (
        <div
          onClick={handleExpiringClick}
          className="bg-gradient-to-l from-amber-50 to-white border border-amber-200 rounded-xl p-4 shadow-2xs hover:shadow-sm hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between gap-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {expiringCount === 1
                      ? 'صنف واحد قارب انتهاء الصلاحية'
                      : expiringCount === 2
                      ? 'صنفان قاربا انتهاء الصلاحية'
                      : `${expiringCount} أصناف قاربت انتهاء الصلاحية`}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                    تنبيه 60 يوماً
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  مواد طبية تنتهي صلاحيتها خلال الـ 60 يوماً القادمة
                </p>
              </div>
            </div>

            <div className="w-7 h-7 rounded-lg bg-amber-100/60 group-hover:bg-amber-200 text-amber-800 flex items-center justify-center transition-colors shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </div>
          </div>

          {/* Preview of item names */}
          <div className="bg-white/80 rounded-lg p-2.5 border border-amber-100/80 space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {expiringItems.slice(0, 3).map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-amber-50 text-amber-900 font-medium border border-amber-200/60"
                >
                  <span className="font-bold">{item.name}</span>
                  <span className="font-mono text-[10px] text-amber-800">
                    {item.daysRemaining <= 0
                      ? 'منتهي!'
                      : `ينتهي خلال ${item.daysRemaining} يوم`}
                  </span>
                </span>
              ))}
              {expiringItems.length > 3 && (
                <span className="text-[11px] text-slate-500 font-medium self-center">
                  +{expiringItems.length - 3} مواد أخرى
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
