import { useState } from 'react';
import { RefreshCcw } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { InfoRow } from '../components/InfoRow';
import { Panel } from '../components/Panel';
import { getSaveStatusLabel } from '../components/SaveStatusBadge';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { useGame } from '../game/GameProvider';
import { colors, spacing, typography, webFocusReset } from '../theme';

const marketSpeedOptions: Array<{ key: 'slow' | 'normal' | 'fast'; label: string; caption: string }> = [
  { key: 'slow', label: 'Slow', caption: '25s' },
  { key: 'normal', label: 'Normal', caption: '15s' },
  { key: 'fast', label: 'Fast', caption: '7s' },
];
const marketVolatilityOptions: Array<{ key: 'low' | 'normal' | 'high'; label: string; caption: string }> = [
  { key: 'low', label: 'Low', caption: 'Calmer moves' },
  { key: 'normal', label: 'Normal', caption: 'Balanced' },
  { key: 'high', label: 'High', caption: 'Bigger swings' },
];
const economyDifficultyOptions: Array<{ key: 'easy' | 'normal' | 'hard'; label: string; caption: string }> = [
  { key: 'easy', label: 'Easy', caption: 'Lighter debt' },
  { key: 'normal', label: 'Normal', caption: 'Standard' },
  { key: 'hard', label: 'Hard', caption: 'Stronger pressure' },
];
const profileOptions = [
  {
    id: 'chill',
    label: 'Chill',
    speed: 'slow' as const,
    volatility: 'low' as const,
    difficulty: 'easy' as const,
  },
  {
    id: 'balanced',
    label: 'Balanced',
    speed: 'normal' as const,
    volatility: 'normal' as const,
    difficulty: 'normal' as const,
  },
  {
    id: 'chaos',
    label: 'Chaos',
    speed: 'fast' as const,
    volatility: 'high' as const,
    difficulty: 'hard' as const,
  },
] as const;

function getVolatilityMultiplier(level: 'low' | 'normal' | 'high') {
  switch (level) {
    case 'low':
      return 0.7;
    case 'high':
      return 1.4;
    case 'normal':
    default:
      return 1;
  }
}

function getDifficultyInterestMultiplier(level: 'easy' | 'normal' | 'hard') {
  switch (level) {
    case 'easy':
      return 0.75;
    case 'hard':
      return 1.3;
    case 'normal':
    default:
      return 1;
  }
}

export function SettingsScreen() {
  const [isResetArmed, setIsResetArmed] = useState(false);
  const { resetGame, saveStatus, setEconomyDifficulty, setMarketSpeed, setMarketVolatility, state } = useGame();
  const totalTransactions = state.transactions.length;
  const activeProfileId =
    profileOptions.find(
      (profile) =>
        profile.speed === state.settings.marketSpeed &&
        profile.volatility === state.settings.marketVolatility &&
        profile.difficulty === state.settings.economyDifficulty,
    )?.id ?? null;

  async function handleResetPress() {
    if (!isResetArmed) {
      setIsResetArmed(true);
      return;
    }

    setIsResetArmed(false);
    await resetGame();
  }

  function applyProfile(profile: (typeof profileOptions)[number]) {
    setMarketSpeed(profile.speed);
    setMarketVolatility(profile.volatility);
    setEconomyDifficulty(profile.difficulty);
  }

  return (
    <Screen>
      <SectionHeader title="Settings" />

      <Panel>
        <Text style={styles.panelTitle}>Storage</Text>
        <InfoRow label="Save status" value={getSaveStatusLabel(saveStatus)} />
        <InfoRow label="State version" value={`${state.version}`} />
        <InfoRow label="Activity rows" value={`${totalTransactions}`} />
      </Panel>

      <Panel>
        <Text style={styles.panelTitle}>Simulation</Text>
        <Text style={styles.controlLabel}>Preset</Text>
        <View style={styles.segmentRow}>
          {profileOptions.map((profile) => {
            const selected = activeProfileId === profile.id;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={profile.id}
                onPress={() => applyProfile(profile)}
                style={({ pressed }) => [
                  styles.segment,
                  webFocusReset,
                  selected && styles.segmentSelected,
                  pressed && styles.segmentPressed,
                ]}
              >
                <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{profile.label}</Text>
                <Text style={[styles.segmentCaption, selected && styles.segmentCaptionSelected]}>
                  {profile.speed} | {profile.volatility} | {profile.difficulty}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.controlLabel}>Market speed</Text>
        <View style={styles.segmentRow}>
          {marketSpeedOptions.map((item) => {
            const selected = state.settings.marketSpeed === item.key;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={item.key}
                onPress={() => setMarketSpeed(item.key)}
                style={({ pressed }) => [
                  styles.segment,
                  webFocusReset,
                  selected && styles.segmentSelected,
                  pressed && styles.segmentPressed,
                ]}
              >
                <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{item.label}</Text>
                <Text style={[styles.segmentCaption, selected && styles.segmentCaptionSelected]}>{item.caption}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.controlLabel}>Market volatility</Text>
        <View style={styles.segmentRow}>
          {marketVolatilityOptions.map((item) => {
            const selected = state.settings.marketVolatility === item.key;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={item.key}
                onPress={() => setMarketVolatility(item.key)}
                style={({ pressed }) => [
                  styles.segment,
                  webFocusReset,
                  selected && styles.segmentSelected,
                  pressed && styles.segmentPressed,
                ]}
              >
                <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{item.label}</Text>
                <Text style={[styles.segmentCaption, selected && styles.segmentCaptionSelected]}>{item.caption}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.controlLabel}>Economy difficulty</Text>
        <View style={styles.segmentRow}>
          {economyDifficultyOptions.map((item) => {
            const selected = state.settings.economyDifficulty === item.key;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={item.key}
                onPress={() => setEconomyDifficulty(item.key)}
                style={({ pressed }) => [
                  styles.segment,
                  webFocusReset,
                  selected && styles.segmentSelected,
                  pressed && styles.segmentPressed,
                ]}
              >
                <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{item.label}</Text>
                <Text style={[styles.segmentCaption, selected && styles.segmentCaptionSelected]}>{item.caption}</Text>
              </Pressable>
            );
          })}
        </View>
        <InfoRow label="Price swing power" value={`${getVolatilityMultiplier(state.settings.marketVolatility).toFixed(2)}x`} />
        <InfoRow
          label="Debt interest pressure"
          value={`${getDifficultyInterestMultiplier(state.settings.economyDifficulty).toFixed(2)}x`}
        />
        <View style={styles.resetRow}>
          <ActionButton Icon={RefreshCcw} onPress={handleResetPress} tone={isResetArmed ? 'danger' : 'neutral'}>
            {isResetArmed ? 'Confirm reset' : 'Reset all progress'}
          </ActionButton>
        </View>
        {isResetArmed ? <Text style={styles.resetHint}>Confirm reset</Text> : null}
      </Panel>
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
  controlLabel: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: 56,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  segmentSelected: {
    borderColor: colors.warningMuted,
    backgroundColor: colors.warningSoft,
  },
  segmentPressed: {
    opacity: 0.72,
  },
  segmentLabel: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '900',
  },
  segmentLabelSelected: {
    color: colors.warning,
  },
  segmentCaption: {
    color: colors.textFaint,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '700',
  },
  segmentCaptionSelected: {
    color: colors.warningMuted,
  },
  resetRow: {
    minHeight: 48,
  },
  resetHint: {
    color: colors.negative,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    paddingTop: spacing.xs,
  },
});
