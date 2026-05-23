import type {
  BlackjackCard,
  BlackjackResult,
  CrashResult,
  FortuneWheelResult,
  FortuneWheelSection,
  MinesResult,
  PlinkoResult,
  PlinkoRisk,
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
  {
    id: 'crash',
    title: 'Crash',
    description: 'Cash out before the multiplier breaks.',
    accent: 'warning',
  },
  {
    id: 'plinko',
    title: 'Plinko',
    description: 'Drop the ball and chase the right lane.',
    accent: 'accent',
  },
  {
    id: 'mines',
    title: 'Mines',
    description: 'Reveal safe tiles and cash out before a mine.',
    accent: 'positive',
  },
] as const;

export const tokenPacks = [
  { id: 'starter', tokens: 25, price: 1000 },
  { id: 'stack', tokens: 75, price: 2500 },
  { id: 'vault', tokens: 180, price: 5000 },
] as const;

export const slotsSymbols = [
  '\u{1F352}',
  '\u{1F34B}',
  '\u{1F48E}',
  '\u{1F4B0}',
  '\u{1F525}',
  '\u{2B50}',
  '\u{1F514}',
  '\u{1F451}',
  '\u{1F37C}',
  '\u{1F389}',
  '\u{1F680}',
  '\u{26A1}',
] as const;

export const slotsBaseWinChance = 0.24;
export const slotsChanceStep = 0;
export const slotsMaxWinChance = 0.24;
export const fortuneWheelTokenCost = 4;
export const defaultFortuneWheelSectionCount = 20;
export const fortuneWheelSectionOptions = [12, 16, 20, 24] as const;
export const crashMinWager = 50;
export const crashMaxWager = 5000;
export const plinkoRowsOptions = [8, 12, 16] as const;
export const plinkoRiskOptions: PlinkoRisk[] = ['low', 'medium', 'high'];
export const minesColumns = 5;
export const minesTileCount = minesColumns * minesColumns;
export const minesMinCount = 1;
export const minesMaxCount = 24;
export const minesHouseEdge = 0.96;

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

const slotsPremiumSymbols = ['\u{1F48E}', '\u{1F4B0}', '\u{1F451}', '\u{1F680}', '\u{26A1}'];
const slotsHotSymbols = ['\u{1F525}', '\u{2B50}', '\u{1F389}'];

const slotsSymbolWeights: Record<(typeof slotsSymbols)[number], number> = {
  '\u{1F352}': 20,
  '\u{1F34B}': 19,
  '\u{1F48E}': 7,
  '\u{1F4B0}': 5,
  '\u{1F525}': 12,
  '\u{2B50}': 10,
  '\u{1F514}': 16,
  '\u{1F451}': 8,
  '\u{1F37C}': 15,
  '\u{1F389}': 13,
  '\u{1F680}': 6,
  '\u{26A1}': 11,
};

const slotsPayouts: Record<(typeof slotsSymbols)[number], { double: number; triple: number }> = {
  '\u{1F352}': { double: 45, triple: 140 },
  '\u{1F34B}': { double: 50, triple: 165 },
  '\u{1F48E}': { double: 220, triple: 900 },
  '\u{1F4B0}': { double: 260, triple: 1500 },
  '\u{1F525}': { double: 70, triple: 260 },
  '\u{2B50}': { double: 90, triple: 360 },
  '\u{1F514}': { double: 38, triple: 120 },
  '\u{1F451}': { double: 180, triple: 720 },
  '\u{1F37C}': { double: 35, triple: 105 },
  '\u{1F389}': { double: 65, triple: 240 },
  '\u{1F680}': { double: 240, triple: 1100 },
  '\u{26A1}': { double: 110, triple: 420 },
};

function pickWeightedSymbol() {
  const totalWeight = slotsSymbols.reduce((sum, symbol) => sum + slotsSymbolWeights[symbol], 0);
  let roll = Math.random() * totalWeight;

  for (const symbol of slotsSymbols) {
    roll -= slotsSymbolWeights[symbol];

    if (roll <= 0) {
      return symbol;
    }
  }

  return slotsSymbols[slotsSymbols.length - 1];
}

