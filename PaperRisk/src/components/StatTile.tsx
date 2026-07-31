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
    minHeight: 92,
    justifyContent: 'space-between',
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.md,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
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
    fontSize: 21,
    fontWeight: '900',
  },
});
