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
  const iconColor = tone === 'primary' ? colors.background : colors.text;

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
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  largeButton: {
    minHeight: 68,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  neutral: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  primary: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  danger: {
    backgroundColor: colors.negativeSoft,
    borderColor: colors.negativeMuted,
  },
  casino: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningMuted,
  },
  pressed: {
    opacity: 0.74,
  },
  disabled: {
    opacity: 0.48,
  },
  label: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 14,
    fontWeight: '800',
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
