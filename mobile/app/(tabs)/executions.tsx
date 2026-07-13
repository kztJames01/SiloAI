import { WorkflowExecution } from '../../../shared/src/types';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppCard, EmptyState, StatusPill } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { createMobileExecutionApi } from '../../src/lib/execution';
import { useTheme } from '../../src/theme';

const formatDate = (date: string) =>
  new Date(date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function ExecutionsScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const api = useMemo(() => createMobileExecutionApi(() => token), [token]);
  const [items, setItems] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await api.list();
      setItems(data.executions);
    } catch (err: any) {
      setError(err?.message || 'Could not load executions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen title="Runs" subtitle="Workflow execution history" scroll={false} contentStyle={styles.content}>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={items.length ? styles.list : styles.emptyList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<EmptyState title="No runs yet" message="Executed workflows will appear here with logs and results." />}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/execution/${item.id}` as any)}>
              <AppCard style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.titleWrap}>
                    <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.workflow?.name || 'Workflow run'}
                    </Text>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(item.startedAt)}</Text>
                  </View>
                  <StatusPill status={item.status} />
                </View>
                <Text style={[styles.id, { color: colors.textTertiary }]}>ID {item.id.slice(0, 8)}</Text>
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
  card: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800' },
  date: { fontSize: 12, marginTop: 4 },
  id: { fontSize: 11, fontFamily: 'monospace' },
});
