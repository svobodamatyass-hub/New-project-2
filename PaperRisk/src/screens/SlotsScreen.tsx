import { useEffect, useRef, useState } from 'react';
import { Gem } from 'lucide-react-native';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Panel } from '../components/Panel';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import { getCasinoDifficultyConfig, slotsSymbols, spinSlots as createSlotsResult, tokenPacks } from '../domain/casino';
import { formatMoney } from '../domain/finance';
import { useGame } from '../game/GameProvider';
import type { SlotsResult } from '../types/domain';
import { colors, spacing, typography } from '../theme';

const reelHeight = 92;
const spinDurations = [1750, 2050, 2350];

function pickRandomSymbol() {
  return slotsSymbols[Math.floor(Math.random() * slotsSymbols.length)];
}

function SlotReel({ finalSymbol, index, spinning }: { finalSymbol: string; index: number; spinning: boolean }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentSymbol, setCurrentSymbol] = useState<string>(finalSymbol);
  const [nextSymbol, setNextSymbol] = useState<string>(pickRandomSymbol());

  useEffect(() => {
    if (!spinning) {
      setCurrentSymbol(finalSymbol);
      setNextSymbol(finalSymbol);
      translateY.setValue(0);
      return;
    }

    let isMounted = true;
    const cycle = () => {
      const incomingSymbol = pickRandomSymbol();
      setNextSymbol(incomingSymbol);
      translateY.setValue(0);

      Animated.timing(translateY, {
        toValue: 1,
        duration: 126,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        if (isMounted) {
          setCurrentSymbol(incomingSymbol);
        }
      });
    };

    cycle();
    intervalRef.current = setInterval(cycle, 132);

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [finalSymbol, spinning, translateY]);

  const reelTranslate = translateY.interpolate({
    inputRange: [0, 1],
    outputRange: [-reelHeight, 0],
  });

  return (
    <View style={[styles.reel, spinning && styles.spinningReel]}>
      <Animated.View style={[styles.reelStrip, { transform: [{ translateY: reelTranslate }] }]}>
        <View style={styles.reelSlot}>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.symbol}>
            {nextSymbol}
          </Text>
        </View>
        <View style={styles.reelSlot}>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.symbol}>
            {currentSymbol}
          </Text>
        </View>
      </Animated.View>
      <View style={styles.reelShade} pointerEvents="none" />
    </View>
  );
}

export function SlotsScreen() {
  const { buyTokens, spinSlots, state } = useGame();
  const { casino, player } = state;
  const [displayedSymbols, setDisplayedSymbols] = useState(casino.slotsLastResult.symbols);
  const [spinningReels, setSpinningReels] = useState([false, false, false]);
  const [isSpinning, setIsSpinning] = useState(false);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const canSpin = casino.tokens > 0 && !isSpinning;

  useEffect(() => {
    if (!isSpinning) {
      setDisplayedSymbols(casino.slotsLastResult.symbols);
    }
  }, [casino.slotsLastResult.symbols, isSpinning]);

  useEffect(
    () => () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    },
    [],
  );

  function handleSpin() {
    if (!canSpin) {
      return;
    }

    const config = getCasinoDifficultyConfig(state.settings.economyDifficulty);
    const result: SlotsResult = createSlotsResult(casino.slotsLosingStreak, {
      winChanceOffset: config.slotsWinChanceOffset,
      payoutMultiplier: config.slotsPayoutMultiplier,
    });

    setIsSpinning(true);
    setSpinningReels([true, true, true]);
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current = spinDurations.map((duration, index) =>
      setTimeout(() => {
        setDisplayedSymbols((symbols) => {
          const nextSymbols = [...symbols];
          nextSymbols[index] = result.symbols[index];
          return nextSymbols;
        });
        setSpinningReels((reels) => reels.map((isActive, reelIndex) => (reelIndex === index ? false : isActive)));

        if (index === spinDurations.length - 1) {
          spinSlots(result);
          setIsSpinning(false);
        }
      }, duration),
    );
  }

  return (
    <>
      <SectionHeader title="Slots" />

      <View style={styles.statsRow}>
        <StatTile label="Tokens" value={`${casino.tokens}`} tone={casino.tokens > 0 ? 'warning' : 'default'} />
        <StatTile label="Last payout" value={formatMoney(casino.slotsLastResult.payout)} tone={casino.slotsLastResult.payout > 0 ? 'positive' : 'default'} />
      </View>

      <Panel>
        <View style={styles.reels}>
          {displayedSymbols.map((symbol, index) => (
            <SlotReel finalSymbol={symbol} index={index} key={index} spinning={spinningReels[index]} />
          ))}
        </View>

        <View style={styles.spinButtonWrap}>
          <ActionButton disabled={!canSpin} Icon={Gem} onPress={handleSpin} size="large" tone="casino">
            {isSpinning ? 'Spinning...' : 'Spin'}
          </ActionButton>
        </View>
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
                  disabled={player.cash < pack.price || isSpinning}
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
  reels: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reel: {
    flex: 1,
    height: reelHeight,
    borderRadius: 8,
    borderColor: colors.warningMuted,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  spinningReel: {
    borderColor: colors.warning,
    backgroundColor: colors.surfaceRaised,
  },
  reelStrip: {
    height: reelHeight * 2,
  },
  reelSlot: {
    height: reelHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  reelShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  symbol: {
    color: colors.warning,
    fontFamily: typography.family,
    fontSize: 25,
    fontWeight: '900',
  },
  spinButtonWrap: {
    minHeight: 68,
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
