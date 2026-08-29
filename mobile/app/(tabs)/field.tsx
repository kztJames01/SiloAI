import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppButton, AppCard, AppInput } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { createMobileFieldApi } from '../../src/lib/field';
import { dequeueFieldAction, enqueueFieldAction, loadFieldQueue } from '../../src/lib/fieldQueue';
import { useTheme } from '../../src/theme';

const actions = [
  { id: 'clock-in', title: 'Clock In', icon: '⏱', color: 'primary' },
  { id: 'log-hazard', title: 'Log Hazard', icon: '⚠', color: 'warning' },
  { id: 'supply-order', title: 'Supply Order', icon: '▣', color: 'secondary' },
  { id: 'patient-intake', title: 'Patient Intake', icon: '✚', color: 'info' },
] as const;

export default function FieldScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const fieldApi = useMemo(() => createMobileFieldApi(() => token), [token]);
  const [activeAction, setActiveAction] = useState<(typeof actions)[number] | null>(null);
  const [notes, setNotes] = useState('');
  const [jobType, setJobType] = useState('General');
  const [queued, setQueued] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [recentError, setRecentError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadRecent = useCallback(async () => {
    if (!token) return;
    try {
      setRecentError('');
      const res = await fieldApi.list();
      setRecentActions(res.actions || []);
    } catch {
      setRecentError('Could not load recent actions');
    }
  }, [fieldApi, token]);

  const flushQueue = useCallback(async () => {
    if (syncing || !token) return;
    const queue = await loadFieldQueue();
    if (!queue.length) return;

    setSyncing(true);
    let remaining = queue.length;
    for (const item of queue) {
      try {
        await fieldApi.submit({
          actionType: item.actionType,
          notes: item.notes,
          jobType: item.jobType,
        });
        remaining = await dequeueFieldAction(item.id);
      } catch {
        break;
      }
    }
    setQueued(remaining);
    setSyncing(false);
    if (remaining < queue.length) await loadRecent();
  }, [fieldApi, syncing, token, loadRecent]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await loadFieldQueue().then((q) => setQueued(q.length));
    await flushQueue();
    await loadRecent();
    setRefreshing(false);
  }, [flushQueue, loadRecent]);

  useEffect(() => {
    loadFieldQueue().then((q) => setQueued(q.length));
    flushQueue();
    loadRecent();
  }, [token]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        flushQueue();
        loadRecent();
      }
    });
    return () => sub.remove();
  }, [flushQueue, loadRecent]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }, []);

  const submit = async () => {
    if (!activeAction) return;
    const payload = {
      actionType: activeAction.id,
      notes: notes.trim() || undefined,
      jobType,
    };

    setSubmitting(true);
    try {
      const res = await fieldApi.submit(payload);
      setNotes('');
      setActiveAction(null);
      await loadRecent();
      const execId = res.workflowExecutionId;
      const msg = res.status === 'workflow_started'
        ? 'Saved and workflow started.'
        : 'Field action saved.';
      if (execId) {
        Alert.alert('Done', msg, [
          { text: 'OK' },
          { text: 'View run', onPress: () => router.push(`/execution/${execId}` as any) },
        ]);
      } else {
        Alert.alert('Done', msg);
      }
    } catch {
      const count = await enqueueFieldAction(payload);
      setQueued(count);
      setNotes('');
      setActiveAction(null);
      Alert.alert('Saved offline', 'Could not reach the server. Queued for sync.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      title={greeting}
      subtitle="Tap a button to log field work"
      refreshing={refreshing}
      onRefresh={refreshAll}
    >
      <View style={styles.statusRow}>
        <View style={[styles.online, { backgroundColor: `${colors.success}18` }]}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={[styles.onlineText, { color: colors.success }]}>
            {syncing ? 'Syncing' : 'Ready'}
          </Text>
        </View>
        <View style={styles.queueSide}>
          <Text style={[styles.queueText, { color: colors.textSecondary }]}>
            {queued > 0 ? `${queued} queued` : 'All synced'}
          </Text>
          {queued > 0 ? (
            <AppButton title="Sync now" variant="outline" onPress={flushQueue} disabled={syncing} style={styles.syncBtn} />
          ) : null}
        </View>
      </View>

      <View style={styles.grid}>
        {actions.map((action) => {
          const actionColor = colors[action.color];
          return (
            <Pressable
              key={action.id}
              onPress={() => setActiveAction(action)}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.78 },
              ]}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${actionColor}18` }]}>
                <Text style={[styles.actionIconText, { color: actionColor }]}>{action.icon}</Text>
              </View>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>{action.title}</Text>
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>Tap to start</Text>
            </Pressable>
          );
        })}
      </View>

      {recentError ? <Text style={[styles.recentError, { color: colors.error }]}>{recentError}</Text> : null}
      {recentActions.length > 0 ? (
        <AppCard style={styles.recent}>
          <Text style={[styles.recentTitle, { color: colors.textPrimary }]}>Recent actions</Text>
          {recentActions.slice(0, 5).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                if (item.workflowExecutionId) router.push(`/execution/${item.workflowExecutionId}` as any);
              }}
              style={[styles.recentRow, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.recentAction, { color: colors.textPrimary }]}>{item.actionType}</Text>
              <Text style={[styles.recentStatus, { color: colors.textSecondary }]}>{item.status}</Text>
            </Pressable>
          ))}
        </AppCard>
      ) : null}

      <Modal visible={!!activeAction} transparent animationType="slide" onRequestClose={() => setActiveAction(null)}>
        <Pressable style={styles.overlay} onPress={() => setActiveAction(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{activeAction?.title}</Text>
            <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
              Add notes, then save. Works offline if needed.
            </Text>
            <AppInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="What happened?"
              multiline
              numberOfLines={4}
              style={styles.notes}
            />
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Type</Text>
            <View style={styles.chips}>
              {['General', 'Safety', 'Urgent'].map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setJobType(type)}
                  style={[
                    styles.chip,
                    {
                      borderColor: jobType === type ? colors.primary : colors.border,
                      backgroundColor: jobType === type ? `${colors.primary}15` : colors.background,
                    },
                  ]}
                >
                  <Text style={{ color: jobType === type ? colors.primary : colors.textSecondary, fontWeight: '700' }}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.sheetActions}>
              <AppButton title="Cancel" variant="outline" onPress={() => setActiveAction(null)} style={styles.flex} />
              <AppButton title={submitting ? 'Saving...' : 'Save'} onPress={submit} disabled={submitting} style={styles.flex} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  online: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  dot: { width: 7, height: 7, borderRadius: 10 },
  onlineText: { fontSize: 12, fontWeight: '800' },
  queueText: { fontSize: 12 },
  queueSide: { alignItems: 'flex-end', gap: 6 },
  syncBtn: { paddingVertical: 6, paddingHorizontal: 10, minHeight: 32 },
  recentError: { fontSize: 12, marginTop: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  action: { width: '48%', minHeight: 145, borderWidth: 1, borderRadius: 20, padding: 16 },
  actionIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  actionIconText: { fontSize: 20, fontWeight: '800' },
  actionTitle: { fontSize: 16, fontWeight: '800' },
  actionHint: { fontSize: 12, marginTop: 5 },
  recent: { marginTop: 18 },
  recentTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  recentRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  recentAction: { fontSize: 14, fontWeight: '700' },
  recentStatus: { fontSize: 11, marginTop: 2 },
  overlay: { flex: 1, backgroundColor: '#00000070', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 35 },
  handle: { width: 42, height: 5, borderRadius: 5, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 23, fontWeight: '900' },
  sheetSubtitle: { fontSize: 14, marginTop: 4, marginBottom: 20 },
  notes: { minHeight: 100, textAlignVertical: 'top', paddingTop: 13 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 23 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  sheetActions: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});
