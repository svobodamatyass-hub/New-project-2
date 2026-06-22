import { useState } from 'react';
import { ArrowLeft, Bomb, CircleDot, CircleDotDashed, CirclePlay, Club, Gem, TrendingUp } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '../components/Badge';
import { BrandHeader } from '../components/BrandHeader';
import { Panel } from '../components/Panel';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import { casinoGames } from '../domain/casino';
import { formatMoney } from '../domain/finance';
import { getActiveProfileLabel } from '../domain/settingsProfile';
import { colors, spacing, typography, webFocusReset } from '../theme';
import { useGame } from '../game/GameProvider';
import { BlackjackScreen } from './BlackjackScreen';
import { CrashScreen } from './CrashScreen';
import { FortuneWheelScreen } from './FortuneWheelScreen';
import { MinesScreen } from './MinesScreen';
import { PlinkoScreen } from './PlinkoScreen';
import { RouletteScreen } from './RouletteScreen';
import { SlotsScreen } from './SlotsScreen';

type CasinoView = 'hub' | 'slots' | 'blackjack' | 'roulette' | 'fortune' | 'crash' | 'plinko' | 'mines';

const icons = {
  slots: Gem,
  blackjack: Club,
  roulette: CircleDot,
  fortune: CircleDotDashed,
  crash: TrendingUp,
  plinko: CirclePlay,
  mines: Bomb,
};

export function CasinoScreen() {
  const { state } = useGame();
  const [casinoView, setCasinoView] = useState<CasinoView>('hub');
  const isHub = casinoView === 'hub';
  const profileLabel = getActiveProfileLabel(state.settings);

  return (
    <Screen>
      <BrandHeader screen="Casino" status={profileLabel} statusTone={profileLabel === 'Chaos' ? 'negative' : profileLabel === 'Chill' ? 'positive' : 'warning'} />

      {!isHub ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setCasinoView('hub')}
          style={({ pressed }) => [styles.backButton, webFocusReset, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.text} size={18} strokeWidth={2.4} />
          <Text style={styles.backText}>Casino</Text>
        </Pressable>
      ) : null}

      {isHub ? (
        <>
          <SectionHeader title="Games" />

          <Panel>
            <View style={styles.statsRow}>
              <StatTile label="Cash" value={formatMoney(state.player.cash)} />
              <StatTile label="Tokens" tone={state.casino.tokens > 0 ? 'warning' : 'default'} value={`${state.casino.tokens}`} />
            </View>
          </Panel>

          <View style={styles.list}>
            {casinoGames.map((game) => {
              const Icon = icons[game.id];
              return (
                <Pressable
                  accessibilityRole="button"
                  key={game.id}
                  onPress={() => setCasinoView(game.id)}
                  style={({ pressed }) => [
                    styles.card,
                    webFocusReset,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.iconFrame, { borderColor: colors[`${game.accent}Muted`] }]}>
                    <Icon color={colors[game.accent]} size={24} strokeWidth={2.2} />
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.title}>{game.title}</Text>
                    <Text style={styles.description}>{game.description}</Text>
                  </View>
                  <Badge label="Open" tone={game.accent} />
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {casinoView === 'slots' ? <SlotsScreen /> : null}
      {casinoView === 'blackjack' ? <BlackjackScreen /> : null}
      {casinoView === 'roulette' ? <RouletteScreen /> : null}
      {casinoView === 'fortune' ? <FortuneWheelScreen /> : null}
      {casinoView === 'crash' ? <CrashScreen /> : null}
      {casinoView === 'plinko' ? <PlinkoScreen /> : null}
      {casinoView === 'mines' ? <MinesScreen /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backText: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '800',
  },
  list: {
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    minHeight: 92,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.985 }],
  },
  iconFrame: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    color: colors.textFaint,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 4,
  },
});
