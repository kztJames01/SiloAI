import { WorkflowExecution } from '../../../shared/src/types';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppCard, StatusPill } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { createMobileExecutionApi } from '../../src/lib/execution';
import { useTheme } from '../../src/theme';

export default function ExecutionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const api = useMemo(() => createMobileExecutionApi(() => token), [token]);
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(id)
      .then((data) => setExecution(data.execution))
      .catch((err: any) => setError(err?.message || 'Could not load execution'))
      .finally(() => setLoading(false));
  }, [id, api]);

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
    ? `${Math.max(0, new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime())} ms`
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
