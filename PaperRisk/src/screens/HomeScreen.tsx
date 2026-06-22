import { BanknoteArrowUp, CircleDollarSign } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { BrandHeader } from '../components/BrandHeader';
import { Panel } from '../components/Panel';
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
  const { casino, player } = state;
  const statusLine = player.loan.principal > 0 ? 'Debt is active and interest keeps growing.' : 'No open debt. Cash is ready to use.';
  const profileLabel = getActiveProfileLabel(state.settings);
  const casinoTone = player.casinoProfit > 0 ? 'positive' : player.casinoProfit < 0 ? 'warning' : 'default';

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
        <Text style={[styles.delta, player.loan.principal > 0 && styles.negativeDelta]}>{statusLine}</Text>
      </View>

      <View style={styles.statsRow}>
        <StatTile label="Cash" value={formatMoney(player.cash)} />
        <StatTile
          label="Debt"
          tone={player.loan.principal > 0 ? 'warning' : 'positive'}
          value={player.loan.principal > 0 ? formatMoney(player.loan.principal) : 'Clear'}
        />
      </View>

      <Panel>
        <Text style={styles.panelTitle}>Quick actions</Text>
        <View style={styles.actions}>
          <ActionButton Icon={CircleDollarSign} onPress={() => onNavigate('casino')} size="large" tone="casino">
            Play
          </ActionButton>
          <ActionButton Icon={BanknoteArrowUp} onPress={() => onNavigate('wallet')} size="large">
            Bank
          </ActionButton>
        </View>
      </Panel>

      <Panel>
        <Text style={styles.panelTitle}>Session</Text>
        <View style={styles.statsRow}>
          <StatTile label="Tokens" tone={casino.tokens > 0 ? 'warning' : 'default'} value={`${casino.tokens}`} />
          <StatTile label="Casino P/L" tone={casinoTone} value={formatMoney(player.casinoProfit)} />
        </View>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  netWorth: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 44,
    fontWeight: '900',
  },
  delta: {
    color: colors.positive,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
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
});
