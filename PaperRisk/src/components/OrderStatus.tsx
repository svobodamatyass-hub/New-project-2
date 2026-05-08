import { AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

type OrderStatusProps = {
  message: string;
  tone: 'positive' | 'warning';
};

export function OrderStatus({ message, tone }: OrderStatusProps) {
  const Icon = tone === 'positive' ? CheckCircle2 : AlertTriangle;

  return (
    <View style={[styles.status, tone === 'positive' ? styles.positive : styles.warning]}>
      <Icon color={colors[tone]} size={16} strokeWidth={2.4} />
      <Text style={[styles.text, { color: colors[tone] }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  status: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  positive: {
    backgroundColor: colors.positiveSoft,
    borderColor: colors.positiveMuted,
  },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningMuted,
  },
  text: {
    flex: 1,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
});
