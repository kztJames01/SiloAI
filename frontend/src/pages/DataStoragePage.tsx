import { useState } from 'react';
import {
  Database,
  Plus,
  Server,
  Wifi,
  WifiOff,
  Trash2,
  Play,
  ChevronDown,
  ChevronRight,
  HardDrive,
  RefreshCw,
  Copy,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

type DbEngine = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'redis';
type DbStatus = 'connected' | 'disconnected' | 'error' | 'provisioning';
type ModalMode = 'create' | 'connect' | null;

interface DbConnection {
  id: string;
  name: string;
  engine: DbEngine;
  status: DbStatus;
  host: string;
  port: number;
  database: string;
  username?: string;
  isLocal: boolean;
  createdAt: Date;
  lastUsed?: Date;
  sizeBytes?: number;
}

const ENGINE_META: Record<DbEngine, { label: string; color: string; bg: string; icon: string; defaultPort: number; description: string }> = {
  postgresql: { label: 'PostgreSQL', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: '🐘', defaultPort: 5432, description: 'Advanced open-source relational DB' },
  mysql:       { label: 'MySQL',      color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: '🐬', defaultPort: 3306, description: 'Most popular open-source SQL DB' },
  sqlite:      { label: 'SQLite',     color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: '📦', defaultPort: 0, description: 'Lightweight file-based database' },
  mongodb:     { label: 'MongoDB',    color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: '🍃', defaultPort: 27017, description: 'Flexible document database' },
  redis:       { label: 'Redis',      color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: '⚡', defaultPort: 6379, description: 'In-memory key-value store' },
};

const STATUS_META: Record<DbStatus, { label: string; color: string; dot: string }> = {
  connected:    { label: 'Connected',    color: 'text-green-700 bg-green-100',  dot: 'bg-green-500' },
  disconnected: { label: 'Disconnected', color: 'text-gray-500 bg-gray-100',    dot: 'bg-gray-400' },
  error:        { label: 'Error',        color: 'text-red-700 bg-red-100',      dot: 'bg-red-500 animate-pulse' },
  provisioning: { label: 'Provisioning', color: 'text-amber-700 bg-amber-100',  dot: 'bg-amber-400 animate-pulse' },
};

const DEMO_CONNECTIONS: DbConnection[] = [
  {
    id: 'conn-1',
    name: 'Silo Local Postgres',
    engine: 'postgresql',
    status: 'connected',
    host: '127.0.0.1',
    port: 5432,
    database: 'silo_db',
    username: 'silo_user',
    isLocal: true,
    createdAt: new Date('2026-02-01'),
    lastUsed: new Date('2026-02-20'),
    sizeBytes: 24 * 1024 * 1024,
  },
  {
    id: 'conn-2',
    name: 'Cache Store',
    engine: 'redis',
    status: 'connected',
    host: '127.0.0.1',
    port: 6379,
    database: '0',
    isLocal: true,
    createdAt: new Date('2026-02-10'),
    lastUsed: new Date('2026-02-19'),
  },
];

function fmtSize(bytes?: number) {
  if (!bytes) return null;
  if (bytes > 1024 * 1024 * 1024) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes > 1024 * 1024) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

interface CreateModalProps {
  mode: 'create' | 'connect';
  onClose: () => void;
  onSave: (conn: DbConnection) => void;
}

function DbModal({ mode, onClose, onSave }: CreateModalProps) {
  const [engine, setEngine] = useState<DbEngine>('postgresql');
  const [name, setName] = useState('');
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(ENGINE_META.postgresql.defaultPort);
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null);

  const meta = ENGINE_META[engine];

  const handleEngineChange = (e: DbEngine) => {
    setEngine(e);
    setPort(ENGINE_META[e].defaultPort);
    setTestResult(null);
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    await new Promise(r => setTimeout(r, 1200));
    // Simulate: success if host provided
    setTestResult(host.trim() ? 'ok' : 'fail');
    setIsTesting(false);
  };

  const handleSubmit = () => {
    if (!name.trim() || !database.trim()) {
      toast.error('Name and database are required');
      return;
    }
    const conn: DbConnection = {
      id: `conn-${Date.now()}`,
      name: name.trim(),
      engine,
      status: mode === 'create' ? 'provisioning' : 'connected',
      host: engine === 'sqlite' ? 'local file' : host,
      port,
      database: database.trim(),
      username: username || undefined,
      isLocal: true,
      createdAt: new Date(),
    };
    onSave(conn);
    toast.success(mode === 'create' ? 'Database provisioning started' : 'Connection added');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {mode === 'create' ? 'Provision new database' : 'Connect existing database'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {mode === 'create'
                ? 'Silo will spin up a local database for you'
                : 'Connect to your existing local or remote database'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Engine picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Database Engine</label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(ENGINE_META) as DbEngine[]).map(eng => {
                const m = ENGINE_META[eng];
                return (
                  <button
                    key={eng}
                    onClick={() => handleEngineChange(eng)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center ${
                      engine === eng
                        ? `border-purple-500 ${m.bg}`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{m.icon}</span>
                    <span className="text-[9px] font-semibold text-gray-700 leading-tight">{m.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">{meta.description}</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Connection Name</label>
            <Input
              placeholder="e.g. My Production DB"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* SQLite — just file path */}
          {engine === 'sqlite' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Database File Path</label>
              <Input
                placeholder="./data/app.db"
                value={database}
                onChange={e => setDatabase(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Host</label>
                  <Input placeholder="127.0.0.1" value={host} onChange={e => setHost(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Port</label>
                  <Input
                    type="number"
                    value={port}
                    onChange={e => setPort(parseInt(e.target.value) || meta.defaultPort)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Database Name</label>
                <Input placeholder="my_database" value={database} onChange={e => setDatabase(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Username</label>
                  <Input placeholder="root" value={username} onChange={e => setUsername(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      {showPass ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Test connection */}
          {mode === 'connect' && engine !== 'sqlite' && (
            <div className="flex items-center gap-3">
              <button
                onClick={testConnection}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Testing…' : 'Test connection'}
              </button>
              {testResult === 'ok' && (
                <span className="flex items-center gap-1 text-xs text-green-700 font-semibold">
                  <Check className="h-3.5 w-3.5" /> Connection successful
                </span>
              )}
              {testResult === 'fail' && (
                <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                  <AlertCircle className="h-3.5 w-3.5" /> Connection failed
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700 text-white">
            {mode === 'create' ? 'Provision database' : 'Add connection'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ConnectionCardProps {
  conn: DbConnection;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onCopyDsn: (id: string) => void;
  copiedId: string | null;
}

function ConnectionCard({ conn, onDelete, onToggle, onCopyDsn, copiedId }: ConnectionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = ENGINE_META[conn.engine];
  const statusMeta = STATUS_META[conn.status];
  const size = fmtSize(conn.sizeBytes);

  const dsn =
    conn.engine === 'sqlite'
      ? `sqlite:///${conn.database}`
      : conn.engine === 'redis'
      ? `redis://${conn.host}:${conn.port}/${conn.database}`
      : `${conn.engine}://${conn.username ?? 'user'}:***@${conn.host}:${conn.port}/${conn.database}`;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Engine badge */}
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl flex-shrink-0 mt-0.5 ${meta.bg}`}>
            {meta.icon}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-900 truncate">{conn.name}</p>
              {conn.isLocal && (
                <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">LOCAL</span>
              )}
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusMeta.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
              {size && <span className="text-[10px] text-gray-400">{size}</span>}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 font-mono truncate">
              {conn.engine === 'sqlite' ? conn.database : `${conn.host}:${conn.port}/${conn.database}`}
            </p>
            {conn.lastUsed && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                Last used {conn.lastUsed.toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onCopyDsn(conn.id)}
              title="Copy connection string"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {copiedId === conn.id
                ? <Check className="h-3.5 w-3.5 text-green-600" />
                : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => onToggle(conn.id)}
              title={conn.status === 'connected' ? 'Disconnect' : 'Connect'}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {conn.status === 'connected'
                ? <WifiOff className="h-3.5 w-3.5" />
                : <Wifi className="h-3.5 w-3.5 text-green-600" />}
            </button>
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => onDelete(conn.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Expanded DSN */}
        {expanded && (
          <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Connection String</p>
            <code className="text-[11px] font-mono text-gray-700 break-all select-all">{dsn}</code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DataStoragePage() {
  const [connections, setConnections] = useState<DbConnection[]>(DEMO_CONNECTIONS);
  const [modal, setModal] = useState<ModalMode>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSave = (conn: DbConnection) => {
    setConnections(prev => [conn, ...prev]);
    setModal(null);
    // Simulate provisioning completing
    if (conn.status === 'provisioning') {
      setTimeout(() => {
        setConnections(prev =>
          prev.map(c => c.id === conn.id ? { ...c, status: 'connected' as DbStatus } : c)
        );
        toast.success(`${conn.name} is ready`);
      }, 3000);
    }
  };

  const handleDelete = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
    toast.success('Connection removed');
  };

  const handleToggle = (id: string) => {
    setConnections(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: c.status === 'connected' ? 'disconnected' as DbStatus : 'connected' as DbStatus }
          : c
      )
    );
  };

  const handleCopyDsn = (id: string) => {
    const conn = connections.find(c => c.id === id);
    if (!conn) return;
    const dsn =
      conn.engine === 'sqlite'
        ? `sqlite:///${conn.database}`
        : conn.engine === 'redis'
        ? `redis://${conn.host}:${conn.port}/${conn.database}`
        : `${conn.engine}://${conn.username ?? 'user'}:***@${conn.host}:${conn.port}/${conn.database}`;
    navigator.clipboard.writeText(dsn);
    setCopiedId(id);
    toast.success('Connection string copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const connected = connections.filter(c => c.status === 'connected').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Storage</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Host local databases or connect existing ones — use them directly inside your workflows.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setModal('connect')}
            className="gap-2"
          >
            <Wifi className="h-4 w-4" />
            Connect existing
          </Button>
          <Button
            onClick={() => setModal('create')}
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4" />
            New database
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Database, label: 'Total connections', value: connections.length, color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: Wifi, label: 'Connected', value: connected, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: Server, label: 'Local instances', value: connections.filter(c => c.isLocal).length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: HardDrive, label: 'DB engines', value: new Set(connections.map(c => c.engine)).size, color: 'text-gray-600', bg: 'bg-gray-100' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`h-4.5 w-4.5 h-[18px] w-[18px] ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-[10px] text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Engine quick-pick */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supported Engines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(Object.entries(ENGINE_META) as [DbEngine, typeof ENGINE_META[DbEngine]][]).map(([eng, m]) => (
              <button
                key={eng}
                onClick={() => setModal('create')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${m.bg} hover:shadow-md transition-all group`}
              >
                <span className="text-2xl">{m.icon}</span>
                <span className={`text-xs font-semibold ${m.color}`}>{m.label}</span>
                <span className="text-[9px] text-gray-400 text-center leading-tight">{m.description}</span>
                <span className="text-[9px] font-bold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  + Provision
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connections list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Your Connections
            <span className="ml-2 text-sm font-normal text-gray-400">({connections.length})</span>
          </h2>
        </div>

        {connections.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Database className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-base font-medium text-gray-700 mb-2">No databases yet</h3>
              <p className="text-sm text-gray-400 mb-6">
                Provision a new local database or connect an existing one to use it in your workflows.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setModal('connect')}>Connect existing</Button>
                <Button onClick={() => setModal('create')} className="bg-purple-600 hover:bg-purple-700 text-white">
                  New database
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {connections.map(conn => (
              <ConnectionCard
                key={conn.id}
                conn={conn}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onCopyDsn={handleCopyDsn}
                copiedId={copiedId}
              />
            ))}
          </div>
        )}
      </div>

      {/* How to use in workflows callout */}
      <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
        <CardContent className="p-5 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
            <Play className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">Use in Workflows</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Every connected database is available as a data source inside the Workflow Editor.
              Add a <strong>Database Query</strong> or <strong>Database Write</strong> node and select your connection from the dropdown.
              No cloud credentials needed — everything stays local.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {modal && (
        <DbModal
          mode={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
