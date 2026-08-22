import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MarketingFooter } from '../../src/components/MarketingFooter';
import { Screen } from '../../src/components/Screen';
import { AppButton, AppCard } from '../../src/components/ui';
import { welcomeHighlights, welcomeQuote } from '../../src/content/support';
import { useTheme } from '../../src/theme';

export default function WelcomeScreen() {
  const { colors } = useTheme();

  return (
    <Screen title="Build. Integrate. Automate." subtitle="Run your work with Silo.">
      <View style={[styles.badge, { backgroundColor: `${colors.primary}18` }]}>
        <Text style={[styles.badgeText, { color: colors.primary }]}>✦ Your automation command center</Text>
      </View>

      <Text style={[styles.lead, { color: colors.textSecondary }]}>
        Create smart workflows, connect apps, and move faster with less manual work.
      </Text>

      <View style={styles.cta}>
        <AppButton title="Get Started Free" onPress={() => router.push('/(auth)/register' as any)} />
        <AppButton title="I already have account" variant="outline" onPress={() => router.push('/(auth)/login' as any)} />
      </View>

      <View style={styles.highlights}>
        {welcomeHighlights.map((item) => (
          <AppCard key={item.title} style={styles.highlight}>
            <Text style={styles.highlightIcon}>{item.icon}</Text>
            <Text style={[styles.highlightTitle, { color: colors.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.highlightText, { color: colors.textSecondary }]}>{item.text}</Text>
          </AppCard>
        ))}
      </View>

      <AppCard style={styles.quote}>
        <Text style={styles.stars}>★★★★★</Text>
        <Text style={[styles.quoteText, { color: colors.textSecondary }]}>“{welcomeQuote}”</Text>
      </AppCard>

      <View style={styles.quickLinks}>
        <Pressable onPress={() => router.push('/(marketing)/help' as any)}>
          <Text style={[styles.quickLink, { color: colors.primary }]}>Help & Tutorial</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(marketing)/contact' as any)}>
          <Text style={[styles.quickLink, { color: colors.primary }]}>Contact Us</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(marketing)/privacy' as any)}>
          <Text style={[styles.quickLink, { color: colors.primary }]}>Privacy Policy</Text>
        </Pressable>
      </View>

      <MarketingFooter />
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  lead: { fontSize: 15, lineHeight: 22, marginBottom: 18 },
  cta: { gap: 10, marginBottom: 20 },
  highlights: { gap: 12 },
  highlight: { gap: 6 },
  highlightIcon: { fontSize: 22 },
  highlightTitle: { fontSize: 16, fontWeight: '800' },
  highlightText: { fontSize: 13, lineHeight: 19 },
  quote: { marginTop: 16, gap: 8 },
  stars: { fontSize: 14, color: '#facc15' },
  quoteText: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 20 },
  quickLink: { fontSize: 13, fontWeight: '700' },
});
