import { useEffect, useRef, useState } from 'react';
import { Club } from 'lucide-react-native';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';

import { ActionButton } from '../components/ActionButton';
import { AmountSelector } from '../components/AmountSelector';
import { InfoRow } from '../components/InfoRow';
import { Panel } from '../components/Panel';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import { formatMoney } from '../domain/finance';
import { useGame } from '../game/GameProvider';
import type { BlackjackCard } from '../types/domain';
import { colors, spacing, typography } from '../theme';

const wagerOptions = [250, 500, 1000];

function SuitMark({ color, size = 18, suit }: { color: string; size?: number; suit?: string }) {
  if (suit === 'H') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path
          d="M12 20 C8 16.6 4.5 13.6 4.5 9.5 C4.5 7.2 6 5.5 8.2 5.5 C9.7 5.5 11 6.3 12 7.7 C13 6.3 14.3 5.5 15.8 5.5 C18 5.5 19.5 7.2 19.5 9.5 C19.5 13.6 16 16.6 12 20 Z"
          fill={color}
        />
      </Svg>
    );
  }

  if (suit === 'D') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path d="M12 3 L20 12 L12 21 L4 12 Z" fill={color} />
      </Svg>
    );
  }

  if (suit === 'C') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Circle cx="12" cy="8" fill={color} r="4.2" />
        <Circle cx="8" cy="13" fill={color} r="4.2" />
        <Circle cx="16" cy="13" fill={color} r="4.2" />
        <Path d="M12 13 L15.5 21 H8.5 Z" fill={color} />
      </Svg>
    );
  }

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M12 3 C8.1 6.4 5 9.6 5 13.1 C5 15.5 6.6 17.1 8.8 17.1 C10.1 17.1 11 16.6 12 15.6 C13 16.6 13.9 17.1 15.2 17.1 C17.4 17.1 19 15.5 19 13.1 C19 9.6 15.9 6.4 12 3 Z"
        fill={color}
      />
      <Polygon fill={color} points="12,14 15.5,21 8.5,21" />
    </Svg>
  );
}

