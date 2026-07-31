import { useMemo, useState } from 'react';
import { Minus, Plus, RefreshCcw } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';

import { ActionButton } from '../components/ActionButton';
import { Badge } from '../components/Badge';
import { InfoRow } from '../components/InfoRow';
import { Panel } from '../components/Panel';
import { getSaveStatusLabel } from '../components/SaveStatusBadge';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { useGame } from '../game/GameProvider';
import { colors, spacing, typography, webFocusReset } from '../theme';

const economyDifficultyOptions: Array<{ key: 'easy' | 'normal' | 'hard'; label: string; caption: string }> = [
  { key: 'easy', label: 'Easy', caption: 'Lighter debt' },
  { key: 'normal', label: 'Normal', caption: 'Standard' },
  { key: 'hard', label: 'Hard', caption: 'Stronger pressure' },
];
const profileOptions = [
  {
    id: 'chill',
    label: 'Chill',
    difficulty: 'easy' as const,
  },
  {
    id: 'balanced',
    label: 'Balanced',
    difficulty: 'normal' as const,
  },
  {
    id: 'chaos',
    label: 'Chaos',
    difficulty: 'hard' as const,
  },
] as const;

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

function TuningRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.tuningRow}>
      <Text style={styles.tuningLabel}>{label}</Text>
      <View style={styles.tuningControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canDecrease }}
          disabled={!canDecrease}
          onPress={() => onChange(Math.max(min, Number((value - step).toFixed(2))))}
          style={({ pressed }) => [styles.tuningButton, webFocusReset, !canDecrease && styles.disabled, pressed && styles.segmentPressed]}
        >
          <Minus color={colors.text} size={14} />
        </Pressable>
        <Text style={styles.tuningValue}>{value.toFixed(2)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canIncrease }}
          disabled={!canIncrease}
          onPress={() => onChange(Math.min(max, Number((value + step).toFixed(2))))}
          style={({ pressed }) => [styles.tuningButton, webFocusReset, !canIncrease && styles.disabled, pressed && styles.segmentPressed]}
        >
          <Plus color={colors.text} size={14} />
        </Pressable>
      </View>
    </View>
  );
}

function ToggleRow({
  label,
  caption,
  value,
  onChange,
}: {
  label: string;
  caption?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.toggleHeader}>
        <Text style={styles.controlLabel}>{label}</Text>
        <Text style={styles.toggleValue}>{value ? 'On' : 'Off'}</Text>
      </View>
      {caption ? <Text style={styles.toggleCaption}>{caption}</Text> : null}
      <View style={styles.segmentRow}>
        {[true, false].map((option) => {
          const selected = value === option;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option ? 'on' : 'off'}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                styles.segment,
                webFocusReset,
                selected && styles.segmentSelected,
                pressed && styles.segmentPressed,
              ]}
            >
              <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{option ? 'On' : 'Off'}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function VolumeSliderRow({
  label,
  caption,
  value,
  onChange,
}: {
  label: string;
  caption?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const percent = Math.round(value * 100);

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.toggleHeader}>
        <Text style={styles.controlLabel}>{label}</Text>
        <Text style={styles.toggleValue}>{percent}%</Text>
      </View>
      {caption ? <Text style={styles.toggleCaption}>{caption}</Text> : null}
      <View style={styles.sliderCard}>
        <Slider
          maximumTrackTintColor={colors.border}
          maximumValue={1}
          minimumTrackTintColor={colors.warning}
          minimumValue={0}
          onSlidingComplete={(nextValue) => onChange(Number(nextValue.toFixed(2)))}
          onValueChange={onChange}
          step={0.05}
          style={styles.slider}
          thumbTintColor={colors.text}
          value={value}
        />
        <View style={styles.sliderScale}>
          <Text style={styles.sliderScaleText}>0%</Text>
          <Text style={styles.sliderScaleText}>100%</Text>
        </View>
      </View>
    </View>
  );
}

