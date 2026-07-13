import { Workflow } from '../../../shared/src/types';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppCard, EmptyState, StatusPill } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { createMobileWorkflowApi } from '../../src/lib/workflow';
import { useTheme } from '../../src/theme';

export default function WorkflowsScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const api = useMemo(() => createMobileWorkflowApi(() => token), [token]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await api.list();
      setWorkflows(data.workflows);
    } catch (err: any) {
      setError(err?.message || 'Could not load workflows');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen
      title="Workflows"
      subtitle={`${workflows.filter((item) => item.isActive).length} active automations`}
      scroll={false}
      contentStyle={styles.content}
    >
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={workflows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={workflows.length ? styles.list : styles.emptyList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<EmptyState title="No workflows yet" message="Create workflows on desktop, then run and monitor them here." />}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/workflow/${item.id}` as any)}>
              <AppCard style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.description || 'No description'}
                    </Text>
                  </View>
                  <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
                </View>
                <View style={styles.meta}>
                  <StatusPill status={item.isActive ? 'Active' : 'Inactive'} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {item.nodes?.length || 0} steps · {item.trigger?.type || 'manual'}
                  </Text>
                </View>
              </AppCard>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { gap: 12, paddingBottom: 28 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  error: { fontSize: 13, marginBottom: 12 },
  card: { gap: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  description: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  chevron: { fontSize: 30, marginLeft: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaText: { fontSize: 12 },
});
