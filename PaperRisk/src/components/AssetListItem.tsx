import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Asset } from '../types/domain';
import { formatMoney, formatPercent } from '../domain/finance';
import { getVolatilityLabel } from '../domain/market';
import { colors, spacing, typography, webFocusReset } from '../theme';
import { Badge } from './Badge';
import { MiniTrend } from './MiniTrend';

type AssetListItemProps = {
  asset: Asset;
  compact?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
};

export function AssetListItem({ asset, compact = false, isSelected = false, onPress }: AssetListItemProps) {
  const tone = asset.changePercent >= 0 ? 'positive' : 'negative';
  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: isSelected } : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        webFocusReset,
        compact && styles.compactCard,
        isSelected && styles.selectedCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.identity}>
          <Text style={styles.symbol}>{asset.symbol}</Text>
          <Text style={styles.name}>{asset.name}</Text>
        </View>
        {!compact ? <MiniTrend history={asset.priceHistory} /> : null}
        <View style={styles.numbers}>
          <Text style={styles.price}>{formatMoney(asset.price)}</Text>
          <Badge label={formatPercent(asset.changePercent)} tone={tone} />
        </View>
      </View>

      {!compact ? (
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{asset.sector}</Text>
          <Text style={styles.meta}>{getVolatilityLabel(asset)}</Text>
        </View>
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  compactCard: {
    minHeight: 72,
    paddingVertical: spacing.md,
  },
  selectedCard: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceRaised,
  },
  pressed: {
    opacity: 0.76,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  symbol: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 18,
    fontWeight: '800',
  },
  name: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '600',
  },
  numbers: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  price: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    color: colors.textFaint,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '700',
  },
});
