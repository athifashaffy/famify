import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChildProfile, ChildHealthInfo } from '../../lib/types';
import { Card } from '../ui/card';
import { AlertTriangle, Phone, Utensils, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  child: ChildProfile;
  childId: string;
}

export function OverviewTab({ child, childId }: Props) {
  const [health, setHealth] = useState<ChildHealthInfo | null>(null);

  useEffect(() => {
    fetchHealth();
  }, [childId]);

  const fetchHealth = async () => {
    const { data } = await supabase
      .from('child_health_info').select('*').eq('child_id', childId).single();
    if (data) setHealth(data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Basic Info */}
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Basic Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Name</span>
            <span className="font-medium">{child.name || 'Not set'}</span>
          </div>
          {child.date_of_birth && (
            <div className="flex justify-between">
              <span className="text-slate-500">Date of Birth</span>
              <span className="font-medium">{format(new Date(child.date_of_birth), 'MMM d, yyyy')}</span>
            </div>
          )}
          {(child as any).gender && (
            <div className="flex justify-between">
              <span className="text-slate-500">Gender</span>
              <span className="font-medium">{(child as any).gender}</span>
            </div>
          )}
          {child.likes && (
            <div className="flex justify-between">
              <span className="text-slate-500">Likes</span>
              <span className="font-medium text-right max-w-[60%]">{child.likes}</span>
            </div>
          )}
          {child.dislikes && (
            <div className="flex justify-between">
              <span className="text-slate-500">Dislikes</span>
              <span className="font-medium text-right max-w-[60%]">{child.dislikes}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Emergency Contacts */}
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Phone size={16} className="text-rose-500" /> Emergency Contacts
        </h3>
        {health?.emergency_contacts && health.emergency_contacts.length > 0 ? (
          <div className="space-y-2">
            {health.emergency_contacts.map((contact, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-xs text-slate-500">{contact.relation}</p>
                </div>
                <a href={`tel:${contact.phone}`} className="text-emerald-600 font-medium">{contact.phone}</a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No emergency contacts added. Add them in the Health tab.</p>
        )}
      </Card>

      {/* Allergies */}
      {child.allergies && child.allergies.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" /> Allergies
          </h3>
          <div className="flex flex-wrap gap-2">
            {child.allergies.map((a, i) => (
              <span key={i} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">{a}</span>
            ))}
          </div>
          {child.medical_notes && (
            <p className="text-sm text-slate-600 mt-3">{child.medical_notes}</p>
          )}
        </Card>
      )}

      {/* Food Preferences */}
      {child.food_preferences && child.food_preferences.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Utensils size={16} className="text-amber-500" /> Food Preferences
          </h3>
          <div className="flex flex-wrap gap-2">
            {child.food_preferences.map((f, i) => (
              <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">{f}</span>
            ))}
          </div>
        </Card>
      )}

      {/* Hobbies */}
      {child.hobbies && child.hobbies.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-sky-500" /> Hobbies & Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {child.hobbies.map((h, i) => (
              <span key={i} className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium">{h}</span>
            ))}
          </div>
        </Card>
      )}

      {/* Custom Notes */}
      {child.custom_notes && (
        <Card className="p-5 md:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
          <p className="text-sm text-slate-600">{child.custom_notes}</p>
        </Card>
      )}
    </div>
  );
}
