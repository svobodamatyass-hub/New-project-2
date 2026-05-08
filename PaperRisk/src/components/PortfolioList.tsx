import { StyleSheet, Text, View } from 'react-native';

import { formatMoney } from '../domain/finance';
import { colors, spacing, typography } from '../theme';
import type { Asset, PortfolioPosition } from '../types/domain';
import { Badge } from './Badge';

type PortfolioListProps = {
  assets: Asset[];
  positions: PortfolioPosition[];
};

export function PortfolioList({ assets, positions }: PortfolioListProps) {
  if (positions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No positions yet</Text>
        <Text style={styles.emptyText}>Your first paper trades will appear here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {positions.map((position) => {
        const asset = assets.find((item) => item.id === position.assetId);

        if (!asset) {
          return null;
        }

        const marketValue = asset.price * position.shares;
        const costBasis = position.averagePrice * position.shares;
        const gain = marketValue - costBasis;

        return (
          <View key={position.assetId} style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.symbol}>{asset.symbol}</Text>
              <Text style={styles.meta}>
                {position.shares} shares at {formatMoney(position.averagePrice)}
              </Text>
            </View>
            <View style={styles.values}>
              <Text style={styles.value}>{formatMoney(marketValue)}</Text>
              <Badge label={formatMoney(gain)} tone={gain >= 0 ? 'positive' : 'negative'} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  empty: {
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  symbol: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  values: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  value: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 14,
    fontWeight: '800',
  },
});
