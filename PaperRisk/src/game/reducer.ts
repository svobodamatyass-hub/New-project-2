import { createInitialGameState, initialCasino } from '../data/initialState';
import {
  getCasinoDifficultyConfig,
  settleMinesRound,
  fortuneWheelTokenCost,
  getSlotsWinChance,
  playPlinko,
  playBlackjack,
  playRoulette,
  getRouletteBetLabel,
  settleCrash,
  slotsSymbols,
  spinFortuneWheel,
  spinSlots,
  tokenPacks,
} from '../domain/casino';
import { calculateInterestCharge, getRemainingCredit } from '../domain/finance';
import { normalizeAssetHistory, simulateAssetTickWithMultiplier } from '../domain/marketSimulation';
import { getEconomyDifficultyFactors } from '../domain/economy';
import type {
  BlackjackResult,
  CrashResult,
  FortuneWheelResult,
  GameState,
  MinesResult,
  PlinkoResult,
  PlinkoRisk,
  RouletteBet,
  RouletteResult,
  SlotsResult,
  Transaction,
} from '../types/domain';
import { getAssetById, getPositionByAssetId, hydrateComputedPlayer } from './selectors';

const INTEREST_INTERVAL_MS = 1000 * 60 * 60 * 2;
const MAX_CATCH_UP_STEPS = 8;

export type GameAction =
  | { type: 'hydrate'; state: GameState }
  | { type: 'borrow'; amount: number }
  | { type: 'repay'; amount: number }
  | { type: 'applyInterest' }
  | { type: 'tickMarket' }
  | { type: 'buyTokens'; packId: string }
  | { type: 'spinSlots'; result?: SlotsResult }
  | { type: 'spinFortuneWheel'; sectionCount: number; result?: FortuneWheelResult }
  | { type: 'settleCrash'; wager: number; crashMultiplier: number; cashoutMultiplier: number | null; result?: CrashResult }
  | { type: 'playPlinko'; wager: number; rows: number; risk: PlinkoRisk; result?: PlinkoResult }
  | { type: 'settleMines'; wager: number; mineCount: number; safePicks: number; didHitMine: boolean; result?: MinesResult }
  | { type: 'playBlackjack'; wager: number }
  | { type: 'settleBlackjack'; result: BlackjackResult }
  | { type: 'playRoulette'; wager: number; bet: RouletteBet; result?: RouletteResult }
  | { type: 'buyAsset'; assetId: string; shares: number }
  | { type: 'sellAsset'; assetId: string; shares: number }
  | { type: 'setMarketSpeed'; speed: GameState['settings']['marketSpeed'] }
  | { type: 'setMarketVolatility'; volatility: GameState['settings']['marketVolatility'] }
  | { type: 'setEconomyDifficulty'; difficulty: GameState['settings']['economyDifficulty'] }
  | { type: 'reset' };

