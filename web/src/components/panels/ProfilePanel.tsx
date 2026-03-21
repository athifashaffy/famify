import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFamily } from '../../context/FamilyContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChildProfile } from '../../lib/types';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Save, Baby, User, MapPin, Heart, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

const PARENTING_STAGES = [
  'Expecting', 'Newborn (0-3 months)', 'Infant (3-12 months)',
  'Toddler (1-3 years)', 'Preschool (3-5 years)', 'School Age (5-12 years)',
  'Teenager (13-18 years)', 'Multiple Ages',
];

const GENDERS = ['Boy', 'Girl', 'Non-binary', 'Prefer not to say'];

interface MemberProfile {
  id: string;
  name: string | null;
  role: string | null;
  location?: string | null;
  bio?: string | null;
  parenting_stage?: string | null;
}

export function ProfilePanel() {
  const { user, profile, logout } = useAuth();
  const { family, members } = useFamily();
  const navigate = useNavigate();

  // Which member profile is being edited
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({ name: '', location: '', bio: '', parenting_stage: '' });
  const [memberProfiles, setMemberProfiles] = useState<MemberProfile[]>([]);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // Child profiles
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [childForm, setChildForm] = useState({
    name: '', gender: '', date_of_birth: '', allergies: '', medical_notes: '',
    food_preferences: '', hobbies: '', likes: '', dislikes: '', custom_notes: '',
  });

  useEffect(() => {
    if (family) {
      fetchChildren();
      fetchMemberProfiles();
    }
  }, [family, members]);

  const fetchMemberProfiles = async () => {
    if (!members || members.length === 0) return;
    const userIds = members.map((m: any) => m.user_id || m.id);
    const { data } = await supabase.from('profiles').select('id, name, role, location, bio, parenting_stage').in('id', userIds);
    if (data) setMemberProfiles(data);
  };

  const fetchChildren = async () => {
    if (!family) return;
    const { data } = await supabase
      .from('child_profiles').select('*').eq('family_id', family.id).order('created_at');
    if (data) setChildren(data);
  };

  const handleSaveMember = async (memberId: string) => {
    await supabase.from('profiles').update({
      name: memberForm.name,
      location: memberForm.location,
      bio: memberForm.bio,
      parenting_stage: memberForm.parenting_stage,
      updated_at: new Date().toISOString(),
    }).eq('id', memberId);
    setEditingMemberId(null);
    fetchMemberProfiles();
    if (memberId === user?.id) window.location.reload();
  };

  const startEditMember = (member: MemberProfile) => {
    setEditingMemberId(member.id);
    setMemberForm({
      name: member.name || '',
      location: member.location || '',
      bio: member.bio || '',
      parenting_stage: member.parenting_stage || '',
    });
  };

  const handleAddChild = async () => {
    if (!family || !user) return;
    await supabase.from('child_profiles').insert({
      family_id: family.id, parent_id: user.id, name: childForm.name,
      gender: childForm.gender || null,
      date_of_birth: childForm.date_of_birth || null,
      allergies: childForm.allergies ? childForm.allergies.split(',').map(s => s.trim()) : [],
      medical_notes: childForm.medical_notes || null,
      food_preferences: childForm.food_preferences ? childForm.food_preferences.split(',').map(s => s.trim()) : [],
      hobbies: childForm.hobbies ? childForm.hobbies.split(',').map(s => s.trim()) : [],
      likes: childForm.likes || null, dislikes: childForm.dislikes || null,
      custom_notes: childForm.custom_notes || null,
    });
    resetChildForm(); setShowAddChild(false); fetchChildren();
  };

  const handleUpdateChild = async (childId: string) => {
    await supabase.from('child_profiles').update({
      name: childForm.name,
      gender: childForm.gender || null,
      date_of_birth: childForm.date_of_birth || null,
      allergies: childForm.allergies ? childForm.allergies.split(',').map(s => s.trim()) : [],
      medical_notes: childForm.medical_notes || null,
      food_preferences: childForm.food_preferences ? childForm.food_preferences.split(',').map(s => s.trim()) : [],
      hobbies: childForm.hobbies ? childForm.hobbies.split(',').map(s => s.trim()) : [],
      likes: childForm.likes || null, dislikes: childForm.dislikes || null,
      custom_notes: childForm.custom_notes || null,
    }).eq('id', childId);
    setEditingChildId(null); resetChildForm(); fetchChildren();
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm('Remove this child profile?')) return;
    await supabase.from('child_profiles').delete().eq('id', childId);
    fetchChildren();
  };

  const startEditChild = (child: ChildProfile) => {
    setEditingChildId(child.id);
    setChildForm({
      name: child.name || '', gender: (child as any).gender || '',
      date_of_birth: child.date_of_birth || '',
      allergies: (child.allergies || []).join(', '), medical_notes: child.medical_notes || '',
      food_preferences: (child.food_preferences || []).join(', '),
      hobbies: (child.hobbies || []).join(', '),
      likes: child.likes || '', dislikes: child.dislikes || '', custom_notes: child.custom_notes || '',
    });
  };

  const resetChildForm = () => {
    setChildForm({
      name: '', gender: '', date_of_birth: '', allergies: '', medical_notes: '',
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

  const getMemberProfile = (userId: string) => memberProfiles.find(p => p.id === userId);

  const renderChildForm = (onSubmit: () => void, submitLabel: string) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Name *</label>
          <Input required value={childForm.name} onChange={(e) => setChildForm({ ...childForm, name: e.target.value })} placeholder="Child's name" className="text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
          <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={childForm.gender} onChange={(e) => setChildForm({ ...childForm, gender: e.target.value })}>
            <option value="">Select</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth</label>
        <Input type="date" value={childForm.date_of_birth} onChange={(e) => setChildForm({ ...childForm, date_of_birth: e.target.value })} className="text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Allergies (comma separated)</label>
        <Input value={childForm.allergies} onChange={(e) => setChildForm({ ...childForm, allergies: e.target.value })} placeholder="e.g., Peanuts, Dairy" className="text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Medical Notes</label>
        <textarea className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={childForm.medical_notes} onChange={(e) => setChildForm({ ...childForm, medical_notes: e.target.value })} placeholder="Medical conditions, medications" rows={2} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Food Preferences</label>
        <Input value={childForm.food_preferences} onChange={(e) => setChildForm({ ...childForm, food_preferences: e.target.value })} placeholder="e.g., Pasta, No spicy" className="text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Hobbies</label>
        <Input value={childForm.hobbies} onChange={(e) => setChildForm({ ...childForm, hobbies: e.target.value })} placeholder="e.g., Soccer, Drawing" className="text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Likes</label>
          <Input value={childForm.likes} onChange={(e) => setChildForm({ ...childForm, likes: e.target.value })} className="text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Dislikes</label>
          <Input value={childForm.dislikes} onChange={(e) => setChildForm({ ...childForm, dislikes: e.target.value })} className="text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
        <textarea className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={childForm.custom_notes} onChange={(e) => setChildForm({ ...childForm, custom_notes: e.target.value })} rows={2} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={onSubmit} className="bg-emerald-500 hover:bg-emerald-600 text-sm">
          <Save size={14} className="mr-1" /> {submitLabel}
        </Button>
        <Button onClick={() => { setShowAddChild(false); setEditingChildId(null); resetChildForm(); }} className="bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      {/* Family Members - each parent is editable */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <User size={16} className="text-emerald-600" /> Family Members
        </h3>

        {family && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Family</span>
              <span className="font-medium">{family.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-500">Invite Code</span>
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{family.invite_code}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {members.map((member: any) => {
            const memberId = member.user_id || member.id;
            const mp = getMemberProfile(memberId);
            const isExpanded = expandedMember === memberId;
            const isEditing = editingMemberId === memberId;
            const isCurrentUser = memberId === user?.id;

            return (
              <div key={member.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedMember(isExpanded ? null : memberId)}
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(mp?.name || member.name)?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-900">
                        {mp?.name || member.name}
                        {isCurrentUser && <span className="text-[10px] text-emerald-600 ml-1">(You)</span>}
                      </p>
                      <p className="text-[10px] text-slate-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </button>

                {isExpanded && !isEditing && (
                  <div className="px-3 pb-3 space-y-1.5">
                    {mp?.location && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin size={11} /> {mp.location}
                      </div>
                    )}
                    {mp?.parenting_stage && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Heart size={11} /> {mp.parenting_stage}
                      </div>
                    )}
                    {mp?.bio && <p className="text-xs text-slate-600">{mp.bio}</p>}
                    <button
                      onClick={() => startEditMember(mp || { id: memberId, name: member.name, role: member.role })}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mt-1"
                    >
                      <Edit2 size={11} /> Edit Profile
                    </button>
                  </div>
                )}

                {isExpanded && isEditing && (
                  <div className="px-3 pb-3 space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                      <Input value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} className="text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                      <Input value={memberForm.location} onChange={(e) => setMemberForm({ ...memberForm, location: e.target.value })} placeholder="e.g., Sudbury, ON" className="text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Parenting Stage</label>
                      <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={memberForm.parenting_stage} onChange={(e) => setMemberForm({ ...memberForm, parenting_stage: e.target.value })}>
                        <option value="">Select stage</option>
                        {PARENTING_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Bio</label>
                      <textarea className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={memberForm.bio} onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })} rows={2} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleSaveMember(memberId)} className="bg-emerald-500 hover:bg-emerald-600 text-sm">
                        <Save size={14} className="mr-1" /> Save
                      </Button>
                      <Button onClick={() => setEditingMemberId(null)} className="bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Children */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
            <Baby size={16} className="text-emerald-600" /> Children ({children.length})
          </h3>
          {!showAddChild && !editingChildId && (
            <button onClick={() => { setShowAddChild(true); resetChildForm(); }} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              <Plus size={12} /> Add
            </button>
          )}
        </div>

        {showAddChild && (
          <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <h4 className="text-xs font-semibold text-slate-800 mb-2">Add New Child</h4>
            {renderChildForm(handleAddChild, 'Add Child')}
          </div>
        )}

        <div className="space-y-3">
          {children.map((child) => (
            <div key={child.id} className="border border-slate-200 rounded-lg p-3">
              {editingChildId === child.id ? (
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 mb-2">Edit Child</h4>
                  {renderChildForm(() => handleUpdateChild(child.id), 'Save')}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-sky-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {child.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">{child.name || 'Unnamed'}</p>
                        <p className="text-[11px] text-slate-500">
                          {(child as any).gender && <span>{(child as any).gender} &middot; </span>}
                          {child.date_of_birth && (
                            <span>{getChildAge(child.date_of_birth)} &middot; {format(new Date(child.date_of_birth), 'MMM d, yyyy')}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => startEditChild(child)} className="text-slate-400 hover:text-emerald-600 p-1">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDeleteChild(child.id)} className="text-slate-400 hover:text-rose-600 p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {child.allergies && child.allergies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {child.allergies.map((a, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px]">{a}</span>
                        ))}
                      </div>
                    )}
                    {child.medical_notes && (
                      <p className="text-slate-600"><span className="font-medium text-slate-500">Medical:</span> {child.medical_notes}</p>
                    )}
                    {child.food_preferences && child.food_preferences.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {child.food_preferences.map((f, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px]">{f}</span>
                        ))}
                      </div>
                    )}
                    {child.hobbies && child.hobbies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {child.hobbies.map((h, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded-full text-[10px]">{h}</span>
                        ))}
                      </div>
                    )}
                    {child.likes && <p className="text-slate-600"><span className="font-medium text-slate-500">Likes:</span> {child.likes}</p>}
                    {child.dislikes && <p className="text-slate-600"><span className="font-medium text-slate-500">Dislikes:</span> {child.dislikes}</p>}
                    {child.custom_notes && <p className="text-slate-600 italic">{child.custom_notes}</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
          {children.length === 0 && !showAddChild && (
            <p className="text-center text-slate-400 py-3 text-xs">No children added yet.</p>
          )}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
      >
        <LogOut size={16} /> Log Out
      </button>
    </div>
  );
}
