import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

export function ProfilePage() {
  const { profile, logout } = useAuth();
  const { family, members } = useFamily();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Profile</h1>

      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">User Information</h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-slate-500">Name:</span>
              <p className="font-medium">{profile?.name || 'Not set'}</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Role:</span>
              <p className="font-medium capitalize">{profile?.role || 'parent'}</p>
            </div>
          </div>
        </Card>

        {family && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Family Information</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-slate-500">Family Name:</span>
                <p className="font-medium">{family.name}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">Invite Code:</span>
                <p className="font-mono bg-slate-100 px-3 py-2 rounded inline-block">
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

        <Button onClick={handleLogout} variant="outline" className="w-full">
          Log Out
        </Button>
      </div>
    </div>
  );
}