function createTransaction(input: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const now = new Date().toISOString();

  return {
    ...input,
    id: `${input.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
  };
}

function finalizeState(state: GameState): GameState {
  return hydrateComputedPlayer({
    ...state,
    updatedAt: new Date().toISOString(),
  });
}

function normalizeSavedCasino(state: GameState) {
  const savedCasino = state.casino ?? initialCasino;
  const savedSymbols = savedCasino.slotsLastResult?.symbols ?? initialCasino.slotsLastResult.symbols;
  const symbolsAreCurrent = savedSymbols.every((symbol) => slotsSymbols.includes(symbol as (typeof slotsSymbols)[number]));

  return {
    ...initialCasino,
    ...savedCasino,
    slotsLastResult: {
      ...initialCasino.slotsLastResult,
      ...(savedCasino.slotsLastResult ?? {}),
      symbols: symbolsAreCurrent ? savedSymbols : initialCasino.slotsLastResult.symbols,
      winChance: getSlotsWinChance(savedCasino.slotsLosingStreak ?? 0),
    },
  };
}

function normalizeSavedState(state: GameState): GameState {
  return {
    ...state,
    settings: {
      marketSpeed: state.settings?.marketSpeed ?? 'normal',
      marketVolatility: state.settings?.marketVolatility ?? 'normal',
      economyDifficulty: state.settings?.economyDifficulty ?? 'normal',
    },
    casino: normalizeSavedCasino(state),
    assets: state.assets.map(normalizeAssetHistory),
  };
}

function getVolatilityMultiplier(level: GameState['settings']['marketVolatility']) {
  switch (level) {
    case 'low':
      return 0.7;
    case 'high':
      return 1.4;
    case 'normal':
    default:
      return 1;
  }
}

function getNextInterestDate() {
  return new Date(Date.now() + INTEREST_INTERVAL_MS).toISOString();
}

function applyInterestStep(state: GameState) {
  const factors = getEconomyDifficultyFactors(state.settings.economyDifficulty);
  const baseCharge = calculateInterestCharge(state.player.loan.principal, state.player.loan.interestRate);
  const charge = baseCharge <= 0 ? 0 : Math.max(1, Math.round(baseCharge * factors.interestChargeMultiplier));

  if (charge <= 0) {
    return { charge: 0, state };
  }

  const nextRate = Math.min(state.player.loan.interestRate + factors.rateStepUp, 0.3);

  return {
    charge,
    state: {
      ...state,
      player: {
        ...state.player,
        loan: {
          ...state.player.loan,
          principal: state.player.loan.principal + charge,
          interestRate: nextRate,
          nextIncreaseAt: getNextInterestDate(),
        },
      },
    },
  };
}

function settleOverdueInterest(state: GameState) {
  if (state.player.loan.principal <= 0) {
    return state;
  }

  const dueAt = new Date(state.player.loan.nextIncreaseAt).getTime();

  if (Number.isNaN(dueAt) || dueAt > Date.now()) {
    return state;
  }

  const overdueSteps = Math.min(
    Math.floor((Date.now() - dueAt) / INTEREST_INTERVAL_MS) + 1,
    MAX_CATCH_UP_STEPS,
  );
  let settledState = state;
  let totalCharge = 0;

  for (let index = 0; index < overdueSteps; index += 1) {
    const result = applyInterestStep(settledState);
    settledState = result.state;
    totalCharge += result.charge;
  }

  if (totalCharge <= 0) {
    return state;
  }

  return {
    ...settledState,
    transactions: [
      createTransaction({
        type: 'interest',
        title: 'Overdue interest',
        amount: -totalCharge,
        description: `${overdueSteps} missed interest step${overdueSteps === 1 ? '' : 's'} caught up.`,
      }),
      ...state.transactions,
    ],
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'hydrate':
      return finalizeState(settleOverdueInterest(normalizeSavedState(action.state)));

    case 'tickMarket':
      return finalizeState({
        ...state,
        assets: state.assets.map((asset) =>
          simulateAssetTickWithMultiplier(asset, getVolatilityMultiplier(state.settings.marketVolatility)),
        ),
      });

    case 'borrow': {
      const amount = Math.max(0, Math.round(action.amount));
      const remainingCredit = getRemainingCredit(state.player.loan.principal, state.player.netWorth);
      const borrowedAmount = Math.min(amount, remainingCredit);

      if (borrowedAmount <= 0) {
        return state;
      }

      return finalizeState({
        ...state,
        player: {
          ...state.player,
            cash: state.player.cash + borrowedAmount,
            loan: {
              ...state.player.loan,
              principal: state.player.loan.principal + borrowedAmount,
            interestRate: Math.min(
              state.player.loan.interestRate + getEconomyDifficultyFactors(state.settings.economyDifficulty).borrowRateStep,
              0.3,
            ),
            nextIncreaseAt: state.player.loan.principal > 0 ? state.player.loan.nextIncreaseAt : getNextInterestDate(),
          },
        },
        transactions: [
          createTransaction({
            type: 'borrow',
            title: 'Credit draw',
            amount: borrowedAmount,
            description: 'Cash increased and the loan balance moved up.',
          }),
          ...state.transactions,
        ],
      });
    }

    case 'buyTokens': {
      const pack = tokenPacks.find((item) => item.id === action.packId);

      if (!pack || state.player.cash < pack.price) {
        return state;
      }

      return finalizeState({
        ...state,
        casino: {
          ...state.casino,
          tokens: state.casino.tokens + pack.tokens,
        },
        player: {
          ...state.player,
          cash: state.player.cash - pack.price,
          casinoProfit: state.player.casinoProfit - pack.price,
        },
        transactions: [
          createTransaction({
            type: 'casino',
            title: 'Token purchase',
            amount: -pack.price,
            description: `${pack.tokens} slot tokens added.`,
          }),
          ...state.transactions,
        ],
      });
    }

    case 'spinSlots': {
      if (state.casino.tokens <= 0) {
        return state;
      }

      const casinoConfig = getCasinoDifficultyConfig(state.settings.economyDifficulty);
      const result =
        action.result ??
        spinSlots(state.casino.slotsLosingStreak, {
          winChanceOffset: casinoConfig.slotsWinChanceOffset,
          payoutMultiplier: casinoConfig.slotsPayoutMultiplier,
        });
      const isWin = result.payout > 0;

      return finalizeState({
        ...state,
        casino: {
          ...state.casino,
          tokens: state.casino.tokens - 1,
          slotsLosingStreak: isWin ? 0 : state.casino.slotsLosingStreak + 1,
          slotsLastResult: result,
        },
        player: {
          ...state.player,
          cash: state.player.cash + result.payout,
          casinoProfit: state.player.casinoProfit + result.payout,
        },
        transactions: [
          createTransaction({
            type: 'casino',
            title: isWin ? `Slots ${result.tier} win` : 'Slots spin',
            amount: result.payout,
            description: isWin
              ? `${result.symbols.join(' ')} paid ${result.payout} CZK.`
              : `${result.symbols.join(' ')} missed at ${Math.round(result.winChance * 1000) / 10}%.`,
          }),
          ...state.transactions,
        ],
      });
    }

    case 'spinFortuneWheel': {
      if (state.casino.tokens < fortuneWheelTokenCost) {
        return state;
      }

      const result = action.result ?? spinFortuneWheel(action.sectionCount);
      const isWin = result.payout > 0;

      return finalizeState({
        ...state,
        casino: {
          ...state.casino,
          tokens: state.casino.tokens - result.tokenCost,
          fortuneWheelLastResult: result,
        },
        player: {
          ...state.player,
          cash: state.player.cash + result.payout,
          casinoProfit: state.player.casinoProfit + result.payout,
        },
        transactions: [
          createTransaction({
            type: 'casino',
            title: result.isJackpot ? 'Wheel jackpot' : isWin ? 'Wheel win' : 'Wheel spin',
            amount: result.payout,
            description: `${result.label} landed on a ${result.sectionCount}-section wheel.`,
          }),
          ...state.transactions,
        ],
      });
    }

    case 'settleCrash': {
      const wager = Math.min(Math.max(0, Math.round(action.wager)), state.player.cash);

      if (wager <= 0) {
        return state;
      }

      const result = action.result ?? settleCrash(wager, action.crashMultiplier, action.cashoutMultiplier);
      const netAmount = result.payout - wager;

      return finalizeState({
        ...state,
        casino: {
          ...state.casino,
          crashLastResult: result,
        },
        player: {
          ...state.player,
          cash: state.player.cash + netAmount,
          casinoProfit: state.player.casinoProfit + netAmount,
        },
        transactions: [
          createTransaction({
            type: 'casino',
            title: result.outcome === 'cashout' ? 'Crash cash out' : 'Crash loss',
            amount: netAmount,
            description:
              result.outcome === 'cashout'
                ? `${result.cashoutMultiplier?.toFixed(2)}x before ${result.crashMultiplier.toFixed(2)}x.`
                : `Crashed at ${result.crashMultiplier.toFixed(2)}x.`,
          }),
          ...state.transactions,
        ],
      });
    }

    case 'playPlinko': {
      const wager = Math.min(Math.max(0, Math.round(action.wager)), state.player.cash);

      if (wager <= 0) {
        return state;
      }

      const result = action.result ?? playPlinko(wager, action.rows, action.risk);
      const netAmount = result.payout - wager;

      return finalizeState({
        ...state,
        casino: {
          ...state.casino,
          plinkoLastResult: result,
        },
        player: {
          ...state.player,
          cash: state.player.cash + netAmount,
          casinoProfit: state.player.casinoProfit + netAmount,
        },
        transactions: [
          createTransaction({
            type: 'casino',
            title: 'Plinko drop',
            amount: netAmount,
            description: `${result.risk} risk, ${result.rows} rows, ${result.multiplier.toFixed(2)}x slot.`,
          }),
          ...state.transactions,
        ],
      });
    }

    case 'settleMines': {
      const wager = Math.min(Math.max(0, Math.round(action.wager)), state.player.cash);

      if (wager <= 0) {
        return state;
      }

      const result = action.result ?? settleMinesRound(wager, action.mineCount, action.safePicks, action.didHitMine);
      const netAmount = result.payout - wager;

      return finalizeState({
        ...state,
        casino: {
          ...state.casino,
          minesLastResult: result,
        },
        player: {
          ...state.player,
          cash: state.player.cash + netAmount,
          casinoProfit: state.player.casinoProfit + netAmount,
        },
        transactions: [
          createTransaction({
            type: 'casino',
            title: result.outcome === 'cashout' ? 'Mines cashout' : 'Mines loss',
            amount: netAmount,
            description:
              result.outcome === 'cashout'
                ? `${result.safePicks} safe pick${result.safePicks === 1 ? '' : 's'} at ${result.multiplier.toFixed(2)}x.`
                : `Mine hit after ${result.safePicks} safe pick${result.safePicks === 1 ? '' : 's'}.`,
          }),
          ...state.transactions,
        ],
      });
    }

    case 'playBlackjack': {
      const wager = Math.min(Math.max(0, Math.round(action.wager)), state.player.cash);

      if (wager <= 0) {
        return state;
      }

      const casinoConfig = getCasinoDifficultyConfig(state.settings.economyDifficulty);
      const result = playBlackjack(wager, casinoConfig.blackjackPayoutMultiplier);
      const netAmount = result.payout - wager;

      return finalizeState({
        ...state,
        casino: {
          ...state.casino,
          blackjackLastResult: result,
        },
        player: {
          ...state.player,
          cash: state.player.cash + netAmount,
          casinoProfit: state.player.casinoProfit + netAmount,
        },
        transactions: [
          createTransaction({
            type: 'casino',
            title: `Blackjack ${result.outcome}`,
            amount: netAmount,
            description: `You ${result.playerTotal}, dealer ${result.dealerTotal}, wager ${wager} CZK.`,
          }),
          ...state.transactions,
        ],
      });
    }

    case 'settleBlackjack': {
      const result = action.result;
      const netAmount = result.payout - result.wager;

      return finalizeState({
        ...state,
        casino: {
          ...state.casino,
          blackjackLastResult: result,
        },
        player: {
          ...state.player,
          cash: state.player.cash + netAmount,
          casinoProfit: state.player.casinoProfit + netAmount,
        },
        transactions: [
          createTransaction({
            type: 'casino',
            title: `Blackjack ${result.outcome}`,
            amount: netAmount,
            description: `You ${result.playerTotal}, dealer ${result.dealerTotal}, wager ${result.wager} CZK.`,
          }),
          ...state.transactions,
        ],
      });
    }

    case 'playRoulette': {
      const wager = Math.min(Math.max(0, Math.round(action.wager)), state.player.cash);

      if (wager <= 0) {
        return state;
      }

      const casinoConfig = getCasinoDifficultyConfig(state.settings.economyDifficulty);
      const result =
        action.result ??
        playRoulette(action.bet, wager, {
          boostOffset: casinoConfig.rouletteBoostOffset,
          payoutMultiplier: casinoConfig.roulettePayoutMultiplier,
        });
      const netAmount = result.payout - wager;
      const betLabel = getRouletteBetLabel(result.bet);
      const isWin = result.payout > 0;

      return finalizeState({
        ...state,
        casino: {
          ...state.casino,
          rouletteLastResult: result,
        },
        player: {
          ...state.player,
          cash: state.player.cash + netAmount,
          casinoProfit: state.player.casinoProfit + netAmount,
        },
        transactions: [
          createTransaction({
            type: 'casino',
            title: `Roulette ${isWin ? 'win' : 'loss'}`,
            amount: netAmount,
            description: `${result.number} landed ${result.color}; bet was ${betLabel}.`,
          }),
          ...state.transactions,
        ],
      });
    }

    case 'repay': {
      const amount = Math.min(Math.max(0, Math.round(action.amount)), state.player.cash, state.player.loan.principal);

      if (amount <= 0) {
        return state;
      }

      return finalizeState({
        ...state,
        player: {
          ...state.player,
          cash: state.player.cash - amount,
          loan: {
            ...state.player.loan,
            principal: state.player.loan.principal - amount,
            interestRate:
              state.player.loan.principal - amount <= 0
                ? 0.05
                : Math.max(
                    0.05,
                    state.player.loan.interestRate - getEconomyDifficultyFactors(state.settings.economyDifficulty).repayRateStep,
                  ),
            nextIncreaseAt: state.player.loan.principal - amount <= 0 ? getNextInterestDate() : state.player.loan.nextIncreaseAt,
          },
        },
        transactions: [
          createTransaction({
            type: 'repay',
            title: 'Credit repayment',
            amount: -amount,
            description: 'Cash paid down part of the open loan.',
          }),
          ...state.transactions,
        ],
      });
    }

    case 'applyInterest': {
      const result = applyInterestStep(state);
      const charge = result.charge;

      if (charge <= 0) {
        return state;
      }

      return finalizeState({
        ...result.state,
        transactions: [
          createTransaction({
            type: 'interest',
            title: 'Interest added',
            amount: -charge,
            description: `Loan balance increased at ${Math.round(state.player.loan.interestRate * 1000) / 10}%.`,
          }),
          ...state.transactions,
        ],
      });
    }

    case 'buyAsset': {
      const asset = getAssetById(state, action.assetId);
      const shares = Math.max(0, Math.round(action.shares));

      if (!asset || shares <= 0) {
        return state;
      }

      const cost = Math.round(asset.price * shares);

      if (cost > state.player.cash) {
        return state;
      }

      const existingPosition = getPositionByAssetId(state, asset.id);
      const positions = existingPosition
        ? state.player.positions.map((position) => {
            if (position.assetId !== asset.id) {
              return position;
            }

            const totalShares = position.shares + shares;
            const totalCost = position.averagePrice * position.shares + asset.price * shares;

            return {
              ...position,
              shares: totalShares,
              averagePrice: totalCost / totalShares,
            };
          })
        : [
            ...state.player.positions,
            {
              assetId: asset.id,
              shares,
              averagePrice: asset.price,
            },
          ];

      return finalizeState({
        ...state,
        player: {
          ...state.player,
          cash: state.player.cash - cost,
          positions,
        },
        transactions: [
          createTransaction({
            type: 'buy',
            title: `Bought ${asset.symbol}`,
            amount: -cost,
            description: `${shares} shares at ${Math.round(asset.price)} CZK.`,
          }),
          ...state.transactions,
        ],
      });
    }

    case 'sellAsset': {
      const asset = getAssetById(state, action.assetId);
      const existingPosition = getPositionByAssetId(state, action.assetId);
      const shares = Math.max(0, Math.round(action.shares));

      if (!asset || !existingPosition || shares <= 0) {
        return state;
      }

      const soldShares = Math.min(shares, existingPosition.shares);
      const proceeds = Math.round(asset.price * soldShares);
      const remainingShares = existingPosition.shares - soldShares;
      const positions =
        remainingShares <= 0
          ? state.player.positions.filter((position) => position.assetId !== asset.id)
          : state.player.positions.map((position) =>
              position.assetId === asset.id ? { ...position, shares: remainingShares } : position,
            );

      return finalizeState({
        ...state,
        player: {
          ...state.player,
          cash: state.player.cash + proceeds,
          positions,
        },
        transactions: [
          createTransaction({
            type: 'sell',
            title: `Sold ${asset.symbol}`,
            amount: proceeds,
            description: `${soldShares} shares at ${Math.round(asset.price)} CZK.`,
          }),
          ...state.transactions,
        ],
      });
    }

    case 'setMarketSpeed': {
      if (state.settings.marketSpeed === action.speed) {
        return state;
      }

      return finalizeState({
        ...state,
        settings: {
          ...state.settings,
          marketSpeed: action.speed,
        },
      });
    }

    case 'setMarketVolatility': {
      if (state.settings.marketVolatility === action.volatility) {
        return state;
      }

      return finalizeState({
        ...state,
        settings: {
          ...state.settings,
          marketVolatility: action.volatility,
        },
      });
    }

    case 'setEconomyDifficulty': {
      if (state.settings.economyDifficulty === action.difficulty) {
        return state;
      }

      return finalizeState({
        ...state,
        settings: {
          ...state.settings,
          economyDifficulty: action.difficulty,
        },
      });
    }

    case 'reset':
      return createInitialGameState();

    default:
      return state;
  }
}
