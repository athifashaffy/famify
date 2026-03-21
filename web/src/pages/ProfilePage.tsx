import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ChildProfile } from '../lib/types';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Save, Baby, User, MapPin, Heart } from 'lucide-react';
import { format } from 'date-fns';

const PARENTING_STAGES = [
  'Expecting',
  'Newborn (0-3 months)',
  'Infant (3-12 months)',
  'Toddler (1-3 years)',
  'Preschool (3-5 years)',
  'School Age (5-12 years)',
  'Teenager (13-18 years)',
  'Multiple Ages',
];

export function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const { family, members } = useFamily();
  const navigate = useNavigate();

  // Parent profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    location: '',
    bio: '',
    parenting_stage: '',
  });

  // Child profiles
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [childForm, setChildForm] = useState({
    name: '',
    date_of_birth: '',
    allergies: '',
    medical_notes: '',
    food_preferences: '',
    hobbies: '',
    likes: '',
    dislikes: '',
    custom_notes: '',
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        location: (profile as any).location || '',
        bio: (profile as any).bio || '',
        parenting_stage: (profile as any).parenting_stage || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (family) {
      fetchChildren();
    }
  }, [family]);

  const fetchChildren = async () => {
    if (!family) return;
    const { data } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at');
    if (data) setChildren(data);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({
        name: profileForm.name,
        location: profileForm.location,
        bio: profileForm.bio,
        parenting_stage: profileForm.parenting_stage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    setEditingProfile(false);
    window.location.reload();
  };

  const handleAddChild = async () => {
    if (!family || !user) return;
    await supabase.from('child_profiles').insert({
      family_id: family.id,
      parent_id: user.id,
      name: childForm.name,
      date_of_birth: childForm.date_of_birth || null,
      allergies: childForm.allergies ? childForm.allergies.split(',').map(s => s.trim()) : [],
      medical_notes: childForm.medical_notes || null,
      food_preferences: childForm.food_preferences ? childForm.food_preferences.split(',').map(s => s.trim()) : [],
      hobbies: childForm.hobbies ? childForm.hobbies.split(',').map(s => s.trim()) : [],
      likes: childForm.likes || null,
      dislikes: childForm.dislikes || null,
      custom_notes: childForm.custom_notes || null,
    });
    resetChildForm();
    setShowAddChild(false);
    fetchChildren();
  };

  const handleUpdateChild = async (childId: string) => {
    await supabase
      .from('child_profiles')
      .update({
        name: childForm.name,
        date_of_birth: childForm.date_of_birth || null,
        allergies: childForm.allergies ? childForm.allergies.split(',').map(s => s.trim()) : [],
        medical_notes: childForm.medical_notes || null,
        food_preferences: childForm.food_preferences ? childForm.food_preferences.split(',').map(s => s.trim()) : [],
        hobbies: childForm.hobbies ? childForm.hobbies.split(',').map(s => s.trim()) : [],
        likes: childForm.likes || null,
        dislikes: childForm.dislikes || null,
        custom_notes: childForm.custom_notes || null,
      })
      .eq('id', childId);
    setEditingChildId(null);
    resetChildForm();
    fetchChildren();
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm('Are you sure you want to remove this child profile?')) return;
    await supabase.from('child_profiles').delete().eq('id', childId);
    fetchChildren();
  };

  const startEditChild = (child: ChildProfile) => {
    setEditingChildId(child.id);
    setChildForm({
      name: child.name || '',
      date_of_birth: child.date_of_birth || '',
      allergies: (child.allergies || []).join(', '),
      medical_notes: child.medical_notes || '',
      food_preferences: (child.food_preferences || []).join(', '),
      hobbies: (child.hobbies || []).join(', '),
      likes: child.likes || '',
      dislikes: child.dislikes || '',
      custom_notes: child.custom_notes || '',
    });
  };

  const resetChildForm = () => {
    setChildForm({
      name: '', date_of_birth: '', allergies: '', medical_notes: '',
      food_preferences: '', hobbies: '', likes: '', dislikes: '', custom_notes: '',
    });
  };

  const getChildAge = (dob: string | null) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    if (years === 0) return `${months < 0 ? 12 + months : months} months`;
    return `${years} years old`;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderChildForm = (onSubmit: () => void, submitLabel: string) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
          <Input
            required
            value={childForm.name}
            onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
            placeholder="Child's name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
          <Input
            type="date"
            value={childForm.date_of_birth}
            onChange={(e) => setChildForm({ ...childForm, date_of_birth: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Allergies (comma separated)</label>
        <Input
          value={childForm.allergies}
          onChange={(e) => setChildForm({ ...childForm, allergies: e.target.value })}
          placeholder="e.g., Peanuts, Dairy, Gluten"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Medical Notes</label>
        <textarea
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          value={childForm.medical_notes}
          onChange={(e) => setChildForm({ ...childForm, medical_notes: e.target.value })}
          placeholder="Any medical conditions, medications, or special needs"
          rows={2}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Food Preferences (comma separated)</label>
        <Input
          value={childForm.food_preferences}
          onChange={(e) => setChildForm({ ...childForm, food_preferences: e.target.value })}
          placeholder="e.g., Vegetarian, No spicy food, Loves pasta"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Hobbies (comma separated)</label>
        <Input
          value={childForm.hobbies}
          onChange={(e) => setChildForm({ ...childForm, hobbies: e.target.value })}
          placeholder="e.g., Soccer, Drawing, Reading"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Likes</label>
          <Input
            value={childForm.likes}
            onChange={(e) => setChildForm({ ...childForm, likes: e.target.value })}
            placeholder="Things they love"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Dislikes</label>
          <Input
            value={childForm.dislikes}
            onChange={(e) => setChildForm({ ...childForm, dislikes: e.target.value })}
            placeholder="Things they don't like"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Custom Notes</label>
        <textarea
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          value={childForm.custom_notes}
          onChange={(e) => setChildForm({ ...childForm, custom_notes: e.target.value })}
          placeholder="Any additional notes about your child"
          rows={2}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={onSubmit} className="bg-emerald-500 hover:bg-emerald-600">
          <Save size={16} className="mr-2" />
          {submitLabel}
        </Button>
        <Button
          onClick={() => { setShowAddChild(false); setEditingChildId(null); resetChildForm(); }}
          className="bg-slate-200 text-slate-700 hover:bg-slate-300"
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Profile</h1>

      <div className="space-y-6">
        {/* Parent Profile */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User size={20} className="text-emerald-600" />
              Parent Profile
            </h2>
            {!editingProfile && (
              <Button
                onClick={() => setEditingProfile(true)}
                variant="outline"
                className="text-sm"
              >
                <Edit2 size={14} className="mr-1" /> Edit
              </Button>
            )}
          </div>

          {editingProfile ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <Input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <Input
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  placeholder="e.g., Toronto, ON"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parenting Stage</label>
                <select
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={profileForm.parenting_stage}
                  onChange={(e) => setProfileForm({ ...profileForm, parenting_stage: e.target.value })}
                >
                  <option value="">Select stage</option>
                  {PARENTING_STAGES.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                <textarea
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Tell us about yourself and your family"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveProfile} className="bg-emerald-500 hover:bg-emerald-600">
                  <Save size={16} className="mr-2" /> Save Profile
                </Button>
                <Button
                  onClick={() => setEditingProfile(false)}
                  className="bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-xl font-semibold">{profile?.name || 'Not set'}</p>
                  <p className="text-sm text-slate-500 capitalize">{profile?.role || 'parent'}</p>
                </div>
              </div>
              {(profile as any)?.location && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={14} /> {(profile as any).location}
                </div>
              )}
              {(profile as any)?.parenting_stage && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Heart size={14} /> {(profile as any).parenting_stage}
                </div>
              )}
              {(profile as any)?.bio && (
                <p className="text-sm text-slate-600 mt-2">{(profile as any).bio}</p>
              )}
            </div>
          )}
        </Card>

        {/* Family Info */}
        {family && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Family Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-slate-500">Family Name:</span>
                <p className="font-medium">{family.name}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">Invite Code:</span>
                <p className="font-mono bg-slate-100 px-3 py-2 rounded inline-block text-sm">
                  {family.invite_code}
                </p>
              </div>
              <div>
                <span className="text-sm text-slate-500 block mb-2">Members ({members.length}):</span>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-medium">
                        {member.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Children Profiles */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Baby size={20} className="text-emerald-600" />
              Children ({children.length})
            </h2>
            {!showAddChild && !editingChildId && (
              <Button
                onClick={() => { setShowAddChild(true); resetChildForm(); }}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                <Plus size={16} className="mr-2" /> Add Child
              </Button>
            )}
          </div>

          {/* Add Child Form */}
          {showAddChild && (
            <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <h3 className="font-medium text-slate-900 mb-3">Add New Child</h3>
              {renderChildForm(handleAddChild, 'Add Child')}
            </div>
          )}

          {/* Children List */}
          <div className="space-y-4">
            {children.map((child) => (
              <div key={child.id} className="border rounded-lg p-4">
                {editingChildId === child.id ? (
                  <div>
                    <h3 className="font-medium text-slate-900 mb-3">Edit Child Profile</h3>
                    {renderChildForm(() => handleUpdateChild(child.id), 'Save Changes')}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                          {child.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{child.name || 'Unnamed'}</p>
                          {child.date_of_birth && (
                            <p className="text-sm text-slate-500">
                              {getChildAge(child.date_of_birth)} &middot; Born {format(new Date(child.date_of_birth), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditChild(child)} className="text-slate-400 hover:text-emerald-600">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteChild(child.id)} className="text-slate-400 hover:text-rose-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {child.allergies && child.allergies.length > 0 && (
                        <div>
                          <span className="text-slate-500 font-medium">Allergies:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {child.allergies.map((a, i) => (
                              <span key={i} className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs">{a}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {child.medical_notes && (
                        <div>
                          <span className="text-slate-500 font-medium">Medical:</span>
                          <p className="text-slate-700 mt-1">{child.medical_notes}</p>
                        </div>
                      )}
                      {child.food_preferences && child.food_preferences.length > 0 && (
                        <div>
                          <span className="text-slate-500 font-medium">Food Preferences:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {child.food_preferences.map((f, i) => (
                              <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">{f}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {child.hobbies && child.hobbies.length > 0 && (
                        <div>
                          <span className="text-slate-500 font-medium">Hobbies:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {child.hobbies.map((h, i) => (
                              <span key={i} className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs">{h}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {child.likes && (
                        <div>
                          <span className="text-slate-500 font-medium">Likes:</span>
                          <p className="text-slate-700 mt-1">{child.likes}</p>
                        </div>
                      )}
                      {child.dislikes && (
                        <div>
                          <span className="text-slate-500 font-medium">Dislikes:</span>
                          <p className="text-slate-700 mt-1">{child.dislikes}</p>
                        </div>
                      )}
                      {child.custom_notes && (
                        <div className="md:col-span-2">
                          <span className="text-slate-500 font-medium">Notes:</span>
                          <p className="text-slate-700 mt-1">{child.custom_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {children.length === 0 && !showAddChild && (
              <p className="text-center text-slate-500 py-4">
                No children added yet. Click "Add Child" to get started.
              </p>
            )}
          </div>
        </Card>

        <Button onClick={handleLogout} variant="outline" className="w-full">
          Log Out
        </Button>
      </div>
    </div>
  );
}
