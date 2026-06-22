import { createInitialGameState, initialCasino } from '../data/initialState';
import {
  fortuneWheelTokenCost,
  getCasinoDifficultyConfig,
  getRouletteBetLabel,
  getSlotsWinChance,
  playBlackjack,
  playPlinko,
  playRoulette,
  settleCrash,
  settleMinesRound,
  slotsSymbols,
  spinFortuneWheel,
  spinSlots,
  tokenPacks,
} from '../domain/casino';
import { getEconomyDifficultyFactors } from '../domain/economy';
import { calculateInterestCharge, getRemainingCredit } from '../domain/finance';
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
import { hydrateComputedPlayer } from './selectors';

const INTEREST_INTERVAL_MS = 1000 * 60 * 60 * 2;
const MAX_CATCH_UP_STEPS = 8;

export type GameAction =
  | { type: 'hydrate'; state: GameState }
  | { type: 'borrow'; amount: number }
  | { type: 'repay'; amount: number }
  | { type: 'applyInterest' }
  | { type: 'buyTokens'; packId: string }
  | { type: 'spinSlots'; result?: SlotsResult }
  | { type: 'spinFortuneWheel'; sectionCount: number; result?: FortuneWheelResult }
  | { type: 'settleCrash'; wager: number; crashMultiplier: number; cashoutMultiplier: number | null; result?: CrashResult }
  | { type: 'playPlinko'; wager: number; rows: number; risk: PlinkoRisk; result?: PlinkoResult }
  | { type: 'settleMines'; wager: number; mineCount: number; safePicks: number; didHitMine: boolean; result?: MinesResult }
  | { type: 'playBlackjack'; wager: number }
  | { type: 'settleBlackjack'; result: BlackjackResult }
  | { type: 'playRoulette'; wager: number; bet: RouletteBet; result?: RouletteResult }
  | { type: 'setEconomyDifficulty'; difficulty: GameState['settings']['economyDifficulty'] }
  | { type: 'setMasterMute'; enabled: boolean }
  | { type: 'setHapticsIntensity'; intensity: number }
  | { type: 'setBlackjackVolume'; volume: number }
  | { type: 'setRouletteVolume'; volume: number }
  | { type: 'setAdminSlotsWinChanceOffset'; offset: number }
  | { type: 'setAdminSlotsPayoutMultiplier'; multiplier: number }
  | { type: 'setAdminPlinkoPayoutMultiplier'; multiplier: number }
  | { type: 'simulateSlots'; count: number }
  | { type: 'setAdminPreset'; preset: 'safe' | 'boost' | 'chaos' | 'default' }
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

function getLegacyVolume(
  nextVolume: number | undefined,
  legacyEnabled: boolean | undefined,
  fallbackVolume: number,
) {
  if (typeof nextVolume === 'number') {
    return Math.max(0, Math.min(1, nextVolume));
  }

  if (legacyEnabled === false) {
    return 0;
  }

  return fallbackVolume;
}

