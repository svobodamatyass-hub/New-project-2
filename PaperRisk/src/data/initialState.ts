import type { CasinoState, GameState, PlayerState, Transaction } from '../types/domain';
import { slotsBaseWinChance } from '../domain/casino';

export const initialPlayer: PlayerState = {
  currency: 'CZK',
  cash: 10000,
  netWorth: 10000,
  casinoProfit: 0,
  loan: {
    principal: 0,
    interestRate: 0.05,
    nextIncreaseAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
  },
};

export const initialCasino: CasinoState = {
  tokens: 0,
  slotsLosingStreak: 0,
  slotsLastResult: {
    symbols: ['\u{1F4B0}', '\u{1F48E}', '\u{2B50}'],
    tier: 'none',
    payout: 0,
    winChance: slotsBaseWinChance,
  },
  blackjackLastResult: null,
  rouletteLastResult: null,
  fortuneWheelLastResult: null,
  crashLastResult: null,
  plinkoLastResult: null,
  minesLastResult: null,
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
      economyDifficulty: 'normal',
      feedback: {
        masterMute: false,
        hapticsIntensity: 0.75,
        blackjackVolume: 0.8,
        rouletteVolume: 0.8,
      },
      adminTuning: {
        slotsWinChanceOffset: 0,
        slotsPayoutMultiplier: 1,
        plinkoPayoutMultiplier: 1,
      },
    },
    player: {
      ...initialPlayer,
      loan: {
        ...initialPlayer.loan,
        nextIncreaseAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      },
    },
    casino: initialCasino,
    transactions: initialTransactions.map((transaction) => ({
      ...transaction,
      createdAt: now,
    })),
    updatedAt: now,
  };
}