function getSlotsTier(payout: number): SlotsResult['tier'] {
  if (payout >= 4500) {
    return 'jackpot';
  }

  if (payout >= 1000) {
    return 'mega';
  }

  if (payout >= 500) {
    return 'big';
  }

  if (payout >= 200) {
    return 'medium';
  }

  if (payout >= 80) {
    return 'small';
  }

  if (payout > 0) {
    return 'mini';
  }

  return 'none';
}

function evaluateSlotsSymbols(symbols: string[]) {
  const counts = new Map<string, number>();

  for (const symbol of symbols) {
    counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  const [topSymbol, topCount] = sorted[0] ?? [slotsSymbols[0], 0];
  const premiumMix = symbols.every((symbol) => slotsPremiumSymbols.includes(symbol));
  const hotMix = symbols.filter((symbol) => slotsHotSymbols.includes(symbol)).length >= 2;

  if (topCount === 3) {
    const payout = slotsPayouts[topSymbol as (typeof slotsSymbols)[number]]?.triple ?? 0;
    return { payout, tier: getSlotsTier(payout) };
  }

  if (topCount === 2) {
    const payout = slotsPayouts[topSymbol as (typeof slotsSymbols)[number]]?.double ?? 0;
    return { payout, tier: getSlotsTier(payout) };
  }

  if (premiumMix) {
    return { payout: 160, tier: getSlotsTier(160) };
  }

  if (hotMix) {
    return { payout: 75, tier: getSlotsTier(75) };
  }

  return { payout: 0, tier: 'none' as const };
}

function generateSlotsSymbols(wantWin: boolean) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const symbols = [pickWeightedSymbol(), pickWeightedSymbol(), pickWeightedSymbol()];
    const evaluation = evaluateSlotsSymbols(symbols);

    if ((wantWin && evaluation.payout > 0) || (!wantWin && evaluation.payout === 0)) {
      return {
        symbols,
        payout: evaluation.payout,
        tier: evaluation.tier,
      };
    }
  }

  const fallbackSymbols = wantWin ? ['\u{1F352}', '\u{1F352}', '\u{1F34B}'] : ['\u{1F352}', '\u{1F4B0}', '\u{1F514}'];
  const fallback = evaluateSlotsSymbols(fallbackSymbols);

  return {
    symbols: fallbackSymbols,
    payout: fallback.payout,
    tier: fallback.tier,
  };
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
  const baseResult = generateSlotsSymbols(isWin);

  return {
    symbols: baseResult.symbols,
    tier: baseResult.tier,
    payout: Math.max(0, Math.round(baseResult.payout * payoutMultiplier)),
    winChance,
  };
}

