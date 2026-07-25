import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';
import { PENDING_INVITE_KEY } from '../lib/constants';

/**
 * Landing point for shared invite links (famify.co/join/<code>).
 * Logged-in users join immediately; visitors are sent through
 * registration with the code carried along automatically.
 */
export function JoinFamilyPage() {
  const { code } = useParams<{ code: string }>();
  const { session, loading: authLoading } = useAuth();
  const { joinFamily, refreshFamily } = useFamily();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (authLoading || !code || started.current) return;
    started.current = true;

    if (!session) {
      localStorage.setItem(PENDING_INVITE_KEY, code);
      navigate('/register', { replace: true });
      return;
    }

    (async () => {
      const { error } = await joinFamily(code);
      if (!error || /duplicate|unique/i.test(error.message)) {
        // Joined, or already a member of this family
        localStorage.removeItem(PENDING_INVITE_KEY);
        await refreshFamily();
        navigate('/dashboard', { replace: true });
      } else {
        setError("This invite link doesn't seem to be valid anymore.");
      }
    })();
  }, [authLoading, session, code, joinFamily, refreshFamily, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
        <img src="/logo.svg" alt="Famify logo" className="w-16 h-16 mx-auto mb-4" />
        {error ? (
          <>
            <h1 className="text-xl font-display font-bold text-slate-800">Invite not valid</h1>
            <p className="mt-2 text-slate-600">{error}</p>
            <Link to="/" className="mt-6 inline-block text-emerald-600 font-medium hover:underline">
              Go to Famify
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-display font-bold text-slate-800">Joining family...</h1>
            <p className="mt-2 text-slate-600">One moment while we set things up.</p>
          </>
        )}
      </div>
    </div>
  );
}
