import type { Asset, CasinoState, GameState, PlayerState, Transaction } from '../types/domain';
import { slotsBaseWinChance } from '../domain/casino';

function buildPriceHistory(price: number, changePercent: number) {
  const startPrice = price / (1 + changePercent / 100);
  const points = 12;

  return Array.from({ length: points }, (_, index) => {
    const progress = index / (points - 1);
    const wave = Math.sin(index * 1.3) * price * 0.006;
    return Math.max(1, Number((startPrice + (price - startPrice) * progress + wave).toFixed(2)));
  });
}

export const initialAssets: Asset[] = [
  {
    id: 'novatech',
    symbol: 'NOVA',
    name: 'NovaTech',
    sector: 'Technology',
    price: 421.2,
    priceHistory: buildPriceHistory(421.2, 2.8),
    changePercent: 2.8,
    volatility: 'high',
  },
  {
    id: 'ironbank',
    symbol: 'IRBK',
    name: 'IronBank',
    sector: 'Finance',
    price: 188.6,
    priceHistory: buildPriceHistory(188.6, 0.7),
    changePercent: 0.7,
    volatility: 'low',
  },
  {
    id: 'greenvolt',
    symbol: 'GVLT',
    name: 'GreenVolt',
    sector: 'Energy',
    price: 93.4,
    priceHistory: buildPriceHistory(93.4, -1.4),
    changePercent: -1.4,
    volatility: 'medium',
  },
  {
    id: 'bitfox',
    symbol: 'BFOX',
    name: 'BitFox',
    sector: 'Crypto',
    price: 68.9,
    priceHistory: buildPriceHistory(68.9, -7.9),
    changePercent: -7.9,
    volatility: 'high',
  },
  {
    id: 'goldx',
    symbol: 'GLDX',
    name: 'GoldX',
    sector: 'Commodity',
    price: 249.7,
    priceHistory: buildPriceHistory(249.7, 0.4),
    changePercent: 0.4,
    volatility: 'low',
  },
];

export const initialPlayer: PlayerState = {
  currency: 'CZK',
  cash: 10000,
  invested: 0,
  netWorth: 10000,
  casinoProfit: 0,
  loan: {
    principal: 0,
    interestRate: 0.05,
    nextIncreaseAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
  },
  positions: [],
};

export const initialCasino: CasinoState = {
  tokens: 0,
  slotsLosingStreak: 0,
  slotsLastResult: {
    symbols: ['7', 'BAR', 'DIA'],
    tier: 'none',
    payout: 0,
    winChance: slotsBaseWinChance,
  },
  blackjackLastResult: null,
  rouletteLastResult: null,
  fortuneWheelLastResult: null,
};

const initialTransactions: Transaction[] = [
  {
    id: 'welcome-balance',
    type: 'system',
    title: 'Starting balance',
    amount: initialPlayer.cash,
    createdAt: new Date().toISOString(),
    description: 'Paper money loaded into your local simulation.',
  },
];

export function createInitialGameState(): GameState {
  const now = new Date().toISOString();

  return {
    version: 1,
    settings: {
      marketSpeed: 'normal',
      marketVolatility: 'normal',
      economyDifficulty: 'normal',
    },
    player: {
      ...initialPlayer,
      loan: {
        ...initialPlayer.loan,
        nextIncreaseAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      },
    },
    casino: initialCasino,
    assets: initialAssets,
    transactions: initialTransactions.map((transaction) => ({
      ...transaction,
      createdAt: now,
    })),
    updatedAt: now,
  };
}
