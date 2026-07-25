import { useEffect, useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getGreeting, formatTime, getInitials } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Event, Task, MealPlan, Note, Routine, ChildProfile } from '../lib/types';
import { CATEGORY_COLORS, MEAL_COLORS } from '../lib/constants';
import { format, differenceInYears, differenceInMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Baby, ChevronRight } from 'lucide-react';

export function DashboardPage() {
  const { profile, user } = useAuth();
  const { family, members } = useFamily();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
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

    const [eventsRes, tasksRes, mealsRes, routinesRes, notesRes, childrenRes] = await Promise.all([
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
        .from('routines')
        .select('*')
        .eq('family_id', family.id)
        .eq('is_active', true)
        .order('sort_order')
        .limit(5),
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
    if (routinesRes.data) setRoutines(routinesRes.data);
    if (notesRes.data) setNotes(notesRes.data);
    if (childrenRes.data) setChildren(childrenRes.data);
  };

  const handleQuickAddTask = async () => {
    if (!family || !user || !quickTaskTitle.trim()) return;
    const { error } = await supabase.from('tasks').insert({
      family_id: family.id,
      created_by: user.id,
      title: quickTaskTitle.trim(),
      priority: 'medium',
    });
    if (error) {
      window.alert('Could not add task. Please try again.');
      return;
    }
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
                onClick={() => navigate(`/child-hub/${child.id}`)}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              📅 Today's Events
            </h2>
            <button
              onClick={() => navigate('/planner')}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Manage <ChevronRight size={14} />
            </button>
          </div>
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

        {/* Routines Widget */}
        <Card className="border-l-4 border-l-violet-400 cursor-pointer" onClick={() => navigate('/planner?tab=routines')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              🔄 Routines
            </h2>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/planner?tab=routines'); }}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Manage <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {routines.length === 0 ? (
              <p className="text-slate-500 text-sm">No routines set up</p>
            ) : (
              routines.map((routine) => (
                <div key={routine.id} className="flex items-center gap-2 p-2 bg-violet-50 rounded border-l-2 border-violet-400">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{routine.title}</p>
                    {routine.time_of_day && (
                      <p className="text-xs text-slate-500">{routine.time_of_day}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Tasks Widget */}
        <Card className="bg-rose-50/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              ✅ Tasks
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQuickAdd(true)}
                className="p-1.5 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                title="Quick add task"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => navigate('/planner')}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Manage <ChevronRight size={14} />
              </button>
            </div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              🍽 Meal Planner
            </h2>
            <button
              onClick={() => navigate('/planner')}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Manage <ChevronRight size={14} />
            </button>
          </div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              📝 Notes
            </h2>
            <button
              onClick={() => navigate('/planner')}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Manage <ChevronRight size={14} />
            </button>
          </div>
          {notes.length > 0 ? (
            <div>
              <div className="font-semibold text-slate-900 text-sm mb-1">
                {notes[0].title || 'Note'}
              </div>
              <div className="text-sm text-slate-600 line-clamp-3">
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
