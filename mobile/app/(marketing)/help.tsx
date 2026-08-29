import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MarketingFooter } from '../../src/components/MarketingFooter';
import { Screen } from '../../src/components/Screen';
import { AppButton, AppCard } from '../../src/components/ui';
import { faqs, tutorialSlides } from '../../src/content/support';
import { useTheme } from '../../src/theme';

export default function HelpScreen() {
  const { colors } = useTheme();
  const [idx, setIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const current = tutorialSlides[idx];

  const next = () => setIdx((i) => (i + 1) % tutorialSlides.length);
  const prev = () => setIdx((i) => (i - 1 + tutorialSlides.length) % tutorialSlides.length);

  return (
    <Screen title="Help Center" subtitle="Learn every flow of our tools with interactive slides.">
      <AppCard style={styles.tutorial}>
        <View style={styles.tutorialHead}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Interactive Tutorial</Text>
          <Text style={[styles.counter, { color: colors.textSecondary }]}>
            {idx + 1} / {tutorialSlides.length}
          </Text>
        </View>
        <View style={[styles.slideBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>{current.title}</Text>
          <Text style={[styles.slideText, { color: colors.textSecondary }]}>{current.text}</Text>
        </View>
        <View style={styles.nav}>
          <AppButton title="Previous" variant="outline" onPress={prev} style={styles.navBtn} />
          <AppButton title="Next" onPress={next} style={styles.navBtn} />
        </View>
      </AppCard>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 18 }]}>FAQs</Text>
      {faqs.map((faq, i) => (
        <AppCard key={faq.q} style={styles.faq}>
          <Pressable onPress={() => setOpenFaq(openFaq === i ? null : i)}>
            <Text style={[styles.faqQ, { color: colors.textPrimary }]}>{faq.q}</Text>
          </Pressable>
          {openFaq === i ? (
            <Text style={[styles.faqA, { color: colors.textSecondary }]}>{faq.a}</Text>
          ) : null}
        </AppCard>
      ))}

      <MarketingFooter />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tutorial: { gap: 12 },
  tutorialHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  counter: { fontSize: 12 },
  slideBox: { padding: 14, borderRadius: 12, minHeight: 110 },
  slideTitle: { fontSize: 16, fontWeight: '800' },
  slideText: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  nav: { flexDirection: 'row', gap: 10 },
  navBtn: { flex: 1 },
  faq: { marginTop: 10 },
  faqQ: { fontSize: 14, fontWeight: '700' },
  faqA: { fontSize: 13, marginTop: 8, lineHeight: 19 },
});
