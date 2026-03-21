import { useState, useEffect } from 'react';
import { useFamily } from '../context/FamilyContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Event, Task, List, MealPlan, Reminder, Note, Routine, ChildProfile, RoutineCategory } from '../lib/types';
import { CATEGORY_COLORS, MEAL_COLORS } from '../lib/constants';
import { format, parseISO, isToday, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Calendar, CheckSquare, ShoppingCart, UtensilsCrossed, Bell, StickyNote, Plus, X, RotateCcw, Trash2, User, Repeat } from 'lucide-react';

type TabType = 'calendar' | 'tasks' | 'lists' | 'meals' | 'reminders' | 'notes' | 'routines';

const ROUTINE_CATEGORIES: { value: RoutineCategory; label: string; emoji: string }[] = [
  { value: 'morning', label: 'Morning', emoji: '🌅' },
  { value: 'bedtime', label: 'Bedtime', emoji: '🌙' },
  { value: 'mealtime', label: 'Mealtime', emoji: '🍽' },
  { value: 'school', label: 'School', emoji: '📚' },
  { value: 'afterschool', label: 'After School', emoji: '⚽' },
  { value: 'weekend', label: 'Weekend', emoji: '🎉' },
  { value: 'custom', label: 'Custom', emoji: '📋' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function PlannerPage() {
  const { family } = useFamily();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [showForm, setShowForm] = useState(false);

  // Data states
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarView, setCalendarView] = useState<'today' | 'week'>('today');

  // Form states
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (family) {
      loadData();
      fetchChildren();
    }
  }, [family, activeTab]);

  const fetchChildren = async () => {
    if (!family) return;
    const { data } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at');
    if (data) setChildren(data);
  };

  const loadData = async () => {
    if (!family) return;
    setLoading(true);

    try {
      if (activeTab === 'calendar') {
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('family_id', family.id)
          .order('start_time');
        setEvents(data || []);
      } else if (activeTab === 'tasks') {
        const { data } = await supabase
          .from('tasks')
          .select('*')
          .eq('family_id', family.id)
          .order('due_date');
        setTasks(data || []);
      } else if (activeTab === 'lists') {
        const { data } = await supabase
          .from('lists')
          .select('*')
          .eq('family_id', family.id)
          .order('created_at', { ascending: false });
        setLists(data || []);
      } else if (activeTab === 'meals') {
        const { data } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('family_id', family.id)
          .order('date');
        setMeals(data || []);
      } else if (activeTab === 'reminders') {
        const { data } = await supabase
          .from('reminders')
          .select('*')
          .eq('family_id', family.id)
          .order('is_completed')
          .order('remind_at');
        setReminders(data || []);
      } else if (activeTab === 'notes') {
        const { data } = await supabase
          .from('notes')
          .select('*')
          .eq('family_id', family.id)
          .order('created_at', { ascending: false });
        setNotes(data || []);
      } else if (activeTab === 'routines') {
        const { data } = await supabase
          .from('routines')
          .select('*')
          .eq('family_id', family.id)
          .order('sort_order')
          .order('time_of_day');
        setRoutines(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || !user) return;

    try {
      if (activeTab === 'calendar') {
        await supabase.from('events').insert({
          family_id: family.id,
          created_by: user.id,
          title: formData.title,
          description: formData.description,
          start_time: formData.start_time,
          end_time: formData.end_time,
          location: formData.location,
          category: formData.category || 'other',
          assigned_to: formData.assigned_to ? [formData.assigned_to] : [],
        });
      } else if (activeTab === 'tasks') {
        await supabase.from('tasks').insert({
          family_id: family.id,
          created_by: user.id,
          title: formData.title,
          description: formData.description,
          due_date: formData.due_date,
          priority: formData.priority || 'medium',
          assigned_to: formData.assigned_to || null,
          recurrence: formData.recurrence ? { pattern: formData.recurrence } : null,
        });
      } else if (activeTab === 'lists') {
        await supabase.from('lists').insert({
          family_id: family.id,
          created_by: user.id,
          title: formData.title,
          type: formData.type || 'grocery',
        });
      } else if (activeTab === 'meals') {
        await supabase.from('meal_plans').insert({
          family_id: family.id,
          created_by: user.id,
          date: formData.date,
          meal_type: formData.meal_type,
          description: formData.description,
        });
      } else if (activeTab === 'reminders') {
        await supabase.from('reminders').insert({
          family_id: family.id,
          user_id: user.id,
          title: formData.title,
          remind_at: formData.remind_at,
        });
      } else if (activeTab === 'notes') {
        await supabase.from('notes').insert({
          family_id: family.id,
          created_by: user.id,
          title: formData.title,
          content: formData.content,
        });
      } else if (activeTab === 'routines') {
        await supabase.from('routines').insert({
          family_id: family.id,
          created_by: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category || 'custom',
          time_of_day: formData.time_of_day || null,
          child_id: formData.child_id || null,
          days_of_week: formData.days_of_week || [1, 2, 3, 4, 5, 6, 7],
        });
      }

      setFormData({});
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const toggleTask = async (taskId: string, isCompleted: boolean) => {
    await supabase
      .from('tasks')
      .update({ is_completed: !isCompleted })
      .eq('id', taskId);
    loadData();
  };

  const toggleRoutineActive = async (routineId: string, isActive: boolean) => {
    await supabase
      .from('routines')
      .update({ is_active: !isActive })
      .eq('id', routineId);
    loadData();
  };

  const deleteRoutine = async (routineId: string) => {
    await supabase.from('routines').delete().eq('id', routineId);
    loadData();
  };

  const toggleReminder = async (reminderId: string, isCompleted: boolean) => {
    await supabase
      .from('reminders')
      .update({ is_completed: !isCompleted })
      .eq('id', reminderId);
    loadData();
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId);
    loadData();
  };

  const deleteEvent = async (eventId: string) => {
    await supabase.from('events').delete().eq('id', eventId);
    loadData();
  };

  const toggleDayOfWeek = (day: number) => {
    const current = formData.days_of_week || [1, 2, 3, 4, 5, 6, 7];
    const updated = current.includes(day)
      ? current.filter((d: number) => d !== day)
      : [...current, day].sort();
    setFormData({ ...formData, days_of_week: updated });
  };

  const tabs = [
    { id: 'calendar' as TabType, label: 'Calendar', icon: Calendar },
    { id: 'tasks' as TabType, label: 'Tasks', icon: CheckSquare },
    { id: 'routines' as TabType, label: 'Routine', icon: RotateCcw },
    { id: 'lists' as TabType, label: 'Lists', icon: ShoppingCart },
    { id: 'meals' as TabType, label: 'Meals', icon: UtensilsCrossed },
    { id: 'reminders' as TabType, label: 'Reminders', icon: Bell },
    { id: 'notes' as TabType, label: 'Notes', icon: StickyNote },
  ];

  const renderForm = () => {
    if (!showForm) return null;

    return (
      <Card className="p-6 mb-4 bg-emerald-50 border-emerald-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'calendar' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <Input
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Event description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                  <Input
                    required
                    type="datetime-local"
                    value={formData.start_time || ''}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.end_time || ''}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <Input
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Event location"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={formData.category || 'other'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="health">Health</option>
                    <option value="family">Family</option>
                    <option value="activity">Activity</option>
                    <option value="chores">Chores</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {children.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Child</label>
                    <select
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                      value={formData.assigned_to || ''}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value || null })}
                    >
                      <option value="">Everyone</option>
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>{child.name || 'Unnamed'}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'tasks' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                <Input
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <Input
                    type="datetime-local"
                    value={formData.due_date || ''}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={formData.priority || 'medium'}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {children.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Child</label>
                    <select
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                      value={formData.assigned_to || ''}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value || null })}
                    >
                      <option value="">Unassigned</option>
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>{child.name || 'Unnamed'}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Repeat</label>
                  <select
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={formData.recurrence || ''}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value || null })}
                  >
                    <option value="">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {activeTab === 'lists' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">List Name</label>
                <Input
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Weekly Groceries"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={formData.type || 'grocery'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="grocery">Grocery</option>
                  <option value="shopping">Shopping</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'meals' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <Input
                  required
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meal Type</label>
                <select
                  required
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={formData.meal_type || ''}
                  onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                >
                  <option value="">Select meal type</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <Input
                  required
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Spaghetti Bolognese • Garlic Bread • Salad"
                />
              </div>
            </>
          )}

          {activeTab === 'reminders' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reminder</label>
                <Input
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What do you want to be reminded about?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remind At</label>
                <Input
                  required
                  type="datetime-local"
                  value={formData.remind_at || ''}
                  onChange={(e) => setFormData({ ...formData, remind_at: e.target.value })}
                />
              </div>
            </>
          )}

          {activeTab === 'notes' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Note Title</label>
                <Input
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Note title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                <textarea
                  required
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your note here..."
                  rows={4}
                />
              </div>
            </>
          )}

          {activeTab === 'routines' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Routine Title</label>
                <Input
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Brush teeth, Pack lunch, Bedtime story"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Steps or details for this routine"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={formData.category || 'custom'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {ROUTINE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                  <Input
                    type="time"
                    value={formData.time_of_day || ''}
                    onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })}
                  />
                </div>
              </div>
              {children.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Child</label>
                  <select
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={formData.child_id || ''}
                    onChange={(e) => setFormData({ ...formData, child_id: e.target.value || null })}
                  >
                    <option value="">All children / Family</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>{child.name || 'Unnamed'}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Days of Week</label>
                <div className="flex gap-2">
                  {DAYS.map((day, i) => {
                    const dayNum = i + 1;
                    const selected = (formData.days_of_week || [1, 2, 3, 4, 5, 6, 7]).includes(dayNum);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayOfWeek(dayNum)}
                        className={`w-10 h-10 rounded-full text-xs font-medium transition-colors ${
                          selected
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
              Create
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormData({});
              }}
              className="bg-slate-200 text-slate-700 hover:bg-slate-300"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    );
  };

  if (!family) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-slate-600">Please create or join a family to use the Planner.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Planner</h1>
        <p className="text-sm md:text-base text-slate-600 mt-1">Manage your family's schedule and activities</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setShowForm(false);
                setFormData({});
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Add Button + View Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900">
              {activeTab === 'calendar' && 'Events'}
              {activeTab === 'tasks' && 'Tasks'}
              {activeTab === 'routines' && 'Family Routines'}
              {activeTab === 'lists' && 'Shopping Lists'}
              {activeTab === 'meals' && 'Meal Plan'}
              {activeTab === 'reminders' && 'Reminders'}
              {activeTab === 'notes' && 'Family Notes'}
            </h2>
            {activeTab === 'calendar' && (
              <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setCalendarView('today')}
                  className={`px-3 py-1.5 text-xs font-medium ${calendarView === 'today' ? 'bg-emerald-500 text-white' : 'text-slate-600'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => setCalendarView('week')}
                  className={`px-3 py-1.5 text-xs font-medium ${calendarView === 'week' ? 'bg-emerald-500 text-white' : 'text-slate-600'}`}
                >
                  This Week
                </button>
              </div>
            )}
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {showForm ? (
              <>
                <X size={16} className="mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                Add {activeTab === 'calendar' ? 'Event' : activeTab === 'tasks' ? 'Task' : activeTab === 'routines' ? 'Routine' : activeTab === 'lists' ? 'List' : activeTab === 'meals' ? 'Meal' : activeTab === 'reminders' ? 'Reminder' : 'Note'}
              </>
            )}
          </Button>
        </div>

        {/* Form */}
        {renderForm()}

        {/* Content */}
        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-slate-600">Loading...</p>
          </Card>
        ) : (
          <>
            {/* CALENDAR TAB */}
            {activeTab === 'calendar' && (() => {
              const now = new Date();
              const weekStart = startOfWeek(now, { weekStartsOn: 1 });
              const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
              const filteredEvents = events.filter((event) => {
                const eventDate = parseISO(event.start_time);
                if (calendarView === 'today') return isToday(eventDate);
                return isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
              });
              return filteredEvents.length === 0 && !showForm ? (
                <Card className="p-8 text-center">
                  <p className="text-slate-600">No events {calendarView === 'today' ? 'today' : 'this week'}</p>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {filteredEvents.map((event) => {
                    const assignedChild = event.assigned_to?.length ? children.find((c) => c.id === event.assigned_to[0]) : null;
                    return (
                      <Card key={event.id} className={`p-4 border-l-4 ${CATEGORY_COLORS[event.category]?.border || 'border-l-slate-300'}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900">{event.title}</h3>
                              {assignedChild && (
                                <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs flex items-center gap-1">
                                  <User size={10} /> {assignedChild.name}
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                            )}
                            <div className="flex gap-3 mt-2 text-sm text-slate-500">
                              <span>{format(parseISO(event.start_time), 'MMM d, yyyy • h:mm a')}</span>
                              {event.location && <span>📍 {event.location}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${CATEGORY_COLORS[event.category]?.bg || 'bg-slate-100'} ${CATEGORY_COLORS[event.category]?.text || 'text-slate-700'}`}>
                              {event.category}
                            </span>
                            <button onClick={() => deleteEvent(event.id)} className="text-slate-400 hover:text-rose-600 p-1">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              );
            })()}

            {/* TASKS TAB */}
            {activeTab === 'tasks' && (
              tasks.length === 0 && !showForm ? (
                <Card className="p-8 text-center">
                  <p className="text-slate-600">No tasks yet</p>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {tasks.map((task) => {
                    const assignedChild = task.assigned_to ? children.find((c) => c.id === task.assigned_to) : null;
                    const recurrence = (task as any).recurrence;
                    return (
                      <Card key={task.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={task.is_completed}
                            onChange={() => toggleTask(task.id, task.is_completed)}
                            className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className={`font-medium ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {task.title}
                              </h3>
                              {assignedChild && (
                                <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs flex items-center gap-1">
                                  <User size={10} /> {assignedChild.name}
                                </span>
                              )}
                              {recurrence?.pattern && (
                                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs flex items-center gap-1">
                                  <Repeat size={10} /> {recurrence.pattern}
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                            )}
                            <div className="flex gap-3 mt-2 text-sm text-slate-500">
                              {task.due_date && (
                                <span>Due {format(parseISO(task.due_date), 'MMM d, yyyy')}</span>
                              )}
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                task.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                                task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                          <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-rose-600 p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )
            )}

            {/* LISTS TAB */}
            {activeTab === 'lists' && (
              lists.length === 0 && !showForm ? (
                <Card className="p-8 text-center">
                  <p className="text-slate-600">No lists created</p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {lists.map((list) => (
                    <Card key={list.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-slate-900">{list.title}</h3>
                        <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                          {list.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">Created {format(parseISO(list.created_at), 'MMM d, yyyy')}</p>
                    </Card>
                  ))}
                </div>
              )
            )}

            {/* MEALS TAB */}
            {activeTab === 'meals' && (
              meals.length === 0 && !showForm ? (
                <Card className="p-8 text-center">
                  <p className="text-slate-600">No meals planned</p>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {meals.map((meal) => (
                    <Card key={meal.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${meal.meal_type ? MEAL_COLORS[meal.meal_type]?.bg : 'bg-slate-100'} ${meal.meal_type ? MEAL_COLORS[meal.meal_type]?.text : 'text-slate-700'}`}>
                              {meal.meal_type || 'meal'}
                            </span>
                            <span className="text-sm text-slate-600">{format(parseISO(meal.date), 'MMM d, yyyy')}</span>
                          </div>
                          <p className="mt-2 text-slate-900">{meal.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}

            {/* REMINDERS TAB */}
            {activeTab === 'reminders' && (
              reminders.length === 0 && !showForm ? (
                <Card className="p-8 text-center">
                  <p className="text-slate-600">No reminders set</p>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {reminders.map((reminder) => (
                    <Card key={reminder.id} className={`p-4 ${reminder.is_completed ? 'opacity-50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={reminder.is_completed}
                          onChange={() => toggleReminder(reminder.id, reminder.is_completed)}
                          className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <h3 className={`font-medium ${reminder.is_completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {reminder.title}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {format(parseISO(reminder.remind_at), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                        {!reminder.is_completed && (
                          <Bell size={18} className="text-emerald-500 mt-0.5" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              notes.length === 0 && !showForm ? (
                <Card className="p-8 text-center">
                  <p className="text-slate-600">No notes yet</p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {notes.map((note) => (
                    <Card key={note.id} className="p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-slate-900 mb-2">{note.title}</h3>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-3">{note.content}</p>
                      <p className="text-xs text-slate-500">{format(parseISO(note.created_at), 'MMM d, yyyy')}</p>
                    </Card>
                  ))}
                </div>
              )
            )}

            {/* ROUTINES TAB */}
            {activeTab === 'routines' && (
              routines.length === 0 && !showForm ? (
                <Card className="p-8 text-center">
                  <div className="mb-4">
                    <RotateCcw size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-600 font-medium">No routines created yet</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Routines help establish structure and security for your family.
                      Create morning, bedtime, or mealtime routines to build healthy habits.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  {ROUTINE_CATEGORIES.map((cat) => {
                    const catRoutines = routines.filter((r) => r.category === cat.value);
                    if (catRoutines.length === 0) return null;
                    return (
                      <div key={cat.value}>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          {cat.emoji} {cat.label}
                        </h3>
                        <div className="grid gap-2">
                          {catRoutines.map((routine) => {
                            const assignedChild = children.find((c) => c.id === routine.child_id);
                            return (
                              <Card key={routine.id} className={`p-4 ${!routine.is_active ? 'opacity-50' : ''}`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-slate-900">{routine.title}</h3>
                                      {assignedChild && (
                                        <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs">
                                          {assignedChild.name}
                                        </span>
                                      )}
                                      {!routine.is_active && (
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs">
                                          Paused
                                        </span>
                                      )}
                                    </div>
                                    {routine.description && (
                                      <p className="text-sm text-slate-600 mt-1">{routine.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                      {routine.time_of_day && (
                                        <span>
                                          {format(new Date(`2000-01-01T${routine.time_of_day}`), 'h:mm a')}
                                        </span>
                                      )}
                                      <span>
                                        {routine.days_of_week.length === 7
                                          ? 'Every day'
                                          : routine.days_of_week.map((d) => DAYS[d - 1]).join(', ')}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => toggleRoutineActive(routine.id, routine.is_active)}
                                      className={`px-2 py-1 rounded text-xs ${
                                        routine.is_active
                                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      {routine.is_active ? 'Active' : 'Resume'}
                                    </button>
                                    <button
                                      onClick={() => deleteRoutine(routine.id)}
                                      className="text-slate-400 hover:text-rose-600 p-1"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
