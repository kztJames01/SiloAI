import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppCard } from '../../src/components/ui';
import { useTheme } from '../../src/theme';

export default function PrivacyScreen() {
  const { colors } = useTheme();
  return (
    <Screen title="Privacy Policy" subtitle={`Last updated: ${new Date().toLocaleDateString()}`}>
      <AppCard style={styles.card}>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          We collect only the information needed to provide workflow automation and integrations.
        </Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          We use your data to run automations, improve service quality, and support troubleshooting.
        </Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          We do not sell your personal data. Access is restricted to authorized systems and team members.
        </Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          You can request account data changes or deletion by contacting our support team.
        </Text>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  p: { fontSize: 13, lineHeight: 20 },
});
