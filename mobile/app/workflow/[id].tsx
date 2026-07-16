import { Workflow } from '../../../shared/src/types';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppButton, AppCard, StatusPill } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { createMobileWorkflowApi } from '../../src/lib/workflow';
import { useTheme } from '../../src/theme';

export default function WorkflowDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const canManage = user?.role !== 'FIELD';
  const { colors } = useTheme();
  const api = useMemo(() => createMobileWorkflowApi(() => token), [token]);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!id) return;
    try {
      const data = await api.get(id);
      setWorkflow(data.workflow);
    } catch (err: any) {
      setError(err?.message || 'Could not load workflow');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const run = async () => {
    if (!id) return;
    setWorking(true);
    try {
      const response = await api.execute(id, { source: 'mobile' });
      Alert.alert('Workflow started', response.message, [
        { text: 'View run', onPress: () => router.push(`/execution/${response.executionId}` as any) },
        { text: 'OK' },
      ]);
    } catch (err: any) {
      Alert.alert('Could not run workflow', err?.data?.error || err?.message || 'Please try again');
    } finally {
      setWorking(false);
    }
  };

  const toggle = async () => {
    if (!id) return;
    setWorking(true);
    try {
      const response = await api.toggle(id);
      setWorkflow(response.workflow);
    } catch (err: any) {
      Alert.alert('Could not update workflow', err?.data?.error || err?.message || 'Please try again');
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (!workflow) {
    return (
      <Screen title="Workflow unavailable">
        <Text style={{ color: colors.error }}>{error || 'Workflow not found'}</Text>
      </Screen>
    );
  }

  return (
    <Screen title={workflow.name} subtitle={workflow.description || 'Workflow details'}>
      <View style={styles.status}>
        <StatusPill status={workflow.isActive ? 'Active' : 'Inactive'} />
        <Text style={[styles.updated, { color: colors.textSecondary }]}>
          Updated {new Date(workflow.updatedAt).toLocaleDateString()}
        </Text>
      </View>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: colors.primary }]}>{workflow.nodes?.length || 0}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Steps</Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: colors.secondary }]}>{workflow.trigger?.type || 'manual'}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Trigger</Text>
          </View>
        </View>
      </AppCard>

      <AppCard style={styles.steps}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Workflow steps</Text>
        {(workflow.nodes || []).length ? (
          workflow.nodes.map((node: any, index) => (
            <View key={node?.id || index} style={[styles.step, { borderBottomColor: colors.border }]}>
              <View style={[styles.stepNumber, { backgroundColor: `${colors.primary}18` }]}>
                <Text style={{ color: colors.primary, fontWeight: '900' }}>{index + 1}</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                  {node?.data?.label || node?.type || `Step ${index + 1}`}
                </Text>
                <Text style={[styles.stepType, { color: colors.textSecondary }]}>{node?.type || 'action'}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.noSteps, { color: colors.textSecondary }]}>No steps configured.</Text>
        )}
      </AppCard>

      {canManage ? (
        <View style={styles.actions}>
          <AppButton title="Run now" onPress={run} loading={working} style={styles.flex} />
          <AppButton
            title={workflow.isActive ? 'Pause' : 'Activate'}
            variant="outline"
            onPress={toggle}
            disabled={working}
            style={styles.flex}
          />
        </View>
      ) : (
        <Text style={[styles.noSteps, { color: colors.textSecondary, marginTop: 14 }]}>
          Field accounts can view workflows but can't run or edit them. Ask an admin if you need changes.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  status: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  updated: { fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 14 },
  metrics: { flexDirection: 'row' },
  metric: { flex: 1 },
  metricValue: { fontSize: 22, fontWeight: '900', textTransform: 'capitalize' },
  metricLabel: { fontSize: 12, marginTop: 3 },
  steps: { marginTop: 14 },
  step: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  stepNumber: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepText: { marginLeft: 12, flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700' },
  stepType: { fontSize: 11, marginTop: 3, textTransform: 'capitalize' },
  noSteps: { fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  flex: { flex: 1 },
});
