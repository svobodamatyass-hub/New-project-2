import { useState } from 'react';
import { ArrowLeft, CircleDot, Club, Gem } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '../components/Badge';
import { BrandHeader } from '../components/BrandHeader';
import { InfoRow } from '../components/InfoRow';
import { Panel } from '../components/Panel';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { casinoGames, getCasinoDifficultyConfig } from '../domain/casino';
import { getActiveProfileLabel } from '../domain/settingsProfile';
import { colors, spacing, typography, webFocusReset } from '../theme';
import { useGame } from '../game/GameProvider';
import { BlackjackScreen } from './BlackjackScreen';
import { RouletteScreen } from './RouletteScreen';
import { SlotsScreen } from './SlotsScreen';

type CasinoView = 'hub' | 'slots' | 'blackjack' | 'roulette';

const icons = {
  slots: Gem,
  blackjack: Club,
  roulette: CircleDot,
};

function getCasinoReturnTone(valuePercent: number) {
  if (valuePercent > 0.05) return 'positive' as const;
  if (valuePercent < -0.05) return 'negative' as const;
  return 'default' as const;
}

export function CasinoScreen() {
  const { state } = useGame();
  const [casinoView, setCasinoView] = useState<CasinoView>('hub');
  const isHub = casinoView === 'hub';
  const profileLabel = getActiveProfileLabel(state.settings);
  const casinoConfig = getCasinoDifficultyConfig(state.settings.economyDifficulty);
  const slotsEdge = (casinoConfig.slotsPayoutMultiplier - 1) * 100;
  const rouletteEdge = (casinoConfig.roulettePayoutMultiplier - 1) * 100;
  const blackjackEdge = (casinoConfig.blackjackPayoutMultiplier - 1) * 100;

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
          <SectionHeader title="Games" caption="Choose a mini game. Each one runs on fake money only." />

          <Panel>
            <Text style={styles.panelTitle}>Return preview</Text>
            <InfoRow label="Slots" tone={getCasinoReturnTone(slotsEdge)} value={`${slotsEdge >= 0 ? '+' : ''}${slotsEdge.toFixed(1)}%`} />
            <InfoRow
              label="Roulette"
              tone={getCasinoReturnTone(rouletteEdge)}
              value={`${rouletteEdge >= 0 ? '+' : ''}${rouletteEdge.toFixed(1)}%`}
            />
            <InfoRow
              label="Blackjack"
              tone={getCasinoReturnTone(blackjackEdge)}
              value={`${blackjackEdge >= 0 ? '+' : ''}${blackjackEdge.toFixed(1)}%`}
            />
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
                  <Badge label="Play" tone={game.accent} />
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {casinoView === 'slots' ? <SlotsScreen /> : null}
      {casinoView === 'blackjack' ? <BlackjackScreen /> : null}
      {casinoView === 'roulette' ? <RouletteScreen /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  panelTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: '800',
  },
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
    opacity: 0.76,
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
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});
