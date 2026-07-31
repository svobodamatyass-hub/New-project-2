import { useEffect, useRef, useState } from 'react';
import { BookOpen, Club, X } from 'lucide-react-native';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';

import { ActionButton } from '../components/ActionButton';
import { CasinoResultBanner } from '../components/CasinoResultBanner';
import { InfoRow } from '../components/InfoRow';
import { Panel } from '../components/Panel';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import { WagerInput } from '../components/WagerInput';
import { getCasinoDifficultyConfig } from '../domain/casino';
import { useCasinoFeedback } from '../feedback/useCasinoFeedback';
import { formatMoney } from '../domain/finance';
import { useGame } from '../game/GameProvider';
import type { BlackjackCard, BlackjackResult } from '../types/domain';
import { colors, spacing, typography } from '../theme';

const ranks = [
  { rank: 'A', value: 11 },
  { rank: '2', value: 2 },
  { rank: '3', value: 3 },
  { rank: '4', value: 4 },
  { rank: '5', value: 5 },
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 10 },
  { rank: 'Q', value: 10 },
  { rank: 'K', value: 10 },
] as const;
const suits = ['S', 'H', 'D', 'C'] as const;

type HandState = {
  deck: BlackjackCard[];
  playerCards: BlackjackCard[];
  dealerCards: BlackjackCard[];
  wager: number;
  status: 'playing' | 'settled';
  result: BlackjackResult | null;
};

function buildDeck() {
  const deck: BlackjackCard[] = [];

  suits.forEach((suit) => {
    ranks.forEach((card) => {
      deck.push({ rank: card.rank, suit, value: card.value });
    });
  });

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck;
}

function drawCard(deck: BlackjackCard[]) {
  const [card, ...nextDeck] = deck;
  return { card, deck: nextDeck };
}

function getHandTotal(cards: BlackjackCard[]) {
  let total = cards.reduce((sum, card) => sum + card.value, 0);
  let aces = cards.filter((card) => card.rank === 'A').length;

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

function isBlackjack(cards: BlackjackCard[]) {
  return cards.length === 2 && getHandTotal(cards) === 21;
}

function createResult(
  playerCards: BlackjackCard[],
  dealerCards: BlackjackCard[],
  wager: number,
  payoutMultiplier: number,
): BlackjackResult {
  const playerTotal = getHandTotal(playerCards);
  const dealerTotal = getHandTotal(dealerCards);
  const playerBlackjack = isBlackjack(playerCards);
  const dealerBlackjack = isBlackjack(dealerCards);
  let outcome: BlackjackResult['outcome'] = 'loss';
  let payout = 0;

  if (playerBlackjack && dealerBlackjack) {
    outcome = 'push';
    payout = wager;
  } else if (playerBlackjack) {
    outcome = 'blackjack';
    payout = Math.round(wager * 2.5 * payoutMultiplier);
  } else if (playerTotal > 21) {
    outcome = 'loss';
  } else if (dealerBlackjack) {
    outcome = 'loss';
  } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
    outcome = 'win';
    payout = Math.round(wager * 2 * payoutMultiplier);
  } else if (playerTotal === dealerTotal) {
    outcome = 'push';
    payout = wager;
  }

  return {
    playerCards,
    dealerCards,
    playerTotal,
    dealerTotal,
    outcome,
    wager,
    payout,
  };
}

