import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Notification } from '../../lib/types';
import { format, parseISO } from 'date-fns';
import { Bell, CheckCheck, Calendar, Baby, MapPin, AlertCircle } from 'lucide-react';

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  planner: Calendar,
  child_hub: Baby,
  needle: MapPin,
  system: AlertCircle,
};

export function NotificationsPanel() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(50);
    setNotifications(data || []);
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-500">{unreadCount} unread</span>
          <button
            onClick={markAllAsRead}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            <CheckCheck size={12} /> Mark all read
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-12 text-center">
          <Bell size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-600 font-medium">No notifications yet</p>
          <p className="text-xs text-slate-400 mt-1">
            You'll receive notifications for reminders, child updates, and more.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
            return (
              <div
                key={notification.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                  !notification.is_read
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-full flex-shrink-0 ${
                    !notification.is_read ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-xs font-medium leading-tight ${
                        !notification.is_read ? 'text-slate-900' : 'text-slate-600'
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1 flex-shrink-0" />
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
                    )}
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {format(parseISO(notification.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
