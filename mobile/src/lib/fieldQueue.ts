import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'silo.mobile.field.queue';

export type QueuedFieldAction = {
  id: string;
  actionType: string;
  notes?: string;
  jobType?: string;
  createdAt: string;
};

export async function loadFieldQueue(): Promise<QueuedFieldAction[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveFieldQueue(items: QueuedFieldAction[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function enqueueFieldAction(item: Omit<QueuedFieldAction, 'id' | 'createdAt'>) {
  const queue = await loadFieldQueue();
  queue.push({
    ...item,
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  });
  await saveFieldQueue(queue);
  return queue.length;
}

export async function dequeueFieldAction(id: string) {
  const next = (await loadFieldQueue()).filter((q) => q.id !== id);
  await saveFieldQueue(next);
  return next.length;
}
