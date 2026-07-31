import { Fragment, useMemo, useRef, useState } from 'react';
import { CirclePlay } from 'lucide-react-native';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { ActionButton } from '../components/ActionButton';
import { CasinoResultBanner } from '../components/CasinoResultBanner';
import { InfoRow } from '../components/InfoRow';
import { Panel } from '../components/Panel';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import { WagerInput } from '../components/WagerInput';
import { formatMoney } from '../domain/finance';
import { getPlinkoMultipliers, plinkoRiskOptions, plinkoRowsOptions, playPlinko as createPlinkoResult } from '../domain/casino';
import { useGame } from '../game/GameProvider';
import type { PlinkoResult, PlinkoRisk } from '../types/domain';
import { colors, spacing, typography, webFocusReset } from '../theme';

const boardWidth = 324;
const topY = 22;
const bottomMargin = 74;
const pegRadius = 3.7;
const ballSize = 9;
const ballLaunchDelayMs = 140;
const AnimatedView = Animated.createAnimatedComponent(View);

type ActiveBall = {
  id: string;
  opacity: Animated.Value;
  result: PlinkoResult;
  scale: Animated.Value;
  x: Animated.Value;
  y: Animated.Value;
};

function getBoardHeight(rows: number) {
  return Math.max(286, 76 + rows * 18);
}

function getSlotTone(multiplier: number) {
  if (multiplier >= 10) {
    return {
      fill: colors.warning,
      glow: colors.warningMuted,
      soft: colors.warningSoft,
      text: colors.background,
    };
  }

  if (multiplier >= 2) {
    return {
      fill: colors.accent,
      glow: colors.accentMuted,
      soft: colors.accentSoft,
      text: colors.text,
    };
  }

  if (multiplier >= 1) {
    return {
      fill: colors.positive,
      glow: colors.positiveMuted,
      soft: colors.positiveSoft,
      text: colors.background,
    };
  }

  return {
    fill: colors.negative,
    glow: colors.negativeMuted,
    soft: colors.negativeSoft,
    text: colors.text,
  };
}

function formatMultiplier(multiplier: number) {
  if (multiplier >= 100) {
    return `${multiplier.toFixed(0)}x`;
  }

  if (multiplier >= 10) {
    return `${multiplier.toFixed(1)}x`;
  }

  if (multiplier >= 1) {
    return `${multiplier.toFixed(2)}x`;
  }

  return `${multiplier.toFixed(2)}x`;
}

function buildBallPoints(rows: number, slotIndex: number, path: number[]) {
  const boardHeight = getBoardHeight(rows);
  const rowGap = (boardHeight - bottomMargin - topY) / rows;
  const gapX = (boardWidth - 48) / rows;
  const centerX = boardWidth / 2;
  let rights = 0;
  const points = [{ x: centerX, y: 10 }];

  for (let index = 0; index < rows; index += 1) {
    rights += path[index] ?? 0;
    points.push({
      x: centerX + (2 * rights - (index + 1)) * (gapX / 2),
      y: topY + rowGap * (index + 0.72),
    });
  }

  const slotWidth = (boardWidth - 24) / (rows + 1);
  const slotCenterX = 12 + slotWidth * slotIndex + slotWidth / 2;
  const slotCenterY = boardHeight - 21;

  points.push({ x: slotCenterX, y: slotCenterY - 11 });
  points.push({ x: slotCenterX, y: slotCenterY });

  return points;
}

function PlinkoBoard({
  rows,
  multipliers,
  activeSlotIndex,
}: {
  rows: number;
  multipliers: number[];
  activeSlotIndex: number | null;
}) {
  const boardHeight = getBoardHeight(rows);
  const rowGap = (boardHeight - bottomMargin - topY) / rows;
  const gapX = (boardWidth - 48) / rows;
  const centerX = boardWidth / 2;
  const slotWidth = (boardWidth - 24) / (rows + 1);
  const slotFontSize = rows >= 16 ? 8 : rows >= 12 ? 9 : 10;
  const pegs = [];

  for (let row = 0; row < rows; row += 1) {
    for (let peg = 0; peg <= row; peg += 1) {
      pegs.push({
        id: `${row}-${peg}`,
        x: centerX + (peg - row / 2) * gapX,
        y: topY + row * rowGap,
      });
    }
  }

  return (
    <Svg height={boardHeight} viewBox={`0 0 ${boardWidth} ${boardHeight}`} width="100%">
      <Defs>
        <LinearGradient id="plinkoBoardGlow" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor={colors.surfaceRaised} />
          <Stop offset="1" stopColor={colors.background} />
        </LinearGradient>
      </Defs>

      <Rect fill="url(#plinkoBoardGlow)" height={boardHeight} rx="14" width={boardWidth} />
      <Rect
        fill="transparent"
        height={boardHeight - 2}
        rx="14"
        stroke={colors.border}
        strokeWidth="1"
        width={boardWidth - 2}
        x="1"
        y="1"
      />

      {pegs.map((peg) => (
        <Fragment key={peg.id}>
          <Circle cx={peg.x} cy={peg.y} fill={colors.surfaceRaised} opacity={1} r={pegRadius + 1.15} />
          <Circle cx={peg.x} cy={peg.y} fill={colors.textMuted} opacity={0.92} r={pegRadius} />
        </Fragment>
      ))}

      {multipliers.map((multiplier, index) => {
        const slotTone = getSlotTone(multiplier);
        const x = 12 + slotWidth * index;
        const isActive = activeSlotIndex === index;

        return (
          <Fragment key={`${rows}-${index}`}>
            <Rect
              fill={isActive ? slotTone.fill : slotTone.soft}
              height="38"
              opacity={isActive ? 1 : 0.98}
              rx="8"
              stroke={isActive ? slotTone.glow : colors.border}
              strokeWidth={isActive ? 1.6 : 0.8}
              width={slotWidth - 4}
              x={x + 2}
              y={boardHeight - 40}
            />
            <SvgText
              fill={isActive ? slotTone.text : colors.text}
              fontSize={slotFontSize}
              fontWeight="900"
              textAnchor="middle"
              x={x + slotWidth / 2}
              y={boardHeight - 17}
            >
              {formatMultiplier(multiplier)}
            </SvgText>
          </Fragment>
        );
      })}
    </Svg>
  );
}

