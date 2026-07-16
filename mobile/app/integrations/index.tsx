import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppCard, EmptyState } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { createMobileIntegrationApi } from '../../src/lib/integration';
import { useTheme } from '../../src/theme';

export default function IntegrationsScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const api = useMemo(() => createMobileIntegrationApi(() => token), [token]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [listRes, userRes] = await Promise.all([api.list(), api.listUser()]);
      setIntegrations(listRes.integrations || []);
      setConnections(userRes.connections || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load integrations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const connectedProviders = new Set(connections.map((c) => c.provider || c.integration?.provider));

  return (
    <Screen
      title="Apps"
      subtitle={`${connections.length} connected · ${integrations.length} available`}
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
          data={integrations}
          keyExtractor={(item) => item.provider}
          contentContainerStyle={integrations.length ? styles.list : styles.emptyList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<EmptyState title="No integrations available" message="Check back once your admin configures app integrations." />}
          renderItem={({ item }) => {
            const connected = connectedProviders.has(item.provider);
            return (
              <Pressable onPress={() => router.push(`/integrations/${item.provider}` as any)}>
                <AppCard style={styles.card}>
                  <View style={[styles.icon, { backgroundColor: `${item.color || colors.primary}20` }]}>
                    <Text style={{ fontSize: 20 }}>🔌</Text>
                  </View>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                  {item.comingSoon ? (
                    <Text style={[styles.badge, { color: colors.textTertiary }]}>Soon</Text>
                  ) : connected ? (
                    <Text style={[styles.badge, { color: colors.success }]}>Connected</Text>
                  ) : (
                    <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
                  )}
                </AppCard>
              </Pressable>
            );
          }}
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
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardDesc: { fontSize: 12, marginTop: 3 },
  badge: { fontSize: 11, fontWeight: '800' },
  chevron: { fontSize: 26 },
});
