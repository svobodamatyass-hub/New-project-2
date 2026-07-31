import { useEffect, useMemo, useRef, useState } from 'react';
import { Bomb, Gem, Plus, RotateCcw, WalletCards } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { CasinoResultBanner } from '../components/CasinoResultBanner';
import { InfoRow } from '../components/InfoRow';
import { Panel } from '../components/Panel';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import { WagerInput } from '../components/WagerInput';
import {
  createMinesBoard,
  getMinesMultiplier,
  minesColumns,
  minesMaxCount,
  minesMinCount,
  minesTileCount,
  settleMinesRound,
} from '../domain/casino';
import { formatMoney } from '../domain/finance';
import { useGame } from '../game/GameProvider';
import { colors, spacing, typography, webFocusReset } from '../theme';

const minePresets = [3, 5, 10, 15, 20];
const autoNextOptions = [
  { id: 'off', label: 'Off' },
  { id: 'instant', label: 'Now' },
  { id: 'delay', label: '1s' },
] as const;
const autoPickOptions = [0, 1, 3, 5, 8] as const;
const autoPickDelayOptions = [
  { id: 280, label: 'Fast' },
  { id: 550, label: 'Normal' },
  { id: 900, label: 'Slow' },
] as const;

type AutoNextMode = (typeof autoNextOptions)[number]['id'];

function formatMultiplier(value: number) {
  return `${value.toFixed(value >= 10 ? 1 : 2)}x`;
}

