const KEY = 'silo.field.queue';

export type QueuedFieldAction = {
  id: string;
  actionType: string;
  notes?: string;
  jobType?: string;
  createdAt: string;
};

export function loadFieldQueue(): QueuedFieldAction[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFieldQueue(items: QueuedFieldAction[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function enqueueFieldAction(item: Omit<QueuedFieldAction, 'id' | 'createdAt'>) {
  const queue = loadFieldQueue();
  queue.push({
    ...item,
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  });
  saveFieldQueue(queue);
  return queue.length;
}

export function dequeueFieldAction(id: string) {
  const next = loadFieldQueue().filter((q) => q.id !== id);
  saveFieldQueue(next);
  return next.length;
}
