import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { executionApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useUiStore } from '../lib/store';
import { formatDate } from '../lib/utils';
import { Eye, EyeOff, Copy, Check, UserCheck, UserX } from 'lucide-react';

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

const API_KEYS = {
  public: 'pk_live_4f8a2b1c9d3e7f6a5b0c8d2e1f4a7b3c',
  private: 'sk_live_9d3e7f6a5b0c8d2e1f4a7b3c4f8a2b1c',
};

type RequestStatus = 'pending' | 'approved' | 'rejected';
interface ConnectionRequest { id: string; name: string; email: string; status: RequestStatus; }

const INITIAL_REQUESTS: ConnectionRequest[] = [
  { id: 'r1', name: 'Jordan Lee',   email: 'jordan.lee@acme.com',   status: 'pending' },
  { id: 'r2', name: 'Morgan Smith', email: 'morgan.smith@corp.io',  status: 'pending' },
  { id: 'r3', name: 'Riley Chen',   email: 'riley.chen@techlab.co', status: 'pending' },
];

export default function SafetyDashboardPage() {
  const { isMaskingEnabled } = useUiStore();
  const [permissions, setPermissions] = useState<Record<string, { run: boolean; build: boolean; sensitive: boolean }>>({
    '1': { run: true, build: false, sensitive: false },
    '2': { run: true, build: true, sensitive: false },
    '3': { run: true, build: true, sensitive: true },
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

  const [showPublicKey, setShowPublicKey]   = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedKey, setCopiedKey]           = useState<'public' | 'private' | null>(null);
  const [requests, setRequests]             = useState<ConnectionRequest[]>(INITIAL_REQUESTS);

  const copyKey = async (type: 'public' | 'private') => {
    await navigator.clipboard.writeText(API_KEYS[type]);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
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
        <h1 className="text-3xl font-bold text-gray-900">Safety & Governance</h1>
        <p className="text-gray-600 mt-1">Audit trail and access controls</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trail.length === 0 ? (
              <p className="text-sm text-gray-600">No audit events yet</p>
            ) : (
              trail.map((item: { id: string; actor: string; action: string; status: string; at: string }) => (
                <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-gray-900">{maskValue(item.actor, isMaskingEnabled)}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{maskValue(item.action, isMaskingEnabled)}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.at}</p>
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
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['public', 'private'] as const).map((type) => {
              const isVisible = type === 'public' ? showPublicKey : showPrivateKey;
              const toggle    = type === 'public' ? () => setShowPublicKey(v => !v) : () => setShowPrivateKey(v => !v);
              const isCopied  = copiedKey === type;
              const masked    = '•'.repeat(32);
              return (
                <div key={type}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {type === 'public' ? 'Public Key' : 'Private Key'}
                  </p>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                    <code className="flex-1 text-xs font-mono text-gray-800 truncate select-all">
                      {isVisible ? API_KEYS[type] : masked}
                    </code>
                    <button
                      onClick={toggle}
                      className="p-1 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
                      title={isVisible ? 'Hide' : 'Reveal'}
                    >
                      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => copyKey(type)}
                      className={`p-1 flex-shrink-0 transition-colors ${
                        isCopied ? 'text-green-600' : 'text-gray-400 hover:text-gray-700'
                      }`}
                      title={isCopied ? 'Copied!' : 'Copy'}
                    >
                      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  {type === 'private' && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Never share your private key. It grants full API access.
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Connection Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-sm text-gray-500">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      req.status === 'approved'
                        ? 'bg-green-50 border-green-200'
                        : req.status === 'rejected'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {req.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{req.name}</p>
                      <p className="text-xs text-gray-500 truncate">{req.email}</p>
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
