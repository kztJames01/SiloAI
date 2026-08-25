import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orgApi } from '../lib/api';
import { useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';

export default function OrganizationDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [inviteUrl, setInviteUrl] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['org'],
    queryFn: async () => (await orgApi.get()).data,
  });

  const inviteMut = useMutation({
    mutationFn: () => orgApi.invite(email.trim(), role),
    onSuccess: (res) => {
      setInviteUrl(res.data.invite.url);
      setEmail('');
      qc.invalidateQueries({ queryKey: ['org'] });
      toast.success('Invite created. Copy the link and send it.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Could not invite'),
  });

  const transferMut = useMutation({
    mutationFn: (userId: string) => orgApi.transfer(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org'] });
      toast.success('Ownership transferred');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Transfer failed'),
  });

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading org...</div>;
  if (!data) return <div className="p-8">Could not load org</div>;

  const isOwner = data.me?.role === 'OWNER';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{data.org.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">Team members share workflows and run history.</p>
      </div>

      <div className="rounded-2xl border border-white/25 dark:border-white/10 bg-white/45 dark:bg-slate-900/45 backdrop-blur-xl p-5">
        <h2 className="font-semibold mb-3">Invite</h2>
        <div className="flex flex-wrap gap-2">
          <input
            className="flex-1 min-w-[200px] border border-border rounded-lg px-3 py-2 text-sm bg-background"
            placeholder="email@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
            <option value="FIELD">Field</option>
          </select>
          <button
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
            disabled={!email.includes('@') || inviteMut.isPending}
            onClick={() => inviteMut.mutate()}
          >
            Invite
          </button>
        </div>
        {inviteUrl ? (
          <p className="text-xs mt-3 break-all text-muted-foreground">
            Link (24h): {inviteUrl}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/25 dark:border-white/10 bg-white/45 dark:bg-slate-900/45 backdrop-blur-xl p-5">
        <h2 className="font-semibold mb-3">Members</h2>
        <div className="space-y-2">
          {data.members.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between text-sm border-b border-border/50 py-2">
              <div>
                <div className="font-medium">{m.user.name || m.user.email}</div>
                <div className="text-xs text-muted-foreground">{m.user.email} · {m.role}</div>
              </div>
              {isOwner && m.userId !== user?.id ? (
                <button
                  className="text-xs px-2 py-1 border border-border rounded-lg"
                  onClick={() => {
                    if (confirm(`Make ${m.user.email} the owner?`)) transferMut.mutate(m.userId);
                  }}
                >
                  Transfer owner
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
