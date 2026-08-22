import { WorkflowExecution } from '../../../shared/src/types';
import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppCard, StatusPill } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { createMobileExecutionApi } from '../../src/lib/execution';
import { formatDurationMs } from '../../src/lib/format';
import { isAdmin } from '../../src/lib/role';
import { useTheme } from '../../src/theme';

export default function ExecutionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const api = useMemo(() => createMobileExecutionApi(() => token), [token]);
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAdmin(user?.role)) router.replace('/(tabs)/field' as any);
  }, [user?.role]);

  const load = useCallback(() => {
    if (!id) return;
    return api.get(id)
      .then((data) => setExecution(data.execution))
      .catch((err: any) => setError(err?.message || 'Could not load execution'))
      .finally(() => setLoading(false));
  }, [id, api]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const isRunning = execution?.status === 'RUNNING' || execution?.status === 'PENDING';
    if (isRunning && !pollRef.current) {
      pollRef.current = setInterval(load, 3000);
    } else if (!isRunning && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [execution?.status, load]);

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (!execution) {
    return <Screen title="Run unavailable"><Text style={{ color: colors.error }}>{error}</Text></Screen>;
  }

  const duration = execution.finishedAt
    ? formatDurationMs(Math.max(0, new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime()))
    : 'In progress';

  return (
    <Screen title={execution.workflow?.name || 'Workflow run'} subtitle={`Run ${execution.id.slice(0, 8)}`}>
      <View style={styles.statusRow}>
        <StatusPill status={execution.status} />
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {new Date(execution.startedAt).toLocaleString()}
        </Text>
      </View>

      <View style={styles.stats}>
        <AppCard style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{duration}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Duration</Text>
        </AppCard>
        <AppCard style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.secondary }]}>{execution.logs?.length || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Log entries</Text>
        </AppCard>
      </View>

      {execution.error ? (
        <AppCard style={[styles.errorCard, { borderColor: colors.error }]}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Error</Text>
          <Text style={[styles.body, { color: colors.textPrimary }]}>{execution.error}</Text>
        </AppCard>
      ) : null}

      <AppCard style={styles.logsCard}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Activity log</Text>
        {execution.logs?.length ? (
          execution.logs.map((log) => (
            <View key={log.id} style={[styles.log, { borderLeftColor: log.level === 'ERROR' ? colors.error : colors.primary }]}>
              <Text style={[styles.logTitle, { color: colors.textPrimary }]}>{log.nodeName || log.level}</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>{log.message}</Text>
              <Text style={[styles.time, { color: colors.textTertiary }]}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.body, { color: colors.textSecondary }]}>No logs were recorded for this run.</Text>
        )}
      </AppCard>

      {execution.output != null ? (
        <AppCard style={styles.outputCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Output</Text>
          <Text style={[styles.code, { color: colors.textSecondary, backgroundColor: colors.background }]}>
            {JSON.stringify(execution.output, null, 2)}
          </Text>
        </AppCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  date: { fontSize: 11 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1 },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 11, marginTop: 4 },
  errorCard: { marginTop: 14 },
  logsCard: { marginTop: 14 },
  outputCard: { marginTop: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  body: { fontSize: 13, lineHeight: 19 },
  log: { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 16 },
  logTitle: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  time: { fontSize: 10, marginTop: 5 },
  code: { fontFamily: 'monospace', fontSize: 11, padding: 12, borderRadius: 10 },
});
