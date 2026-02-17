import { useMemo, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Mic, Camera, Wifi, WifiOff, Loader2 } from 'lucide-react';

type SyncState = 'online' | 'saving' | 'syncing';

const fieldActions = [
  { id: 'clock-in', label: 'Clock In', style: 'bg-primary text-primary-foreground' },
  { id: 'log-hazard', label: 'Log Hazard', style: 'bg-secondary text-secondary-foreground' },
  { id: 'supply-order', label: 'Supply Order', style: 'bg-muted text-foreground' },
  { id: 'patient-intake', label: 'Patient Intake', style: 'bg-accent text-accent-foreground' },
];

export default function FieldPage() {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [jobType, setJobType] = useState('General');
  const [queuedTasks, setQueuedTasks] = useState(0);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const syncState: SyncState = useMemo(() => {
    if (!online) {
      return queuedTasks > 0 ? 'syncing' : 'saving';
    }
    return 'online';
  }, [online, queuedTasks]);

  const handlePress = (actionId: string) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
    setActiveAction(actionId);
  };

  const submitTask = () => {
    setQueuedTasks((current) => current + 1);
    setActiveAction(null);
    setNotes('');
  };

  const syncLabel =
    syncState === 'online'
      ? 'Online'
      : syncState === 'syncing'
      ? `Syncing ${queuedTasks} tasks`
      : 'Saving to device...';

  const syncClass =
    syncState === 'online'
      ? 'bg-green-100 text-green-700'
      : 'bg-orange-100 text-orange-700';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Actions</h1>
          <p className="text-gray-600 mt-1">Tap one button to run a workflow</p>
        </div>
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${syncClass}`}>
          {syncState === 'online' ? <Wifi className="h-4 w-4" /> : syncState === 'syncing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <WifiOff className="h-4 w-4" />}
          {syncLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fieldActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handlePress(action.id)}
            className={`min-h-20 rounded-lg text-xl font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${action.style}`}
          >
            {action.label}
          </button>
        ))}
      </div>

      {activeAction && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center sm:justify-center">
          <Card className="w-full sm:max-w-lg rounded-b-none sm:rounded-lg">
            <CardHeader>
              <CardTitle>Complete this action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add a quick note"
                    rows={3}
                    className="w-full px-3 py-2 border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full" onClick={() => {}}>
                    <Mic className="h-4 w-4 mr-2" />
                    Dictate
                  </Button>
                  <>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Scan
                    </Button>
                  </>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={jobType}
                    onChange={(event) => setJobType(event.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option>General</option>
                    <option>Safety</option>
                    <option>Urgent</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setActiveAction(null)}>
                    Cancel
                  </Button>
                  <Button onClick={submitTask}>Submit</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}
