import { BanknoteArrowUp, CircleDollarSign, TrendingUp } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { AssetListItem } from '../components/AssetListItem';
import { BrandHeader } from '../components/BrandHeader';
import { Panel } from '../components/Panel';
import { PortfolioList } from '../components/PortfolioList';
import { SectionHeader } from '../components/SectionHeader';
import { Screen } from '../components/Screen';
import { getSaveStatusLabel, getSaveStatusTone } from '../components/SaveStatusBadge';
import { StatTile } from '../components/StatTile';
import { formatMoney } from '../domain/finance';
import { getActiveProfileLabel } from '../domain/settingsProfile';
import { useGame } from '../game/GameProvider';
import type { TabKey } from '../navigation/tabs';
import { colors, spacing, typography } from '../theme';

type HomeScreenProps = {
  onNavigate: (tab: TabKey) => void;
};

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { saveStatus, state } = useGame();
  const { player } = state;
  const dailyDelta = player.loan.principal > 0 ? '-0.8% debt pressure' : '+3.4% today';
  const profileLabel = getActiveProfileLabel(state.settings);

  return (
    <Screen>
      <BrandHeader
        screen="Home"
        status={`${getSaveStatusLabel(saveStatus)} | ${profileLabel}`}
        statusTone={getSaveStatusTone(saveStatus)}
      />

      <View style={styles.hero}>
        <Text style={styles.label}>Net worth</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.netWorth}>
          {formatMoney(player.netWorth)}
        </Text>
        <Text style={[styles.delta, player.loan.principal > 0 && styles.negativeDelta]}>{dailyDelta}</Text>
      </View>

      <View style={styles.statsRow}>
        <StatTile label="Cash" value={formatMoney(player.cash)} />
        <StatTile label="Invested" value={formatMoney(player.invested)} />
      </View>

      <Panel>
        <Text style={styles.panelTitle}>Quick actions</Text>
        <View style={styles.actions}>
          <ActionButton Icon={TrendingUp} onPress={() => onNavigate('market')} tone="primary">
            Invest
          </ActionButton>
          <ActionButton Icon={BanknoteArrowUp} onPress={() => onNavigate('wallet')}>
            Borrow
          </ActionButton>
          <ActionButton Icon={CircleDollarSign} onPress={() => onNavigate('casino')} tone="casino">
            Casino
          </ActionButton>
        </View>
      </Panel>

      <SectionHeader title="Watchlist" />
      <View style={styles.list}>
        {state.assets.slice(0, 3).map((asset) => (
          <AssetListItem compact asset={asset} key={asset.id} />
        ))}
      </View>

      <Panel>
        <Text style={styles.panelTitle}>Portfolio</Text>
        <PortfolioList assets={state.assets} positions={player.positions} />
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.xs,
  },
  kicker: {
    color: colors.textFaint,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 14,
    fontWeight: '600',
  },
  netWorth: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 42,
    fontWeight: '800',
  },
  delta: {
    color: colors.positive,
    fontFamily: typography.family,
    fontSize: 15,
    fontWeight: '700',
  },
  negativeDelta: {
    color: colors.negative,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  panelTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
});
