import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppButton, AppCard, AppInput, StatusPill } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { createMobileAgentApi } from '../../src/lib/agent';
import { useTheme } from '../../src/theme';

export default function AgentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const api = useMemo(() => createMobileAgentApi(() => token), [token]);
  const [agent, setAgent] = useState<any>(null);
  const [executions, setExecutions] = useState<any[]>([]);
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [detail, execs] = await Promise.all([api.get(id), api.executions(id)]);
      setAgent(detail.agent);
      setExecutions(execs.executions || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load agent');
    } finally {
      setLoading(false);
    }
  }, [id, api]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const hasRunning = executions.some((e) => e.status === 'RUNNING');
    if (hasRunning && !pollRef.current) {
      pollRef.current = setInterval(load, 4000);
    } else if (!hasRunning && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [executions, load]);

  const run = async () => {
    if (!id || !task.trim()) return;
    setRunning(true);
    try {
      await api.run(id, { task: task.trim() });
      setTask('');
      await load();
    } catch (err: any) {
      Alert.alert('Could not run agent', err?.message || 'Please try again');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (!agent) {
    return (
      <Screen title="Agent unavailable">
        <Text style={{ color: colors.error }}>{error || 'Agent not found'}</Text>
      </Screen>
    );
  }

  return (
    <Screen title={agent.name} subtitle={agent.description || 'AI agent'}>
      <View style={styles.status}>
        <StatusPill status={agent.isActive ? 'Active' : 'Inactive'} />
        <Text style={[styles.model, { color: colors.textSecondary }]}>{agent.llmProvider} · {agent.llmModel}</Text>
      </View>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Run a task</Text>
        <AppInput
          label="Task"
          value={task}
          onChangeText={setTask}
          placeholder="Describe what you want the agent to do"
          multiline
          numberOfLines={3}
        />
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
        <AppButton title="Run agent" onPress={run} loading={running} disabled={!task.trim()} />
      </AppCard>

      <AppCard style={styles.executions}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent runs</Text>
        {executions.length ? (
          executions.map((exec) => (
            <Pressable key={exec.id} onPress={() => router.push(`/execution/${exec.steps?.[0]?.workflowExecutionId || exec.id}` as any)}>
              <View style={[styles.execRow, { borderBottomColor: colors.border }]}>
                <View style={styles.execText}>
                  <Text style={[styles.execInput, { color: colors.textPrimary }]} numberOfLines={1}>{exec.input}</Text>
                  <Text style={[styles.execTime, { color: colors.textTertiary }]}>
                    {new Date(exec.startedAt).toLocaleString()}
                  </Text>
                </View>
                <StatusPill status={exec.status} />
              </View>
            </Pressable>
          ))
        ) : (
          <Text style={[styles.body, { color: colors.textSecondary }]}>No runs yet.</Text>
        )}
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  model: { fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  error: { fontSize: 13, marginBottom: 10 },
  executions: { marginTop: 14 },
  execRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  execText: { flex: 1 },
  execInput: { fontSize: 13, fontWeight: '700' },
  execTime: { fontSize: 11, marginTop: 3 },
  body: { fontSize: 13 },
});
