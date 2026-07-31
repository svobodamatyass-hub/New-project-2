import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, spacing, typography, webFocusReset } from '../theme';

type ActionButtonProps = {
  accessibilityLabel?: string;
  children: ReactNode;
  disabled?: boolean;
  Icon?: LucideIcon;
  size?: 'default' | 'large';
  tone?: 'primary' | 'neutral' | 'danger' | 'casino';
  onPress?: () => void;
};

export function ActionButton({
  accessibilityLabel,
  children,
  disabled = false,
  Icon,
  size = 'default',
  tone = 'neutral',
  onPress,
}: ActionButtonProps) {
  const iconColor = tone === 'primary' || tone === 'casino' ? colors.background : colors.text;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'large' && styles.largeButton,
        webFocusReset,
        styles[tone],
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.inner}>
        {Icon ? <Icon color={disabled ? colors.textFaint : iconColor} size={size === 'large' ? 20 : 16} strokeWidth={2.4} /> : null}
        <Text style={[styles.label, size === 'large' && styles.largeLabel, tone === 'primary' && styles.primaryLabel, disabled && styles.disabledLabel]}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 52,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  largeButton: {
    minHeight: 76,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  neutral: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
  },
  primary: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  danger: {
    backgroundColor: '#4A1E1C',
    borderColor: colors.negativeMuted,
  },
  casino: {
    backgroundColor: colors.warning,
    borderColor: '#F4D08A',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.48,
  },
  label: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 15,
    fontWeight: '900',
  },
  largeLabel: {
    fontSize: 17,
  },
  primaryLabel: {
    color: colors.background,
  },
  disabledLabel: {
    color: colors.textFaint,
  },
});
