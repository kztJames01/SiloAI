import { StyleSheet, Text } from 'react-native';
import { MarketingFooter } from '../../src/components/MarketingFooter';
import { Screen } from '../../src/components/Screen';
import { AppCard } from '../../src/components/ui';
import { privacyParagraphs } from '../../src/content/support';
import { useTheme } from '../../src/theme';

export default function PrivacyScreen() {
  const { colors } = useTheme();
  return (
    <Screen title="Privacy Policy" subtitle={`Last updated: ${new Date().toLocaleDateString()}`}>
      <AppCard style={styles.card}>
        {privacyParagraphs.map((p) => (
          <Text key={p.slice(0, 24)} style={[styles.p, { color: colors.textSecondary }]}>
            {p}
          </Text>
        ))}
      </AppCard>
      <MarketingFooter />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  p: { fontSize: 13, lineHeight: 20 },
});
