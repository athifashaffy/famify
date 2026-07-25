import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Event, Task, List, MealPlan, Note, Routine, ChildProfile, RoutineCategory } from '../lib/types';
import { CATEGORY_COLORS, MEAL_COLORS } from '../lib/constants';
import { format, parseISO, isToday, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Calendar, CheckSquare, ShoppingCart, UtensilsCrossed, StickyNote, Plus, X, RotateCcw, Trash2, User, Repeat, Edit2, Save, Check } from 'lucide-react';

type TabType = 'calendar' | 'tasks' | 'routines' | 'lists' | 'meals' | 'notes';
type RoutineFilter = 'all' | 'parent' | 'family' | string; // string = child_id

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
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'calendar'
  );
  const [showForm, setShowForm] = useState(false);

  // Data
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarView, setCalendarView] = useState<'today' | 'week' | 'all'>('today');
  const [routineFilter, setRoutineFilter] = useState<RoutineFilter>('all');

  // Create form
  const [formData, setFormData] = useState<any>({});
  const [submitError, setSubmitError] = useState('');

  // Edit state (shared by tabs)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // List item state
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [listItems, setListItems] = useState<Record<string, any[]>>({});
  const [newListItemText, setNewListItemText] = useState('');
  const [editingListItemId, setEditingListItemId] = useState<string | null>(null);
  const [editingListItemText, setEditingListItemText] = useState('');

  useEffect(() => {
    if (family) { loadData(); fetchChildren(); }
  }, [family, activeTab]);

  useEffect(() => {
    if (expandedListId) fetchListItems(expandedListId);
  }, [expandedListId]);

  const fetchChildren = async () => {
    if (!family) return;
    const { data } = await supabase.from('child_profiles').select('*').eq('family_id', family.id).order('created_at');
    if (data) setChildren(data);
  };

  const loadData = async () => {
    if (!family) return;
    setLoading(true);
    try {
      if (activeTab === 'calendar') {
        const { data } = await supabase.from('events').select('*').eq('family_id', family.id).order('start_time');
        setEvents(data || []);
      } else if (activeTab === 'tasks') {
        const { data } = await supabase.from('tasks').select('*').eq('family_id', family.id).order('due_date');
        setTasks(data || []);
      } else if (activeTab === 'lists') {
        const { data } = await supabase.from('lists').select('*').eq('family_id', family.id).order('created_at', { ascending: false });
        setLists(data || []);
      } else if (activeTab === 'meals') {
        const { data } = await supabase.from('meal_plans').select('*').eq('family_id', family.id).order('date');
        setMeals(data || []);
      } else if (activeTab === 'notes') {
        const { data } = await supabase.from('notes').select('*').eq('family_id', family.id).order('created_at', { ascending: false });
        setNotes(data || []);
      } else if (activeTab === 'routines') {
        const { data } = await supabase.from('routines').select('*').eq('family_id', family.id).order('sort_order').order('time_of_day');
        setRoutines(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchListItems = async (listId: string) => {
    const { data } = await supabase.from('list_items').select('*').eq('list_id', listId).order('sort_order');
    setListItems((prev) => ({ ...prev, [listId]: data || [] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || !user) return;
    setSubmitError('');
    try {
      let error: { message: string } | null = null;
      if (activeTab === 'calendar') {
        ({ error } = await supabase.from('events').insert({
          family_id: family.id, created_by: user.id,
          title: formData.title, description: formData.description,
          start_time: formData.start_time, end_time: formData.end_time,
          location: formData.location, category: formData.category || 'other',
          assigned_to: formData.assigned_to ? [formData.assigned_to] : [],
        }));
      } else if (activeTab === 'tasks') {
        ({ error } = await supabase.from('tasks').insert({
          family_id: family.id, created_by: user.id,
          title: formData.title, description: formData.description,
          due_date: formData.due_date || null, priority: formData.priority || 'medium',
        }));
      } else if (activeTab === 'lists') {
        ({ error } = await supabase.from('lists').insert({ family_id: family.id, created_by: user.id, title: formData.title, type: formData.type || 'grocery' }));
      } else if (activeTab === 'meals') {
        ({ error } = await supabase.from('meal_plans').insert({ family_id: family.id, created_by: user.id, date: formData.date, meal_type: formData.meal_type, description: formData.description }));
      } else if (activeTab === 'notes') {
        ({ error } = await supabase.from('notes').insert({ family_id: family.id, created_by: user.id, title: formData.title, content: formData.content }));
      } else if (activeTab === 'routines') {
        const assigneeType = formData.assignee_type || 'family';
        const routinePayload: Record<string, unknown> = {
          family_id: family.id, created_by: user.id,
          title: formData.title,
          description: formData.description || null,
          category: formData.category || 'custom',
          time_of_day: formData.time_of_day || null,
          child_id: assigneeType === 'child' ? (formData.child_id || null) : null,
          days_of_week: formData.days_of_week || [1, 2, 3, 4, 5, 6, 7],
        };
        ({ error } = await supabase
          .from('routines')
          .insert({ ...routinePayload, assignee_type: assigneeType }));
        if (error && /assignee_type/.test(error.message)) {
          // Migration 016 not applied yet — insert without the column
          ({ error } = await supabase.from('routines').insert(routinePayload));
        }
      }
      if (error) {
        setSubmitError(error.message);
        return;
      }
      setFormData({});
      setShowForm(false);
      loadData();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save');
    }
  };

  // ── Edit handlers ────────────────────────────────────────────────────────────

  const startEdit = (id: string, data: any) => {
    setEditingId(id);
    setEditForm({ ...data });
    setShowForm(false);
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEditEvent = async (id: string) => {
    await supabase.from('events').update({
      title: editForm.title, description: editForm.description,
      start_time: editForm.start_time, end_time: editForm.end_time,
      location: editForm.location, category: editForm.category,
    }).eq('id', id);
    cancelEdit(); loadData();
  };

  const saveEditTask = async (id: string) => {
    await supabase.from('tasks').update({
      title: editForm.title, description: editForm.description,
      due_date: editForm.due_date || null, priority: editForm.priority,
    }).eq('id', id);
    cancelEdit(); loadData();
  };

  const saveEditNote = async (id: string) => {
    await supabase.from('notes').update({ title: editForm.title, content: editForm.content }).eq('id', id);
    cancelEdit(); loadData();
  };

  const saveEditMeal = async (id: string) => {
    await supabase.from('meal_plans').update({ description: editForm.description, meal_type: editForm.meal_type, date: editForm.date }).eq('id', id);
    cancelEdit(); loadData();
  };

  const saveEditRoutine = async (id: string) => {
    const assigneeType = editForm.assignee_type || 'family';
    await supabase.from('routines').update({
      title: editForm.title, description: editForm.description,
      category: editForm.category, time_of_day: editForm.time_of_day || null,
      assignee_type: assigneeType,
      child_id: assigneeType === 'child' ? (editForm.child_id || null) : null,
      days_of_week: editForm.days_of_week || [1, 2, 3, 4, 5, 6, 7],
    }).eq('id', id);
    cancelEdit(); loadData();
  };

  const saveEditList = async (id: string) => {
    await supabase.from('lists').update({ title: editForm.title, type: editForm.type }).eq('id', id);
    cancelEdit(); loadData();
  };

  // ── Delete handlers ──────────────────────────────────────────────────────────

  const confirmDelete = async (label: string, run: () => PromiseLike<{ error: unknown }>) => {
    if (!window.confirm(`Delete this ${label}?`)) return;
    const { error } = await run();
    if (error) {
      window.alert(`Could not delete ${label}. Please try again.`);
      return;
    }
    loadData();
  };

  const deleteEvent = (id: string) => confirmDelete('event', () => supabase.from('events').delete().eq('id', id));
  const deleteTask = (id: string) => confirmDelete('task', () => supabase.from('tasks').delete().eq('id', id));
  const deleteNote = (id: string) => confirmDelete('note', () => supabase.from('notes').delete().eq('id', id));
  const deleteMeal = (id: string) => confirmDelete('meal', () => supabase.from('meal_plans').delete().eq('id', id));
  const deleteList = (id: string) => confirmDelete('list', () => supabase.from('lists').delete().eq('id', id));
  const deleteRoutine = (id: string) => confirmDelete('routine', () => supabase.from('routines').delete().eq('id', id));
  const toggleTask = async (id: string, done: boolean) => { await supabase.from('tasks').update({ is_completed: !done }).eq('id', id); loadData(); };
  const toggleRoutineActive = async (id: string, active: boolean) => { await supabase.from('routines').update({ is_active: !active }).eq('id', id); loadData(); };

  // ── List items ───────────────────────────────────────────────────────────────

  const addListItem = async (listId: string) => {
    if (!newListItemText.trim()) return;
    const items = listItems[listId] || [];
    await supabase.from('list_items').insert({ list_id: listId, name: newListItemText.trim(), sort_order: items.length, is_checked: false });
    setNewListItemText('');
    fetchListItems(listId);
  };

  const toggleListItem = async (listId: string, itemId: string, checked: boolean) => {
    await supabase.from('list_items').update({ is_checked: !checked }).eq('id', itemId);
    fetchListItems(listId);
  };

  const saveEditListItem = async (listId: string, itemId: string) => {
    await supabase.from('list_items').update({ name: editingListItemText }).eq('id', itemId);
    setEditingListItemId(null);
    fetchListItems(listId);
  };

  const deleteListItem = async (listId: string, itemId: string) => {
    if (!window.confirm('Delete this item?')) return;
    const { error } = await supabase.from('list_items').delete().eq('id', itemId);
    if (error) {
      window.alert('Could not delete item. Please try again.');
      return;
    }
    fetchListItems(listId);
  };

  const toggleDayOfWeek = (day: number, isEdit = false) => {
    const key = isEdit ? editForm : formData;
    const setter = isEdit ? setEditForm : setFormData;
    const current = key.days_of_week || [1, 2, 3, 4, 5, 6, 7];
    const updated = current.includes(day) ? current.filter((d: number) => d !== day) : [...current, day].sort();
    setter({ ...key, days_of_week: updated });
  };

  // ── Tabs ─────────────────────────────────────────────────────────────────────

  const tabs = [
    { id: 'calendar' as TabType, label: 'Calendar', icon: Calendar },
    { id: 'tasks' as TabType, label: 'Tasks', icon: CheckSquare },
    { id: 'routines' as TabType, label: 'Routine', icon: RotateCcw },
    { id: 'lists' as TabType, label: 'Lists', icon: ShoppingCart },
    { id: 'meals' as TabType, label: 'Meals', icon: UtensilsCrossed },
    { id: 'notes' as TabType, label: 'Notes', icon: StickyNote },
  ];

  // Filtered routines based on selected filter tab
  const filteredRoutines = routines.filter((r) => {
    if (routineFilter === 'all') return true;
    if (routineFilter === 'parent') return r.assignee_type === 'parent';
    if (routineFilter === 'family') return r.assignee_type === 'family' || (!r.assignee_type && !r.child_id);
    return r.child_id === routineFilter; // specific child
  });

  // ── Form renderer ────────────────────────────────────────────────────────────

  const renderForm = () => {
    if (!showForm) return null;
    return (
      <Card className="p-6 mb-4 bg-emerald-50 border-emerald-200">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* CALENDAR FORM */}
          {activeTab === 'calendar' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <Input required value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Event title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start</label>
                  <Input required type="datetime-local" value={formData.start_time || ''} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
                  <Input type="datetime-local" value={formData.end_time || ''} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <Input value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={formData.category || 'other'} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    <option value="health">Health</option>
                    <option value="family">Family</option>
                    <option value="activity">Activity</option>
                    <option value="chores">Chores</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              {children.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign to</label>
                  <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={formData.assigned_to || ''} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value || null })}>
                    <option value="">Everyone</option>
                    {children.map((c) => <option key={c.id} value={c.id}>{c.name || 'Child'}</option>)}
                  </select>
                </div>
              )}
            </>
          )}

          {/* TASKS FORM */}
          {activeTab === 'tasks' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                <Input required value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="What needs to be done?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <Input type="datetime-local" value={formData.due_date || ''} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={formData.priority || 'medium'} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* LISTS FORM */}
          {activeTab === 'lists' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">List Name</label>
                <Input required value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Weekly Groceries" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={formData.type || 'grocery'} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <option value="grocery">Grocery</option>
                  <option value="shopping">Shopping</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </>
          )}

          {/* MEALS FORM */}
          {activeTab === 'meals' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <Input required type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meal Type</label>
                  <select required className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={formData.meal_type || ''} onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}>
                    <option value="">Select type</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <Input required value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g., Spaghetti Bolognese" />
              </div>
            </>
          )}

          {/* NOTES FORM */}
          {activeTab === 'notes' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <Input required value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Note title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                <textarea required className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={formData.content || ''} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={4} placeholder="Write your note..." />
              </div>
            </>
          )}

          {/* ROUTINE FORM — quick 2-field create + optional details */}
          {activeTab === 'routines' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Routine Task</label>
                <Input required value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Brush teeth, Pack lunch, Bedtime story" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={formData.assignee_type || 'family'} onChange={(e) => setFormData({ ...formData, assignee_type: e.target.value, child_id: '' })}>
                  <option value="family">Whole Family</option>
                  <option value="parent">Parent Only</option>
                  {children.map((c) => <option key={c.id} value="child" data-child={c.id}>{c.name || 'Child'}</option>)}
                </select>
                {/* If 'child' selected, show child picker */}
                {formData.assignee_type === 'child' && (
                  <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm mt-2" value={formData.child_id || ''} onChange={(e) => setFormData({ ...formData, child_id: e.target.value })}>
                    <option value="">Select child</option>
                    {children.map((c) => <option key={c.id} value={c.id}>{c.name || 'Child'}</option>)}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={formData.category || 'custom'} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    {ROUTINE_CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time (optional)</label>
                  <Input type="time" value={formData.time_of_day || ''} onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Days</label>
                <div className="flex gap-2">
                  {DAYS.map((day, i) => {
                    const dayNum = i + 1;
                    const selected = (formData.days_of_week || [1, 2, 3, 4, 5, 6, 7]).includes(dayNum);
                    return (
                      <button key={day} type="button" onClick={() => toggleDayOfWeek(dayNum)}
                        className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${selected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                <textarea className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} placeholder="Any additional details..." />
              </div>
            </>
          )}

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">Create</Button>
            <Button type="button" onClick={() => { setShowForm(false); setFormData({}); }} className="bg-slate-200 text-slate-700 hover:bg-slate-300">Cancel</Button>
          </div>
        </form>
      </Card>
    );
  };

  if (!family) return (
    <div className="p-6">
      <Card className="p-8 text-center"><p className="text-slate-600">Please create or join a family first.</p></Card>
    </div>
  );

  const tabLabel: Record<TabType, string> = {
    calendar: 'Events', tasks: 'Tasks', routines: 'Routines',
    lists: 'Lists', meals: 'Meals', notes: 'Notes',
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Planner</h1>
        <p className="text-sm text-slate-600 mt-1">Manage your family's schedule and activities</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowForm(false); setFormData({}); cancelEdit(); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}>
              <Icon size={16} />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-4">

        {/* Header row */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900">{tabLabel[activeTab]}</h2>
            {activeTab === 'calendar' && (
              <div className="flex bg-white border border-slate-200 rounded-full overflow-hidden text-xs">
                {(['today', 'week', 'all'] as const).map((v) => (
                  <button key={v} onClick={() => setCalendarView(v)}
                    className={`px-3 py-1.5 font-medium capitalize ${calendarView === v ? 'bg-emerald-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {v === 'week' ? 'This Week' : v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={() => { setShowForm(!showForm); setSubmitError(''); cancelEdit(); }} className="bg-emerald-500 hover:bg-emerald-600">
            {showForm ? <><X size={16} className="mr-1" />Cancel</> : <><Plus size={16} className="mr-1" />Add {tabLabel[activeTab].slice(0, -1)}</>}
          </Button>
        </div>

        {renderForm()}

        {/* Routine filter tabs */}
        {activeTab === 'routines' && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'family', label: '👨‍👩‍👧 Family' },
              { key: 'parent', label: '👤 Parent' },
              ...children.map((c) => ({ key: c.id, label: c.name || 'Child' })),
            ].map((f) => (
              <button key={f.key} onClick={() => setRoutineFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  routineFilter === f.key ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <Card className="p-8 text-center"><p className="text-slate-600">Loading...</p></Card>
        ) : (
          <>
            {/* ── CALENDAR ── */}
            {activeTab === 'calendar' && (() => {
              const now = new Date();
              const ws = startOfWeek(now, { weekStartsOn: 1 });
              const we = endOfWeek(now, { weekStartsOn: 1 });
              const filtered = events.filter((ev) => {
                if (calendarView === 'all') return true;
                const d = parseISO(ev.start_time);
                return calendarView === 'today' ? isToday(d) : isWithinInterval(d, { start: ws, end: we });
              });
              return filtered.length === 0 && !showForm ? (
                <Card className="p-8 text-center"><p className="text-slate-600">No events {calendarView === 'today' ? 'today' : calendarView === 'week' ? 'this week' : ''}</p></Card>
              ) : (
                <div className="grid gap-3">
                  {filtered.map((ev) => {
                    const isEditing = editingId === ev.id;
                    const assignedChild = ev.assigned_to?.length ? children.find((c) => c.id === ev.assigned_to[0]) : null;
                    if (isEditing) return (
                      <Card key={ev.id} className="p-4 border-2 border-emerald-300">
                        <div className="space-y-3">
                          <Input value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" />
                          <textarea className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} />
                          <div className="grid grid-cols-2 gap-2">
                            <Input type="datetime-local" value={editForm.start_time || ''} onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })} />
                            <Input type="datetime-local" value={editForm.end_time || ''} onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })} />
                          </div>
                          <Input value={editForm.location || ''} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} placeholder="Location" />
                          <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={editForm.category || 'other'} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                            <option value="health">Health</option><option value="family">Family</option><option value="activity">Activity</option><option value="chores">Chores</option><option value="other">Other</option>
                          </select>
                          <div className="flex gap-2">
                            <Button onClick={() => saveEditEvent(ev.id)} className="bg-emerald-500 hover:bg-emerald-600 text-sm"><Save size={14} className="mr-1" />Save</Button>
                            <Button onClick={cancelEdit} className="bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">Cancel</Button>
                          </div>
                        </div>
                      </Card>
                    );
                    return (
                      <Card key={ev.id} className={`p-4 border-l-4 ${CATEGORY_COLORS[ev.category]?.border || 'border-l-slate-300'}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-slate-900">{ev.title}</h3>
                              {assignedChild && <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs flex items-center gap-1"><User size={10} />{assignedChild.name}</span>}
                              <span className={`px-2 py-0.5 rounded text-xs ${CATEGORY_COLORS[ev.category]?.bg || 'bg-slate-100'} ${CATEGORY_COLORS[ev.category]?.text || 'text-slate-700'}`}>{ev.category}</span>
                            </div>
                            {ev.description && <p className="text-sm text-slate-600 mt-1">{ev.description}</p>}
                            <div className="flex gap-3 mt-2 text-sm text-slate-500">
                              <span>{format(parseISO(ev.start_time), 'MMM d, yyyy • h:mm a')}</span>
                              {ev.location && <span>📍 {ev.location}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button onClick={() => startEdit(ev.id, ev)} className="text-slate-400 hover:text-emerald-600 p-1"><Edit2 size={14} /></button>
                            <button onClick={() => deleteEvent(ev.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              );
            })()}

            {/* ── TASKS ── */}
            {activeTab === 'tasks' && (
              tasks.length === 0 && !showForm ? (
                <Card className="p-8 text-center"><p className="text-slate-600">No tasks yet</p></Card>
              ) : (
                <div className="grid gap-3">
                  {tasks.map((task) => {
                    const isEditing = editingId === task.id;
                    const assignedChild = task.assigned_to ? children.find((c) => c.id === task.assigned_to) : null;
                    const recurrence = (task as any).recurrence;
                    if (isEditing) return (
                      <Card key={task.id} className="p-4 border-2 border-emerald-300">
                        <div className="space-y-3">
                          <Input value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Task title" />
                          <textarea className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} />
                          <div className="grid grid-cols-2 gap-2">
                            <Input type="datetime-local" value={editForm.due_date || ''} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} />
                            <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={editForm.priority || 'medium'} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
                              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => saveEditTask(task.id)} className="bg-emerald-500 hover:bg-emerald-600 text-sm"><Save size={14} className="mr-1" />Save</Button>
                            <Button onClick={cancelEdit} className="bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">Cancel</Button>
                          </div>
                        </div>
                      </Card>
                    );
                    return (
                      <Card key={task.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={task.is_completed} onChange={() => toggleTask(task.id, task.is_completed)} className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`font-medium ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</h3>
                              {assignedChild && <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs flex items-center gap-1"><User size={10} />{assignedChild.name}</span>}
                              {recurrence?.pattern && <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs flex items-center gap-1"><Repeat size={10} />{recurrence.pattern}</span>}
                            </div>
                            {task.description && <p className="text-sm text-slate-600 mt-1">{task.description}</p>}
                            <div className="flex gap-3 mt-2 text-sm text-slate-500">
                              {task.due_date && <span>Due {format(parseISO(task.due_date), 'MMM d, yyyy')}</span>}
                              <span className={`px-2 py-0.5 rounded text-xs ${task.priority === 'high' ? 'bg-rose-100 text-rose-700' : task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{task.priority}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => startEdit(task.id, task)} className="text-slate-400 hover:text-emerald-600 p-1"><Edit2 size={14} /></button>
                            <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )
            )}

            {/* ── ROUTINES ── */}
            {activeTab === 'routines' && (
              filteredRoutines.length === 0 && !showForm ? (
                <Card className="p-8 text-center">
                  <RotateCcw size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-600 font-medium">No routines yet</p>
                  <p className="text-sm text-slate-500 mt-1">Create morning, bedtime, or custom routines and assign them to your family.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {ROUTINE_CATEGORIES.map((cat) => {
                    const catItems = filteredRoutines.filter((r) => r.category === cat.value);
                    if (catItems.length === 0) return null;
                    return (
                      <div key={cat.value}>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{cat.emoji} {cat.label}</h3>
                        <div className="grid gap-2">
                          {catItems.map((r) => {
                            const isEditing = editingId === r.id;
                            const assignedChild = children.find((c) => c.id === r.child_id);
                            const assigneeLabel =
                              r.assignee_type === 'parent' ? '👤 Parent' :
                              r.assignee_type === 'family' ? '👨‍👩‍👧 Family' :
                              assignedChild ? assignedChild.name :
                              r.child_id ? 'Child' : '👨‍👩‍👧 Family';

                            if (isEditing) return (
                              <Card key={r.id} className="p-4 border-2 border-emerald-300">
                                <div className="space-y-3">
                                  <Input value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Routine task" />
                                  <div className="grid grid-cols-2 gap-2">
                                    <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={editForm.assignee_type || 'family'} onChange={(e) => setEditForm({ ...editForm, assignee_type: e.target.value, child_id: '' })}>
                                      <option value="family">Whole Family</option>
                                      <option value="parent">Parent Only</option>
                                      <option value="child">Specific Child</option>
                                    </select>
                                    {editForm.assignee_type === 'child' && (
                                      <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={editForm.child_id || ''} onChange={(e) => setEditForm({ ...editForm, child_id: e.target.value })}>
                                        <option value="">Select child</option>
                                        {children.map((c) => <option key={c.id} value={c.id}>{c.name || 'Child'}</option>)}
                                      </select>
                                    )}
                                    <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={editForm.category || 'custom'} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                                      {ROUTINE_CATEGORIES.map((cat2) => <option key={cat2.value} value={cat2.value}>{cat2.emoji} {cat2.label}</option>)}
                                    </select>
                                    <Input type="time" value={editForm.time_of_day || ''} onChange={(e) => setEditForm({ ...editForm, time_of_day: e.target.value })} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-slate-500 mb-1">Days</p>
                                    <div className="flex gap-1.5">
                                      {DAYS.map((day, i) => {
                                        const dn = i + 1;
                                        const sel = (editForm.days_of_week || [1,2,3,4,5,6,7]).includes(dn);
                                        return <button key={day} type="button" onClick={() => toggleDayOfWeek(dn, true)} className={`w-8 h-8 rounded-full text-xs font-medium ${sel ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{day}</button>;
                                      })}
                                    </div>
                                  </div>
                                  <textarea className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} placeholder="Notes..." />
                                  <div className="flex gap-2">
                                    <Button onClick={() => saveEditRoutine(r.id)} className="bg-emerald-500 hover:bg-emerald-600 text-sm"><Save size={14} className="mr-1" />Save</Button>
                                    <Button onClick={cancelEdit} className="bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">Cancel</Button>
                                  </div>
                                </div>
                              </Card>
                            );

                            return (
                              <Card key={r.id} className={`p-4 ${!r.is_active ? 'opacity-60' : ''}`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="font-medium text-slate-900">{r.title}</h3>
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">{assigneeLabel}</span>
                                      {!r.is_active && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs">Paused</span>}
                                    </div>
                                    {r.description && <p className="text-sm text-slate-600 mt-1">{r.description}</p>}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                      {r.time_of_day && <span>{format(new Date(`2000-01-01T${r.time_of_day}`), 'h:mm a')}</span>}
                                      <span>{r.days_of_week?.length === 7 ? 'Every day' : r.days_of_week?.map((d: number) => DAYS[d - 1]).join(', ')}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 ml-2">
                                    <button onClick={() => toggleRoutineActive(r.id, r.is_active)} className={`px-2 py-1 rounded text-xs ${r.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                      {r.is_active ? 'Active' : 'Resume'}
                                    </button>
                                    <button onClick={() => startEdit(r.id, { ...r })} className="text-slate-400 hover:text-emerald-600 p-1"><Edit2 size={14} /></button>
                                    <button onClick={() => deleteRoutine(r.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 size={14} /></button>
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

            {/* ── LISTS ── */}
            {activeTab === 'lists' && (
              lists.length === 0 && !showForm ? (
                <Card className="p-8 text-center"><p className="text-slate-600">No lists created</p></Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {lists.map((list) => {
                    const isEditing = editingId === list.id;
                    const items = listItems[list.id] || [];
                    const isExpanded = expandedListId === list.id;
                    return (
                      <Card key={list.id} className="p-4">
                        {isEditing ? (
                          <div className="space-y-3 mb-3">
                            <Input value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                            <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={editForm.type || 'grocery'} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                              <option value="grocery">Grocery</option><option value="shopping">Shopping</option><option value="custom">Custom</option>
                            </select>
                            <div className="flex gap-2">
                              <Button onClick={() => saveEditList(list.id)} className="bg-emerald-500 hover:bg-emerald-600 text-sm"><Save size={14} className="mr-1" />Save</Button>
                              <Button onClick={cancelEdit} className="bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-slate-900">{list.title}</h3>
                              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 mt-1 inline-block">{list.type}</span>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => startEdit(list.id, list)} className="text-slate-400 hover:text-emerald-600 p-1"><Edit2 size={14} /></button>
                              <button onClick={() => deleteList(list.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        )}
                        {/* List items */}
                        <button onClick={() => setExpandedListId(isExpanded ? null : list.id)} className="text-xs text-emerald-600 font-medium hover:underline mb-2 block">
                          {isExpanded ? 'Hide items' : 'Show items'}
                        </button>
                        {isExpanded && (
                          <div className="space-y-1">
                            {items.map((item) => (
                              <div key={item.id} className="flex items-center gap-2">
                                <input type="checkbox" checked={item.is_checked} onChange={() => toggleListItem(list.id, item.id, item.is_checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
                                {editingListItemId === item.id ? (
                                  <div className="flex flex-1 gap-1">
                                    <Input value={editingListItemText} onChange={(e) => setEditingListItemText(e.target.value)} className="text-sm h-7 py-1" />
                                    <button onClick={() => saveEditListItem(list.id, item.id)} className="text-emerald-600 p-1"><Check size={14} /></button>
                                    <button onClick={() => setEditingListItemId(null)} className="text-slate-400 p-1"><X size={14} /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span className={`flex-1 text-sm ${item.is_checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.name}</span>
                                    <button onClick={() => { setEditingListItemId(item.id); setEditingListItemText(item.name); }} className="text-slate-300 hover:text-emerald-600 p-1"><Edit2 size={12} /></button>
                                    <button onClick={() => deleteListItem(list.id, item.id)} className="text-slate-300 hover:text-rose-600 p-1"><Trash2 size={12} /></button>
                                  </>
                                )}
                              </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                              <Input value={newListItemText} onChange={(e) => setNewListItemText(e.target.value)} placeholder="Add item..." className="text-sm h-8" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addListItem(list.id))} />
                              <Button onClick={() => addListItem(list.id)} className="bg-emerald-500 hover:bg-emerald-600 h-8 px-3 text-sm">Add</Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )
            )}

            {/* ── MEALS ── */}
            {activeTab === 'meals' && (
              meals.length === 0 && !showForm ? (
                <Card className="p-8 text-center"><p className="text-slate-600">No meals planned</p></Card>
              ) : (
                <div className="grid gap-3">
                  {meals.map((meal) => {
                    const isEditing = editingId === meal.id;
                    if (isEditing) return (
                      <Card key={meal.id} className="p-4 border-2 border-emerald-300">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Input type="date" value={editForm.date || ''} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                            <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={editForm.meal_type || ''} onChange={(e) => setEditForm({ ...editForm, meal_type: e.target.value })}>
                              <option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option>
                            </select>
                          </div>
                          <Input value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" />
                          <div className="flex gap-2">
                            <Button onClick={() => saveEditMeal(meal.id)} className="bg-emerald-500 hover:bg-emerald-600 text-sm"><Save size={14} className="mr-1" />Save</Button>
                            <Button onClick={cancelEdit} className="bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">Cancel</Button>
                          </div>
                        </div>
                      </Card>
                    );
                    return (
                      <Card key={meal.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded ${meal.meal_type ? MEAL_COLORS[meal.meal_type]?.bg : 'bg-slate-100'} ${meal.meal_type ? MEAL_COLORS[meal.meal_type]?.text : 'text-slate-700'}`}>{meal.meal_type || 'meal'}</span>
                              <span className="text-sm text-slate-600">{format(parseISO(meal.date), 'MMM d, yyyy')}</span>
                            </div>
                            <p className="mt-2 text-slate-900">{meal.description}</p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button onClick={() => startEdit(meal.id, meal)} className="text-slate-400 hover:text-emerald-600 p-1"><Edit2 size={14} /></button>
                            <button onClick={() => deleteMeal(meal.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )
            )}

            {/* ── NOTES ── */}
            {activeTab === 'notes' && (
              notes.length === 0 && !showForm ? (
                <Card className="p-8 text-center"><p className="text-slate-600">No notes yet</p></Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {notes.map((note) => {
                    const isEditing = editingId === note.id;
                    if (isEditing) return (
                      <Card key={note.id} className="p-4 border-2 border-emerald-300">
                        <div className="space-y-3">
                          <Input value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" />
                          <textarea className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={editForm.content || ''} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} rows={4} />
                          <div className="flex gap-2">
                            <Button onClick={() => saveEditNote(note.id)} className="bg-emerald-500 hover:bg-emerald-600 text-sm"><Save size={14} className="mr-1" />Save</Button>
                            <Button onClick={cancelEdit} className="bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">Cancel</Button>
                          </div>
                        </div>
                      </Card>
                    );
                    return (
                      <Card key={note.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-slate-900">{note.title}</h3>
                          <div className="flex gap-1">
                            <button onClick={() => startEdit(note.id, note)} className="text-slate-400 hover:text-emerald-600 p-1"><Edit2 size={14} /></button>
                            <button onClick={() => deleteNote(note.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-3 line-clamp-3">{note.content}</p>
                        <p className="text-xs text-slate-400">{format(parseISO(note.created_at), 'MMM d, yyyy')}</p>
                      </Card>
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
