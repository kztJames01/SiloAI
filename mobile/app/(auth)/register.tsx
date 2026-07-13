import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppButton, AppCard, AppInput } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await register({ name: name.trim() || undefined, email: email.trim(), password });
      router.replace('/(tabs)/field' as any);
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.brand}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>SILO MOBILE</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Create your workspace</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Run jobs, workflows, and field tasks from anywhere.
        </Text>
      </View>

      <AppCard>
        <AppInput label="Name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
        <AppInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@company.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <AppInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="8 characters or more"
          secureTextEntry
        />
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
        <AppButton
          title="Create account"
          onPress={submit}
          loading={submitting}
          disabled={!email.trim() || password.length < 8}
        />
      </AppCard>

      <Text style={[styles.switchText, { color: colors.textSecondary }]}>
        Already have an account?{' '}
        <Link href={'/(auth)/login' as any} style={{ color: colors.primary, fontWeight: '700' }}>
          Sign in
        </Link>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center', paddingVertical: 40 },
  brand: { marginBottom: 25 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  title: { fontSize: 30, fontWeight: '900', marginTop: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  error: { fontSize: 13, marginBottom: 12 },
  switchText: { textAlign: 'center', marginTop: 20, fontSize: 14 },
});
