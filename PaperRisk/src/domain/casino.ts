import type {
  BlackjackCard,
  BlackjackResult,
  FortuneWheelResult,
  FortuneWheelSection,
  RouletteBet,
  RouletteColor,
  RouletteResult,
  SlotsResult,
} from '../types/domain';

export const casinoGames = [
  {
    id: 'slots',
    title: 'Slots',
    description: 'Token spins with a rising pity chance.',
    accent: 'warning',
  },
  {
    id: 'blackjack',
    title: 'Blackjack',
    description: 'Quick hands against the dealer.',
    accent: 'positive',
  },
  {
    id: 'roulette',
    title: 'Roulette',
    description: 'Pick a color and accept the swing.',
    accent: 'negative',
  },
  {
    id: 'fortune',
    title: 'Wheel',
    description: 'Token wheel with adjustable sections.',
    accent: 'accent',
  },
] as const;

export const tokenPacks = [
  { id: 'starter', tokens: 25, price: 1000 },
  { id: 'stack', tokens: 75, price: 2500 },
  { id: 'vault', tokens: 180, price: 5000 },
] as const;

export const slotsSymbols = ['7', 'BAR', 'DIA', 'DOT', 'STAR', 'K', 'Q', 'A', 'CHIP', 'BELL', 'CROWN', 'X'] as const;

export const slotsBaseWinChance = 0.55;
export const slotsChanceStep = 0;
export const slotsMaxWinChance = 0.55;
export const fortuneWheelTokenCost = 4;
export const defaultFortuneWheelSectionCount = 20;
export const fortuneWheelSectionOptions = [12, 16, 20, 24] as const;

export type CasinoDifficulty = 'easy' | 'normal' | 'hard';

export type CasinoDifficultyConfig = {
  slotsWinChanceOffset: number;
  slotsPayoutMultiplier: number;
  rouletteBoostOffset: number;
  roulettePayoutMultiplier: number;
  blackjackPayoutMultiplier: number;
};

export function getCasinoDifficultyConfig(difficulty: CasinoDifficulty): CasinoDifficultyConfig {
  switch (difficulty) {
    case 'easy':
      return {
        slotsWinChanceOffset: 0.04,
        slotsPayoutMultiplier: 1.1,
        rouletteBoostOffset: 0.02,
        roulettePayoutMultiplier: 1.05,
        blackjackPayoutMultiplier: 1.05,
      };
    case 'hard':
      return {
        slotsWinChanceOffset: -0.06,
        slotsPayoutMultiplier: 0.9,
        rouletteBoostOffset: -0.015,
        roulettePayoutMultiplier: 0.93,
        blackjackPayoutMultiplier: 0.94,
      };
    case 'normal':
    default:
      return {
        slotsWinChanceOffset: 0,
        slotsPayoutMultiplier: 1,
        rouletteBoostOffset: 0,
        roulettePayoutMultiplier: 1,
        blackjackPayoutMultiplier: 1,
      };
  }
}

export function getSlotsWinChance(losingStreak: number) {
  return Math.min(slotsBaseWinChance + losingStreak * slotsChanceStep, slotsMaxWinChance);
}

function pickSymbol() {
  return slotsSymbols[Math.floor(Math.random() * slotsSymbols.length)];
}

function pickWinningTier() {
  const roll = Math.random();

  if (roll < 0.01) {
    return 'jackpot';
  }

  if (roll < 0.08) {
    return 'big';
  }

  if (roll < 0.28) {
    return 'medium';
  }

  return 'small';
}

function getTierPayout(tier: 'small' | 'medium' | 'big' | 'jackpot') {
  switch (tier) {
    case 'jackpot':
      return 5000;
    case 'big':
      return 1500;
    case 'medium':
      return 500;
    case 'small':
    default:
      return 200;
  }
}

function getWinningSymbols(tier: 'small' | 'medium' | 'big' | 'jackpot') {
  switch (tier) {
    case 'jackpot':
      return ['7', '7', '7'];
    case 'big':
      return ['STAR', 'STAR', 'STAR'];
    case 'medium':
      return ['BAR', 'BAR', 'BAR'];
    case 'small':
    default:
      return ['DIA', 'DIA', 'DIA'];
  }
}

