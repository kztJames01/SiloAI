import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { orgApi } from '../lib/api';
import { useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!token) return;
    if (!isAuthenticated) return;
    orgApi.inviteInfo(token)
      .then((res) => setInfo(res.data))
      .catch((err: any) => setError(err?.response?.data?.error || 'Invite not found'));
  }, [token, isAuthenticated]);

  const accept = async () => {
    if (!token) return;
    setWorking(true);
    try {
      await orgApi.acceptInvite(token);
      toast.success('Joined workspace');
      navigate('/orgs');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not accept invite');
    } finally {
      setWorking(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-border p-6 space-y-3">
          <h1 className="text-xl font-bold">Org invite</h1>
          <p className="text-sm text-muted-foreground">Sign in with the invited email to join.</p>
          <Link className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm" to={`/login?next=/invite/${token}`}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-border p-6 space-y-3">
        <h1 className="text-xl font-bold">Join {info?.org?.name || 'workspace'}</h1>
        {error ? <p className="text-sm text-red-600">{error}</p> : (
          <p className="text-sm text-muted-foreground">
            Invited as {info?.role || '...'} for {info?.email}. Signed in as {user?.email}.
          </p>
        )}
        <button
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
          disabled={!!error || working}
          onClick={accept}
        >
          {working ? 'Joining...' : 'Accept invite'}
        </button>
      </div>
    </div>
  );
}
