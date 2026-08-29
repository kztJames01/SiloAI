import { Workflow } from '../../../shared/src/types';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppCard, AppInput, EmptyState, StatusPill } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { createMobileWorkflowApi } from '../../src/lib/workflow';
import { useTheme } from '../../src/theme';

type Filter = 'all' | 'active' | 'inactive';

export default function WorkflowsScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const api = useMemo(() => createMobileWorkflowApi(() => token), [token]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await api.list();
      setWorkflows(data.workflows.filter((item) => !item.name.startsWith('__agent__')));
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

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return workflows.filter((item) => {
      if (filter === 'active' && !item.isActive) return false;
      if (filter === 'inactive' && item.isActive) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
    });
  }, [workflows, search, filter]);

  const activeCount = workflows.filter((item) => item.isActive).length;

  return (
    <Screen
      title="Workflows"
      subtitle={`${activeCount} active · ${workflows.length} total`}
      scroll={false}
      contentStyle={styles.content}
    >
      <AppInput value={search} onChangeText={setSearch} placeholder="Search workflows" />
      <View style={styles.filters}>
        {(['all', 'active', 'inactive'] as Filter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.chip,
              {
                borderColor: filter === f ? colors.primary : colors.border,
                backgroundColor: filter === f ? `${colors.primary}15` : colors.surface,
              },
            ]}
          >
            <Text style={{ color: filter === f ? colors.primary : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Inactive'}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item) => item.id}
          contentContainerStyle={shown.length ? styles.list : styles.emptyList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={
            <EmptyState
              title={search || filter !== 'all' ? 'No matches' : 'No workflows yet'}
              message="Create workflows on desktop, then run and monitor them here."
            />
          }
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
  list: { gap: 12, paddingBottom: 28, paddingTop: 10 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  error: { fontSize: 13, marginBottom: 12 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 4 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  card: { gap: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  description: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  chevron: { fontSize: 30, marginLeft: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaText: { fontSize: 12 },
});
