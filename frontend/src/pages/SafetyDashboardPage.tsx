import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiKeyApi, executionApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useUiStore, useAuthStore, dbRoleToUi } from '../lib/store';
import { formatDate } from '../lib/utils';
import { Eye, EyeOff, Copy, Check, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

const statusClass: Record<string, string> = {
  Success: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-700',
  Running: 'bg-blue-100 text-blue-700',
};

const maskValue = (value: string, enabled: boolean) => {
  if (!enabled) {
    return value;
  }
  return value.replace(/[A-Za-z0-9]/g, '*');
};

export default function SafetyDashboardPage() {
  const queryClient = useQueryClient();
  const { isMaskingEnabled } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const roleLabel = dbRoleToUi(user?.role) === 'admin' ? 'Admin' : 'Field Worker';

  const { data: keyData } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await apiKeyApi.list();
      return res.data.keys || [];
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async () => apiKeyApi.create('Safety key'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      if (res.data.key?.secret) {
        setNewSecret(res.data.key.secret);
        toast.success('API key created — copy it now');
      }
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => apiKeyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('Key deleted');
    },
  });

  const { data } = useQuery({
    queryKey: ['safety-executions'],
    queryFn: async () => {
      const response = await executionApi.list();
      return response.data.executions;
    },
  });

  const trail = useMemo(() => {
    const executions = data || [];
    return executions.slice(0, 8).map((execution: any) => {
      const label =
        execution.status === 'FAILED'
          ? 'Failed'
          : execution.status === 'RUNNING'
          ? 'Running'
          : 'Success';

      return {
        id: execution.id,
        at: formatDate(execution.startedAt),
        actor: execution.workflow?.name || 'Workflow',
        action: execution.error || execution.status,
        status: label,
      };
    });
  }, [data]);

  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const copyKey = async (value: string, id: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
        <h1 className="text-3xl font-bold text-foreground">Safety & Governance</h1>
        <p className="text-muted-foreground mt-1">Audit trail and access controls</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trail.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit events yet</p>
            ) : (
              trail.map((item: { id: string; actor: string; action: string; status: string; at: string }) => (
                <div key={item.id} className="border border-border rounded-lg p-3 bg-muted/40">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{maskValue(item.actor, isMaskingEnabled)}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{maskValue(item.action, isMaskingEnabled)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.at}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Your account role: <span className="font-semibold text-foreground">{roleLabel}</span>
          </p>
          <p>Workflow authoring and agent management require an Admin account. Field accounts can run assigned workflows and submit field actions.</p>
          <p>Role changes are managed by your organization administrator in the database.</p>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>API Keys</CardTitle>
              <Button size="sm" onClick={() => createKeyMutation.mutate()} disabled={createKeyMutation.isPending}>
                <Plus className="h-4 w-4 mr-1" />
                New key
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {newSecret && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-800 mb-1">New key (shown once)</p>
                <code className="text-xs break-all">{newSecret}</code>
              </div>
            )}
            {(keyData || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No API keys yet</p>
            ) : (
              (keyData || []).map((key: any) => {
                const visible = showKeyId === key.id;
                return (
                  <div key={key.id} className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{key.name}</p>
                      <code className="text-xs font-mono text-muted-foreground">{visible ? key.prefix : '••••••••'}</code>
                    </div>
                    <button onClick={() => setShowKeyId(visible ? null : key.id)} className="p-1 text-muted-foreground">
                      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button onClick={() => copyKey(key.prefix, key.id)} className="p-1 text-muted-foreground">
                      {copiedKeyId === key.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button onClick={() => deleteKeyMutation.mutate(key.id)} className="p-1 text-muted-foreground hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