export function PlinkoScreen() {
  const { playPlinko, state } = useGame();
  const [wager, setWager] = useState(500);
  const [rows, setRows] = useState(16);
  const [risk, setRisk] = useState<PlinkoRisk>('medium');
  const [ballCount, setBallCount] = useState(1);
  const [activeBalls, setActiveBalls] = useState<ActiveBall[]>([]);
  const [reservedCash, setReservedCash] = useState(0);
  const [latestResult, setLatestResult] = useState<PlinkoResult | null>(null);
  const [lastBatchCount, setLastBatchCount] = useState(0);
  const [lastBatchPayout, setLastBatchPayout] = useState(0);
  const [lastBatchNet, setLastBatchNet] = useState(0);
  const ballIdRef = useRef(0);
  const multipliers = useMemo(() => getPlinkoMultipliers(rows, risk), [rows, risk]);
  const totalBatchWager = wager * ballCount;
  const availableCash = Math.max(0, state.player.cash - reservedCash);
  const displayedCash = availableCash;
  const canDrop = wager > 0 && totalBatchWager <= availableCash;

  function cleanupBall(id: string) {
    setActiveBalls((current) => current.filter((ball) => ball.id !== id));
  }

  function animateBall(ball: ActiveBall, onDone: () => void) {
    const points = buildBallPoints(ball.result.rows, ball.result.slotIndex, ball.result.path);

    ball.x.setValue(points[0].x - ballSize / 2);
    ball.y.setValue(points[0].y);
    ball.scale.setValue(1);
    ball.opacity.setValue(0);

    const segmentAnimations = points.slice(1).map((point, index) =>
      Animated.parallel([
        Animated.timing(ball.x, {
          toValue: point.x - ballSize / 2,
          duration: index >= points.length - 3 ? 150 : 102,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ball.y, {
          toValue: point.y,
          duration: index >= points.length - 3 ? 150 : 102,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.sequence([
      Animated.timing(ball.opacity, {
        toValue: 1,
        duration: 70,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      ...segmentAnimations,
      Animated.sequence([
        Animated.timing(ball.scale, {
          toValue: 1.12,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(ball.scale, {
            toValue: 0.96,
            duration: 130,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ball.opacity, {
            toValue: 0,
            duration: 160,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      onDone();
      cleanupBall(ball.id);
    });
  }

  function handleDrop() {
    if (!canDrop) {
      return;
    }

    const results = Array.from({ length: ballCount }, () => createPlinkoResult(wager, rows, risk));
    let batchPayout = 0;
    let batchNet = 0;

    setReservedCash((current) => current + totalBatchWager);
    setLastBatchCount(results.length);
    setLastBatchPayout(0);
    setLastBatchNet(0);

    results.forEach((result, index) => {
      const ball: ActiveBall = {
        id: `plinko-ball-${ballIdRef.current}-${index}`,
        result,
        x: new Animated.Value(boardWidth / 2 - ballSize / 2),
        y: new Animated.Value(0),
        scale: new Animated.Value(1),
        opacity: new Animated.Value(0),
      };

      ballIdRef.current += 1;

      setTimeout(() => {
        setActiveBalls((current) => [...current, ball]);
        animateBall(ball, () => {
          batchPayout += result.payout;
          batchNet += result.payout - result.wager;
          setReservedCash((current) => Math.max(0, current - result.wager));
          setLatestResult(result);
          setLastBatchPayout(batchPayout);
          setLastBatchNet(batchNet);
          playPlinko(result.wager, result.rows, result.risk, result);
        });
      }, index * ballLaunchDelayMs);
    });
  }

  return (
    <>
      <SectionHeader title="Plinko" />

      <View style={styles.gameHero}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>DROP BOARD</Text>
          <Text style={styles.heroSubline}>Pick a risk profile | chase the landing slot</Text>
        </View>
        <View style={styles.heroIcon}>
          <CirclePlay color={colors.warning} size={22} strokeWidth={2.4} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatTile label="Cash" value={formatMoney(displayedCash)} tone="default" />
        <StatTile label="Batch" value={formatMoney(totalBatchWager)} tone="warning" />
      </View>

      <Panel>
        <View style={[styles.boardStage, { minHeight: getBoardHeight(rows) + 8 }]}>
          <PlinkoBoard rows={rows} multipliers={multipliers} activeSlotIndex={latestResult?.slotIndex ?? null} />
          {activeBalls.map((ball) => (
            <AnimatedView
              key={ball.id}
              pointerEvents="none"
              style={[
                styles.ball,
                {
                  opacity: ball.opacity,
                  transform: [{ translateX: ball.x }, { translateY: ball.y }, { scale: ball.scale }],
                },
              ]}
            />
          ))}
        </View>

        <ActionButton disabled={!canDrop} Icon={CirclePlay} onPress={handleDrop} size="large" tone="casino">
          {`Drop ${ballCount} ball${ballCount === 1 ? '' : 's'}`}
        </ActionButton>

        <View style={styles.controlSection}>
          <Text style={styles.panelTitle}>Rows</Text>
          <View style={styles.toggleRow}>
            {plinkoRowsOptions.map((option) => {
              const active = option === rows;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={option}
                  onPress={() => setRows(option)}
                  style={({ pressed }) => [styles.toggle, webFocusReset, active && styles.toggleActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.controlSection}>
          <Text style={styles.panelTitle}>Risk</Text>
          <View style={styles.toggleRow}>
            {plinkoRiskOptions.map((option) => {
              const active = option === risk;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={option}
                  onPress={() => setRisk(option)}
                  style={({ pressed }) => [styles.toggle, webFocusReset, active && styles.toggleActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.controlSection}>
          <Text style={styles.panelTitle}>Balls</Text>
          <View style={styles.toggleRow}>
            {[1, 3, 5].map((option) => {
              const active = option === ballCount;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={option}
                  onPress={() => setBallCount(option)}
                  style={({ pressed }) => [styles.toggle, webFocusReset, active && styles.toggleActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.panelTitle}>Wager per ball</Text>
        <WagerInput disabled={false} max={Math.floor(availableCash / Math.max(1, ballCount))} onChange={setWager} value={wager} />

        <View style={styles.summaryStrip}>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{formatMoney(totalBatchWager)}</Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryLabel}>Ready</Text>
            <Text style={styles.summaryValue}>{formatMoney(availableCash)}</Text>
          </View>
        </View>
      </Panel>

      {latestResult ? (
        <Panel>
          <CasinoResultBanner
            caption="Last drop"
            title={formatMultiplier(latestResult.multiplier)}
            tone={lastBatchNet >= 0 ? 'positive' : 'negative'}
            value={formatMoney(lastBatchNet)}
          />
          <InfoRow label="Rows" value={`${latestResult.rows}`} />
          <InfoRow label="Risk" value={latestResult.risk} />
          <InfoRow label="Last lane" value={formatMultiplier(latestResult.multiplier)} tone={latestResult.multiplier >= 1 ? 'positive' : 'negative'} />
          <InfoRow label="Last batch" value={`${lastBatchCount} ball${lastBatchCount === 1 ? '' : 's'}`} />
          <InfoRow
            label="Batch net"
            value={formatMoney(lastBatchNet)}
            tone={lastBatchNet >= 0 ? 'positive' : 'negative'}
          />
          <InfoRow
            label="Batch payout"
            value={formatMoney(lastBatchPayout)}
            tone={lastBatchPayout >= totalBatchWager ? 'positive' : 'default'}
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
    marginTop: spacing.sm,
  },
  gameHero: {
    minHeight: 72,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: 14,
    borderColor: '#4C3B62',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#21172F',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCopy: {
    gap: 4,
  },
  heroEyebrow: {
    color: '#C99AFF',
    fontFamily: typography.family,
    fontSize: 10,
    fontWeight: '900',
  },
  heroSubline: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '800',
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardStage: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    borderColor: '#49365B',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#130F1D',
    padding: spacing.xs,
  },
  ball: {
    position: 'absolute',
    width: ballSize,
    height: ballSize,
    borderRadius: ballSize / 2,
    backgroundColor: colors.warning,
    borderColor: colors.text,
    borderWidth: 1,
    shadowColor: colors.warning,
    shadowOpacity: 0.32,
    shadowRadius: 8,
  },
  controlSection: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggle: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  toggleActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentMuted,
  },
  toggleLabel: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  toggleLabelActive: {
    color: colors.text,
  },
  panelTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: '800',
  },
  summaryStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  summaryPill: {
    flex: 1,
    minHeight: 58,
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#11141D',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.72,
  },
});
