import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiKeyApi, executionApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useUiStore } from '../lib/store';
import { formatDate } from '../lib/utils';
import { Eye, EyeOff, Copy, Check, UserCheck, UserX, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

const employees = [
  { id: '1', name: 'Ava Nurse' },
  { id: '2', name: 'Ben Field Lead' },
  { id: '3', name: 'Chris Admin' },
];

const statusClass: Record<string, string> = {
  Success: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-700',
  'Requires Human': 'bg-orange-100 text-orange-700',
};

const maskValue = (value: string, enabled: boolean) => {
  if (!enabled) {
    return value;
  }
  return value.replace(/[A-Za-z0-9]/g, '*');
};

type RequestStatus = 'pending' | 'approved' | 'rejected';
interface ConnectionRequest { id: string; name: string; email: string; status: RequestStatus; }

const INITIAL_REQUESTS: ConnectionRequest[] = [
  { id: 'r1', name: 'Jordan Lee',   email: 'jordan.lee@acme.com',   status: 'pending' },
  { id: 'r2', name: 'Morgan Smith', email: 'morgan.smith@corp.io',  status: 'pending' },
  { id: 'r3', name: 'Riley Chen',   email: 'riley.chen@techlab.co', status: 'pending' },
];

export default function SafetyDashboardPage() {
  const queryClient = useQueryClient();
  const { isMaskingEnabled } = useUiStore();
  const [permissions, setPermissions] = useState<Record<string, { run: boolean; build: boolean; sensitive: boolean }>>({
    '1': { run: true, build: false, sensitive: false },
    '2': { run: true, build: true, sensitive: false },
    '3': { run: true, build: true, sensitive: true },
  });

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
          ? 'Requires Human'
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
  const [requests, setRequests] = useState<ConnectionRequest[]>(INITIAL_REQUESTS);

  const copyKey = async (value: string, id: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const resolveRequest = (id: string, action: 'approved' | 'rejected') => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: action } : r));
  };

  const toggleCell = (employeeId: string, key: 'run' | 'build' | 'sensitive') => {
    setPermissions((current) => ({
      ...current,
      [employeeId]: {
        ...current[employeeId],
        [key]: !current[employeeId][key],
      },
    }));
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
          <CardTitle>Access Control List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Employee</th>
                  <th className="text-left py-2">Can Run Workflows</th>
                  <th className="text-left py-2">Can Build Workflows</th>
                  <th className="text-left py-2">Can View Sensitive Data</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b">
                    <td className="py-3">{maskValue(employee.name, isMaskingEnabled)}</td>
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={permissions[employee.id].run}
                        onChange={() => toggleCell(employee.id, 'run')}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={permissions[employee.id].build}
                        onChange={() => toggleCell(employee.id, 'build')}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={permissions[employee.id].sensitive}
                        onChange={() => toggleCell(employee.id, 'sensitive')}
                        className="h-4 w-4"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Keys + Connection Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* API Keys */}
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

        {/* Connection Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      req.status === 'approved'
                        ? 'bg-green-500/10 border-green-500/30'
                        : req.status === 'rejected'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-muted/40 border-border'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {req.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{req.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{req.email}</p>
                    </div>
                    {/* Actions */}
                    {req.status === 'pending' ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => resolveRequest(req.id, 'approved')}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => resolveRequest(req.id, 'rejected')}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition-colors"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Decline
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                        req.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {req.status === 'approved' ? 'Approved' : 'Declined'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
      </div>
    </div>
  );
}
