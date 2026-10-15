import React, { useState } from 'react';
import { MessageSquare, ChevronLeft, Send } from 'lucide-react';
import clsx from 'clsx';

interface MessageItem {
  id: string;
  senderName: string;
  role: string;
  text: string;
  time: string;
  avatarColor: string;
  unread?: boolean;
}

export const TeamMessages: React.FC = () => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'm1',
      senderName: 'د. أحمد خالد',
      role: 'الطبيب المسؤول',
      text: 'تم تجهيز غرفة 1 لعملية زراعة الأسنان في تمام 10:00 ص',
      time: 'منذ 15 د',
      avatarColor: 'bg-brand-blue text-white',
      unread: true,
    },
    {
      id: 'm2',
      senderName: 'سارة محمد',
      role: 'مسؤولة الاستقبال',
      text: 'المريض خالد حسن في غرفة الانتظار ولديه أشعة حديثة جاهزة',
      time: 'منذ 32 د',
      avatarColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'm3',
      senderName: 'د. سارة حسن',
      role: 'طبيبة أسنان',
      text: 'مواعيد الخميس المسائية مكتملة بالكامل مع قائمة انتظار',
      time: 'منذ ساعتين',
      avatarColor: 'bg-rose-500 text-white',
    },
  ]);

  const [newMsgText, setNewMsgText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim()) return;

    setIsSending(true);
    const newMsg: MessageItem = {
      id: `m-${Date.now()}`,
      senderName: 'د. أحمد خالد',
      role: 'الطبيب المسؤول',
      text: newMsgText.trim(),
      time: 'الآن',
      avatarColor: 'bg-brand-blue text-white',
    };

    setTimeout(() => {
      setMessages((prev) => [newMsg, ...prev]);
      setNewMsgText('');
      setIsSending(false);
    }, 200);
  };

  return (
    <div
      id="team-messages-card"
      className="bg-white rounded-xl border border-border-default p-4 shadow-sm select-none"
      dir="rtl"
    >
      <div className="flex items-center justify-between pb-3 border-b border-border-default/60 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-brand-teal flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">رسائل الفريق</h3>
        </div>
        <span className="text-xs font-semibold text-text-secondary bg-gray-100 px-2 py-0.5 rounded-full">
          {messages.length}
        </span>
      </div>

      {/* Message List */}
      <div className="space-y-2 mb-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="flex items-start justify-between p-2.5 rounded-lg border border-border-default/50 hover:bg-gray-50/70 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-2.5">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                  msg.avatarColor
                )}
              >
                {msg.senderName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-text-primary">{msg.senderName}</span>
                  <span className="text-[10px] text-text-tertiary">({msg.role})</span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-1 group-hover:line-clamp-none transition-all">
                  {msg.text}
                </p>
                <span className="text-[10px] text-text-tertiary mt-1 block">{msg.time}</span>
              </div>
            </div>

            <div className="text-text-tertiary group-hover:text-brand-blue group-hover:-translate-x-0.5 transition-all mt-1">
              <ChevronLeft className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick message input form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-border-default/50">
        <input
          type="text"
          value={newMsgText}
          onChange={(e) => setNewMsgText(e.target.value)}
          placeholder="أرسل ملاحظة سريعة للفريق..."
          className="flex-1 bg-gray-50 text-xs text-text-primary px-3 py-2 rounded-lg border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-blue"
        />
        <button
          type="submit"
          disabled={!newMsgText.trim() || isSending}
          className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center hover:bg-brand-blue/90 disabled:opacity-50 transition-colors shrink-0"
          title="إرسال"
        >
          <Send className="w-3.5 h-3.5 rotate-180" />
        </button>
      </form>
    </div>
  );
};
