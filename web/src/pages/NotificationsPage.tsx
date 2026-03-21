import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Notification } from '../lib/types';
import { format, parseISO } from 'date-fns';
import { Bell, CheckCheck, Calendar, Baby, MapPin, AlertCircle } from 'lucide-react';

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  planner: Calendar,
  child_hub: Baby,
  needle: MapPin,
  system: AlertCircle,
};

export function NotificationsPage() {
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
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" className="text-sm">
            <CheckCheck size={16} className="mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600">Loading notifications...</p>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No notifications yet</p>
          <p className="text-sm text-slate-500 mt-1">
            You'll receive notifications for planner reminders, child updates, and more.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
            return (
              <Card
                key={notification.id}
                className={`p-4 cursor-pointer transition-colors ${
                  !notification.is_read
                    ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500'
                    : 'hover:bg-slate-50'
                }`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    !notification.is_read ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm font-medium ${
                        !notification.is_read ? 'text-slate-900' : 'text-slate-600'
                      }`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {format(parseISO(notification.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    {notification.message && (
                      <p className="text-sm text-slate-500 mt-0.5">{notification.message}</p>
                    )}
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