function CardTile({ card, faceDown = false, index = 0 }: { card?: BlackjackCard; faceDown?: boolean; index?: number }) {
  const translateY = useRef(new Animated.Value(10)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isRed = card?.suit === 'H' || card?.suit === 'D';
  const suitColor = isRed ? colors.negative : colors.textMuted;

  useEffect(() => {
    translateY.setValue(10);
    opacity.setValue(0);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [card?.rank, card?.suit, faceDown, index, opacity, translateY]);

  return (
    <Animated.View style={[styles.cardTile, faceDown && styles.cardBack, { opacity, transform: [{ translateY }] }]}>
      {faceDown ? (
        <View style={styles.cardBackMark}>
          <View style={styles.cardBackLine} />
          <View style={styles.cardBackLineShort} />
          <View style={styles.cardBackLine} />
        </View>
      ) : (
        <>
          <View style={styles.cardTop}>
            <Text style={[styles.cardRank, isRed && styles.cardRed]}>{card?.rank}</Text>
            <SuitMark color={suitColor} size={12} suit={card?.suit} />
          </View>
          <View style={styles.cardSuit}>
            <SuitMark color={suitColor} size={23} suit={card?.suit} />
          </View>
        </>
      )}
    </Animated.View>
  );
}

export function BlackjackScreen() {
  const [wager, setWager] = useState(wagerOptions[1]);
  const [isDealing, setIsDealing] = useState(false);
  const [dealStep, setDealStep] = useState(0);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { playBlackjack, state } = useGame();
  const { blackjackLastResult } = state.casino;
  const canPlay = state.player.cash >= wager && !isDealing;
  const resultTone =
    blackjackLastResult?.outcome === 'win' || blackjackLastResult?.outcome === 'blackjack'
      ? 'positive'
      : blackjackLastResult?.outcome === 'loss'
        ? 'negative'
        : 'default';

  useEffect(
    () => () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    },
    [],
  );

  function handleDeal() {
    if (!canPlay) {
      return;
    }

    setIsDealing(true);
    setDealStep(0);
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current = [
      setTimeout(() => setDealStep(1), 120),
      setTimeout(() => setDealStep(2), 360),
      setTimeout(() => setDealStep(3), 600),
      setTimeout(() => setDealStep(4), 840),
      setTimeout(() => {
        playBlackjack(wager);
        setIsDealing(false);
        setDealStep(0);
      }, 1280),
    ];
  }

  return (
    <>
      <SectionHeader title="Blackjack" caption="Pick a wager and play one fast dealer hand." />

      <View style={styles.statsRow}>
        <StatTile label="Cash" value={formatMoney(state.player.cash)} tone="default" />
        <StatTile label="Casino P/L" value={formatMoney(state.player.casinoProfit)} tone="warning" />
      </View>

      <Panel>
        <Text style={styles.panelTitle}>Wager</Text>
        <AmountSelector amounts={wagerOptions} selectedAmount={wager} onSelectAmount={setWager} />
        <ActionButton disabled={!canPlay} Icon={Club} onPress={handleDeal} tone="casino">
          {isDealing ? 'Dealing...' : 'Deal hand'}
        </ActionButton>
        {state.player.cash < wager ? <Text style={styles.hint}>Not enough cash for this wager.</Text> : null}
      </Panel>

      <Panel>
        <Text style={styles.panelTitle}>Last hand</Text>
        {isDealing ? (
          <>
            <View style={styles.hand}>
              <Text style={styles.handLabel}>You</Text>
              <View style={styles.cardRow}>
                {Array.from({ length: Math.min(dealStep, 2) }).map((_, index) => (
                  <CardTile faceDown index={index} key={`player-dealing-${index}`} />
                ))}
              </View>
            </View>
            <View style={styles.hand}>
              <Text style={styles.handLabel}>Dealer</Text>
              <View style={styles.cardRow}>
                {Array.from({ length: Math.max(0, dealStep - 2) }).map((_, index) => (
                  <CardTile faceDown index={index} key={`dealer-dealing-${index}`} />
                ))}
              </View>
            </View>
            <Text style={styles.empty}>Cards are landing...</Text>
          </>
        ) : blackjackLastResult ? (
          <>
            <View style={styles.hand}>
              <Text style={styles.handLabel}>You</Text>
              <View style={styles.cardRow}>
                {blackjackLastResult.playerCards.map((card, index) => (
                  <CardTile card={card} index={index} key={`player-${card.rank}-${card.suit}-${index}`} />
                ))}
              </View>
            </View>
            <View style={styles.hand}>
              <Text style={styles.handLabel}>Dealer</Text>
              <View style={styles.cardRow}>
                {blackjackLastResult.dealerCards.map((card, index) => (
                  <CardTile card={card} index={index} key={`dealer-${card.rank}-${card.suit}-${index}`} />
                ))}
              </View>
            </View>
            <InfoRow label="Your total" value={`${blackjackLastResult.playerTotal}`} />
            <InfoRow label="Dealer total" value={`${blackjackLastResult.dealerTotal}`} />
            <InfoRow label="Outcome" value={blackjackLastResult.outcome} tone={resultTone} />
            <InfoRow
              label="Net"
              value={formatMoney(blackjackLastResult.payout - blackjackLastResult.wager)}
              tone={resultTone}
            />
          </>
        ) : (
          <Text style={styles.empty}>No blackjack hand yet.</Text>
        )}
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
  hand: {
    minHeight: 94,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  handLabel: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cardTile: {
    width: 52,
    height: 72,
    borderRadius: 8,
    borderColor: '#323743',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.xs,
    justifyContent: 'space-between',
  },
  cardBack: {
    backgroundColor: colors.background,
    borderColor: colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackMark: {
    width: 26,
    height: 34,
    borderRadius: 6,
    borderColor: colors.warningMuted,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cardBackLine: {
    width: 14,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.warningMuted,
  },
  cardBackLineShort: {
    width: 8,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.warning,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
  },
  cardRank: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 17,
    fontWeight: '900',
  },
  cardSuit: {
    alignSelf: 'center',
  },
  cardRed: {
    color: colors.negative,
  },
  cards: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
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
