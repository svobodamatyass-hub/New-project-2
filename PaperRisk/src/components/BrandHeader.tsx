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
      <View>
        <Text style={styles.brand}>PaperRisk</Text>
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
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brand: {
    color: colors.textFaint,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '800',
  },
  screen: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
