import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Shield, Lock, AlertTriangle, Eye, Heart, Moon, Utensils, Phone } from 'lucide-react';

interface ShareData {
  child: any;
  health: any;
  routine: any;
  watermark_note: string | null;
  expires_at: string;
  views_remaining: number;
}

export function SecureSharePage() {
  const { token } = useParams<{ token: string }>();
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ShareData | null>(null);

  const handleAccess = async () => {
    if (!token || !accessCode) return;
    setLoading(true);
    setError(null);

    const { data: result, error: rpcErr } = await supabase.rpc('access_child_share', {
      p_token: token,
      p_access_code: accessCode,
      p_user_agent: navigator.userAgent,
    });

    setLoading(false);

    if (rpcErr) {
      setError('Unable to access share. Please try again.');
      return;
    }

    if (result?.error) {
      setError(result.error);
      return;
    }

    setData(result);
  };

  // Pre-access: show code input
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Famify Secure Share</h1>
            <p className="text-sm text-slate-500 mt-1">Enter the access code to view child information</p>
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
              <Lock size={16} /> This link is encrypted and view-limited
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Access Code</label>
                <Input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="text-center text-lg tracking-widest font-mono"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">
                  <AlertTriangle size={16} /> {error}
                </div>
              )}

              <Button
                onClick={handleAccess}
                disabled={loading || accessCode.length < 6}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                {loading ? 'Verifying...' : 'Access Information'}
              </Button>
            </div>
          </Card>

          <p className="text-center text-xs text-slate-400 mt-4">
            Powered by Famify Family Management
          </p>
        </div>
      </div>
    );
  }

  // Post-access: show child data
  const { child, health, routine, watermark_note, views_remaining } = data;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Watermark Banner */}
      <div className="sticky top-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-2">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <Shield size={14} />
            <span className="font-medium">{watermark_note || 'Private Information'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <Eye size={12} /> {views_remaining} view{views_remaining !== 1 ? 's' : ''} remaining
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-sky-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {child?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{child?.name || 'Child'}</h1>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                {child?.gender && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">{child.gender}</span>}
                {child?.date_of_birth && <span>DOB: {child.date_of_birth}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Allergies */}
          {child?.allergies?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-500" /> Allergies
              </h3>
              <div className="flex flex-wrap gap-2">
                {child.allergies.map((a: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">{a}</span>
                ))}
              </div>
              {child.medical_notes && <p className="text-sm text-slate-600 mt-2">{child.medical_notes}</p>}
            </Card>
          )}

          {/* Health */}
          {health && health.id && (
            <>
              {health.medications?.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Heart size={16} className="text-purple-500" /> Medications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {health.medications.map((m: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{m}</span>
                    ))}
                  </div>
                </Card>
              )}

              {health.dietary_restrictions?.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Utensils size={16} className="text-amber-500" /> Dietary Restrictions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {health.dietary_restrictions.map((d: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">{d}</span>
                    ))}
                  </div>
                </Card>
              )}

              {health.emergency_contacts?.length > 0 && (
                <Card className="p-5 md:col-span-2">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Phone size={16} className="text-rose-500" /> Emergency Contacts
                  </h3>
                  <div className="space-y-2">
                    {health.emergency_contacts.map((c: any, i: number) => (
                      <div key={i} className="flex justify-between p-2 bg-slate-50 rounded-lg text-sm">
                        <span className="font-medium">{c.name} ({c.relation})</span>
                        <span className="text-emerald-600">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Routine */}
          {routine && routine.id && (
            <>
              {(routine.sleep_schedule?.bedtime || routine.sleep_schedule?.wake_time) && (
                <Card className="p-5">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Moon size={16} className="text-indigo-500" /> Sleep Schedule
                  </h3>
                  <div className="space-y-1 text-sm">
                    {routine.sleep_schedule.bedtime && <p>Bedtime: {routine.sleep_schedule.bedtime}</p>}
                    {routine.sleep_schedule.wake_time && <p>Wake: {routine.sleep_schedule.wake_time}</p>}
                    {routine.sleep_schedule.nap_times?.length > 0 && <p>Naps: {routine.sleep_schedule.nap_times.join(', ')}</p>}
                  </div>
                </Card>
              )}

              {routine.comfort_methods?.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-semibold text-slate-900 mb-3">Comfort Methods</h3>
                  <div className="flex flex-wrap gap-2">
                    {routine.comfort_methods.map((m: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm">{m}</span>
                    ))}
                  </div>
                </Card>
              )}

              {routine.triggers?.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-semibold text-slate-900 mb-3">Triggers</h3>
                  <div className="flex flex-wrap gap-2">
                    {routine.triggers.map((t: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm">{t}</span>
                    ))}
                  </div>
                </Card>
              )}

              {routine.special_instructions && (
                <Card className="p-5 md:col-span-2">
                  <h3 className="font-semibold text-slate-900 mb-2">Special Instructions</h3>
                  <p className="text-sm text-slate-600">{routine.special_instructions}</p>
                </Card>
              )}
            </>
          )}

          {/* Food Preferences */}
          {child?.food_preferences?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Food Preferences</h3>
              <div className="flex flex-wrap gap-2">
                {child.food_preferences.map((f: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">{f}</span>
                ))}
              </div>
            </Card>
          )}

          {/* Likes/Dislikes */}
          {(child?.likes || child?.dislikes) && (
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Preferences</h3>
              <div className="space-y-2 text-sm">
                {child.likes && <p><span className="text-slate-500">Likes:</span> {child.likes}</p>}
                {child.dislikes && <p><span className="text-slate-500">Dislikes:</span> {child.dislikes}</p>}
              </div>
            </Card>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8 mb-4">
          Shared securely via Famify &middot; This information is confidential
        </p>
      </div>
    </div>
  );
}
