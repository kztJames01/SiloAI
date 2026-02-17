import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { executionApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useUiStore } from '../lib/store';
import { formatDate } from '../lib/utils';

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
      </div>
    </div>
  );
}
