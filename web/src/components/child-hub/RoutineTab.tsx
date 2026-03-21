import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChildRoutineInfo, Routine } from '../../lib/types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Save, Moon, Sun, Coffee } from 'lucide-react';

interface Props {
  childId: string;
  familyId: string;
}

export function RoutineTab({ childId, familyId }: Props) {
  const [routineInfo, setRoutineInfo] = useState<ChildRoutineInfo | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bedtime: '',
    wake_time: '',
    nap_times: '',
    meal_times: '',
    comfort_methods: '',
    triggers: '',
    special_instructions: '',
  });

  useEffect(() => {
    fetchData();
  }, [childId]);

  const fetchData = async () => {
    const { data: info } = await supabase
      .from('child_routine_info').select('*').eq('child_id', childId).single();
    if (info) {
      setRoutineInfo(info);
      setForm({
        bedtime: info.sleep_schedule?.bedtime || '',
        wake_time: info.sleep_schedule?.wake_time || '',
        nap_times: (info.sleep_schedule?.nap_times || []).join(', '),
        meal_times: (info.feeding_schedule?.meal_times || []).join(', '),
        comfort_methods: (info.comfort_methods || []).join(', '),
        triggers: (info.triggers || []).join(', '),
        special_instructions: info.special_instructions || '',
      });
    }

    const { data: r } = await supabase
      .from('routines').select('*').eq('family_id', familyId).order('sort_order');
    if (r) setRoutines(r);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      child_id: childId,
      sleep_schedule: {
        bedtime: form.bedtime || null,
        wake_time: form.wake_time || null,
        nap_times: form.nap_times ? form.nap_times.split(',').map(s => s.trim()) : [],
      },
      feeding_schedule: {
        meal_times: form.meal_times ? form.meal_times.split(',').map(s => s.trim()) : [],
      },
      comfort_methods: form.comfort_methods ? form.comfort_methods.split(',').map(s => s.trim()) : [],
      triggers: form.triggers ? form.triggers.split(',').map(s => s.trim()) : [],
      special_instructions: form.special_instructions || null,
      updated_at: new Date().toISOString(),
    };

    if (routineInfo) {
      await supabase.from('child_routine_info').update(payload).eq('id', routineInfo.id);
    } else {
      await supabase.from('child_routine_info').insert(payload);
    }
    setEditing(false);
    setSaving(false);
    fetchData();
  };

  const getCategoryIcon = (cat: string) => {
    if (cat === 'morning') return <Sun size={14} className="text-amber-500" />;
    if (cat === 'bedtime') return <Moon size={14} className="text-indigo-500" />;
    return <Coffee size={14} className="text-emerald-500" />;
  };

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setEditing(true)} className="bg-emerald-500 hover:bg-emerald-600 text-sm">
            Edit Routine Info
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Moon size={16} className="text-indigo-500" /> Sleep Schedule
            </h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-slate-500">Bedtime:</span> {routineInfo?.sleep_schedule?.bedtime || 'Not set'}</p>
              <p><span className="text-slate-500">Wake time:</span> {routineInfo?.sleep_schedule?.wake_time || 'Not set'}</p>
              {routineInfo?.sleep_schedule?.nap_times?.length > 0 && (
                <p><span className="text-slate-500">Naps:</span> {routineInfo.sleep_schedule.nap_times.join(', ')}</p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Coffee size={16} className="text-amber-500" /> Feeding Schedule
            </h3>
            {routineInfo?.feeding_schedule?.meal_times?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {routineInfo.feeding_schedule.meal_times.map((t: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">{t}</span>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">Not set</p>}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Comfort Methods</h3>
            {routineInfo?.comfort_methods?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {routineInfo.comfort_methods.map((m, i) => (
                  <span key={i} className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm">{m}</span>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">None recorded</p>}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Triggers</h3>
            {routineInfo?.triggers?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {routineInfo.triggers.map((t, i) => (
                  <span key={i} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm">{t}</span>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">None recorded</p>}
          </Card>

          {routineInfo?.special_instructions && (
            <Card className="p-5 md:col-span-2">
              <h3 className="font-semibold text-slate-900 mb-2">Special Instructions</h3>
              <p className="text-sm text-slate-600">{routineInfo.special_instructions}</p>
            </Card>
          )}
        </div>

        {/* Family Routines */}
        {routines.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Family Routines</h3>
            <div className="space-y-2">
              {routines.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  {getCategoryIcon(r.category)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.title}</p>
                    {r.description && <p className="text-xs text-slate-500">{r.description}</p>}
                  </div>
                  {r.time_of_day && <span className="text-xs text-slate-400">{r.time_of_day}</span>}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-slate-900 mb-4">Edit Routine Information</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bedtime</label>
            <Input type="time" value={form.bedtime} onChange={(e) => setForm({ ...form, bedtime: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Wake Time</label>
            <Input type="time" value={form.wake_time} onChange={(e) => setForm({ ...form, wake_time: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nap Times (comma separated)</label>
          <Input value={form.nap_times} onChange={(e) => setForm({ ...form, nap_times: e.target.value })} placeholder="e.g., 13:00, 15:30" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Meal Times (comma separated)</label>
          <Input value={form.meal_times} onChange={(e) => setForm({ ...form, meal_times: e.target.value })} placeholder="e.g., 08:00, 12:00, 17:30" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Comfort Methods (comma separated)</label>
          <Input value={form.comfort_methods} onChange={(e) => setForm({ ...form, comfort_methods: e.target.value })} placeholder="e.g., Rocking, White noise, Stuffed bear" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Triggers (comma separated)</label>
          <Input value={form.triggers} onChange={(e) => setForm({ ...form, triggers: e.target.value })} placeholder="e.g., Loud noises, Dark rooms" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Special Instructions</label>
          <textarea className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={form.special_instructions} onChange={(e) => setForm({ ...form, special_instructions: e.target.value })} rows={3} placeholder="Any special care instructions..." />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
            <Save size={16} className="mr-1" /> {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={() => setEditing(false)} className="bg-slate-200 text-slate-700 hover:bg-slate-300">Cancel</Button>
        </div>
      </div>
    </Card>
  );
}
