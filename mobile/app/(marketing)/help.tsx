import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppCard } from '../../src/components/ui';
import { useTheme } from '../../src/theme';

const tutorialSlides = [
  { title: '1. Create a Workflow', text: 'Ask an admin to build workflows on desktop, then run and monitor them here.' },
  { title: '2. Connect Integrations', text: 'Go to Apps, choose an integration, authorize it, then use it inside workflows.' },
  { title: '3. Run and Monitor', text: 'Open Workflows or Runs to trigger automations and check execution logs.' },
  { title: '4. Use Field Actions', text: 'Tap a field action to log work — it can automatically kick off a workflow.' },
];

const faqs = [
  { q: 'How do I start quickly?', a: 'Ask your admin for access to a few workflows, then run them from the Workflows tab.' },
  { q: 'Where can I debug failed runs?', a: 'Open Runs and tap into any execution to see logs, status, and output.' },
  { q: 'Can I use this offline?', a: 'Field actions queue locally when the server is unreachable and sync on the next successful connection.' },
];

export default function HelpScreen() {
  const { colors } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <Screen title="Help Center" subtitle="Tutorials and frequently asked questions">
      <View style={styles.slides}>
        {tutorialSlides.map((slide) => (
          <AppCard key={slide.title} style={styles.slide}>
            <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>{slide.title}</Text>
            <Text style={[styles.slideText, { color: colors.textSecondary }]}>{slide.text}</Text>
          </AppCard>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>FAQs</Text>
      {faqs.map((faq, idx) => (
        <AppCard key={faq.q} style={styles.faq}>
          <Pressable onPress={() => setOpenFaq(openFaq === idx ? null : idx)}>
            <Text style={[styles.faqQ, { color: colors.textPrimary }]}>{faq.q}</Text>
          </Pressable>
          {openFaq === idx ? (
            <Text style={[styles.faqA, { color: colors.textSecondary }]}>{faq.a}</Text>
          ) : null}
        </AppCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  slides: { gap: 12, marginBottom: 8 },
  slide: { gap: 6 },
  slideTitle: { fontSize: 15, fontWeight: '800' },
  slideText: { fontSize: 13, lineHeight: 19 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 18, marginBottom: 10 },
  faq: { marginBottom: 10 },
  faqQ: { fontSize: 14, fontWeight: '700' },
  faqA: { fontSize: 13, marginTop: 8, lineHeight: 19 },
});
