import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppButton, AppCard, AppInput } from '../../src/components/ui';
import { useTheme } from '../../src/theme';

const actions = [
  { id: 'clock-in', title: 'Clock In', icon: '⏱', color: 'primary' },
  { id: 'log-hazard', title: 'Log Hazard', icon: '⚠', color: 'warning' },
  { id: 'supply-order', title: 'Supply Order', icon: '▣', color: 'secondary' },
  { id: 'job-update', title: 'Job Update', icon: '✓', color: 'info' },
] as const;

export default function FieldScreen() {
  const { colors } = useTheme();
  const [activeAction, setActiveAction] = useState<(typeof actions)[number] | null>(null);
  const [notes, setNotes] = useState('');
  const [jobType, setJobType] = useState('General');
  const [queued, setQueued] = useState(0);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }, []);

  const submit = () => {
    setQueued((value) => value + 1);
    setNotes('');
    setActiveAction(null);
  };

  return (
    <Screen title={greeting} subtitle="What do you need to get done in the field?">
      <View style={styles.statusRow}>
        <View style={[styles.online, { backgroundColor: `${colors.success}18` }]}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={[styles.onlineText, { color: colors.success }]}>Online</Text>
        </View>
        <Text style={[styles.queueText, { color: colors.textSecondary }]}>{queued} saved tasks</Text>
      </View>

      <View style={styles.grid}>
        {actions.map((action) => {
          const actionColor = colors[action.color];
          return (
            <Pressable
              key={action.id}
              onPress={() => setActiveAction(action)}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.78 },
              ]}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${actionColor}18` }]}>
                <Text style={[styles.actionIconText, { color: actionColor }]}>{action.icon}</Text>
              </View>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>{action.title}</Text>
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>Tap to start</Text>
            </Pressable>
          );
        })}
      </View>

      <AppCard style={styles.recent}>
        <Text style={[styles.recentTitle, { color: colors.textPrimary }]}>Today</Text>
        <Text style={[styles.recentNumber, { color: colors.primary }]}>{queued}</Text>
        <Text style={[styles.recentLabel, { color: colors.textSecondary }]}>field updates recorded</Text>
      </AppCard>

      <Modal visible={!!activeAction} transparent animationType="slide" onRequestClose={() => setActiveAction(null)}>
        <Pressable style={styles.overlay} onPress={() => setActiveAction(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{activeAction?.title}</Text>
            <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
              Add the important details before saving.
            </Text>
            <AppInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="What happened?"
              multiline
              numberOfLines={4}
              style={styles.notes}
            />
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Type</Text>
            <View style={styles.chips}>
              {['General', 'Safety', 'Urgent'].map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setJobType(type)}
                  style={[
                    styles.chip,
                    {
                      borderColor: jobType === type ? colors.primary : colors.border,
                      backgroundColor: jobType === type ? `${colors.primary}15` : colors.background,
                    },
                  ]}
                >
                  <Text style={{ color: jobType === type ? colors.primary : colors.textSecondary, fontWeight: '700' }}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.sheetActions}>
              <AppButton title="Cancel" variant="outline" onPress={() => setActiveAction(null)} style={styles.flex} />
              <AppButton title="Save task" onPress={submit} style={styles.flex} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  online: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  dot: { width: 7, height: 7, borderRadius: 10 },
  onlineText: { fontSize: 12, fontWeight: '800' },
  queueText: { fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  action: { width: '48%', minHeight: 145, borderWidth: 1, borderRadius: 20, padding: 16 },
  actionIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  actionIconText: { fontSize: 20, fontWeight: '800' },
  actionTitle: { fontSize: 16, fontWeight: '800' },
  actionHint: { fontSize: 12, marginTop: 5 },
  recent: { marginTop: 18, alignItems: 'center' },
  recentTitle: { fontSize: 14, fontWeight: '700' },
  recentNumber: { fontSize: 34, fontWeight: '900', marginTop: 5 },
  recentLabel: { fontSize: 13 },
  overlay: { flex: 1, backgroundColor: '#00000070', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 35 },
  handle: { width: 42, height: 5, borderRadius: 5, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 23, fontWeight: '900' },
  sheetSubtitle: { fontSize: 14, marginTop: 4, marginBottom: 20 },
  notes: { minHeight: 100, textAlignVertical: 'top', paddingTop: 13 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 23 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  sheetActions: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});
