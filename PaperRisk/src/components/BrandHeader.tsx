import { ShieldCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';
import { Badge } from './Badge';

type BrandHeaderProps = {
  screen: string;
  status?: string;
  statusTone?: 'neutral' | 'positive' | 'negative' | 'warning';
};

export function BrandHeader({ screen, status = 'Paper', statusTone = 'positive' }: BrandHeaderProps) {
  const iconColor = statusTone === 'negative' ? colors.negative : statusTone === 'warning' ? colors.warning : colors.positive;

  return (
    <View style={styles.header}>
      <View style={styles.brandBlock}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark} />
          <Text style={styles.brand}>PaperRisk Casino</Text>
        </View>
        <Text style={styles.screen}>{screen}</Text>
      </View>
      <View style={styles.status}>
        <ShieldCheck color={iconColor} size={16} strokeWidth={2.4} />
        <Badge label={status} tone={statusTone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brandBlock: {
    gap: 3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandMark: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.warning,
    shadowColor: colors.warning,
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  brand: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  screen: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 24,
    fontWeight: '900',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