export function MinesScreen() {
  const { settleMines, state } = useGame();
  const [wager, setWager] = useState(500);
  const [mineCount, setMineCount] = useState(5);
  const [mineIndexes, setMineIndexes] = useState<number[]>([]);
  const [revealedIndexes, setRevealedIndexes] = useState<number[]>([]);
  const [safePicks, setSafePicks] = useState(0);
  const [explodedIndex, setExplodedIndex] = useState<number | null>(null);
  const [roundState, setRoundState] = useState<'idle' | 'active' | 'loss' | 'cashout'>('idle');
  const [autoNextMode, setAutoNextMode] = useState<AutoNextMode>('off');
  const [autoPickTarget, setAutoPickTarget] = useState<(typeof autoPickOptions)[number]>(0);
  const [autoPickDelayMs, setAutoPickDelayMs] = useState<(typeof autoPickDelayOptions)[number]['id']>(550);
  const [gridWidth, setGridWidth] = useState(0);
  const autoNextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = roundState === 'active';
  const canStart = !isActive && wager > 0 && wager <= state.player.cash;
  const canCashOut = isActive && safePicks > 0;
  const currentMultiplier = useMemo(() => getMinesMultiplier(mineCount, safePicks), [mineCount, safePicks]);
  const nextMultiplier = useMemo(() => getMinesMultiplier(mineCount, safePicks + 1), [mineCount, safePicks]);
  const maxSafePicks = minesTileCount - mineCount;
  const tileSize = useMemo(() => {
    if (gridWidth <= 0) {
      return 0;
    }

    const totalGap = spacing.sm * (minesColumns - 1);
    return (gridWidth - totalGap) / minesColumns;
  }, [gridWidth]);
  const projectedPayout = Math.round(wager * currentMultiplier);
  const lastResult = state.casino.minesLastResult;

  useEffect(
    () => () => {
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
      }

      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (roundState !== 'loss' && roundState !== 'cashout') {
      return;
    }

    if (autoNextMode === 'off' || wager <= 0 || wager > state.player.cash) {
      return;
    }

    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
    }

    autoNextTimeoutRef.current = setTimeout(() => {
      startRound(true);
    }, autoNextMode === 'instant' ? 80 : 1000);

    return () => {
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
        autoNextTimeoutRef.current = null;
      }
    };
  }, [autoNextMode, roundState, state.player.cash, wager, mineCount]);

  useEffect(() => {
    if (!isActive || autoPickTarget <= 0) {
      return;
    }

    if (safePicks >= Math.min(autoPickTarget, maxSafePicks)) {
      autoPlayTimeoutRef.current = setTimeout(() => {
        cashOut();
      }, autoPickDelayMs);

      return () => {
        if (autoPlayTimeoutRef.current) {
          clearTimeout(autoPlayTimeoutRef.current);
          autoPlayTimeoutRef.current = null;
        }
      };
    }

    const remainingTiles = Array.from({ length: minesTileCount }, (_, index) => index).filter((index) => !revealedIndexes.includes(index));

    if (remainingTiles.length === 0) {
      return;
    }

    const nextTile = remainingTiles[Math.floor(Math.random() * remainingTiles.length)];
    autoPlayTimeoutRef.current = setTimeout(() => {
      revealTile(nextTile);
    }, autoPickDelayMs);

    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
        autoPlayTimeoutRef.current = null;
      }
    };
  }, [autoPickDelayMs, autoPickTarget, isActive, maxSafePicks, revealedIndexes, safePicks]);

  function resetBoard() {
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }

    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }

    setMineIndexes([]);
    setRevealedIndexes([]);
    setSafePicks(0);
    setExplodedIndex(null);
    setRoundState('idle');
  }

  function startRound(force = false) {
    if ((!force && !canStart) || wager <= 0 || wager > state.player.cash) {
      return;
    }

    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }

    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }

    setMineIndexes(createMinesBoard(mineCount));
    setRevealedIndexes([]);
    setSafePicks(0);
    setExplodedIndex(null);
    setRoundState('active');
  }

  function finishRound(nextSafePicks: number, didHitMine: boolean) {
    const result = settleMinesRound(wager, mineCount, nextSafePicks, didHitMine);
    settleMines(wager, mineCount, nextSafePicks, didHitMine, result);
    setRoundState(didHitMine ? 'loss' : 'cashout');
  }

  function revealTile(tileIndex: number) {
    if (!isActive || revealedIndexes.includes(tileIndex)) {
      return;
    }

    const didHitMine = mineIndexes.includes(tileIndex);

    if (didHitMine) {
      setExplodedIndex(tileIndex);
      setRevealedIndexes(Array.from(new Set([...revealedIndexes, ...mineIndexes])));
      finishRound(safePicks, true);
      return;
    }

    const nextSafePicks = safePicks + 1;
    setRevealedIndexes([...revealedIndexes, tileIndex]);
    setSafePicks(nextSafePicks);

    if (nextSafePicks >= maxSafePicks) {
      finishRound(nextSafePicks, false);
    }
  }

  function cashOut() {
    if (!canCashOut) {
      return;
    }

    finishRound(safePicks, false);
  }

  function shiftMineCount(direction: -1 | 1) {
    if (isActive) {
      return;
    }

    setMineCount((current) => Math.min(minesMaxCount, Math.max(minesMinCount, current + direction)));
  }

  return (
    <>
      <SectionHeader title="Mines" />

      <View style={styles.statsRow}>
        <StatTile label="Cash" value={formatMoney(state.player.cash)} tone="default" />
        <StatTile label="Potential" value={safePicks > 0 ? formatMoney(projectedPayout) : formatMoney(wager)} tone="positive" />
      </View>

      <Panel>
        <View style={styles.boardFrame}>
          <View style={styles.boardHeader}>
            <View>
              <Text style={styles.boardTitle}>5x5 board</Text>
              <Text style={styles.boardMeta}>
                {mineCount} mine{mineCount === 1 ? '' : 's'} | {safePicks} safe
              </Text>
            </View>
            <View style={[styles.liveBadge, roundState === 'loss' ? styles.liveBadgeLoss : roundState === 'cashout' ? styles.liveBadgeCashout : null]}>
              <Text style={styles.liveBadgeText}>
                {roundState === 'active' ? 'Live' : roundState === 'loss' ? 'Busted' : roundState === 'cashout' ? 'Cashed' : 'Ready'}
              </Text>
            </View>
          </View>

          <View
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;
              if (Math.abs(width - gridWidth) > 0.5) {
                setGridWidth(width);
              }
            }}
            style={styles.grid}
          >
            {Array.from({ length: minesTileCount }, (_, index) => {
              const isRevealed = revealedIndexes.includes(index);
              const isMine = mineIndexes.includes(index);
              const isExploded = explodedIndex === index;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !isActive || isRevealed }}
                  disabled={!isActive || isRevealed}
                  key={index}
                  onPress={() => revealTile(index)}
                  style={({ pressed }) => [
                    styles.tile,
                    tileSize > 0 && { width: tileSize, height: tileSize },
                    isRevealed && (isMine ? styles.tileMine : styles.tileSafe),
                    isExploded && styles.tileExploded,
                    pressed && !isRevealed && isActive && styles.tilePressed,
                    webFocusReset,
                  ]}
                >
                  {!isRevealed ? <View style={styles.tileDot} /> : null}
                  {isRevealed && !isMine ? <Gem color={colors.background} size={20} strokeWidth={2.2} /> : null}
                  {isRevealed && isMine ? <Bomb color={colors.text} size={20} strokeWidth={2.2} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.actionRow}>
          <ActionButton disabled={!canStart} Icon={WalletCards} onPress={startRound} tone="casino">
            {roundState === 'idle' ? 'Start round' : 'New round'}
          </ActionButton>
          <ActionButton disabled={!canCashOut} Icon={RotateCcw} onPress={cashOut} tone="primary">
            Cash out
          </ActionButton>
        </View>

        <Text style={styles.sectionLabel}>Wager</Text>
        <WagerInput disabled={isActive} max={state.player.cash} onChange={setWager} value={wager} />

        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <Text style={styles.sectionLabel}>Mines</Text>
            <View style={styles.counter}>
              <Pressable
                accessibilityRole="button"
                disabled={isActive || mineCount <= minesMinCount}
                onPress={() => shiftMineCount(-1)}
                style={({ pressed }) => [styles.counterButton, webFocusReset, pressed && styles.tilePressed, (isActive || mineCount <= minesMinCount) && styles.counterDisabled]}
              >
                <Text style={styles.counterButtonText}>-</Text>
              </Pressable>
              <Text style={styles.counterValue}>{mineCount}</Text>
              <Pressable
                accessibilityRole="button"
                disabled={isActive || mineCount >= minesMaxCount}
                onPress={() => shiftMineCount(1)}
                style={({ pressed }) => [styles.counterButton, webFocusReset, pressed && styles.tilePressed, (isActive || mineCount >= minesMaxCount) && styles.counterDisabled]}
              >
                <Plus color={colors.text} size={14} strokeWidth={2.6} />
              </Pressable>
            </View>
          </View>

          <View style={styles.presetRow}>
            {minePresets.map((preset) => {
              const active = preset === mineCount;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  disabled={isActive}
                  key={preset}
                  onPress={() => setMineCount(preset)}
                  style={({ pressed }) => [
                    styles.presetButton,
                    active && styles.presetButtonActive,
                    pressed && styles.tilePressed,
                    isActive && styles.counterDisabled,
                    webFocusReset,
                  ]}
                >
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>{preset}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.settingCard}>
          <Text style={styles.sectionLabel}>Auto next</Text>
          <View style={styles.presetRow}>
            {autoNextOptions.map((option) => {
              const active = option.id === autoNextMode;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  disabled={isActive}
                  key={option.id}
                  onPress={() => setAutoNextMode(option.id)}
                  style={({ pressed }) => [
                    styles.presetButton,
                    active && styles.presetButtonActive,
                    pressed && styles.tilePressed,
                    isActive && styles.counterDisabled,
                    webFocusReset,
                  ]}
                >
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.settingCard}>
          <Text style={styles.sectionLabel}>Auto picks</Text>
          <View style={styles.presetRow}>
            {autoPickOptions.map((option) => {
              const active = option === autoPickTarget;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  disabled={isActive}
                  key={option}
                  onPress={() => setAutoPickTarget(option)}
                  style={({ pressed }) => [
                    styles.presetButton,
                    active && styles.presetButtonActive,
                    pressed && styles.tilePressed,
                    isActive && styles.counterDisabled,
                    webFocusReset,
                  ]}
                >
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>{option === 0 ? 'Off' : `${option}`}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.settingHint}>Random picks, then auto cash out on target.</Text>

          <View style={styles.presetRow}>
            {autoPickDelayOptions.map((option) => {
              const active = option.id === autoPickDelayMs;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  disabled={isActive}
                  key={option.id}
                  onPress={() => setAutoPickDelayMs(option.id)}
                  style={({ pressed }) => [
                    styles.presetButton,
                    active && styles.presetButtonActive,
                    pressed && styles.tilePressed,
                    isActive && styles.counterDisabled,
                    webFocusReset,
                  ]}
                >
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Current</Text>
            <Text style={styles.infoValue}>{formatMultiplier(currentMultiplier)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Next safe</Text>
            <Text style={styles.infoValue}>{safePicks >= maxSafePicks ? '-' : formatMultiplier(nextMultiplier)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Remaining</Text>
            <Text style={styles.infoValue}>{`${maxSafePicks - safePicks}`}</Text>
          </View>
        </View>

        {lastResult ? (
          <CasinoResultBanner
            caption="Last round"
            title={lastResult.outcome === 'cashout' ? 'Cashed out' : 'Mine hit'}
            tone={lastResult.outcome === 'cashout' ? 'positive' : 'negative'}
            value={formatMoney(lastResult.payout - lastResult.wager)}
          />
        ) : null}

      </Panel>

      {lastResult ? (
        <Panel>
          <InfoRow label="Last" tone={lastResult.outcome === 'cashout' ? 'positive' : 'negative'} value={lastResult.outcome} />
          <InfoRow label="Mines" value={`${lastResult.mineCount}`} />
          <InfoRow label="Safe picks" value={`${lastResult.safePicks}`} />
          <InfoRow label="Multiplier" value={formatMultiplier(lastResult.multiplier)} tone={lastResult.outcome === 'cashout' ? 'positive' : 'default'} />
          <InfoRow
            label="Net"
            tone={lastResult.outcome === 'cashout' ? 'positive' : 'negative'}
            value={formatMoney(lastResult.payout - lastResult.wager)}
          />
        </Panel>
      ) : null}

      {roundState !== 'active' && (revealedIndexes.length > 0 || explodedIndex !== null) ? (
        <Pressable accessibilityRole="button" onPress={resetBoard} style={({ pressed }) => [styles.resetHint, webFocusReset, pressed && styles.tilePressed]}>
          <Text style={styles.resetHintText}>Clear board</Text>
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  boardFrame: {
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: spacing.md,
  },
  boardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  boardTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: '800',
  },
  boardMeta: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '700',
  },
  liveBadge: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentMuted,
    borderWidth: StyleSheet.hairlineWidth,
  },
  liveBadgeLoss: {
    backgroundColor: colors.negativeSoft,
    borderColor: colors.negativeMuted,
  },
  liveBadgeCashout: {
    backgroundColor: colors.positiveSoft,
    borderColor: colors.positiveMuted,
  },
  liveBadgeText: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tilePressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  tileSafe: {
    backgroundColor: colors.positive,
    borderColor: colors.positive,
  },
  tileMine: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningMuted,
  },
  tileExploded: {
    backgroundColor: colors.negative,
    borderColor: colors.negative,
  },
  tileDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.textFaint,
  },
  sectionLabel: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: '800',
  },
  settingCard: {
    gap: spacing.md,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  settingHint: {
    color: colors.textFaint,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '700',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  counterButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 18,
  },
  counterValue: {
    minWidth: 26,
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  counterDisabled: {
    opacity: 0.42,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetButtonActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentMuted,
  },
  presetText: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '900',
  },
  presetTextActive: {
    color: colors.text,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  infoLabel: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 18,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  resetHint: {
    alignSelf: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetHintText: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '800',
  },
});
