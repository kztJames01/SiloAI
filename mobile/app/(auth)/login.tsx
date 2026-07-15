import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppButton, AppCard, AppInput } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { DEFAULT_API_BASE_URL } from '../../src/lib/auth';
import { useTheme } from '../../src/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await login({ email: email.trim(), password });
      router.replace('/(tabs)/field' as any);
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Could not sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.brand}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Text style={[styles.logoText, { color: colors.onPrimary }]}>S</Text>
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Silo</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Field work and automations in your pocket.
        </Text>
      </View>

      <AppCard>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Welcome back</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Sign in to your workspace</Text>
        <AppInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@company.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <AppInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          autoComplete="password"
        />
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
        <AppButton
          title="Sign in"
          onPress={submit}
          loading={submitting}
          disabled={!email.trim() || !password}
        />
      </AppCard>

      <Text style={[styles.switchText, { color: colors.textSecondary }]}>
        New to Silo?{' '}
        <Link href={'/(auth)/register' as any} style={{ color: colors.primary, fontWeight: '700' }}>
          Create an account
        </Link>
      </Text>
      <Text style={[styles.api, { color: colors.textTertiary }]}>
        {__DEV__ ? `API: ${DEFAULT_API_BASE_URL}` : ''}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center', paddingVertical: 40 },
  brand: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 30, fontWeight: '900' },
  title: { fontSize: 34, fontWeight: '900', marginTop: 12 },
  subtitle: { fontSize: 15, marginTop: 5, textAlign: 'center' },
  cardTitle: { fontSize: 22, fontWeight: '800' },
  cardSubtitle: { fontSize: 14, marginTop: 3, marginBottom: 22 },
  error: { fontSize: 13, marginBottom: 12 },
  switchText: { textAlign: 'center', marginTop: 20, fontSize: 14 },
  api: { textAlign: 'center', marginTop: 18, fontSize: 11 },
});
