import { useEffect, useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getGreeting, formatTime, getInitials } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Event, Task, MealPlan, Reminder, Note, Notification, ChildProfile } from '../lib/types';
import { CATEGORY_COLORS, MEAL_COLORS } from '../lib/constants';
import { format, differenceInYears, differenceInMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Bell, Baby, Heart } from 'lucide-react';

export function DashboardPage() {
  const { profile, user } = useAuth();
  const { family, members } = useFamily();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [currentTime, setCurrentTime] = useState(format(new Date(), 'HH:mm'));
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'EEE • MMM d'));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'HH:mm'));
      setCurrentDate(format(new Date(), 'EEE • MMM d').toUpperCase());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (family) {
      fetchData();
    }
  }, [family]);

  const fetchData = async () => {
    if (!family) return;

    const today = format(new Date(), 'yyyy-MM-dd');

    const [eventsRes, tasksRes, mealsRes, remindersRes, notesRes, childrenRes] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .eq('family_id', family.id)
        .gte('start_time', today)
        .order('start_time')
        .limit(5),
      supabase
        .from('tasks')
        .select('*')
        .eq('family_id', family.id)
        .eq('is_completed', false)
        .order('due_date')
        .limit(5),
      supabase
        .from('meal_plans')
        .select('*')
        .eq('family_id', family.id)
        .gte('date', today)
        .order('date')
        .limit(6),
      supabase
        .from('reminders')
        .select('*')
        .eq('family_id', family.id)
        .eq('is_completed', false)
        .order('remind_at')
        .limit(3),
      supabase
        .from('notes')
        .select('*')
        .eq('family_id', family.id)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('child_profiles')
        .select('*')
        .eq('family_id', family.id)
        .order('created_at'),
    ]);

    if (eventsRes.data) setEvents(eventsRes.data);
    if (tasksRes.data) setTasks(tasksRes.data);
    if (mealsRes.data) setMeals(mealsRes.data);
    if (remindersRes.data) setReminders(remindersRes.data);
    if (notesRes.data) setNotes(notesRes.data);
    if (childrenRes.data) setChildren(childrenRes.data);

    // Fetch notifications separately (uses user_id)
    if (user) {
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(3);
      if (notifData) setNotifications(notifData);
    }
  };

  const handleQuickAddTask = async () => {
    if (!family || !user || !quickTaskTitle.trim()) return;
    await supabase.from('tasks').insert({
      family_id: family.id,
      created_by: user.id,
      title: quickTaskTitle.trim(),
      priority: 'medium',
    });
    setQuickTaskTitle('');
    setShowQuickAdd(false);
    fetchData();
  };

  const getChildAge = (dob: string | null) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const years = differenceInYears(new Date(), birthDate);
    if (years < 1) {
      const months = differenceInMonths(new Date(), birthDate);
      return `${months}mo`;
    }
    return `${years}y`;
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header Bar */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="hidden md:block text-slate-500">☀️ 24°C</div>
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {getGreeting()}, {profile?.name}!
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
              {members.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-sm"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: '#10B981' }}
                  >
                    {getInitials(member.name || '')}
                  </div>
                  <span className="text-sm">{member.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:block text-right">
            <div className="text-3xl font-bold text-slate-900">{currentTime}</div>
            <div className="text-sm text-slate-500">{currentDate}</div>
          </div>
        </div>
      </div>

      {/* Quick Add Task */}
      {showQuickAdd && (
        <Card className="p-4 mb-6 bg-emerald-50 border-emerald-200">
          <form onSubmit={(e) => { e.preventDefault(); handleQuickAddTask(); }} className="flex gap-2">
            <Input
              autoFocus
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              placeholder="Quick add a task..."
              className="flex-1"
            />
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">Add</Button>
            <Button type="button" onClick={() => { setShowQuickAdd(false); setQuickTaskTitle(''); }} variant="outline">
              <X size={16} />
            </Button>
          </form>
        </Card>
      )}

      {/* Children Quick-View Cards */}
      {children.length > 0 && (
        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {children.map((child) => (
              <Card
                key={child.id}
                className="min-w-[160px] p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-white to-sky-50 border-sky-100"
                onClick={() => navigate('/profile')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                    <Baby size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{child.name || 'Child'}</p>
                    {child.date_of_birth && (
                      <p className="text-xs text-slate-500">{getChildAge(child.date_of_birth)} old</p>
                    )}
                  </div>
                </div>
                {(child.allergies?.length > 0 || child.hobbies?.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {child.allergies?.slice(0, 2).map((a) => (
                      <span key={a} className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px]">{a}</span>
                    ))}
                    {child.hobbies?.slice(0, 2).map((h) => (
                      <span key={h} className="px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded text-[10px]">{h}</span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Events Widget */}
        <Card className="lg:col-span-2 border-l-4 border-l-emerald-500">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📅 Today's Events
          </h2>
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-slate-500 text-sm">No events scheduled</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="text-sm text-slate-500 w-16">{formatTime(event.start_time)}</div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{event.title}</div>
                    {event.description && (
                      <div className="text-sm text-slate-500">{event.description}</div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${CATEGORY_COLORS[event.category]?.bg || 'bg-slate-100'} ${CATEGORY_COLORS[event.category]?.text || 'text-slate-700'}`}
                  >
                    {event.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Notifications Preview Widget */}
        <Card className="border-l-4 border-l-amber-400">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell size={18} className="text-amber-500" /> Notifications
            </h2>
            {notifications.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                {notifications.length} new
              </span>
            )}
          </div>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-slate-500 text-sm">All caught up!</p>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="flex items-start gap-2 p-2 bg-amber-50 rounded border-l-2 border-amber-400">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                    {notif.message && <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>}
                  </div>
                </div>
              ))
            )}
            <button
              onClick={() => navigate('/notifications')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-1"
            >
              View all notifications →
            </button>
          </div>
        </Card>

        {/* Reminders Widget */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🔔 Reminders
          </h2>
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center gap-2 p-2 bg-emerald-50 rounded border-l-2 border-emerald-500">
                <span className="text-sm">{reminder.title}</span>
              </div>
            ))}
            {reminders.length === 0 && (
              <p className="text-slate-500 text-sm">No reminders</p>
            )}
          </div>
        </Card>

        {/* Tasks Widget */}
        <Card className="bg-rose-50/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              ✅ Tasks
            </h2>
            <button
              onClick={() => setShowQuickAdd(true)}
              className="p-1.5 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
              title="Quick add task"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{task.title}</div>
                  {task.due_date && (
                    <div className="text-xs text-slate-500">
                      Due {format(new Date(task.due_date), 'MMM d')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-slate-500 text-sm">No pending tasks</p>
            )}
          </div>
        </Card>

        {/* Meal Planner Widget */}
        <Card className="lg:col-span-2 bg-emerald-50/30">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🍽 Meal Planner
          </h2>
          <div className="space-y-3">
            {meals.map((meal) => (
              <div key={meal.id} className="flex items-center gap-3">
                {meal.meal_type && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${MEAL_COLORS[meal.meal_type]?.bg || 'bg-slate-100'} ${MEAL_COLORS[meal.meal_type]?.text || 'text-slate-700'}`}
                  >
                    {meal.meal_type}
                  </span>
                )}
                <div className="text-sm">{meal.description}</div>
              </div>
            ))}
            {meals.length === 0 && (
              <p className="text-slate-500 text-sm">No meals planned</p>
            )}
          </div>
        </Card>

        {/* Notes Widget */}
        <Card className="bg-amber-50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📝 Notes
          </h2>
          {notes.length > 0 ? (
            <div className="text-center">
              <div className="text-2xl font-bold text-rose-500 mb-2">
                {notes[0].title || 'Note'}
              </div>
              <div className="text-lg text-emerald-600 font-semibold">
                {notes[0].content || ''}
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No notes yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}
