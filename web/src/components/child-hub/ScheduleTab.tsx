import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChildRoutineInfo, ChildHealthInfo, Routine } from '../../lib/types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import {
  Sun,
  Sunrise,
  Coffee,
  Moon,
  UtensilsCrossed,
  BedDouble,
  Stethoscope,
  Phone,
  StickyNote,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  X,
  Printer,
} from 'lucide-react';

interface Props {
  childId: string;
  familyId: string;
}

interface ScheduleItem {
  id: string;
  time: string;
  activity: string;
  description: string;
  period: 'morning' | 'midday' | 'afternoon' | 'evening';
  source: 'routine-info' | 'routine' | 'default';
  done: boolean;
}

interface DailyNote {
  id: string;
  content: string;
  created_at: string;
}

const PERIOD_CONFIG = {
  morning: {
    label: 'Morning',
    icon: <Sunrise size={16} className="text-amber-500" />,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    accent: 'text-amber-700',
  },
  midday: {
    label: 'Midday',
    icon: <Sun size={16} className="text-orange-500" />,
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    accent: 'text-orange-700',
  },
  afternoon: {
    label: 'Afternoon',
    icon: <Coffee size={16} className="text-emerald-500" />,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    accent: 'text-emerald-700',
  },
  evening: {
    label: 'Evening',
    icon: <Moon size={16} className="text-indigo-500" />,
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    accent: 'text-indigo-700',
  },
} as const;

type Period = keyof typeof PERIOD_CONFIG;