const fortuneWheelBaseSections: FortuneWheelSection[] = [
  { id: 'zero-a', label: '0', payout: 0 },
  { id: 'ten-a', label: '10', payout: 10 },
  { id: 'zero-b', label: '0', payout: 0 },
  { id: 'fifty-a', label: '55', payout: 55 },
  { id: 'zero-c', label: '0', payout: 0 },
  { id: 'twenty-five-a', label: '25', payout: 25 },
  { id: 'zero-d', label: '0', payout: 0 },
  { id: 'hundred-a', label: '105', payout: 105 },
  { id: 'ten-b', label: '10', payout: 10 },
  { id: 'fifteen-a', label: '15', payout: 15 },
  { id: 'fifty-b', label: '55', payout: 55 },
  { id: 'zero-f', label: '0', payout: 0 },
  { id: 'twenty-five-b', label: '25', payout: 25 },
  { id: 'zero-g', label: '0', payout: 0 },
  { id: 'two-fifty', label: '265', payout: 265 },
  { id: 'ten-c', label: '10', payout: 10 },
  { id: 'zero-h', label: '0', payout: 0 },
  { id: 'fifty-c', label: '55', payout: 55 },
  { id: 'five-hundred', label: '525', payout: 525 },
  { id: 'jackpot', label: 'Jackpot', payout: 790, isJackpot: true },
  { id: 'zero-i', label: '0', payout: 0 },
  { id: 'twenty-five-c', label: '25', payout: 25 },
  { id: 'seventy-five', label: '75', payout: 75 },
  { id: 'hundred-b', label: '105', payout: 105 },
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

export function createCrashMultiplier() {
  const roll = Math.random();

  if (roll < 0.67) {
    return Number((1.03 + Math.random() * 0.96).toFixed(2));
  }

  if (roll < 0.93) {
    return Number((2.01 + Math.random() * 1.99).toFixed(2));
  }

  if (roll < 0.99) {
    return Number((4 + Math.random() * 6).toFixed(2));
  }

  return Number((10 + Math.random() * 15).toFixed(2));
}

export function settleCrash(
  wager: number,
  crashMultiplier: number,
  cashoutMultiplier: number | null,
): CrashResult {
  const normalizedWager = Math.max(0, Math.round(wager));
  const didCashOut = cashoutMultiplier !== null && cashoutMultiplier < crashMultiplier;
  const payout = didCashOut ? Math.max(1, Math.round(normalizedWager * cashoutMultiplier)) : 0;

  return {
    wager: normalizedWager,
    crashMultiplier,
    cashoutMultiplier: didCashOut ? cashoutMultiplier : null,
    payout,
    outcome: didCashOut ? 'cashout' : 'crash',
  };
}

const plinkoMultipliers: Record<number, Record<PlinkoRisk, number[]>> = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  12: {
    low: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.5, 0.7, 1, 1.3, 1.9, 3, 8.4],
    medium: [33, 11, 4, 1.7, 0.9, 0.5, 0.3, 0.5, 0.9, 1.7, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  },
  16: {
    low: [16, 9, 2, 1.4, 1.1, 1, 0.7, 0.5, 0.3, 0.5, 0.7, 1, 1.1, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

export function getPlinkoMultipliers(rows: number, risk: PlinkoRisk) {
  return plinkoMultipliers[rows]?.[risk] ?? plinkoMultipliers[16][risk];
}

export function playPlinko(wager: number, rows: number, risk: PlinkoRisk): PlinkoResult {
  const normalizedRows = plinkoRowsOptions.includes(rows as (typeof plinkoRowsOptions)[number]) ? rows : 16;
  const path: number[] = [];
  let slotIndex = 0;

  for (let index = 0; index < normalizedRows; index += 1) {
    const move = Math.random() < 0.5 ? 0 : 1;
    path.push(move);
    slotIndex += move;
  }

  const multipliers = getPlinkoMultipliers(normalizedRows, risk);
  const multiplier = multipliers[slotIndex] ?? multipliers[Math.floor(multipliers.length / 2)];
  const payout = Math.max(0, Math.round(wager * multiplier));

  return {
    wager: Math.max(0, Math.round(wager)),
    rows: normalizedRows,
    risk,
    slotIndex,
    multiplier,
    payout,
    path,
  };
}

export function createMinesBoard(mineCount: number) {
  const normalizedMineCount = Math.min(minesMaxCount, Math.max(minesMinCount, Math.round(mineCount)));
  const pool = Array.from({ length: minesTileCount }, (_, index) => index);
  const mineIndexes: number[] = [];

  while (mineIndexes.length < normalizedMineCount) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    mineIndexes.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }

  return mineIndexes.sort((left, right) => left - right);
}

export function getMinesMultiplier(mineCount: number, safePicks: number) {
  const normalizedMineCount = Math.min(minesMaxCount, Math.max(minesMinCount, Math.round(mineCount)));
  const normalizedSafePicks = Math.min(Math.max(0, Math.round(safePicks)), minesTileCount - normalizedMineCount);

  if (normalizedSafePicks <= 0) {
    return 1;
  }

  let multiplier = minesHouseEdge;

  for (let index = 0; index < normalizedSafePicks; index += 1) {
    multiplier *= (minesTileCount - index) / (minesTileCount - normalizedMineCount - index);
  }

  return Number(multiplier.toFixed(2));
}

export function settleMinesRound(wager: number, mineCount: number, safePicks: number, didHitMine: boolean): MinesResult {
  const normalizedWager = Math.max(0, Math.round(wager));
  const normalizedMineCount = Math.min(minesMaxCount, Math.max(minesMinCount, Math.round(mineCount)));
  const normalizedSafePicks = Math.max(0, Math.min(Math.round(safePicks), minesTileCount - normalizedMineCount));
  const multiplier = getMinesMultiplier(normalizedMineCount, normalizedSafePicks);
  const payout = didHitMine ? 0 : Math.max(0, Math.round(normalizedWager * multiplier));

  return {
    wager: normalizedWager,
    mineCount: normalizedMineCount,
    safePicks: normalizedSafePicks,
    multiplier,
    payout,
    outcome: didHitMine ? 'loss' : 'cashout',
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
