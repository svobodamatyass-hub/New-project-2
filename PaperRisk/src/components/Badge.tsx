import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

type BadgeProps = {
  label: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'warning';
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={[styles.label, tone !== 'neutral' && styles[`${tone}Label`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 26,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  neutral: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
  },
  positive: {
    backgroundColor: colors.positiveSoft,
    borderColor: colors.positiveMuted,
  },
  negative: {
    backgroundColor: colors.negativeSoft,
    borderColor: colors.negativeMuted,
  },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningMuted,
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '800',
  },
  positiveLabel: {
    color: colors.positive,
  },
  negativeLabel: {
    color: colors.negative,
  },
  warningLabel: {
    color: colors.warning,
  },
});