export function SettingsScreen() {
  const [isResetArmed, setIsResetArmed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const {
    resetGame,
    saveStatus,
    setEconomyDifficulty,
    setMasterMute,
    setHapticsIntensity,
    setBlackjackVolume,
    setRouletteVolume,
    setAdminSlotsPayoutMultiplier,
    setAdminSlotsWinChanceOffset,
    setAdminPlinkoPayoutMultiplier,
    simulateSlots,
    setAdminPreset,
    state,
  } = useGame();
  const totalTransactions = state.transactions.length;
  const activeProfileId = profileOptions.find((profile) => profile.difficulty === state.settings.economyDifficulty)?.id ?? null;
  const feedbackSummary = useMemo(() => {
    if (state.settings.feedback.masterMute) {
      return 'Master mute';
    }

    const activeItems = [
      state.settings.feedback.hapticsIntensity > 0 ? `Haptics ${Math.round(state.settings.feedback.hapticsIntensity * 100)}%` : null,
      state.settings.feedback.blackjackVolume > 0 ? `Blackjack ${Math.round(state.settings.feedback.blackjackVolume * 100)}%` : null,
      state.settings.feedback.rouletteVolume > 0 ? `Roulette ${Math.round(state.settings.feedback.rouletteVolume * 100)}%` : null,
    ].filter(Boolean);

    return activeItems.length > 0 ? activeItems.join(' | ') : 'Silent';
  }, [state.settings.feedback]);

  async function handleResetPress() {
    if (!isResetArmed) {
      setIsResetArmed(true);
      return;
    }

    setIsResetArmed(false);
    await resetGame();
  }

  function applyProfile(profile: (typeof profileOptions)[number]) {
    setEconomyDifficulty(profile.difficulty);
  }

  return (
    <Screen>
      <SectionHeader title="Settings" />

      <Panel>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroEyebrow}>Control room</Text>
            <Text style={styles.heroTitle}>{profileOptions.find((profile) => profile.id === activeProfileId)?.label ?? 'Balanced'}</Text>
          </View>
          <Badge label={state.settings.feedback.masterMute ? 'Muted' : 'Audio active'} tone={state.settings.feedback.masterMute ? 'negative' : 'positive'} />
        </View>
        <Text style={styles.feedbackHint}>Tune pressure, sound and local behavior without leaving the app.</Text>
      </Panel>

      <Panel>
        <Text style={styles.panelTitle}>Profile</Text>
        <View style={styles.sectionBlock}>
          <Text style={styles.controlLabel}>Style</Text>
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
                <Text style={[styles.segmentCaption, selected && styles.segmentCaptionSelected]}>{profile.difficulty}</Text>
              </Pressable>
            );
          })}
          </View>
        </View>
        <View style={styles.sectionBlock}>
          <Text style={styles.controlLabel}>Debt pressure</Text>
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
        </View>
        <InfoRow
          label="Interest multiplier"
          value={`${getDifficultyInterestMultiplier(state.settings.economyDifficulty).toFixed(2)}x`}
        />
      </Panel>
      <Panel>
        <Text style={styles.panelTitle}>Sound & feedback</Text>
        <InfoRow label="Active" value={feedbackSummary} />
        <ToggleRow
          label="Master mute"
          caption="Mutes every game sound and vibration without erasing the switches below."
          onChange={setMasterMute}
          value={state.settings.feedback.masterMute}
        />
        <VolumeSliderRow
          label="Haptics"
          caption="Touch feedback intensity on supported phones."
          onChange={setHapticsIntensity}
          value={state.settings.feedback.hapticsIntensity}
        />
        <VolumeSliderRow
          caption="Card deal, hit and hand result."
          label="Blackjack sound"
          onChange={setBlackjackVolume}
          value={state.settings.feedback.blackjackVolume}
        />
        <VolumeSliderRow
          caption="Only the landing result. No constant wheel noise."
          label="Roulette sound"
          onChange={setRouletteVolume}
          value={state.settings.feedback.rouletteVolume}
        />
        <Text style={styles.feedbackHint}>Slots stay silent by design. Their feel is driven by motion only.</Text>
      </Panel>
      <Panel>
        <View style={styles.advancedHeader}>
          <View style={styles.advancedCopy}>
            <Text style={styles.panelTitle}>Advanced</Text>
            <Text style={styles.advancedHint}>Testing and tuning only.</Text>
          </View>
          <View style={styles.advancedButton}>
            <ActionButton onPress={() => setShowAdvanced((value) => !value)} tone="neutral">
              {showAdvanced ? 'Hide' : 'Show'}
            </ActionButton>
          </View>
        </View>
        {showAdvanced ? (
          <>
            <InfoRow label="Save status" value={getSaveStatusLabel(saveStatus)} />
            <InfoRow label="State version" value={`${state.version}`} />
            <InfoRow label="Activity rows" value={`${totalTransactions}`} />
            <InfoRow label="Slot tokens" value={`${state.casino.tokens}`} />
            <View style={styles.sectionBlock}>
              <Text style={styles.controlLabel}>Live tuning</Text>
              <View style={styles.segmentRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setAdminPreset('safe')}
                style={({ pressed }) => [styles.segment, webFocusReset, pressed && styles.segmentPressed]}
              >
                <Text style={styles.segmentLabel}>Safe</Text>
                <Text style={styles.segmentCaption}>Lower RTP</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setAdminPreset('boost')}
                style={({ pressed }) => [styles.segment, webFocusReset, pressed && styles.segmentPressed]}
              >
                <Text style={styles.segmentLabel}>Boost</Text>
                <Text style={styles.segmentCaption}>Higher wins</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setAdminPreset('chaos')}
                style={({ pressed }) => [styles.segment, webFocusReset, pressed && styles.segmentPressed]}
              >
                <Text style={styles.segmentLabel}>Chaos</Text>
                <Text style={styles.segmentCaption}>High variance</Text>
              </Pressable>
              </View>
            </View>
            <View style={styles.resetRow}>
              <ActionButton Icon={RefreshCcw} onPress={() => setAdminPreset('default')} tone="neutral">
                Reset tuning
              </ActionButton>
            </View>
            <TuningRow
              label="Slots extra win chance"
              value={state.settings.adminTuning.slotsWinChanceOffset}
              min={-0.2}
              max={0.5}
              step={0.02}
              onChange={setAdminSlotsWinChanceOffset}
            />
            <TuningRow
              label="Slots payout multiplier"
              value={state.settings.adminTuning.slotsPayoutMultiplier}
              min={0.1}
              max={10}
              step={0.1}
              onChange={setAdminSlotsPayoutMultiplier}
            />
            <TuningRow
              label="Plinko payout multiplier"
              value={state.settings.adminTuning.plinkoPayoutMultiplier}
              min={0.1}
              max={10}
              step={0.1}
              onChange={setAdminPlinkoPayoutMultiplier}
            />
            <InfoRow
              label="Slots chance boost"
              value={`${state.settings.adminTuning.slotsWinChanceOffset >= 0 ? '+' : ''}${(
                state.settings.adminTuning.slotsWinChanceOffset * 100
              ).toFixed(0)}%`}
            />
            <View style={styles.sectionBlock}>
              <Text style={styles.controlLabel}>Quick simulation</Text>
              <View style={styles.segmentRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => simulateSlots(10)}
                style={({ pressed }) => [styles.segment, webFocusReset, pressed && styles.segmentPressed]}
              >
                <Text style={styles.segmentLabel}>+10 spins</Text>
                <Text style={styles.segmentCaption}>Fast batch</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => simulateSlots(100)}
                style={({ pressed }) => [styles.segment, webFocusReset, pressed && styles.segmentPressed]}
              >
                <Text style={styles.segmentLabel}>+100 spins</Text>
                <Text style={styles.segmentCaption}>Balance check</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => simulateSlots(1000)}
                style={({ pressed }) => [styles.segment, webFocusReset, pressed && styles.segmentPressed]}
              >
                <Text style={styles.segmentLabel}>+1000 spins</Text>
                <Text style={styles.segmentCaption}>Stress test</Text>
              </Pressable>
              </View>
            </View>
          </>
        ) : null}
      </Panel>
      <Panel>
        <Text style={styles.panelTitle}>Reset</Text>
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
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroEyebrow: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.warning,
    fontFamily: typography.family,
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
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
    flexWrap: 'wrap',
  },
  sectionBlock: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  advancedCopy: {
    flex: 1,
    gap: 2,
  },
  advancedButton: {
    width: 92,
  },
  advancedHint: {
    color: colors.textFaint,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '700',
  },
  toggleHeader: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  toggleValue: {
    color: colors.textFaint,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  toggleCaption: {
    color: colors.textFaint,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  sliderCard: {
    width: '100%',
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  slider: {
    width: '100%',
    height: 32,
    marginHorizontal: 0,
  },
  sliderScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sliderScaleText: {
    color: colors.textFaint,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '700',
  },
  segment: {
    minWidth: 94,
    flexGrow: 1,
    flexBasis: 0,
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
  tuningRow: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tuningLabel: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '700',
  },
  tuningControls: {
    minHeight: 42,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tuningButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tuningValue: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 15,
    fontWeight: '800',
  },
  feedbackHint: {
    color: colors.textFaint,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  disabled: {
    opacity: 0.4,
  },
});
