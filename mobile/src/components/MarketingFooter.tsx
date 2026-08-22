import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

const links = [
  { label: 'Welcome', href: '/(marketing)/welcome' },
  { label: 'Privacy', href: '/(marketing)/privacy' },
  { label: 'Contact', href: '/(marketing)/contact' },
  { label: 'Help', href: '/(marketing)/help' },
] as const;

export function MarketingFooter() {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { borderTopColor: colors.border }]}>
      <Text style={[styles.copy, { color: colors.textTertiary }]}>© {new Date().getFullYear()} Silo</Text>
      <View style={styles.links}>
        {links.map((link) => (
          <Pressable key={link.href} onPress={() => router.push(link.href as any)}>
            <Text style={[styles.link, { color: colors.primary }]}>{link.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 28, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  copy: { fontSize: 12 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  link: { fontSize: 13, fontWeight: '600' },
});
