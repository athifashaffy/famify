import { useEffect, useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import { getGreeting, formatTime, getInitials } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Event, Task, MealPlan, Reminder, Note } from '../lib/types';
import { CATEGORY_COLORS, MEAL_COLORS } from '../lib/constants';
import { format } from 'date-fns';

export function DashboardPage() {
  const { profile } = useAuth();
  const { family, members } = useFamily();
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
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

    const [eventsRes, tasksRes, mealsRes, remindersRes, notesRes] = await Promise.all([
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
    ]);

    if (eventsRes.data) setEvents(eventsRes.data);
    if (tasksRes.data) setTasks(tasksRes.data);
    if (mealsRes.data) setMeals(mealsRes.data);
    if (remindersRes.data) setReminders(remindersRes.data);
    if (notesRes.data) setNotes(notesRes.data);
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
                    className={`px-2 py-1 rounded-full text-xs ${CATEGORY_COLORS[event.category].bg} ${CATEGORY_COLORS[event.category].text}`}
                  >
                    {event.category}
                  </span>
                </div>
              ))
            )}
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
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            ✅ Tasks
          </h2>
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
                    className={`px-3 py-1 rounded-full text-xs font-medium ${MEAL_COLORS[meal.meal_type].bg} ${MEAL_COLORS[meal.meal_type].text}`}
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