export function spinSlots(
  losingStreak: number,
  options?: {
    winChanceOffset?: number;
    payoutMultiplier?: number;
  },
): SlotsResult {
  const offset = options?.winChanceOffset ?? 0;
  const payoutMultiplier = options?.payoutMultiplier ?? 1;
  const winChance = Math.max(0.02, Math.min(0.92, getSlotsWinChance(losingStreak) + offset));
  const isWin = Math.random() < winChance;

  if (!isWin) {
    return {
      symbols: [pickSymbol(), pickSymbol(), pickSymbol()],
      tier: 'none',
      payout: 0,
      winChance,
    };
  }

  const tier = pickWinningTier();

  return {
    symbols: getWinningSymbols(tier),
    tier,
    payout: Math.max(1, Math.round(getTierPayout(tier) * payoutMultiplier)),
    winChance,
  };
}

const fortuneWheelBaseSections: FortuneWheelSection[] = [
  { id: 'zero-a', label: '0', payout: 0 },
  { id: 'ten-a', label: '10', payout: 10 },
  { id: 'zero-b', label: '0', payout: 0 },
  { id: 'fifty-a', label: '50', payout: 50 },
  { id: 'zero-c', label: '0', payout: 0 },
  { id: 'twenty-five-a', label: '25', payout: 25 },
  { id: 'zero-d', label: '0', payout: 0 },
  { id: 'hundred-a', label: '100', payout: 100 },
  { id: 'ten-b', label: '10', payout: 10 },
  { id: 'zero-e', label: '0', payout: 0 },
  { id: 'fifty-b', label: '50', payout: 50 },
  { id: 'zero-f', label: '0', payout: 0 },
  { id: 'twenty-five-b', label: '25', payout: 25 },
  { id: 'zero-g', label: '0', payout: 0 },
  { id: 'two-fifty', label: '250', payout: 250 },
  { id: 'ten-c', label: '10', payout: 10 },
  { id: 'zero-h', label: '0', payout: 0 },
  { id: 'fifty-c', label: '50', payout: 50 },
  { id: 'five-hundred', label: '500', payout: 500 },
  { id: 'jackpot', label: 'Jackpot', payout: 750, isJackpot: true },
  { id: 'zero-i', label: '0', payout: 0 },
  { id: 'twenty-five-c', label: '25', payout: 25 },
  { id: 'zero-j', label: '0', payout: 0 },
  { id: 'hundred-b', label: '100', payout: 100 },
];

export function getFortuneWheelSections(sectionCount = defaultFortuneWheelSectionCount): FortuneWheelSection[] {
  const count = Math.max(8, Math.min(fortuneWheelBaseSections.length, Math.round(sectionCount)));
  const jackpot = fortuneWheelBaseSections.find((section) => section.isJackpot) ?? fortuneWheelBaseSections[19];
  const regularSections = fortuneWheelBaseSections.filter((section) => !section.isJackpot).slice(0, count - 1);

  return [...regularSections, jackpot].map((section, index) => ({
    ...section,
    id: `${section.id}-${index}`,
  }));
}

export function spinFortuneWheel(sectionCount = defaultFortuneWheelSectionCount): FortuneWheelResult {
  const sections = getFortuneWheelSections(sectionCount);
  const sectionIndex = Math.floor(Math.random() * sections.length);
  const section = sections[sectionIndex];

  return {
    sectionIndex,
    sectionCount: sections.length,
    label: section.label,
    payout: section.payout,
    tokenCost: fortuneWheelTokenCost,
    isJackpot: Boolean(section.isJackpot),
  };
}

