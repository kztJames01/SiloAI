import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';

export function AppButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.secondary
        : variant === 'danger'
          ? colors.error
          : 'transparent';
  const textColor = variant === 'outline' ? colors.textPrimary : colors.onPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, borderColor: variant === 'outline' ? colors.border : background },
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function AppInput({ label, style, ...props }: TextInputProps & { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.inputWrap}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <TextInput
        {...props}
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
          style,
        ]}
      />
    </View>
  );
}

export function AppCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function StatusPill({ status }: { status: string }) {
  const { colors } = useTheme();
  const normalized = status.toUpperCase();
  const good = normalized === 'ACTIVE' || normalized === 'SUCCESS';
  const bad = normalized === 'FAILED' || normalized === 'ERROR';
  const color = good ? colors.success : bad ? colors.error : colors.warning;
  return (
    <View style={[styles.pill, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.pillText, { color }]}>{status}</Text>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyIcon, { color: colors.primary }]}>◇</Text>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonText: { fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  inputWrap: { gap: 7, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600' },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  pillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  empty: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 50 },
  emptyIcon: { fontSize: 42, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 5 },
  emptyMessage: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
