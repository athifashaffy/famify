import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Users, Home, Baby, UserPlus, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminStats, AdminUserRow } from '../lib/types';

const STAT_TILES: { key: keyof AdminStats; label: string; icon: typeof Users }[] = [
  { key: 'total_users', label: 'Total users', icon: Users },
  { key: 'total_families', label: 'Families', icon: Home },
  { key: 'total_children', label: 'Children', icon: Baby },
  { key: 'new_users_7d', label: 'New users (7 days)', icon: UserPlus },
  { key: 'new_users_30d', label: 'New users (30 days)', icon: UserPlus },
  { key: 'active_users_7d', label: 'Active (7 days)', icon: Activity },
];

export function AdminPage() {
  const navigate = useNavigate();

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      const { data, error } = await supabase.rpc('admin_get_stats');
      if (error) throw error;
      return data as AdminStats;
    },
    retry: false,
  });

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<AdminUserRow[]> => {
      const { data, error } = await supabase.rpc('admin_list_users', {
        p_limit: 200,
        p_offset: 0,
      });
      if (error) throw error;
      return data as AdminUserRow[];
    },
    retry: false,
  });

  // Non-admins (or a DB without the migration) get a permission error — leave quietly
  useEffect(() => {
    if (statsQuery.isError) {
      navigate('/dashboard', { replace: true });
    }
  }, [statsQuery.isError, navigate]);

  if (statsQuery.isLoading) {
    return (
      <div className="p-6 text-slate-500" data-testid="admin-loading">
        Loading admin data...
      </div>
    );
  }

  if (!statsQuery.data) return null;

  const stats = statsQuery.data;

  return (
    <div className="p-6 space-y-8" data-testid="admin-page">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-800">Founder Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Registrations and activity across all Famify families. Read-only.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4" data-testid="admin-stats">
        {STAT_TILES.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-slate-500">
              <Icon className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <span className="text-3xl font-display font-bold text-slate-800">{stats[key]}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="font-display font-semibold text-slate-800">Registered users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="admin-users-table">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Family</th>
                <th className="px-4 py-2 font-medium">Signed up</th>
                <th className="px-4 py-2 font-medium">Last sign-in</th>
              </tr>
            </thead>
            <tbody>
              {(usersQuery.data ?? []).map((u) => (
                <tr key={u.id} className="border-b border-slate-50 text-slate-700">
                  <td className="px-4 py-2 font-medium">{u.name ?? '—'}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2 capitalize">{u.role ?? '—'}</td>
                  <td className="px-4 py-2">{u.family_name ?? '—'}</td>
                  <td className="px-4 py-2">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-2">
                    {u.last_sign_in_at
                      ? format(new Date(u.last_sign_in_at), 'MMM d, yyyy HH:mm')
                      : 'never'}
                  </td>
                </tr>
              ))}
              {usersQuery.data?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