function normalizeSavedState(state: GameState): GameState {
  const legacyFeedback = state.settings?.feedback as
    | {
        blackjackSoundsEnabled?: boolean;
        rouletteSoundsEnabled?: boolean;
      }
    | undefined;

  return {
    ...state,
    settings: {
      economyDifficulty: state.settings?.economyDifficulty ?? 'normal',
      feedback: {
        masterMute: state.settings?.feedback?.masterMute ?? false,
        hapticsIntensity: Math.max(
          0,
          Math.min(
            1,
            state.settings?.feedback?.hapticsIntensity ??
              ((state.settings?.feedback as { hapticsEnabled?: boolean } | undefined)?.hapticsEnabled === false ? 0 : 0.75),
          ),
        ),
        blackjackVolume: getLegacyVolume(state.settings?.feedback?.blackjackVolume, legacyFeedback?.blackjackSoundsEnabled, 0.8),
        rouletteVolume: getLegacyVolume(state.settings?.feedback?.rouletteVolume, legacyFeedback?.rouletteSoundsEnabled, 0.8),
      },
      adminTuning: {
        slotsWinChanceOffset: state.settings?.adminTuning?.slotsWinChanceOffset ?? 0,
        slotsPayoutMultiplier: state.settings?.adminTuning?.slotsPayoutMultiplier ?? 1,
        plinkoPayoutMultiplier: state.settings?.adminTuning?.plinkoPayoutMultiplier ?? 1,
      },
    },
    player: {
      ...state.player,
      cash: state.player?.cash ?? 0,
      netWorth: state.player?.netWorth ?? 0,
      casinoProfit: state.player?.casinoProfit ?? 0,
      loan: {
        principal: state.player?.loan?.principal ?? 0,
        interestRate: state.player?.loan?.interestRate ?? 0.05,
        nextIncreaseAt: state.player?.loan?.nextIncreaseAt ?? getNextInterestDate(),
      },
    },
    casino: normalizeSavedCasino(state),
  };
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

  const overdueSteps = Math.min(Math.floor((Date.now() - dueAt) / INTEREST_INTERVAL_MS) + 1, MAX_CATCH_UP_STEPS);
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
          winChanceOffset: casinoConfig.slotsWinChanceOffset + state.settings.adminTuning.slotsWinChanceOffset,
          payoutMultiplier: casinoConfig.slotsPayoutMultiplier * state.settings.adminTuning.slotsPayoutMultiplier,
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

      const rawResult = action.result ?? playPlinko(wager, action.rows, action.risk);
      const result =
        state.settings.adminTuning.plinkoPayoutMultiplier === 1
          ? rawResult
          : {
              ...rawResult,
              multiplier: Number((rawResult.multiplier * state.settings.adminTuning.plinkoPayoutMultiplier).toFixed(2)),
              payout: Math.max(0, Math.round(rawResult.payout * state.settings.adminTuning.plinkoPayoutMultiplier)),
            };
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

    case 'setEconomyDifficulty':
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

    case 'setMasterMute':
      return finalizeState({
        ...state,
        settings: {
          ...state.settings,
          feedback: {
            ...state.settings.feedback,
            masterMute: action.enabled,
          },
        },
      });

    case 'setHapticsIntensity':
      return finalizeState({
        ...state,
        settings: {
          ...state.settings,
          feedback: {
            ...state.settings.feedback,
            hapticsIntensity: Math.max(0, Math.min(1, Number(action.intensity.toFixed(2)))),
          },
        },
      });

    case 'setBlackjackVolume':
      return finalizeState({
        ...state,
        settings: {
          ...state.settings,
          feedback: {
            ...state.settings.feedback,
            blackjackVolume: Math.max(0, Math.min(1, Number(action.volume.toFixed(2)))),
          },
        },
      });

    case 'setRouletteVolume':
      return finalizeState({
        ...state,
        settings: {
          ...state.settings,
          feedback: {
            ...state.settings.feedback,
            rouletteVolume: Math.max(0, Math.min(1, Number(action.volume.toFixed(2)))),
          },
        },
      });

    case 'setAdminSlotsWinChanceOffset':
      return finalizeState({
        ...state,
        settings: {
          ...state.settings,
          adminTuning: {
            ...state.settings.adminTuning,
            slotsWinChanceOffset: Math.max(-0.2, Math.min(0.5, Number(action.offset.toFixed(3)))),
          },
        },
      });

    case 'setAdminSlotsPayoutMultiplier':
      return finalizeState({
        ...state,
        settings: {
          ...state.settings,
          adminTuning: {
            ...state.settings.adminTuning,
            slotsPayoutMultiplier: Math.max(0.1, Math.min(10, Number(action.multiplier.toFixed(2)))),
          },
        },
      });

    case 'setAdminPlinkoPayoutMultiplier':
      return finalizeState({
        ...state,
        settings: {
          ...state.settings,
          adminTuning: {
            ...state.settings.adminTuning,
            plinkoPayoutMultiplier: Math.max(0.1, Math.min(10, Number(action.multiplier.toFixed(2)))),
          },
        },
      });

    case 'simulateSlots': {
      const count = Math.max(1, Math.min(1000, Math.round(action.count)));
      const spinsToRun = Math.min(count, state.casino.tokens);

      if (spinsToRun <= 0) {
        return state;
      }

      const casinoConfig = getCasinoDifficultyConfig(state.settings.economyDifficulty);
      let losingStreak = state.casino.slotsLosingStreak;
      let totalPayout = 0;
      let lastResult = state.casino.slotsLastResult;

      for (let index = 0; index < spinsToRun; index += 1) {
        const result = spinSlots(losingStreak, {
          winChanceOffset: casinoConfig.slotsWinChanceOffset + state.settings.adminTuning.slotsWinChanceOffset,
          payoutMultiplier: casinoConfig.slotsPayoutMultiplier * state.settings.adminTuning.slotsPayoutMultiplier,
        });

        totalPayout += result.payout;
        lastResult = result;
        losingStreak = result.payout > 0 ? 0 : losingStreak + 1;
      }

      return finalizeState({
        ...state,
        casino: {
          ...state.casino,
          tokens: state.casino.tokens - spinsToRun,
          slotsLosingStreak: losingStreak,
          slotsLastResult: lastResult,
        },
        player: {
          ...state.player,
          cash: state.player.cash + totalPayout,
          casinoProfit: state.player.casinoProfit + totalPayout,
        },
        transactions: [
          createTransaction({
            type: 'casino',
            title: `Slots sim x${spinsToRun}`,
            amount: totalPayout,
            description: `Batch simulation completed: ${spinsToRun} spins, total payout ${totalPayout} CZK.`,
          }),
          ...state.transactions,
        ],
      });
    }

    case 'setAdminPreset': {
      const presets = {
        default: { slotsWinChanceOffset: 0, slotsPayoutMultiplier: 1, plinkoPayoutMultiplier: 1 },
        safe: { slotsWinChanceOffset: -0.04, slotsPayoutMultiplier: 0.85, plinkoPayoutMultiplier: 0.9 },
        boost: { slotsWinChanceOffset: 0.1, slotsPayoutMultiplier: 1.45, plinkoPayoutMultiplier: 1.35 },
        chaos: { slotsWinChanceOffset: 0.22, slotsPayoutMultiplier: 2.4, plinkoPayoutMultiplier: 2.2 },
      } as const;
      const next = presets[action.preset];

      return finalizeState({
        ...state,
        settings: {
          ...state.settings,
          adminTuning: next,
        },
      });
    }

    case 'reset':
      return createInitialGameState();

    default:
      return state;
  }
}
