import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ChildProfile, ChildSecureShare, ChildShareAccessLog } from '../../lib/types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { format } from 'date-fns';
import { Link2, Copy, Shield, Eye, Clock, XCircle, Check } from 'lucide-react';

interface Props {
  childId: string;
  familyId: string;
  child: ChildProfile;
}

const EXPIRY_OPTIONS = [
  { label: '24 hours', hours: 24 },
  { label: '48 hours', hours: 48 },
  { label: '7 days', hours: 168 },
];

export function ShareTab({ childId, familyId, child }: Props) {
  const { user } = useAuth();
  const [shares, setShares] = useState<ChildSecureShare[]>([]);
  const [logs, setLogs] = useState<Record<string, ChildShareAccessLog[]>>({});
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({
    expiryHours: 24,
    maxViews: 3,
    watermarkNote: '',
  });

  useEffect(() => {
    fetchShares();
  }, [childId]);

  const fetchShares = async () => {
    const { data } = await supabase
      .from('child_secure_shares').select('*').eq('child_id', childId).order('created_at', { ascending: false });
    if (data) {
      setShares(data);
      // Fetch logs for each share
      const allLogs: Record<string, ChildShareAccessLog[]> = {};
      for (const share of data) {
        const { data: logData } = await supabase
          .from('child_share_access_logs').select('*').eq('share_id', share.id).order('accessed_at', { ascending: false });
        if (logData) allLogs[share.id] = logData;
      }
      setLogs(allLogs);
    }
  };

  const generateCode = () => {
    return Math.random().toString().slice(2, 8);
  };

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);

    const expiresAt = new Date(Date.now() + form.expiryHours * 60 * 60 * 1000).toISOString();
    const accessCode = generateCode();

    await supabase.from('child_secure_shares').insert({
      child_id: childId,
      family_id: familyId,
      created_by: user.id,
      access_code: accessCode,
      expires_at: expiresAt,
      max_views: form.maxViews,
      watermark_note: form.watermarkNote || `Private - ${child.name}'s Information`,
    });

    setCreating(false);
    setForm({ expiryHours: 24, maxViews: 3, watermarkNote: '' });
    fetchShares();
  };

  const handleRevoke = async (shareId: string) => {
    if (!confirm('Revoke this share link?')) return;
    await supabase.from('child_secure_shares').update({ is_revoked: true }).eq('id', shareId);
    fetchShares();
  };

  const copyLink = (share: ChildSecureShare) => {
    const url = `${window.location.origin}/share/${share.share_token}`;
    navigator.clipboard.writeText(url);
    setCopied(share.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getShareStatus = (share: ChildSecureShare) => {
    if (share.is_revoked) return { label: 'Revoked', color: 'bg-slate-100 text-slate-600' };
    if (new Date(share.expires_at) < new Date()) return { label: 'Expired', color: 'bg-amber-100 text-amber-700' };
    if (share.current_views >= share.max_views) return { label: 'Max Views', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Active', color: 'bg-emerald-100 text-emerald-700' };
  };

  return (
    <div className="space-y-4">
      {/* Create Share */}
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Shield size={16} className="text-emerald-500" /> Generate Secure Share Link
        </h3>
        <p className="text-xs text-slate-500 mb-4">Create a read-only, time-limited link to share {child.name}'s information.</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Expiry</label>
            <div className="flex gap-2">
              {EXPIRY_OPTIONS.map((opt) => (
                <button
                  key={opt.hours}
                  onClick={() => setForm({ ...form, expiryHours: opt.hours })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    form.expiryHours === opt.hours
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Max Views (default: 3)</label>
            <Input
              type="number" min={1} max={10}
              value={form.maxViews}
              onChange={(e) => setForm({ ...form, maxViews: parseInt(e.target.value) || 3 })}
              className="w-24 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Watermark Note (optional)</label>
            <Input
              value={form.watermarkNote}
              onChange={(e) => setForm({ ...form, watermarkNote: e.target.value })}
              placeholder={`Private - ${child.name}'s Information`}
              className="text-sm"
            />
          </div>

          <Button onClick={handleCreate} disabled={creating} className="bg-emerald-500 hover:bg-emerald-600">
            <Link2 size={16} className="mr-1" /> {creating ? 'Creating...' : 'Generate Secure Link'}
          </Button>
        </div>
      </Card>

      {/* Existing Shares */}
      {shares.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Share History</h3>
          <div className="space-y-3">
            {shares.map((share) => {
              const status = getShareStatus(share);
              const shareLogs = logs[share.id] || [];

              return (
                <div key={share.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        Created {format(new Date(share.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {status.label === 'Active' && (
                        <>
                          <button
                            onClick={() => copyLink(share)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Copy link & code"
                          >
                            {copied === share.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => handleRevoke(share.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Revoke"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Eye size={12} /> {share.current_views}/{share.max_views} views
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock size={12} /> Expires {format(new Date(share.expires_at), 'MMM d, h:mm a')}
                    </div>
                    <div className="text-slate-500">
                      Code: <span className="font-mono font-medium">{share.access_code}</span>
                    </div>
                  </div>

                  {/* Access Logs */}
                  {shareLogs.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 mb-1">Access Log</p>
                      {shareLogs.map((log) => (
                        <div key={log.id} className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{format(new Date(log.accessed_at), 'MMM d, h:mm a')}</span>
                          {log.user_agent && <span className="truncate max-w-[200px]">{log.user_agent.slice(0, 50)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
