import { useEffect, useRef, useState } from 'react';
import { CircleDot } from 'lucide-react-native';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { ActionButton } from '../components/ActionButton';
import { AmountSelector } from '../components/AmountSelector';
import { InfoRow } from '../components/InfoRow';
import { Panel } from '../components/Panel';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import {
  europeanRouletteNumbers,
  getCasinoDifficultyConfig,
  getRouletteBetLabel,
  getRouletteBetPayoutMultiplier,
  getRouletteColor,
  playRoulette as createRouletteResult,
  rouletteColorBets,
} from '../domain/casino';
import { formatMoney } from '../domain/finance';
import { useGame } from '../game/GameProvider';
import type { RouletteBet, RouletteResult } from '../types/domain';
import { colors, spacing, typography, webFocusReset } from '../theme';

const wagerOptions = [250, 500, 1000];
const wheelSize = 218;
const wheelCenter = wheelSize / 2;
const outerRadius = 104;
const innerRadius = 58;
const pocketAngle = 360 / europeanRouletteNumbers.length;
const wheelSpinDegrees = 360 * 5;
const rouletteTableRows = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

const AnimatedView = Animated.createAnimatedComponent(View);

function polarToCartesian(radius: number, angle: number) {
  const angleInRadians = (angle * Math.PI) / 180;

  return {
    x: wheelCenter + radius * Math.cos(angleInRadians),
    y: wheelCenter + radius * Math.sin(angleInRadians),
  };
}

