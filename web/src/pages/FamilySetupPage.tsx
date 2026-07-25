import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { PENDING_INVITE_KEY } from '../lib/constants';

export function FamilySetupPage() {
  const [familyName, setFamilyName] = useState('');
  // Prefill from a shared invite link that was followed before registering
  const [inviteCode, setInviteCode] = useState(
    () => localStorage.getItem(PENDING_INVITE_KEY) || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { family, createFamily, joinFamily } = useFamily();
  const navigate = useNavigate();

  // If family exists, redirect to dashboard
  useEffect(() => {
    if (family) {
      console.log('✅ Family detected on setup page, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [family, navigate]);

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await createFamily(familyName);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      localStorage.removeItem(PENDING_INVITE_KEY);
      navigate('/dashboard');
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await joinFamily(inviteCode);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      localStorage.removeItem(PENDING_INVITE_KEY);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-600 mb-2">Welcome to Famify</h1>
          <p className="text-slate-600">Create a new family or join an existing one</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Family</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFamily} className="space-y-4">
                <div>
                  <label htmlFor="familyName" className="block text-sm font-medium text-slate-700 mb-1">
                    Family Name
                  </label>
                  <Input
                    id="familyName"
                    type="text"
                    placeholder="The Johnsons"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Family'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Join a Family</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinFamily} className="space-y-4">
                <div>
                  <label htmlFor="inviteCode" className="block text-sm font-medium text-slate-700 mb-1">
                    Invite Code
                  </label>
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="Enter 8-character code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                    maxLength={8}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Joining...' : 'Join Family'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="mt-4 text-sm text-rose-600 bg-rose-50 p-3 rounded-md text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