function drawDealerToRule(deck: BlackjackCard[], dealerCards: BlackjackCard[]) {
  let nextDeck = deck;
  const nextDealerCards = [...dealerCards];

  while (getHandTotal(nextDealerCards) < 17) {
    const draw = drawCard(nextDeck);
    nextDealerCards.push(draw.card);
    nextDeck = draw.deck;
  }

  return { deck: nextDeck, dealerCards: nextDealerCards };
}

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
  const flip = useRef(new Animated.Value(0)).current;
  const isRed = card?.suit === 'H' || card?.suit === 'D';
  const suitColor = isRed ? colors.negative : '#18212A';

  useEffect(() => {
    translateY.setValue(10);
    opacity.setValue(0);
    flip.setValue(0);

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
      Animated.timing(flip, {
        toValue: 1,
        duration: 240,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [card?.rank, card?.suit, faceDown, flip, index, opacity, translateY]);

  const rotateY = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['82deg', '0deg'],
  });

  return (
    <Animated.View
      style={[
        styles.cardTile,
        faceDown && styles.cardBack,
        {
          opacity,
          transform: [{ perspective: 700 }, { rotateY }, { translateY }],
        },
      ]}
    >
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
  const [wager, setWager] = useState(500);
  const [hand, setHand] = useState<HandState | null>(null);
  const [dealStep, setDealStep] = useState(4);
  const [isInitialDealing, setIsInitialDealing] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { settleBlackjack, state } = useGame();
  const feedback = useCasinoFeedback();
  const { blackjackLastResult } = state.casino;
  const payoutMultiplier = getCasinoDifficultyConfig(state.settings.economyDifficulty).blackjackPayoutMultiplier;
  const activeHand = hand?.status === 'playing' ? hand : null;
  const shownResult = hand?.result ?? blackjackLastResult;
  const playerCards = activeHand?.playerCards ?? shownResult?.playerCards ?? [];
  const dealerCards = activeHand?.dealerCards ?? shownResult?.dealerCards ?? [];
  const visiblePlayerCards = activeHand && isInitialDealing ? playerCards.slice(0, dealStep >= 3 ? 2 : dealStep >= 1 ? 1 : 0) : playerCards;
  const dealerVisibleCards =
    activeHand && isInitialDealing
      ? dealerCards.slice(0, dealStep >= 2 ? 1 : 0)
      : activeHand
        ? dealerCards.slice(0, 1)
        : dealerCards;
  const playerTotal = getHandTotal(visiblePlayerCards);
  const dealerTotal = activeHand ? getHandTotal(dealerVisibleCards) : getHandTotal(dealerCards);
  const canDeal = state.player.cash >= wager && !activeHand && !isInitialDealing;
  const canAct = Boolean(activeHand) && !isInitialDealing;
  const resultTone =
    shownResult?.outcome === 'win' || shownResult?.outcome === 'blackjack'
      ? 'positive'
      : shownResult?.outcome === 'loss'
        ? 'negative'
        : 'default';

  useEffect(
    () => () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    },
    [],
  );

  function commitResult(result: BlackjackResult) {
    feedback.blackjackResult(result.outcome);
    settleBlackjack(result);
    setHand((current) => (current ? { ...current, status: 'settled', result } : current));
  }

  function handleDeal() {
    if (!canDeal) {
      return;
    }

    let deck = buildDeck();
    const playerCards: BlackjackCard[] = [];
    const dealerCards: BlackjackCard[] = [];

    for (let index = 0; index < 2; index += 1) {
      const playerDraw = drawCard(deck);
      playerCards.push(playerDraw.card);
      deck = playerDraw.deck;

      const dealerDraw = drawCard(deck);
      dealerCards.push(dealerDraw.card);
      deck = dealerDraw.deck;
    }

    const nextHand: HandState = {
      deck,
      playerCards,
      dealerCards,
      wager,
      status: 'playing',
      result: null,
    };
    setHand(nextHand);
    setDealStep(0);
    setIsInitialDealing(true);
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current = [
      setTimeout(() => {
        feedback.blackjackDeal();
        setDealStep(1);
      }, 160),
      setTimeout(() => {
        feedback.blackjackDeal();
        setDealStep(2);
      }, 460),
      setTimeout(() => {
        feedback.blackjackDeal();
        setDealStep(3);
      }, 760),
      setTimeout(() => {
        feedback.blackjackDeal();
        setDealStep(4);
      }, 1060),
      setTimeout(() => {
        setIsInitialDealing(false);

        if (isBlackjack(playerCards) || isBlackjack(dealerCards)) {
          commitResult(createResult(playerCards, dealerCards, wager, payoutMultiplier));
        }
      }, 1320),
    ];
  }

  function handleHit() {
    if (!activeHand) {
      return;
    }

    feedback.blackjackHit();
    const draw = drawCard(activeHand.deck);
    const nextPlayerCards = [...activeHand.playerCards, draw.card];
    const nextHand = {
      ...activeHand,
      deck: draw.deck,
      playerCards: nextPlayerCards,
    };

    setHand(nextHand);

    if (getHandTotal(nextPlayerCards) > 21) {
      commitResult(createResult(nextPlayerCards, activeHand.dealerCards, activeHand.wager, payoutMultiplier));
    }
  }

  function handleStand() {
    if (!activeHand) {
      return;
    }

    const dealerDraw = drawDealerToRule(activeHand.deck, activeHand.dealerCards);
    const result = createResult(activeHand.playerCards, dealerDraw.dealerCards, activeHand.wager, payoutMultiplier);
    setHand({
      ...activeHand,
      deck: dealerDraw.deck,
      dealerCards: dealerDraw.dealerCards,
    });
    commitResult(result);
  }

  return (
    <>
      <SectionHeader title="Blackjack" />

      <View style={styles.gameHero}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>PREMIUM TABLE</Text>
          <Text style={styles.heroSubline}>Classic 21 | live hand</Text>
        </View>
        <View style={styles.heroIcon}>
          <Club color={colors.warning} size={22} strokeWidth={2.4} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatTile label="Cash" value={formatMoney(state.player.cash)} tone="default" />
        <StatTile label="Casino P/L" value={formatMoney(state.player.casinoProfit)} tone="warning" />
      </View>

      <Panel>
        <Text style={styles.panelTitle}>Wager</Text>
        <WagerInput disabled={Boolean(activeHand) || isInitialDealing} max={state.player.cash} onChange={setWager} value={wager} />
        <ActionButton disabled={!canDeal} Icon={Club} onPress={handleDeal} tone="casino">
          Deal
        </ActionButton>
        {state.player.cash < wager ? <Text style={styles.hint}>Not enough cash for this wager.</Text> : null}
      </Panel>

      <Panel>
        <View style={styles.hand}>
          <View style={styles.handHeader}>
            <Text style={styles.handLabel}>Dealer</Text>
            <Text style={styles.handTotal}>{dealerVisibleCards.length > 0 ? dealerTotal : '-'}</Text>
          </View>
          <View style={styles.cardRow}>
            {dealerCards.length > 0 ? (
              dealerCards.map((card, index) => (
                <CardTile
                  card={card}
                  faceDown={Boolean(activeHand && (index === 1 || (isInitialDealing && index === 0 && dealStep < 2)))}
                  index={index}
                  key={`dealer-${card.rank}-${card.suit}-${index}`}
                />
              ))
            ) : (
              <Text style={styles.empty}>Dealer hand appears after Deal.</Text>
            )}
          </View>
        </View>

        <View style={styles.hand}>
          <View style={styles.handHeader}>
            <Text style={styles.handLabel}>You</Text>
            <Text style={styles.handTotal}>{visiblePlayerCards.length > 0 ? playerTotal : '-'}</Text>
          </View>
          <View style={styles.cardRow}>
            {playerCards.length > 0 ? (
              playerCards.map((card, index) => (
                <CardTile
                  card={card}
                  faceDown={Boolean(activeHand && isInitialDealing && ((index === 0 && dealStep < 1) || (index === 1 && dealStep < 3)))}
                  index={index}
                  key={`player-${card.rank}-${card.suit}-${index}`}
                />
              ))
            ) : (
              <Text style={styles.empty}>Your cards appear after Deal.</Text>
            )}
          </View>
        </View>

        {activeHand ? (
          <View style={styles.actionRow}>
            <ActionButton disabled={!canAct} onPress={handleHit} tone="primary">
              Hit
            </ActionButton>
            <ActionButton disabled={!canAct} onPress={handleStand} tone="casino">
              Stand
            </ActionButton>
          </View>
        ) : null}

        {shownResult ? (
          <CasinoResultBanner
            caption="Last hand"
            title={shownResult.outcome}
            tone={resultTone}
            value={formatMoney(shownResult.payout - shownResult.wager)}
          />
        ) : null}

        {shownResult ? (
          <>
            <InfoRow label="Outcome" value={shownResult.outcome} tone={resultTone} />
            <InfoRow label="Dealer total" value={`${shownResult.dealerTotal}`} />
            <InfoRow
              label="Net"
              value={formatMoney(shownResult.payout - shownResult.wager)}
              tone={resultTone}
            />
          </>
        ) : null}
      </Panel>

      <Pressable
        accessibilityLabel="Blackjack rules"
        accessibilityRole="button"
        onPress={() => setShowRules(true)}
        style={({ pressed }) => [styles.rulesButton, pressed && styles.pressed]}
      >
        <BookOpen color={colors.text} size={20} strokeWidth={2.3} />
      </Pressable>

      <Modal animationType="fade" transparent visible={showRules} onRequestClose={() => setShowRules(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.rulesSheet}>
            <View style={styles.rulesHeader}>
              <Text style={styles.rulesTitle}>Blackjack rules</Text>
              <Pressable
                accessibilityLabel="Close rules"
                accessibilityRole="button"
                onPress={() => setShowRules(false)}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              >
                <X color={colors.textMuted} size={18} strokeWidth={2.4} />
              </Pressable>
            </View>

            <View style={styles.ruleList}>
              <Text style={styles.ruleText}>Get closer to 21 than the dealer.</Text>
              <Text style={styles.ruleText}>The deck is shuffled once on Deal, then every Hit and dealer draw uses that same deck with no hidden bias.</Text>
              <Text style={styles.ruleText}>Number cards count as shown. J, Q and K count as 10.</Text>
              <Text style={styles.ruleText}>Ace counts as 11, but becomes 1 if your hand would go over 21.</Text>
              <Text style={styles.ruleText}>Hit draws one card. Stand ends your turn.</Text>
              <Text style={styles.ruleText}>Dealer reveals the hidden card and draws until 17 or more.</Text>
              <Text style={styles.ruleText}>Over 21 is bust. Same total is push and returns the wager.</Text>
              <Text style={styles.ruleText}>Normal win pays 2x. Blackjack pays 2.5x.</Text>
            </View>
          </View>
        </View>
      </Modal>
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
    borderColor: '#4B3D26',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#211C16',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCopy: {
    gap: 4,
  },
  heroEyebrow: {
    color: colors.warning,
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
  panelTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: '800',
  },
  hand: {
    minHeight: 116,
    borderRadius: 14,
    borderColor: '#313B4A',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#101923',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  handHeader: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  handLabel: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  handTotal: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '900',
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cardTile: {
    width: 56,
    height: 78,
    borderRadius: 10,
    borderColor: '#465265',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#F5F6F8',
    padding: spacing.xs,
    justifyContent: 'space-between',
  },
  cardBack: {
    backgroundColor: '#152538',
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
    color: '#18212A',
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
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  rulesButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  rulesSheet: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  rulesHeader: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rulesTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 17,
    fontWeight: '900',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleList: {
    gap: spacing.sm,
  },
  ruleText: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.72,
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
