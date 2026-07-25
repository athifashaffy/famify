import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase';
import { ChildProfile } from '../lib/types';
import { differenceInYears, differenceInMonths } from 'date-fns';
import { Baby, Plus, Users, X } from 'lucide-react';

export function ChildHubPage() {
  const { user } = useAuth();
  const { family } = useFamily();
  const navigate = useNavigate();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [addForm, setAddForm] = useState({ name: '', date_of_birth: '', gender: '' });

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || !user) return;
    if (!addForm.name.trim()) {
      setAddError('Please enter a name');
      return;
    }
    setSaving(true);
    setAddError('');
    const payload = {
      family_id: family.id,
      parent_id: user.id,
      name: addForm.name.trim(),
      date_of_birth: addForm.date_of_birth || null,
    };
    let { error } = await supabase
      .from('child_profiles')
      .insert({ ...payload, gender: addForm.gender || null });
    if (error && /gender/.test(error.message)) {
      // Migration 018 not applied yet — insert without the column
      ({ error } = await supabase.from('child_profiles').insert(payload));
    }
    setSaving(false);
    if (error) {
      setAddError(error.message);
      return;
    }
    setAddForm({ name: '', date_of_birth: '', gender: '' });
    setShowAddForm(false);
    fetchChildren();
  };

  useEffect(() => {
    if (family) {
      fetchChildren();
    }
  }, [family]);

  const fetchChildren = async () => {
    if (!family) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at');

    if (!error && data) {
      setChildren(data);
    }
    setLoading(false);
  };

  const getChildAge = (dob: string | null): string | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const years = differenceInYears(new Date(), birthDate);
    if (years < 1) {
      const months = differenceInMonths(new Date(), birthDate);
      return `${months} month${months !== 1 ? 's' : ''} old`;
    }
    return `${years} year${years !== 1 ? 's' : ''} old`;
  };

  const getInitial = (name: string | null): string => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Users size={28} className="text-emerald-500" />
            Child Hub
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your children's profiles, health, and routines
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-emerald-500 hover:bg-emerald-600 gap-2"
        >
          <Plus size={18} />
          Add Child
        </Button>
      </div>

      {/* Add Child form */}
      {showAddForm && (
        <Card className="p-5 mb-6" data-testid="add-child-form">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Add a Child</h2>
            <button
              type="button"
              title="Close"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleAddChild} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="child-name" className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <Input
                id="child-name"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="Child's name"
                required
              />
            </div>
            <div>
              <label htmlFor="child-dob" className="block text-sm font-medium text-slate-700 mb-1">
                Date of Birth
              </label>
              <Input
                id="child-dob"
                type="date"
                value={addForm.date_of_birth}
                onChange={(e) => setAddForm({ ...addForm, date_of_birth: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="child-gender" className="block text-sm font-medium text-slate-700 mb-1">
                Gender
              </label>
              <select
                id="child-gender"
                value={addForm.gender}
                onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Prefer not to say</option>
                <option value="girl">Girl</option>
                <option value="boy">Boy</option>
                <option value="other">Other</option>
              </select>
            </div>
            {addError && (
              <div className="sm:col-span-3 text-sm text-rose-600 bg-rose-50 p-3 rounded-md">
                {addError}
              </div>
            )}
            <div className="sm:col-span-3 flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add Child'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Children Grid */}
      {children.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <Baby size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">No children added yet</h2>
            <p className="text-slate-500 max-w-md">
              Add your children's profiles to keep track of their health records, routines, and important information all in one place.
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-emerald-500 hover:bg-emerald-600 gap-2 mt-2"
            >
              <Plus size={18} />
              Add Your First Child
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <Card
              key={child.id}
              className="p-5 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all"
              onClick={() => navigate(`/child-hub/${child.id}`)}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-sky-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {getInitial(child.name)}
                </div>

                {/* Name and Age */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 truncate">
                    {child.name || 'Unnamed Child'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {child.date_of_birth && (
                      <span className="text-sm text-slate-500">
                        {getChildAge(child.date_of_birth)}
                      </span>
                    )}
                    {child.gender && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium capitalize">
                        {child.gender}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {(child.allergies?.length > 0 || child.hobbies?.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {child.allergies?.map((allergy) => (
                    <span
                      key={allergy}
                      className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-medium"
                    >
                      {allergy}
                    </span>
                  ))}
                  {child.hobbies?.map((hobby) => (
                    <span
                      key={hobby}
                      className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs font-medium"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
