import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { RoomStatus } from '@shared/contracts';
import { Users, Armchair, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface RoomsStatusBarProps {
  unconfirmedCount?: number;
  selectedRoomId?: string;
  onSelectRoom?: (roomId: string) => void;
  onOpenWaitingList?: () => void;
}

export const RoomsStatusBar: React.FC<RoomsStatusBarProps> = ({
  unconfirmedCount = 0,
  selectedRoomId = 'all',
  onSelectRoom,
  onOpenWaitingList,
}) => {
  const queryClient = useQueryClient();

  const { data: rooms = [] } = useQuery({
    queryKey: queryKeys.rooms.all,
    queryFn: async () => {
      const res = await api.rooms.list();
      return res.ok ? res.data : [];
    },
  });

  const toggleRoomStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RoomStatus }) => {
      return api.rooms.updateStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
    },
  });

  // Ensure 5 rooms sorted by room number or name
  const displayRooms = rooms.slice(0, 5);

  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5" dir="rtl">
      {/* 1. Team Status Card */}
      <div
        id="team-status-card"
        onClick={onOpenWaitingList}
        role="button"
        tabIndex={0}
        className={clsx(
          'flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none',
          'bg-white hover:border-brand-blue/40 hover:shadow-sm'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-primary">حالة الفريق</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-brand-blue">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          {unconfirmedCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              <AlertCircle className="w-3 h-3" />
              <span>{unconfirmedCount} غير مؤكد</span>
            </span>
          ) : (
            <span className="text-[11px] text-text-secondary">الفريق مكتمل والتنسيق نشط</span>
          )}
        </div>
        <span className="text-[10px] text-text-tertiary mt-1">مواعيد تحتاج تأكيد</span>
      </div>

      {/* 2 - 6: The 5 Rooms Cards */}
      {displayRooms.map((room, idx) => {
        const isFree = room.status === 'free';
        const isSelected = selectedRoomId === room.id;
        const roomTitle = `غرفة ${idx + 1}`;

        return (
          <div
            key={room.id}
            id={`room-card-${room.id}`}
            onClick={() => onSelectRoom?.(selectedRoomId === room.id ? 'all' : room.id)}
            role="button"
            tabIndex={0}
            className={clsx(
              'flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none relative',
              isSelected
                ? 'border-brand-blue bg-blue-50/40 ring-2 ring-brand-blue/20'
                : 'bg-white border-border-default hover:border-gray-300 hover:shadow-sm'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary">{roomTitle}</span>
              <div
                className={clsx(
                  'w-7 h-7 rounded-lg flex items-center justify-center',
                  isFree ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                )}
                title="أيقونة كرسي الأسنان"
              >
                <Armchair className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRoomStatus.mutate({
                    id: room.id,
                    status: isFree ? 'busy' : 'free',
                  });
                }}
                className={clsx(
                  'inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide transition-colors',
                  isFree
                    ? 'bg-emerald-100/70 text-emerald-700 hover:bg-emerald-200/80'
                    : 'bg-rose-100/70 text-rose-700 hover:bg-rose-200/80'
                )}
                title="اضغط لتغيير حالة الغرفة يدوياً"
              >
                {isFree ? 'شاغرة' : 'مشغولة'}
              </span>

              {isSelected && (
                <span className="text-[10px] font-medium text-brand-blue">محدد</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
