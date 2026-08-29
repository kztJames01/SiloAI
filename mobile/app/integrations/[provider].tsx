import { useLocalSearchParams, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppButton, AppCard, AppInput } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { createMobileIntegrationApi } from '../../src/lib/integration';
import { DEFAULT_API_BASE_URL } from '../../src/lib/auth';
import { isAdmin } from '../../src/lib/role';
import { useTheme } from '../../src/theme';

export default function IntegrationDetailScreen() {
  const { provider } = useLocalSearchParams<{ provider: string }>();
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const api = useMemo(() => createMobileIntegrationApi(() => token), [token]);
  const [info, setInfo] = useState<any>(null);
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin(user?.role)) router.replace('/(tabs)/field' as any);
  }, [user?.role]);

  const load = useCallback(async () => {
    if (!provider) return;
    try {
      const [detail, userConnections] = await Promise.all([api.get(provider), api.listUser()]);
      setInfo(detail);
      setConnection(userConnections.connections.find((c: any) => (c.provider || c.integration?.provider) === provider) || null);
    } catch (err: any) {
      setError(err?.message || 'Could not load integration');
    } finally {
      setLoading(false);
    }
  }, [provider, api]);

  useEffect(() => {
    load();
  }, [load]);

  const metadata = info?.metadata || {};

  const connectOAuth = async () => {
    if (!provider) return;
    setWorking(true);
    setError('');
    try {
      const response = await api.connect(provider, {});
      if (!response.requiresOAuth || !response.authUrl) {
        throw new Error('This app does not support OAuth connect');
      }
      const redirectUrl = Linking.createURL('integration-callback');
      const result = await WebBrowser.openAuthSessionAsync(response.authUrl, redirectUrl);
      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        if (parsed.queryParams?.error) {
          throw new Error(String(parsed.queryParams.error));
        }
      }
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not connect');
    } finally {
      setWorking(false);
    }
  };

  const connectApiKey = async () => {
    if (!provider || !apiKey.trim()) return;
    setWorking(true);
    setError('');
    try {
      await api.connect(provider, { credentials: { apiKey: apiKey.trim() } });
      setApiKey('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not connect');
    } finally {
      setWorking(false);
    }
  };

  const disconnect = async () => {
    if (!provider || !connection) return;
    Alert.alert('Disconnect', `Remove your ${metadata.name || provider} connection?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          setWorking(true);
          try {
            await api.disconnect(provider, connection.id);
            await load();
          } catch (err: any) {
            Alert.alert('Could not disconnect', err?.message || 'Please try again');
          } finally {
            setWorking(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen title={metadata.name || provider} subtitle={metadata.description}>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

      {connection ? (
        <AppCard>
          <Text style={[styles.status, { color: colors.success }]}>● Connected</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {connection.name || 'Connection active'}
          </Text>
          <AppButton title="Disconnect" variant="danger" onPress={disconnect} loading={working} style={styles.button} />
        </AppCard>
      ) : metadata.comingSoon ? (
        <AppCard>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            This integration is coming soon and isn't available to connect yet.
          </Text>
        </AppCard>
      ) : metadata.authType === 'oauth2' ? (
        <AppCard>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Connect with {metadata.name} using a secure sign-in window.
          </Text>
          <AppButton title="Connect" onPress={connectOAuth} loading={working} style={styles.button} />
        </AppCard>
      ) : (
        <AppCard>
          <AppInput
            label="API Key"
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Paste your API key"
            autoCapitalize="none"
            secureTextEntry
          />
          <AppButton title="Connect" onPress={connectApiKey} loading={working} disabled={!apiKey.trim()} style={styles.button} />
        </AppCard>
      )}

      {__DEV__ ? (
        <Text style={[styles.api, { color: colors.textTertiary }]}>API: {DEFAULT_API_BASE_URL}</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 13, marginBottom: 12 },
  status: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  body: { fontSize: 13, lineHeight: 19 },
  button: { marginTop: 16 },
  api: { textAlign: 'center', marginTop: 18, fontSize: 11 },
});
