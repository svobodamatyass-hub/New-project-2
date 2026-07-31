import { lazy, Suspense, useMemo, useState } from 'react';
import { ArrowLeft, Bomb, CircleDot, CircleDotDashed, CirclePlay, Club, Gem, TrendingUp } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '../components/Badge';
import { BrandHeader } from '../components/BrandHeader';
import { Panel } from '../components/Panel';
import { Screen } from '../components/Screen';
import { CasinoGameSectionSkeleton } from '../components/ScreenSkeletons';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import { casinoGames } from '../domain/casino';
import { formatMoney } from '../domain/finance';
import { getActiveProfileLabel } from '../domain/settingsProfile';
import { colors, spacing, typography, webFocusReset } from '../theme';
import { useGame } from '../game/GameProvider';

const SlotsScreen = lazy(() => import('./SlotsScreen').then((module) => ({ default: module.SlotsScreen })));
const BlackjackScreen = lazy(() => import('./BlackjackScreen').then((module) => ({ default: module.BlackjackScreen })));
const RouletteScreen = lazy(() => import('./RouletteScreen').then((module) => ({ default: module.RouletteScreen })));
const FortuneWheelScreen = lazy(() => import('./FortuneWheelScreen').then((module) => ({ default: module.FortuneWheelScreen })));
const CrashScreen = lazy(() => import('./CrashScreen').then((module) => ({ default: module.CrashScreen })));
const PlinkoScreen = lazy(() => import('./PlinkoScreen').then((module) => ({ default: module.PlinkoScreen })));
const MinesScreen = lazy(() => import('./MinesScreen').then((module) => ({ default: module.MinesScreen })));

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
  const activeGameTitle = useMemo(
    () => casinoGames.find((game) => game.id === casinoView)?.title ?? 'Casino',
    [casinoView],
  );

  const activeGame = useMemo(() => {
    switch (casinoView) {
      case 'slots':
        return <SlotsScreen />;
      case 'blackjack':
        return <BlackjackScreen />;
      case 'roulette':
        return <RouletteScreen />;
      case 'fortune':
        return <FortuneWheelScreen />;
      case 'crash':
        return <CrashScreen />;
      case 'plinko':
        return <PlinkoScreen />;
      case 'mines':
        return <MinesScreen />;
      case 'hub':
      default:
        return null;
    }
  }, [casinoView]);

  return (
    <Screen>
      <BrandHeader
        screen={isHub ? 'Casino' : activeGameTitle}
        status={profileLabel}
        statusTone={profileLabel === 'Chaos' ? 'negative' : profileLabel === 'Chill' ? 'positive' : 'warning'}
      />

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
            <View style={styles.hubHeader}>
              <View>
                <Text style={styles.hubTitle}>Choose a table</Text>
                <Text style={styles.hubCopy}>Token games, live wagers, and high-variance rounds in one bankroll.</Text>
              </View>
              <Badge label={`${casinoGames.length} games`} tone="warning" />
            </View>
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

      {!isHub ? (
        <Panel>
          <View style={styles.gameMetaRow}>
            <StatTile label="Cash" value={formatMoney(state.player.cash)} />
            <StatTile label="Tokens" tone={state.casino.tokens > 0 ? 'warning' : 'default'} value={`${state.casino.tokens}`} />
          </View>
        </Panel>
      ) : null}

      {!isHub ? <Suspense fallback={<CasinoGameSectionSkeleton />}>{activeGame}</Suspense> : null}
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
  hubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  hubTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 22,
    fontWeight: '900',
  },
  hubCopy: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    maxWidth: 220,
  },
  card: {
    minHeight: 104,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.985 }],
  },
  iconFrame: {
    width: 50,
    height: 50,
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
  gameMetaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 19,
    fontWeight: '900',
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
