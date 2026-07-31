import { useEffect, useRef, useState } from 'react';
import { Gem, Sparkles, Ticket } from 'lucide-react-native';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { CasinoResultBanner } from '../components/CasinoResultBanner';
import { Panel } from '../components/Panel';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import { getCasinoDifficultyConfig, slotsSymbols, spinSlots as createSlotsResult, tokenPacks } from '../domain/casino';
import { formatMoney } from '../domain/finance';
import { useGame } from '../game/GameProvider';
import type { SlotsResult } from '../types/domain';
import { colors, spacing, typography } from '../theme';

const reelHeight = 92;
const spinDurations = [750, 1050, 1350];

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
      <SectionHeader title="Slots" caption="Neon Royale | live cabinet" />

      <View style={styles.statsRow}>
        <StatTile label="Tokens" value={`${casino.tokens}`} tone={casino.tokens > 0 ? 'warning' : 'default'} />
        <StatTile label="Last payout" value={formatMoney(casino.slotsLastResult.payout)} tone={casino.slotsLastResult.payout > 0 ? 'positive' : 'default'} />
      </View>

      <Panel>
        <View style={styles.stageHeader}>
          <View>
            <Text style={styles.eyebrow}>MIDNIGHT JACKPOT</Text>
            <Text style={styles.stageTitle}>Spin for a clean hit</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.reels}>
          {displayedSymbols.map((symbol, index) => (
            <SlotReel finalSymbol={symbol} index={index} key={index} spinning={spinningReels[index]} />
          ))}
        </View>

        <View style={styles.paytableStrip}>
          <View style={styles.paytableItem}>
            <Sparkles color={colors.warning} size={15} />
            <Text style={styles.paytableText}>Match 3 pays big</Text>
          </View>
          <Text style={styles.paytableHint}>1 token / spin</Text>
        </View>

        <CasinoResultBanner
          caption="Last spin"
          title={casino.slotsLastResult.payout > 0 ? casino.slotsLastResult.symbols.join(' ') : 'No hit'}
          tone={casino.slotsLastResult.payout > 0 ? 'positive' : 'default'}
          value={formatMoney(casino.slotsLastResult.payout)}
        />

        <View style={styles.spinButtonWrap}>
          <ActionButton disabled={!canSpin} Icon={Gem} onPress={handleSpin} size="large" tone="casino">
            {isSpinning ? 'Spinning...' : 'Spin'}
          </ActionButton>
        </View>
      </Panel>

      <Panel>
        <View style={styles.shopHeader}>
          <View>
            <Text style={styles.panelTitle}>Token vault</Text>
            <Text style={styles.panelCaption}>Top up your bankroll with paper credits</Text>
          </View>
          <Ticket color={colors.warning} size={20} />
        </View>
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
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.warning,
    fontFamily: typography.family,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  stageTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.positiveSoft,
    borderColor: colors.positiveMuted,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.positive,
  },
  liveText: {
    color: colors.positive,
    fontFamily: typography.family,
    fontSize: 10,
    fontWeight: '900',
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
    borderWidth: 1,
    backgroundColor: '#0B0D12',
    overflow: 'hidden',
  },
  spinningReel: {
    borderColor: colors.warning,
    backgroundColor: '#171318',
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
    fontSize: 28,
    fontWeight: '900',
  },
  spinButtonWrap: {
    minHeight: 68,
  },
  paytableStrip: {
    minHeight: 42,
    borderRadius: 8,
    borderColor: colors.warningMuted,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  paytableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paytableText: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '800',
  },
  paytableHint: {
    color: colors.warning,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '900',
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  panelTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: '800',
  },
  panelCaption: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
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
