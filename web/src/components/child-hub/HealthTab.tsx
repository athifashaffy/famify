import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChildHealthInfo, EmergencyContact } from '../../lib/types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Save, Plus, Trash2 } from 'lucide-react';

interface Props {
  childId: string;
  familyId: string;
}

const IMMUNIZATION_OPTIONS = ['Up to date', 'Partial', 'Not started', 'Exemption', 'Unknown'];

export function HealthTab({ childId }: Props) {
  const [health, setHealth] = useState<ChildHealthInfo | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    medications: '',
    dietary_restrictions: '',
    pediatrician: '',
    immunization_status: '',
    emergency_contacts: [] as EmergencyContact[],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHealth();
  }, [childId]);

  const fetchHealth = async () => {
    const { data } = await supabase
      .from('child_health_info').select('*').eq('child_id', childId).single();
    if (data) {
      setHealth(data);
      setForm({
        medications: (data.medications || []).join(', '),
        dietary_restrictions: (data.dietary_restrictions || []).join(', '),
        pediatrician: data.pediatrician || '',
        immunization_status: data.immunization_status || '',
        emergency_contacts: data.emergency_contacts || [],
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      child_id: childId,
      medications: form.medications ? form.medications.split(',').map(s => s.trim()) : [],
      dietary_restrictions: form.dietary_restrictions ? form.dietary_restrictions.split(',').map(s => s.trim()) : [],
      pediatrician: form.pediatrician || null,
      immunization_status: form.immunization_status || null,
      emergency_contacts: form.emergency_contacts,
      updated_at: new Date().toISOString(),
    };

    if (health) {
      await supabase.from('child_health_info').update(payload).eq('id', health.id);
    } else {
      await supabase.from('child_health_info').insert(payload);
    }
    setEditing(false);
    setSaving(false);
    fetchHealth();
  };

  const addContact = () => {
    setForm({
      ...form,
      emergency_contacts: [...form.emergency_contacts, { name: '', relation: '', phone: '', is_primary: false }],
    });
  };

  const updateContact = (idx: number, field: keyof EmergencyContact, value: string | boolean) => {
    const contacts = [...form.emergency_contacts];
    contacts[idx] = { ...contacts[idx], [field]: value };
    setForm({ ...form, emergency_contacts: contacts });
  };

  const removeContact = (idx: number) => {
    setForm({ ...form, emergency_contacts: form.emergency_contacts.filter((_, i) => i !== idx) });
  };

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setEditing(true)} className="bg-emerald-500 hover:bg-emerald-600 text-sm">
            Edit Health Info
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Medications</h3>
            {health?.medications && health.medications.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {health.medications.map((m, i) => (
                  <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{m}</span>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">None recorded</p>}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Dietary Restrictions</h3>
            {health?.dietary_restrictions && health.dietary_restrictions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {health.dietary_restrictions.map((d, i) => (
                  <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">{d}</span>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">None recorded</p>}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Pediatrician</h3>
            <p className="text-sm">{health?.pediatrician || 'Not set'}</p>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Immunization Status</h3>
            <p className="text-sm">{health?.immunization_status || 'Not set'}</p>
          </Card>

          <Card className="p-5 md:col-span-2">
            <h3 className="font-semibold text-slate-900 mb-3">Emergency Contacts</h3>
            {health?.emergency_contacts && health.emergency_contacts.length > 0 ? (
              <div className="space-y-2">
                {health.emergency_contacts.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{c.name} <span className="text-slate-400">({c.relation})</span></p>
                      {c.is_primary && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Primary</span>}
                    </div>
                    <a href={`tel:${c.phone}`} className="text-emerald-600 text-sm font-medium">{c.phone}</a>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">No emergency contacts added</p>}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Edit Health Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Medications (comma separated)</label>
            <Input value={form.medications} onChange={(e) => setForm({ ...form, medications: e.target.value })} placeholder="e.g., Ventolin, EpiPen" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dietary Restrictions (comma separated)</label>
            <Input value={form.dietary_restrictions} onChange={(e) => setForm({ ...form, dietary_restrictions: e.target.value })} placeholder="e.g., Nut-free, Gluten-free" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pediatrician</label>
            <Input value={form.pediatrician} onChange={(e) => setForm({ ...form, pediatrician: e.target.value })} placeholder="Dr. name and clinic" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Immunization Status</label>
            <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={form.immunization_status} onChange={(e) => setForm({ ...form, immunization_status: e.target.value })}>
              <option value="">Select</option>
              {IMMUNIZATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Emergency Contacts</label>
              <button onClick={addContact} className="text-xs text-emerald-600 flex items-center gap-1"><Plus size={12} /> Add</button>
            </div>
            <div className="space-y-3">
              {form.emergency_contacts.map((contact, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Name" value={contact.name} onChange={(e) => updateContact(idx, 'name', e.target.value)} className="text-sm" />
                    <Input placeholder="Relation" value={contact.relation} onChange={(e) => updateContact(idx, 'relation', e.target.value)} className="text-sm" />
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Phone" value={contact.phone} onChange={(e) => updateContact(idx, 'phone', e.target.value)} className="text-sm flex-1" />
                    <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                      <input type="checkbox" checked={contact.is_primary} onChange={(e) => updateContact(idx, 'is_primary', e.target.checked)} className="rounded" />
                      Primary
                    </label>
                    <button onClick={() => removeContact(idx)} className="text-rose-400 hover:text-rose-600 p-1"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
              <Save size={16} className="mr-1" /> {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={() => setEditing(false)} className="bg-slate-200 text-slate-700 hover:bg-slate-300">Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
