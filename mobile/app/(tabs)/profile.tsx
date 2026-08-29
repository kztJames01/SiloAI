import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppButton, AppCard, AppInput } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { createMobileExecutionApi } from '../../src/lib/execution';
import { createMobileIntegrationApi } from '../../src/lib/integration';
import { createMobileWorkflowApi } from '../../src/lib/workflow';
import { createMobileAuthApi } from '../../src/lib/auth';
import { isAdmin } from '../../src/lib/role';
import { useTheme } from '../../src/theme';

function NavRow({ label, hint, onPress, color }: { label: string; hint: string; onPress: () => void; color: string }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.navRow, { borderBottomColor: colors.border }]}>
      <View style={styles.navText}>
        <Text style={[styles.navLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[styles.navHint, { color: colors.textSecondary }]}>{hint}</Text>
      </View>
      <Text style={[styles.navChevron, { color }]}>›</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { colors, isDark, setColorScheme } = useTheme();
  const workflowApi = useMemo(() => createMobileWorkflowApi(() => token), [token]);
  const executionApi = useMemo(() => createMobileExecutionApi(() => token), [token]);
  const integrationApi = useMemo(() => createMobileIntegrationApi(() => token), [token]);
  const authApi = useMemo(() => createMobileAuthApi(), []);
  const [workflowCount, setWorkflowCount] = useState(0);
  const [executionCount, setExecutionCount] = useState(0);
  const [integrationCount, setIntegrationCount] = useState(0);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    Promise.all([workflowApi.list(), executionApi.list(), integrationApi.listUser()])
      .then(([workflows, executions, integrations]) => {
        setWorkflowCount(workflows.workflows.length);
        setExecutionCount(executions.executions.length);
        setIntegrationCount(integrations.connections.length);
      })
      .catch(() => {});
  }, [workflowApi, executionApi, integrationApi]);

  const initial = (user?.name || user?.email || 'S').charAt(0).toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : 'Silo member';

  const roleLabel = user?.role === 'FIELD' ? 'Field worker' : 'Admin';
  const admin = isAdmin(user?.role);

  const changePassword = async () => {
    if (!token) return;
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    setPasswordError('');
    setSavingPassword(true);
    try {
      await authApi.changePassword(token, { currentPassword, newPassword });
      Alert.alert('Password updated');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordError(err?.data?.error || err?.message || 'Could not update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Screen title="Profile" subtitle="Account and mobile preferences">
      <AppCard style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.onPrimary }]}>{initial}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name || 'Silo User'}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
          <View style={styles.roleRow}>
            <Text style={[styles.rolePill, { color: colors.primary, backgroundColor: `${colors.primary}18` }]}>{roleLabel}</Text>
            <Text style={[styles.member, { color: colors.textTertiary }]}>{memberSince}</Text>
          </View>
        </View>
      </AppCard>

      <View style={styles.stats}>
        <AppCard style={styles.stat}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{workflowCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Workflows</Text>
        </AppCard>
        <AppCard style={styles.stat}>
          <Text style={[styles.statNumber, { color: colors.secondary }]}>{executionCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Runs</Text>
        </AppCard>
        <AppCard style={styles.stat}>
          <Text style={[styles.statNumber, { color: colors.tertiary }]}>{integrationCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Apps</Text>
        </AppCard>
      </View>

      <AppCard style={styles.settings}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>More</Text>
        {admin ? (
          <>
            <NavRow label="Apps & Integrations" hint="Browse, connect, and manage" color={colors.primary} onPress={() => router.push('/integrations' as any)} />
            <NavRow label="AI Agents" hint="View and run your agents" color={colors.primary} onPress={() => router.push('/agents' as any)} />
          </>
        ) : null}
        <NavRow label="Welcome" hint="About Silo" color={colors.textTertiary} onPress={() => router.push('/(marketing)/welcome' as any)} />
        <NavRow label="Help Center" hint="Tutorials and FAQs" color={colors.textTertiary} onPress={() => router.push('/(marketing)/help' as any)} />
        <NavRow label="Contact Us" hint="Reach the Silo team" color={colors.textTertiary} onPress={() => router.push('/(marketing)/contact' as any)} />
        <NavRow label="Privacy Policy" hint="How we handle your data" color={colors.textTertiary} onPress={() => router.push('/(marketing)/privacy' as any)} />
      </AppCard>

      <AppCard style={styles.settings}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Appearance</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Dark mode</Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Use a darker theme on this device</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(value) => setColorScheme(value ? 'dark' : 'light')}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </AppCard>

      <AppCard style={styles.settings}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Security</Text>
        <AppButton
          title={showPasswordForm ? 'Cancel' : 'Change password'}
          variant="outline"
          onPress={() => {
            setShowPasswordForm((v) => !v);
            setPasswordError('');
          }}
        />
        {showPasswordForm ? (
          <View style={styles.passwordForm}>
            <AppInput
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              secureTextEntry
            />
            <AppInput
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              secureTextEntry
            />
            {passwordError ? <Text style={[styles.error, { color: colors.error }]}>{passwordError}</Text> : null}
            <AppButton
              title="Update password"
              onPress={changePassword}
              loading={savingPassword}
              disabled={!currentPassword || newPassword.length < 8}
            />
          </View>
        ) : null}
      </AppCard>

      <AppButton title="Sign out" variant="outline" onPress={logout} style={styles.logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 27, fontWeight: '900' },
  profileInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '800' },
  email: { fontSize: 13, marginTop: 3 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  rolePill: { fontSize: 10, fontWeight: '800', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, textTransform: 'uppercase' },
  member: { fontSize: 11 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 26, fontWeight: '900' },
  statLabel: { fontSize: 11, marginTop: 3 },
  settings: { marginTop: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  settingRow: { flexDirection: 'row', alignItems: 'center' },
  settingCopy: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '700' },
  settingSubtitle: { fontSize: 12, marginTop: 4 },
  navRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  navText: { flex: 1 },
  navLabel: { fontSize: 14, fontWeight: '700' },
  navHint: { fontSize: 12, marginTop: 3 },
  navChevron: { fontSize: 24 },
  passwordForm: { marginTop: 14 },
  error: { fontSize: 13, marginBottom: 10 },
  logout: { marginTop: 18 },
});
