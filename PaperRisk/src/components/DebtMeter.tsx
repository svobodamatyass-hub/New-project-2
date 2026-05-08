import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

type DebtMeterProps = {
  debt: number;
  netWorth: number;
};

export function DebtMeter({ debt, netWorth }: DebtMeterProps) {
  const ratio = debt <= 0 ? 0 : Math.min(debt / Math.max(netWorth + debt, 1), 1);
  const percent = Math.round(ratio * 100);
  const tone = ratio > 0.55 ? colors.negative : ratio > 0.25 ? colors.warning : colors.positive;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.label}>Debt load</Text>
        <Text style={[styles.value, { color: tone }]}>{percent}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { backgroundColor: tone, width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '700',
  },
  value: {
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '800',
  },
  track: {
    height: 8,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fill: {
    height: '100%',
    borderRadius: 8,
  },
});
