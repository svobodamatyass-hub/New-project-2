export type CurrencyCode = 'CZK';

export type Asset = {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  price: number;
  priceHistory: number[];
  changePercent: number;
  volatility: 'low' | 'medium' | 'high';
};

export type PortfolioPosition = {
  assetId: string;
  shares: number;
  averagePrice: number;
};

export type LoanState = {
  principal: number;
  interestRate: number;
  nextIncreaseAt: string;
};

export type PlayerState = {
  currency: CurrencyCode;
  cash: number;
  netWorth: number;
  invested: number;
  casinoProfit: number;
  loan: LoanState;
  positions: PortfolioPosition[];
};

export type SlotsResultTier = 'none' | 'small' | 'medium' | 'big' | 'jackpot';

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

export type CasinoState = {
  tokens: number;
  slotsLosingStreak: number;
  slotsLastResult: SlotsResult;
  blackjackLastResult: BlackjackResult | null;
  rouletteLastResult: RouletteResult | null;
  fortuneWheelLastResult: FortuneWheelResult | null;
};

export type TransactionType = 'system' | 'borrow' | 'repay' | 'interest' | 'buy' | 'sell' | 'casino';

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
    marketSpeed: 'slow' | 'normal' | 'fast';
    marketVolatility: 'low' | 'normal' | 'high';
    economyDifficulty: 'easy' | 'normal' | 'hard';
  };
  player: PlayerState;
  casino: CasinoState;
  assets: Asset[];
  transactions: Transaction[];
  updatedAt: string;
};