const blackjackRanks = [
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

const blackjackSuits = ['S', 'H', 'D', 'C'] as const;

function drawBlackjackCard(): BlackjackCard {
  const card = blackjackRanks[Math.floor(Math.random() * blackjackRanks.length)];
  const suit = blackjackSuits[Math.floor(Math.random() * blackjackSuits.length)];

  return {
    rank: card.rank,
    suit,
    value: card.value,
  };
}

function getBlackjackTotal(cards: BlackjackCard[]) {
  let total = cards.reduce((sum, card) => sum + card.value, 0);
  let aces = cards.filter((card) => card.rank === 'A').length;

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

export function playBlackjack(wager: number, payoutMultiplier = 1): BlackjackResult {
  const playerCards = [drawBlackjackCard(), drawBlackjackCard()];
  const dealerCards = [drawBlackjackCard(), drawBlackjackCard()];
  let playerTotal = getBlackjackTotal(playerCards);
  let dealerTotal = getBlackjackTotal(dealerCards);

  while (playerTotal < 17) {
    playerCards.push(drawBlackjackCard());
    playerTotal = getBlackjackTotal(playerCards);
  }

  while (dealerTotal < 17) {
    dealerCards.push(drawBlackjackCard());
    dealerTotal = getBlackjackTotal(dealerCards);
  }

  const playerBlackjack = playerCards.length === 2 && playerTotal === 21;
  const dealerBlackjack = dealerCards.length === 2 && dealerTotal === 21;
  let outcome: BlackjackResult['outcome'] = 'loss';
  let payout = 0;

  if (playerBlackjack && !dealerBlackjack) {
    outcome = 'blackjack';
    payout = Math.round(wager * 2.5 * payoutMultiplier);
  } else if (playerTotal > 21) {
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

export const rouletteColorBets: Array<{ color: Exclude<RouletteColor, 'green'>; label: string; payoutMultiplier: number }> = [
  { color: 'red', label: 'Red', payoutMultiplier: 2 },
  { color: 'black', label: 'Black', payoutMultiplier: 2 },
];

export const europeanRouletteNumbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22,
  18, 29, 7, 28, 12, 35, 3, 26,
] as const;

const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export function getRouletteColor(number: number): RouletteColor {
  if (number === 0) {
    return 'green';
  }

  return redNumbers.has(number) ? 'red' : 'black';
}

export function getRoulettePocketIndex(number: number) {
  return Math.max(0, europeanRouletteNumbers.findIndex((item) => item === number));
}

export function getRouletteBetLabel(bet: RouletteBet) {
  return bet.type === 'number' ? `${bet.number}` : bet.color;
}

export function getRouletteBetPayoutMultiplier(bet: RouletteBet) {
  return bet.type === 'number' ? 20 : 2;
}

export function getRouletteBaseWinChance(bet: RouletteBet) {
  if (bet.type === 'number') {
    return 1 / europeanRouletteNumbers.length;
  }

  return europeanRouletteNumbers.filter((number) => getRouletteColor(number) === bet.color).length / europeanRouletteNumbers.length;
}

export function getRouletteBoostedWinChance(bet: RouletteBet, boostOffset = 0) {
  const straightBetPenalty = bet.type === 'number' ? 0.01 : 0;

  return Math.min(Math.max(0.01, getRouletteBaseWinChance(bet) + 0.05 + boostOffset - straightBetPenalty), 0.98);
}

function isRouletteWin(bet: RouletteBet, number: number, color: RouletteColor) {
  if (bet.type === 'number') {
    return bet.number === number;
  }

  return bet.color === color;
}

function getWinningRouletteNumbers(bet: RouletteBet) {
  if (bet.type === 'number') {
    return [bet.number];
  }

  return europeanRouletteNumbers.filter((number) => getRouletteColor(number) === bet.color);
}

function getLosingRouletteNumbers(bet: RouletteBet) {
  const winningNumbers = new Set(getWinningRouletteNumbers(bet));

  return europeanRouletteNumbers.filter((number) => !winningNumbers.has(number));
}

export function playRoulette(
  bet: RouletteBet,
  wager: number,
  options?: {
    boostOffset?: number;
    payoutMultiplier?: number;
  },
): RouletteResult {
  const boostedWinChance = getRouletteBoostedWinChance(bet, options?.boostOffset ?? 0);
  const isBoostedWin = Math.random() < boostedWinChance;
  const winningNumbers = getWinningRouletteNumbers(bet);
  const losingNumbers = getLosingRouletteNumbers(bet);
  const number = isBoostedWin
    ? winningNumbers[Math.floor(Math.random() * winningNumbers.length)]
    : losingNumbers[Math.floor(Math.random() * losingNumbers.length)];
  const pocketIndex = getRoulettePocketIndex(number);
  const color = getRouletteColor(number);
  const payout = isRouletteWin(bet, number, color)
    ? Math.max(1, Math.round(wager * getRouletteBetPayoutMultiplier(bet) * (options?.payoutMultiplier ?? 1)))
    : 0;

  return {
    bet,
    number,
    color,
    pocketIndex,
    wager,
    payout,
  };
}
