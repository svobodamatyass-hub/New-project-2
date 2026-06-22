import { useMemo, useRef, useState } from 'react';
import { CircleDotDashed } from 'lucide-react-native';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { ActionButton } from '../components/ActionButton';
import { CasinoResultBanner } from '../components/CasinoResultBanner';
import { Panel } from '../components/Panel';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import {
  defaultFortuneWheelSectionCount,
  fortuneWheelSectionOptions,
  fortuneWheelTokenCost,
  getFortuneWheelSections,
  spinFortuneWheel as createFortuneWheelResult,
  tokenPacks,
} from '../domain/casino';
import { formatMoney } from '../domain/finance';
import { useGame } from '../game/GameProvider';
import type { FortuneWheelResult, FortuneWheelSection } from '../types/domain';
import { colors, spacing, typography, webFocusReset } from '../theme';

const wheelSize = 238;
const wheelCenter = wheelSize / 2;
const outerRadius = 112;
const innerRadius = 34;
const wheelSpinRounds = 7;
const AnimatedView = Animated.createAnimatedComponent(View);
const sectionPalette = ['#2F7E8E', '#773D7E', '#B8893B', '#245943', '#8D343B', '#2D3548'];

function polarToCartesian(radius: number, angle: number) {
  const angleInRadians = (angle * Math.PI) / 180;

  return {
    x: wheelCenter + radius * Math.cos(angleInRadians),
    y: wheelCenter + radius * Math.sin(angleInRadians),
  };
}

