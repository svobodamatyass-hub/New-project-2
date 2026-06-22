import { useRef, useState } from 'react';
import { TrendingUp } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { CasinoResultBanner } from '../components/CasinoResultBanner';
import { InfoRow } from '../components/InfoRow';
import { Panel } from '../components/Panel';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import { WagerInput } from '../components/WagerInput';
import { formatMoney } from '../domain/finance';
import { useGame } from '../game/GameProvider';
import { colors, spacing, typography } from '../theme';

const visibleLanes = 8;
const chickenStopLane = 5;
const maxCrashPlanSteps = 120;
const crashHouseEdge = 0.98;
const crashMinMultiplier = 1.09;
const crashGrowthRate = 1.04;

function getStepMultiplier(step: number) {
  return Number(Math.pow(crashGrowthRate, step).toFixed(2));
}

function getSafeStepsForCrashMultiplier(crashMultiplier: number) {
  let safeSteps = 0;

  while (safeSteps < maxCrashPlanSteps && getStepMultiplier(safeSteps + 1) < crashMultiplier) {
    safeSteps += 1;
  }

  return safeSteps;
}

function createCrashPlan() {
  const roll = Math.random();
  const crashMultiplier = Number(Math.max(crashMinMultiplier, crashHouseEdge / (1 - roll)).toFixed(2));

  return {
    safeSteps: getSafeStepsForCrashMultiplier(crashMultiplier),
    crashMultiplier,
  };
}

export function CrashScreen() {
  const { settleCrash, state } = useGame();
  const [wager, setWager] = useState(500);
  const [isRunning, setIsRunning] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [steps, setSteps] = useState(0);
  const [roundState, setRoundState] = useState<'ready' | 'running' | 'cashed' | 'crashed'>('ready');
  const crashPlanRef = useRef<{ crashMultiplier: number; safeSteps: number } | null>(null);
  const lastResult = state.casino.crashLastResult;
  const canStart = state.player.cash >= wager && wager > 0 && !isRunning;
  const canCashOut = isRunning && steps > 0;
  const potentialPayout = Math.round(wager * multiplier);

  function handleStart() {
    if (!canStart) {
      return;
    }

    crashPlanRef.current = createCrashPlan();
    setMultiplier(1);
    setSteps(0);
    setIsRunning(true);
    setRoundState('running');
  }

  function handleStep() {
    if (!isRunning) {
      return;
    }

    const nextSteps = steps + 1;
    const nextMultiplier = getStepMultiplier(nextSteps);

    if (!crashPlanRef.current) {
      return;
    }

    if (nextSteps > crashPlanRef.current.safeSteps) {
      setMultiplier(crashPlanRef.current.crashMultiplier);
      setSteps(nextSteps);
      setIsRunning(false);
      setRoundState('crashed');
      settleCrash(wager, crashPlanRef.current.crashMultiplier, null);
      return;
    }

    setSteps(nextSteps);
    setMultiplier(nextMultiplier);
  }

  function handleCashOut() {
    if (!canCashOut) {
      return;
    }

    setIsRunning(false);
    setRoundState('cashed');
    settleCrash(wager, crashPlanRef.current?.crashMultiplier ?? multiplier, multiplier);
  }

  return (
    <>
      <SectionHeader title="Crash" />

      <View style={styles.statsRow}>
        <StatTile label="Cash" value={formatMoney(state.player.cash)} tone="default" />
        <StatTile label="Casino P/L" value={formatMoney(state.player.casinoProfit)} tone="warning" />
      </View>

      <Panel>
        <View style={[styles.multiplierStage, roundState === 'crashed' && styles.crashedStage]}>
          <Text style={[styles.multiplier, isRunning && styles.multiplierLive]}>{multiplier.toFixed(2)}x</Text>
          <Text style={styles.stageMeta}>
            {roundState === 'running' ? `${formatMoney(potentialPayout)}` : roundState === 'crashed' ? 'Crashed' : roundState === 'cashed' ? 'Cashed out' : 'Ready'}
          </Text>
        </View>

        <View style={styles.road}>
          {Array.from({ length: visibleLanes }, (_, index) => {
            const laneNumber = index + 1;
            const chickenLane = Math.min(steps + 1, chickenStopLane);
            const isCurrent = isRunning && laneNumber === chickenLane;
            const isPassed = laneNumber < chickenLane;

            return (
              <View key={laneNumber} style={[styles.lane, isPassed && styles.lanePassed, isCurrent && styles.laneCurrent]}>
                <Text style={styles.laneText}>{isPassed ? '✓' : isCurrent ? '🐔' : ''}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.panelTitle}>Wager</Text>
        <WagerInput disabled={isRunning} max={state.player.cash} onChange={setWager} value={wager} />

        <View style={styles.actionRow}>
          <ActionButton disabled={!canStart} Icon={TrendingUp} onPress={handleStart} tone="casino">
            Start
          </ActionButton>
          <ActionButton disabled={!isRunning} onPress={handleStep} tone="neutral">
            Step
          </ActionButton>
          <ActionButton disabled={!canCashOut} onPress={handleCashOut} tone="primary">
            Cash out
          </ActionButton>
        </View>

        {lastResult ? (
          <CasinoResultBanner
            caption="Last round"
            title={lastResult.outcome === 'cashout' ? 'Cashed out' : 'Crashed'}
            tone={lastResult.outcome === 'cashout' ? 'positive' : 'negative'}
            value={formatMoney(lastResult.payout - lastResult.wager)}
          />
        ) : null}
      </Panel>

      {lastResult ? (
        <Panel>
          <InfoRow label="Last" value={lastResult.outcome} tone={lastResult.outcome === 'cashout' ? 'positive' : 'negative'} />
          <InfoRow label="Crash" value={`${lastResult.crashMultiplier.toFixed(2)}x`} />
          <InfoRow label="Cash out" value={lastResult.cashoutMultiplier ? `${lastResult.cashoutMultiplier.toFixed(2)}x` : '-'} />
          <InfoRow
            label="Net"
            value={formatMoney(lastResult.payout - lastResult.wager)}
            tone={lastResult.outcome === 'cashout' ? 'positive' : 'negative'}
          />
        </Panel>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
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
  multiplierStage: {
    minHeight: 112,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crashedStage: {
    backgroundColor: colors.negativeSoft,
    borderColor: colors.negativeMuted,
  },
  multiplier: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 46,
    fontWeight: '900',
  },
  multiplierLive: {
    color: colors.warning,
  },
  stageMeta: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  road: {
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 76,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
    padding: spacing.sm,
  },
  lane: {
    flex: 1,
    borderRadius: 6,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lanePassed: {
    backgroundColor: colors.positiveSoft,
    borderColor: colors.positiveMuted,
  },
  laneCurrent: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningMuted,
  },
  laneText: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 20,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
