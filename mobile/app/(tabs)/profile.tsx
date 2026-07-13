import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppButton, AppCard } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { createMobileExecutionApi } from '../../src/lib/execution';
import { createMobileWorkflowApi } from '../../src/lib/workflow';
import { useTheme } from '../../src/theme';

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { colors, isDark, setColorScheme } = useTheme();
  const workflowApi = useMemo(() => createMobileWorkflowApi(() => token), [token]);
  const executionApi = useMemo(() => createMobileExecutionApi(() => token), [token]);
  const [workflowCount, setWorkflowCount] = useState(0);
  const [executionCount, setExecutionCount] = useState(0);

  useEffect(() => {
    Promise.all([workflowApi.list(), executionApi.list()])
      .then(([workflows, executions]) => {
        setWorkflowCount(workflows.workflows.length);
        setExecutionCount(executions.executions.length);
      })
      .catch(() => {});
  }, [workflowApi, executionApi]);

  const initial = (user?.name || user?.email || 'S').charAt(0).toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : 'Silo member';

  return (
    <Screen title="Profile" subtitle="Account and mobile preferences">
      <AppCard style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.onPrimary }]}>{initial}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name || 'Silo User'}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
          <Text style={[styles.member, { color: colors.textTertiary }]}>{memberSince}</Text>
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
      </View>

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
  member: { fontSize: 11, marginTop: 7 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 30, fontWeight: '900' },
  statLabel: { fontSize: 12, marginTop: 3 },
  settings: { marginTop: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 15 },
  settingRow: { flexDirection: 'row', alignItems: 'center' },
  settingCopy: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '700' },
  settingSubtitle: { fontSize: 12, marginTop: 4 },
  logout: { marginTop: 18 },
});
