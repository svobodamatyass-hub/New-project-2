import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

type InfoRowProps = {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'negative' | 'warning';
};

export function InfoRow({ label, value, tone = 'default' }: InfoRowProps) {
  const valueColor = tone === 'default' ? colors.text : colors[tone];

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '700',
  },
  value: {
    fontFamily: typography.family,
    fontSize: 14,
    fontWeight: '800',
  },
});
