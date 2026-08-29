import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppCard, EmptyState, StatusPill } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { createMobileAgentApi } from '../../src/lib/agent';
import { isAdmin } from '../../src/lib/role';
import { useTheme } from '../../src/theme';

export default function AgentsScreen() {
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const api = useMemo(() => createMobileAgentApi(() => token), [token]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin(user?.role)) router.replace('/(tabs)/field' as any);
  }, [user?.role]);

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await api.list();
      setAgents(data.agents || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load agents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen title="Agents" subtitle={`${agents.length} AI agents`} scroll={false} contentStyle={styles.content}>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={agents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={agents.length ? styles.list : styles.emptyList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<EmptyState title="No agents yet" message="Create AI agents on desktop, then run and monitor them here." />}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/agents/${item.id}` as any)}>
              <AppCard style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={{ fontSize: 22 }}>{item.icon || '🤖'}</Text>
                  <View style={styles.cardTitleWrap}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.description || 'No description'}
                    </Text>
                  </View>
                </View>
                <View style={styles.meta}>
                  <StatusPill status={item.isActive ? 'Active' : 'Inactive'} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.llmModel}</Text>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  description: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaText: { fontSize: 12 },
});