function classifyTime(timeStr: string): Period {
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (isNaN(hour)) return 'morning';
  if (hour < 12) return 'morning';
  if (hour < 14) return 'midday';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const min = parts[1];
  if (isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${min} ${ampm}`;
}

function classifyRoutineCategory(cat: string): Period {
  if (cat === 'morning') return 'morning';
  if (cat === 'mealtime') return 'midday';
  if (cat === 'afterschool' || cat === 'school') return 'afternoon';
  if (cat === 'bedtime') return 'evening';
  return 'afternoon';
}

export function ScheduleTab({ childId, familyId }: Props) {
  const [routineInfo, setRoutineInfo] = useState<ChildRoutineInfo | null>(null);
  const [healthInfo, setHealthInfo] = useState<ChildHealthInfo | null>(null);
  const [, setRoutines] = useState<Routine[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Notes state
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAll();
  }, [childId, familyId]);

  const fetchAll = async () => {
    setLoading(true);

    const [routineInfoRes, healthRes, routinesRes, notesRes] = await Promise.all([
      supabase.from('child_routine_info').select('*').eq('child_id', childId).single(),
      supabase.from('child_health_info').select('*').eq('child_id', childId).single(),
      supabase.from('routines').select('*').eq('family_id', familyId).order('sort_order'),
      supabase
        .from('child_schedule_notes')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const rInfo = routineInfoRes.data;
    const hInfo = healthRes.data;
    const rList = routinesRes.data || [];
    const nList = notesRes.data || [];

    setRoutineInfo(rInfo);
    setHealthInfo(hInfo);
    setRoutines(rList);
    setNotes(nList);

    // Build schedule items from data
    const items: ScheduleItem[] = [];
    let idx = 0;

    // From routine info: wake time
    if (rInfo?.sleep_schedule?.wake_time) {
      items.push({
        id: `ri-wake-${idx++}`,
        time: rInfo.sleep_schedule.wake_time,
        activity: 'Wake Up',
        description: 'Start of the day',
        period: 'morning',
        source: 'routine-info',
        done: false,
      });
    }

    // From routine info: meal times
    if (rInfo?.feeding_schedule?.meal_times) {
      const mealLabels = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
      (rInfo.feeding_schedule.meal_times as string[]).forEach((t: string, i: number) => {
        const label = mealLabels[i] || `Meal ${i + 1}`;
        items.push({
          id: `ri-meal-${idx++}`,
          time: t,
          activity: label,
          description: `Scheduled ${label.toLowerCase()}`,
          period: classifyTime(t),
          source: 'routine-info',
          done: false,
        });
      });
    }

    // From routine info: nap times
    if (rInfo?.sleep_schedule?.nap_times) {
      (rInfo.sleep_schedule.nap_times as string[]).forEach((t: string) => {
        items.push({
          id: `ri-nap-${idx++}`,
          time: t,
          activity: 'Nap Time',
          description: 'Scheduled rest',
          period: classifyTime(t),
          source: 'routine-info',
          done: false,
        });
      });
    }

    // From routine info: bedtime
    if (rInfo?.sleep_schedule?.bedtime) {
      items.push({
        id: `ri-bed-${idx++}`,
        time: rInfo.sleep_schedule.bedtime,
        activity: 'Bedtime',
        description: rInfo.comfort_methods?.length
          ? `Comfort: ${rInfo.comfort_methods.join(', ')}`
          : 'Time for bed',
        period: 'evening',
        source: 'routine-info',
        done: false,
      });
    }

    // From family routines (filtered to this child or unassigned)
    rList
      .filter((r) => r.is_active && (!r.child_id || r.child_id === childId))
      .forEach((r) => {
        items.push({
          id: `r-${r.id}`,
          time: r.time_of_day || '',
          activity: r.title,
          description: r.description || '',
          period: r.time_of_day ? classifyTime(r.time_of_day) : classifyRoutineCategory(r.category),
          source: 'routine',
          done: false,
        });
      });

    // Sort by time within each period
    const periodOrder: Period[] = ['morning', 'midday', 'afternoon', 'evening'];
    items.sort((a, b) => {
      const pa = periodOrder.indexOf(a.period);
      const pb = periodOrder.indexOf(b.period);
      if (pa !== pb) return pa - pb;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });

    setScheduleItems(items);
    // Load completed state from localStorage
    const todayKey = `schedule-done-${childId}-${new Date().toISOString().slice(0, 10)}`;
    try {
      const saved = localStorage.getItem(todayKey);
      if (saved) setCompletedIds(new Set(JSON.parse(saved)));
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const toggleDone = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      const todayKey = `schedule-done-${childId}-${new Date().toISOString().slice(0, 10)}`;
      localStorage.setItem(todayKey, JSON.stringify([...next]));
      return next;
    });
  };

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    const { data, error } = await supabase
      .from('child_schedule_notes')
      .insert({
        child_id: childId,
        family_id: familyId,
        content: newNote.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setNotes((prev) => [data, ...prev]);
      setNewNote('');
    }
    setSavingNote(false);
  };

  const deleteNote = async (noteId: string) => {
    if (!window.confirm('Delete this note?')) return;
    const { error } = await supabase.from('child_schedule_notes').delete().eq('id', noteId);
    if (error) {
      window.alert('Could not delete note. Please try again.');
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const saveEditNote = async (noteId: string) => {
    if (!editingNoteText.trim()) return;
    await supabase.from('child_schedule_notes').update({ content: editingNoteText.trim() }).eq('id', noteId);
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, content: editingNoteText.trim() } : n));
    setEditingNoteId(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Group schedule items by period
  const grouped = scheduleItems.reduce(
    (acc, item) => {
      if (!acc[item.period]) acc[item.period] = [];
      acc[item.period].push(item);
      return acc;
    },
    {} as Record<Period, ScheduleItem[]>
  );

  const totalItems = scheduleItems.length;
  const completedCount = scheduleItems.filter((i) => completedIds.has(i.id)).length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-emerald-500" />
            Daily Schedule & Notes
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalItems > 0 && (
            <div className="text-right">
              <div className="text-sm font-medium text-slate-700">
                {completedCount}/{totalItems} done
              </div>
              <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${totalItems > 0 ? (completedCount / totalItems) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
          <button onClick={handlePrint} className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors" title="Print Schedule">
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* Daily Schedule - Time-based sections */}
      {totalItems === 0 ? (
        <Card className="p-8 text-center">
          <Clock size={32} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-medium text-slate-700 mb-1">No schedule items yet</h3>
          <p className="text-sm text-slate-400">
            Add routine information in the Routine tab to populate the daily schedule.
          </p>
        </Card>
      ) : (
        (['morning', 'midday', 'afternoon', 'evening'] as Period[]).map((period) => {
          const items = grouped[period];
          if (!items || items.length === 0) return null;
          const config = PERIOD_CONFIG[period];
          const isCollapsed = collapsedSections.has(period);
          const periodCompleted = items.filter((i) => completedIds.has(i.id)).length;

          return (
            <Card key={period} className={`overflow-hidden border ${config.border}`}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(period)}
                className={`w-full flex items-center justify-between px-4 py-3 ${config.bg}`}
              >
                <div className="flex items-center gap-2">
                  {config.icon}
                  <span className={`font-semibold text-sm ${config.accent}`}>{config.label}</span>
                  <span className="text-xs text-slate-400">
                    {periodCompleted}/{items.length}
                  </span>
                </div>
                {isCollapsed ? (
                  <ChevronDown size={16} className="text-slate-400" />
                ) : (
                  <ChevronUp size={16} className="text-slate-400" />
                )}
              </button>

              {/* Items */}
              {!isCollapsed && (
                <div className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const isDone = completedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                          isDone ? 'bg-slate-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <button
                          onClick={() => toggleDone(item.id)}
                          className="mt-0.5 flex-shrink-0"
                          title={isDone ? 'Mark as pending' : 'Mark as done'}
                        >
                          {isDone ? (
                            <CheckCircle2 size={18} className="text-emerald-500" />
                          ) : (
                            <Circle size={18} className="text-slate-300" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium text-sm ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}
                            >
                              {item.activity}
                            </span>
                          </div>
                          {item.description && (
                            <p
                              className={`text-xs mt-0.5 ${isDone ? 'text-slate-300' : 'text-slate-500'}`}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.time && (
                          <span
                            className={`text-xs font-medium flex-shrink-0 px-2 py-0.5 rounded ${
                              isDone ? 'text-slate-300 bg-slate-100' : 'text-slate-600 bg-slate-100'
                            }`}
                          >
                            {formatTime(item.time)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Info sections: Feeding, Sleep, Medical, Emergency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Feeding Schedule */}
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <UtensilsCrossed size={16} className="text-amber-500" /> Feeding Schedule
          </h3>
          {(routineInfo?.feeding_schedule?.meal_times?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {(routineInfo!.feeding_schedule.meal_times as string[]).map((t: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                    {formatTime(t)}
                  </span>
                  <span className="text-slate-600">
                    {['Breakfast', 'Lunch', 'Dinner', 'Snack'][i] || `Meal ${i + 1}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Not set</p>
          )}
        </Card>

        {/* Sleep Routine */}
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <BedDouble size={16} className="text-indigo-500" /> Sleep Routine
          </h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-slate-500">Bedtime:</span>{' '}
              {routineInfo?.sleep_schedule?.bedtime ? formatTime(routineInfo.sleep_schedule.bedtime) : 'Not set'}
            </p>
            <p>
              <span className="text-slate-500">Wake time:</span>{' '}
              {routineInfo?.sleep_schedule?.wake_time ? formatTime(routineInfo.sleep_schedule.wake_time) : 'Not set'}
            </p>
            {(routineInfo?.sleep_schedule?.nap_times?.length ?? 0) > 0 && (
              <p>
                <span className="text-slate-500">Naps:</span>{' '}
                {(routineInfo!.sleep_schedule.nap_times as string[]).map((t: string) => formatTime(t)).join(', ')}
              </p>
            )}
            {(routineInfo?.comfort_methods?.length ?? 0) > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <span className="text-slate-500">Comfort:</span>{' '}
                <span className="text-slate-600">{routineInfo!.comfort_methods.join(', ')}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Medical Instructions */}
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Stethoscope size={16} className="text-rose-500" /> Medical Instructions
          </h3>
          {healthInfo ? (
            <div className="space-y-2 text-sm">
              {healthInfo.medications?.length > 0 && (
                <div>
                  <span className="text-slate-500">Medications:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {healthInfo.medications.map((m, i) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {healthInfo.dietary_restrictions?.length > 0 && (
                <div>
                  <span className="text-slate-500">Dietary:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {healthInfo.dietary_restrictions.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {!healthInfo.medications?.length && !healthInfo.dietary_restrictions?.length && (
                <p className="text-slate-400">No medical instructions</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No health info recorded</p>
          )}
        </Card>

        {/* Emergency Contacts */}
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Phone size={16} className="text-red-500" /> Emergency Contacts
          </h3>
          {(healthInfo?.emergency_contacts?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {healthInfo!.emergency_contacts.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-slate-700">{c.name}</span>
                    <span className="text-slate-400 ml-1">({c.relation})</span>
                    {c.is_primary && (
                      <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <a href={`tel:${c.phone}`} className="text-emerald-600 font-medium text-xs">
                    {c.phone}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No emergency contacts</p>
          )}
        </Card>
      </div>

      {/* Special Instructions */}
      {routineInfo?.special_instructions && (
        <Card className="p-5 border-emerald-100 bg-emerald-50/30">
          <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
            <StickyNote size={16} className="text-emerald-500" /> Special Instructions
          </h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{routineInfo.special_instructions}</p>
        </Card>
      )}

      {/* Triggers */}
      {(routineInfo?.triggers?.length ?? 0) > 0 && (
        <Card className="p-5 border-rose-100 bg-rose-50/30">
          <h3 className="font-semibold text-rose-900 mb-2">Triggers to Watch For</h3>
          <div className="flex flex-wrap gap-2">
            {routineInfo!.triggers.map((t, i) => (
              <span key={i} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm">
                {t}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* ===== NOTES SECTION (at the bottom, per George's request) ===== */}
      <div className="pt-2">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <StickyNote size={16} className="text-emerald-500" /> Daily Notes
          </h3>

          {/* Add new note */}
          <div className="mb-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note for today... (e.g., 'Didn't nap well, may be cranky this afternoon')"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <Button
                onClick={handleSaveNote}
                disabled={savingNote || !newNote.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 text-sm"
              >
                {savingNote ? (
                  'Saving...'
                ) : (
                  <>
                    <Plus size={14} className="mr-1" /> Add Note
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Recent notes */}
          {notes.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Recent Notes</h4>
              {notes.map((note) => (
                <div key={note.id} className="p-3 bg-slate-50 rounded-lg group">
                  {editingNoteId === note.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveEditNote(note.id)} className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-700">
                          <Save size={12} /> Save
                        </button>
                        <button onClick={() => setEditingNoteId(null)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400">
                          {new Date(note.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                          })}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.content); }} className="text-xs text-slate-400 hover:text-emerald-600 flex items-center gap-1">
                            <Edit2 size={11} /> Edit
                          </button>
                          <button onClick={() => deleteNote(note.id)} className="text-xs text-slate-300 hover:text-rose-500">
                            Remove
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-2">
              No notes yet. Add your first note above.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