function createPocketPath(index: number) {
  const startAngle = -90 + index * pocketAngle;
  const endAngle = startAngle + pocketAngle;
  const outerStart = polarToCartesian(outerRadius, startAngle);
  const outerEnd = polarToCartesian(outerRadius, endAngle);
  const innerStart = polarToCartesian(innerRadius, startAngle);
  const innerEnd = polarToCartesian(innerRadius, endAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function getPocketFill(number: number) {
  const color = getRouletteColor(number);

  if (color === 'green') {
    return colors.positive;
  }

  return color === 'red' ? '#B84349' : '#15181E';
}

function RouletteWheel() {
  return (
    <Svg height={wheelSize} viewBox={`0 0 ${wheelSize} ${wheelSize}`} width={wheelSize}>
      <Circle cx={wheelCenter} cy={wheelCenter} fill={colors.background} r={outerRadius + 3} />
      {europeanRouletteNumbers.map((number, index) => {
        const textAngle = -90 + (index + 0.5) * pocketAngle;
        const textPoint = polarToCartesian(84, textAngle);

        return (
          <G key={number}>
            <Path d={createPocketPath(index)} fill={getPocketFill(number)} stroke={colors.text} strokeOpacity={0.58} strokeWidth={0.65} />
            <SvgText
              alignmentBaseline="middle"
              fill={colors.text}
              fontSize="9"
              fontWeight="800"
              textAnchor="middle"
              transform={`rotate(${textAngle + 90} ${textPoint.x} ${textPoint.y})`}
              x={textPoint.x}
              y={textPoint.y}
            >
              {number}
            </SvgText>
          </G>
        );
      })}
      <Circle cx={wheelCenter} cy={wheelCenter} fill={colors.surface} r={innerRadius - 4} stroke={colors.border} strokeWidth={1} />
      <Circle cx={wheelCenter} cy={wheelCenter} fill={colors.background} r={36} stroke={colors.warningMuted} strokeWidth={1} />
    </Svg>
  );
}

export function RouletteScreen() {
  const [wager, setWager] = useState(wagerOptions[1]);
  const [bet, setBet] = useState<RouletteBet>({ type: 'color', color: 'red' });
  const [isSpinning, setIsSpinning] = useState(false);
  const [rollingNumber, setRollingNumber] = useState(0);
  const [pendingResult, setPendingResult] = useState<RouletteResult | null>(null);
  const wheelRotation = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { playRoulette: commitRouletteResult, state } = useGame();
  const { rouletteLastResult } = state.casino;
  const canPlay = state.player.cash >= wager && !isSpinning;
  const result = pendingResult ?? rouletteLastResult;
  const wonLastSpin = rouletteLastResult ? rouletteLastResult.payout > 0 : false;
  const wheelSpin = wheelRotation.interpolate({
    inputRange: [0, 2160],
    outputRange: ['0deg', '2160deg'],
  });

  useEffect(
    () => () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    },
    [],
  );

  function handleSpin() {
    if (!canPlay) {
      return;
    }

    const config = getCasinoDifficultyConfig(state.settings.economyDifficulty);
    const nextResult = createRouletteResult(bet, wager, {
      boostOffset: config.rouletteBoostOffset,
      payoutMultiplier: config.roulettePayoutMultiplier,
    });
    const targetRotation = wheelSpinDegrees - (nextResult.pocketIndex + 0.5) * pocketAngle;

    setPendingResult(nextResult);
    setRollingNumber(nextResult.number);
    setIsSpinning(true);
    wheelRotation.setValue(0);
    intervalRef.current = setInterval(() => {
      setRollingNumber(europeanRouletteNumbers[Math.floor(Math.random() * europeanRouletteNumbers.length)]);
    }, 82);

    Animated.timing(wheelRotation, {
      toValue: targetRotation,
      duration: 2800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setRollingNumber(nextResult.number);
      commitRouletteResult(bet, wager, nextResult);
      setIsSpinning(false);
      setPendingResult(null);
    });
  }

  function isSelectedNumber(number: number) {
    return bet.type === 'number' && bet.number === number;
  }

  function isSelectedColor(color: 'red' | 'black') {
    return bet.type === 'color' && bet.color === color;
  }

  return (
    <>
      <SectionHeader title="Roulette" />

      <View style={styles.statsRow}>
        <StatTile label="Cash" value={formatMoney(state.player.cash)} tone="default" />
        <StatTile label="Casino P/L" value={formatMoney(state.player.casinoProfit)} tone="warning" />
      </View>

      <Panel>
        <Text style={styles.panelTitle}>Wheel</Text>
        <View style={styles.wheelStage}>
          <View style={styles.pointer} />
          <AnimatedView style={[styles.wheel, { transform: [{ rotate: wheelSpin }] }]}>
            <RouletteWheel />
          </AnimatedView>
          <View style={styles.wheelReadout} pointerEvents="none">
            <Text style={styles.resultNumber}>{isSpinning ? rollingNumber : result?.number ?? '-'}</Text>
            <Text style={styles.resultColor}>{isSpinning ? 'spin' : result?.color ?? '-'}</Text>
          </View>
        </View>

        {rouletteLastResult ? (
          <>
            <InfoRow label="Your bet" value={getRouletteBetLabel(rouletteLastResult.bet)} />
            <InfoRow
              label="Pocket"
              value={`${rouletteLastResult.number} ${rouletteLastResult.color}`}
              tone={rouletteLastResult.color === 'red' ? 'negative' : rouletteLastResult.color === 'green' ? 'positive' : 'default'}
            />
            <InfoRow label="Outcome" value={wonLastSpin ? 'win' : 'loss'} tone={wonLastSpin ? 'positive' : 'negative'} />
            <InfoRow
              label="Net"
              value={formatMoney(rouletteLastResult.payout - rouletteLastResult.wager)}
              tone={wonLastSpin ? 'positive' : 'negative'}
            />
          </>
        ) : (
          <Text style={styles.empty}>-</Text>
        )}
      </Panel>

      <Panel>
        <View style={styles.betSummary}>
          <View>
            <Text style={styles.panelTitle}>Bet window</Text>
            <Text style={styles.selectionText}>
              {getRouletteBetLabel(bet)} |{' '}
              {(getRouletteBetPayoutMultiplier(bet) * getCasinoDifficultyConfig(state.settings.economyDifficulty).roulettePayoutMultiplier).toFixed(2)}x
            </Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{formatMoney(wager)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelectedNumber(0) }}
            onPress={() => setBet({ type: 'number', number: 0 })}
            style={({ pressed }) => [
              styles.zeroCell,
              styles.greenCell,
              isSelectedNumber(0) && styles.selectedCell,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.cellText}>0</Text>
          </Pressable>

          <View style={styles.numberGrid}>
            {rouletteTableRows.map((row) => (
              <View key={row.join('-')} style={styles.numberRow}>
                {row.map((number) => {
                  const color = getRouletteColor(number);

                  return (
                    <Pressable
                      accessibilityLabel={`Bet on ${number}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelectedNumber(number) }}
                      key={number}
                      onPress={() => setBet({ type: 'number', number })}
                      style={({ pressed }) => [
                        styles.numberCell,
                        color === 'red' ? styles.redCell : styles.blackCell,
                        isSelectedNumber(number) && styles.selectedCell,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.cellText}>{number}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.outsideBets}>
          {rouletteColorBets.map((item) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelectedColor(item.color) }}
              key={item.color}
              onPress={() => setBet({ type: 'color', color: item.color })}
              style={({ pressed }) => [
                styles.outsideBet,
                item.color === 'red' ? styles.redCell : styles.blackCell,
                isSelectedColor(item.color) && styles.selectedCell,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.betLabel}>{item.label}</Text>
              <Text style={styles.betMeta}>{item.payoutMultiplier}x</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.panelTitle}>Wager</Text>
        <AmountSelector amounts={wagerOptions} selectedAmount={wager} onSelectAmount={setWager} />
        <ActionButton disabled={!canPlay} Icon={CircleDot} onPress={handleSpin} tone="casino">
          {isSpinning ? 'Spinning...' : 'Spin selected bet'}
        </ActionButton>
        {state.player.cash < wager ? <Text style={styles.hint}>Not enough cash for this wager.</Text> : null}
      </Panel>
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
  betLabel: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 14,
    fontWeight: '900',
  },
  betSummary: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  selectionText: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  chip: {
    minWidth: 82,
    minHeight: 34,
    borderRadius: 8,
    borderColor: colors.warningMuted,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  chipText: {
    color: colors.warning,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '900',
  },
  table: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  zeroCell: {
    width: 34,
    minHeight: 118,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberGrid: {
    flex: 1,
    gap: spacing.xs,
  },
  numberRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  numberCell: {
    flex: 1,
    minWidth: 0,
    height: 36,
    borderRadius: 6,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redCell: {
    backgroundColor: colors.negativeSoft,
  },
  blackCell: {
    backgroundColor: colors.surfaceRaised,
  },
  greenCell: {
    backgroundColor: colors.positiveSoft,
  },
  selectedCell: {
    borderColor: colors.warning,
    borderWidth: 2,
  },
  cellText: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '900',
  },
  outsideBets: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  outsideBet: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  betMeta: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  wheelStage: {
    minHeight: 246,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointer: {
    position: 'absolute',
    top: 4,
    zIndex: 3,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.warning,
  },
  wheel: {
    width: wheelSize,
    height: wheelSize,
    borderRadius: wheelSize / 2,
  },
  wheelReadout: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.background,
    borderColor: colors.warningMuted,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultNumber: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 32,
    fontWeight: '900',
  },
  resultColor: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.74,
  },
  empty: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '700',
  },
  hint: {
    color: colors.textFaint,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
