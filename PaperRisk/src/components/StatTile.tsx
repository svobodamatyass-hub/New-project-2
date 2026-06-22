import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

type StatTileProps = {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'negative' | 'warning';
};

export function StatTile({ label, value, tone = 'default' }: StatTileProps) {
  const valueColor = tone === 'default' ? colors.text : colors[tone];

  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 88,
    justifyContent: 'space-between',
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: typography.family,
    fontSize: 20,
    fontWeight: '900',
  },
});