function createSectionPath(index: number, sectionAngle: number) {
  const startAngle = -90 + index * sectionAngle;
  const endAngle = startAngle + sectionAngle;
  const outerStart = polarToCartesian(outerRadius, startAngle);
  const outerEnd = polarToCartesian(outerRadius, endAngle);
  const innerStart = polarToCartesian(innerRadius, startAngle);
  const innerEnd = polarToCartesian(innerRadius, endAngle);
  const largeArc = sectionAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function getSectionFill(section: FortuneWheelSection, index: number) {
  if (section.isJackpot) {
    return '#D8A84E';
  }

  if (section.payout <= 0) {
    return '#11151B';
  }

  return sectionPalette[index % sectionPalette.length];
}

function FortuneWheel({ sections }: { sections: FortuneWheelSection[] }) {
  const sectionAngle = 360 / sections.length;

  return (
    <Svg height={wheelSize} viewBox={`0 0 ${wheelSize} ${wheelSize}`} width={wheelSize}>
      <Circle cx={wheelCenter} cy={wheelCenter} fill="#07080A" r={outerRadius + 7} />
      {sections.map((section, index) => {
        const textAngle = -90 + (index + 0.5) * sectionAngle;
        const textPoint = polarToCartesian(82, textAngle);
        const dotPoint = polarToCartesian(117, -90 + index * sectionAngle);

        return (
          <G key={section.id}>
            <Path
              d={createSectionPath(index, sectionAngle)}
              fill={getSectionFill(section, index)}
              stroke={colors.text}
              strokeOpacity={section.isJackpot ? 0.82 : 0.36}
              strokeWidth={section.isJackpot ? 1.1 : 0.65}
            />
            <Circle cx={dotPoint.x} cy={dotPoint.y} fill={colors.text} opacity={0.78} r={1.9} />
            <SvgText
              alignmentBaseline="middle"
              fill={section.isJackpot ? colors.background : colors.text}
              fontSize={section.label.length > 5 ? '7' : '9'}
              fontWeight="900"
              textAnchor="middle"
              transform={`rotate(${textAngle + 90} ${textPoint.x} ${textPoint.y})`}
              x={textPoint.x}
              y={textPoint.y}
            >
              {section.label}
            </SvgText>
          </G>
        );
      })}
      <Circle cx={wheelCenter} cy={wheelCenter} fill={colors.background} r={innerRadius - 3} stroke={colors.border} strokeWidth={1.2} />
      <Circle cx={wheelCenter} cy={wheelCenter} fill={colors.surfaceRaised} r={14} stroke={colors.textMuted} strokeWidth={2} />
      <Circle cx={wheelCenter} cy={wheelCenter} fill={colors.background} r={6} />
    </Svg>
  );
}

export function FortuneWheelScreen() {
  const { buyTokens, spinFortuneWheel, state } = useGame();
  const [sectionCount, setSectionCount] = useState(defaultFortuneWheelSectionCount);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pendingResult, setPendingResult] = useState<FortuneWheelResult | null>(null);
  const wheelRotation = useRef(new Animated.Value(0)).current;
  const sections = useMemo(() => getFortuneWheelSections(sectionCount), [sectionCount]);
  const lastResult = pendingResult ?? state.casino.fortuneWheelLastResult;
  const canSpin = state.casino.tokens >= fortuneWheelTokenCost && !isSpinning;
  const sectionAngle = 360 / sections.length;
  const wheelSpin = wheelRotation.interpolate({
    inputRange: [0, 360 * wheelSpinRounds],
    outputRange: ['0deg', `${360 * wheelSpinRounds}deg`],
  });

  function handleSpin() {
    if (!canSpin) {
      return;
    }

    const result = createFortuneWheelResult(sectionCount);
    const targetRotation = 360 * wheelSpinRounds - (result.sectionIndex + 0.5) * sectionAngle;

    setPendingResult(result);
    setIsSpinning(true);
    wheelRotation.setValue(0);

    Animated.timing(wheelRotation, {
      toValue: targetRotation,
      duration: 3400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      spinFortuneWheel(sectionCount, result);
      setIsSpinning(false);
      setPendingResult(null);
    });
  }

  return (
    <>
      <SectionHeader title="Wheel" />

      <View style={styles.statsRow}>
        <StatTile label="Tokens" value={`${state.casino.tokens}`} tone={state.casino.tokens >= fortuneWheelTokenCost ? 'warning' : 'default'} />
        <StatTile
          label="Last"
          value={lastResult ? formatMoney(lastResult.payout) : '-'}
          tone={lastResult && lastResult.payout > 0 ? 'positive' : 'default'}
        />
      </View>

      <Panel>
        <View style={styles.wheelStage}>
          <View style={styles.pointer}>
            <View style={styles.pointerInner} />
          </View>
          <AnimatedView style={[styles.wheel, { transform: [{ rotate: wheelSpin }] }]}>
            <FortuneWheel sections={sections} />
          </AnimatedView>
          <View style={styles.readout} pointerEvents="none">
            <Text adjustsFontSizeToFit numberOfLines={1} style={styles.readoutLabel}>
              {isSpinning ? '...' : lastResult?.label ?? 'Spin'}
            </Text>
            <Text style={styles.readoutPayout}>{lastResult ? formatMoney(lastResult.payout) : `${fortuneWheelTokenCost} tokens`}</Text>
          </View>
        </View>

        <View style={styles.sectionControls}>
          {fortuneWheelSectionOptions.map((option) => {
            const isActive = option === sectionCount;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                disabled={isSpinning}
                key={option}
                onPress={() => setSectionCount(option)}
                style={({ pressed }) => [
                  styles.sectionOption,
                  webFocusReset,
                  isActive && styles.sectionOptionActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.sectionOptionText, isActive && styles.sectionOptionTextActive]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        <ActionButton disabled={!canSpin} Icon={CircleDotDashed} onPress={handleSpin} size="large" tone="casino">
          {isSpinning ? 'Spinning...' : 'Spin'}
        </ActionButton>

        {lastResult ? (
          <CasinoResultBanner
            caption="Last spin"
            title={lastResult.label}
            tone={lastResult.payout > 0 ? 'positive' : 'default'}
            value={formatMoney(lastResult.payout)}
          />
        ) : null}
      </Panel>

      <Panel>
        <Text style={styles.panelTitle}>Token shop</Text>
        <View style={styles.packList}>
          {tokenPacks.map((pack) => (
            <View key={pack.id} style={styles.pack}>
              <View>
                <Text style={styles.packTitle}>{pack.tokens} tokens</Text>
                <Text style={styles.packPrice}>{formatMoney(pack.price)}</Text>
              </View>
              <View style={styles.packButton}>
                <ActionButton
                  accessibilityLabel={`Buy ${pack.tokens} tokens`}
                  disabled={state.player.cash < pack.price || isSpinning}
                  onPress={() => buyTokens(pack.id)}
                >
                  Buy
                </ActionButton>
              </View>
            </View>
          ))}
        </View>
      </Panel>
    </>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  wheelStage: {
    minHeight: 272,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheel: {
    width: wheelSize,
    height: wheelSize,
    borderRadius: wheelSize / 2,
  },
  pointer: {
    position: 'absolute',
    top: 4,
    zIndex: 3,
    width: 30,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 5,
  },
  pointerInner: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.background,
  },
  readout: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.background,
    borderColor: colors.accentMuted,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  readoutLabel: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  readoutPayout: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
    textAlign: 'center',
  },
  sectionControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionOption: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionOptionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  sectionOptionText: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '900',
  },
  sectionOptionTextActive: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.72,
  },
  panelTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: '800',
  },
  packList: {
    gap: spacing.md,
  },
  pack: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  packTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 15,
    fontWeight: '800',
  },
  packPrice: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  packButton: {
    width: 100,
  },
});
