export type CurrencyCode = 'CZK';

export type LoanState = {
  principal: number;
  interestRate: number;
  nextIncreaseAt: string;
};

export type PlayerState = {
  currency: CurrencyCode;
  cash: number;
  netWorth: number;
  casinoProfit: number;
  loan: LoanState;
};

export type SlotsResultTier = 'none' | 'mini' | 'small' | 'medium' | 'big' | 'mega' | 'jackpot';

export type SlotsResult = {
  symbols: string[];
  tier: SlotsResultTier;
  payout: number;
  winChance: number;
};

export type BlackjackCard = {
  rank: string;
  suit: string;
  value: number;
};

export type BlackjackResult = {
  playerCards: BlackjackCard[];
  dealerCards: BlackjackCard[];
  playerTotal: number;
  dealerTotal: number;
  outcome: 'win' | 'loss' | 'push' | 'blackjack';
  wager: number;
  payout: number;
};

export type RouletteColor = 'red' | 'black' | 'green';

export type RouletteBet =
  | {
      type: 'color';
      color: Exclude<RouletteColor, 'green'>;
    }
  | {
      type: 'number';
      number: number;
    };

export type RouletteResult = {
  bet: RouletteBet;
  number: number;
  color: RouletteColor;
  pocketIndex: number;
  wager: number;
  payout: number;
};

export type FortuneWheelSection = {
  id: string;
  label: string;
  payout: number;
  isJackpot?: boolean;
};

export type FortuneWheelResult = {
  sectionIndex: number;
  sectionCount: number;
  label: string;
  payout: number;
  tokenCost: number;
  isJackpot: boolean;
};

export type CrashResult = {
  wager: number;
  crashMultiplier: number;
  cashoutMultiplier: number | null;
  payout: number;
  outcome: 'cashout' | 'crash';
};

export type PlinkoRisk = 'low' | 'medium' | 'high';

export type PlinkoResult = {
  wager: number;
  rows: number;
  risk: PlinkoRisk;
  slotIndex: number;
  multiplier: number;
  payout: number;
  path: number[];
};

export type MinesResult = {
  wager: number;
  mineCount: number;
  safePicks: number;
  multiplier: number;
  payout: number;
  outcome: 'cashout' | 'loss';
};

export type CasinoState = {
  tokens: number;
  slotsLosingStreak: number;
  slotsLastResult: SlotsResult;
  blackjackLastResult: BlackjackResult | null;
  rouletteLastResult: RouletteResult | null;
  fortuneWheelLastResult: FortuneWheelResult | null;
  crashLastResult: CrashResult | null;
  plinkoLastResult: PlinkoResult | null;
  minesLastResult: MinesResult | null;
};

export type TransactionType = 'system' | 'borrow' | 'repay' | 'interest' | 'casino';

export type Transaction = {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  createdAt: string;
  description?: string;
};

export type GameState = {
  version: 1;
  settings: {
    economyDifficulty: 'easy' | 'normal' | 'hard';
    feedback: {
      masterMute: boolean;
      hapticsIntensity: number;
      blackjackVolume: number;
      rouletteVolume: number;
    };
    adminTuning: {
      slotsWinChanceOffset: number;
      slotsPayoutMultiplier: number;
      plinkoPayoutMultiplier: number;
    };
  };
  player: PlayerState;
  casino: CasinoState;
  transactions: Transaction[];
  updatedAt: string;
};
