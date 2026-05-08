import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

import { createInitialGameState } from '../data/initialState';
import { clearGameState, loadGameState, saveGameState } from '../storage/storage';
import type { GameState, RouletteBet, RouletteResult, SlotsResult } from '../types/domain';
import { gameReducer } from './reducer';

export type SaveStatus = 'loading' | 'saved' | 'saving' | 'error';

type GameContextValue = {
  state: GameState;
  saveStatus: SaveStatus;
  setMarketSpeed: (speed: GameState['settings']['marketSpeed']) => void;
  setMarketVolatility: (volatility: GameState['settings']['marketVolatility']) => void;
  setEconomyDifficulty: (difficulty: GameState['settings']['economyDifficulty']) => void;
  borrow: (amount: number) => void;
  repay: (amount: number) => void;
  applyInterest: () => void;
  tickMarket: () => void;
  buyTokens: (packId: string) => void;
  spinSlots: (result?: SlotsResult) => void;
  playBlackjack: (wager: number) => void;
  playRoulette: (bet: RouletteBet, wager: number, result?: RouletteResult) => void;
  buyAsset: (assetId: string, shares: number) => void;
  sellAsset: (assetId: string, shares: number) => void;
  resetGame: () => Promise<void>;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('loading');
  const marketTickIntervalMs = state.settings.marketSpeed === 'fast' ? 7000 : state.settings.marketSpeed === 'slow' ? 25000 : 15000;

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const savedState = await loadGameState<GameState>();

        if (!isMounted) {
          return;
        }

        if (savedState?.version === 1) {
          dispatch({ type: 'hydrate', state: savedState });
        }

        setSaveStatus('saved');
      } catch {
        if (isMounted) {
          setSaveStatus('error');
        }
      } finally {
        if (isMounted) {
          setHasHydrated(true);
        }
      }
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    let isCurrent = true;
    setSaveStatus('saving');

    saveGameState(state)
      .then(() => {
        if (isCurrent) {
          setSaveStatus('saved');
        }
      })
      .catch(() => {
        if (isCurrent) {
          setSaveStatus('error');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [hasHydrated, state]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const intervalId = setInterval(() => {
      dispatch({ type: 'tickMarket' });
    }, marketTickIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [hasHydrated, marketTickIntervalMs]);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      saveStatus,
      setMarketSpeed: (speed: GameState['settings']['marketSpeed']) => dispatch({ type: 'setMarketSpeed', speed }),
      setMarketVolatility: (volatility: GameState['settings']['marketVolatility']) =>
        dispatch({ type: 'setMarketVolatility', volatility }),
      setEconomyDifficulty: (difficulty: GameState['settings']['economyDifficulty']) =>
        dispatch({ type: 'setEconomyDifficulty', difficulty }),
      borrow: (amount: number) => dispatch({ type: 'borrow', amount }),
      repay: (amount: number) => dispatch({ type: 'repay', amount }),
      applyInterest: () => dispatch({ type: 'applyInterest' }),
      tickMarket: () => dispatch({ type: 'tickMarket' }),
      buyTokens: (packId: string) => dispatch({ type: 'buyTokens', packId }),
      spinSlots: (result?: SlotsResult) => dispatch({ type: 'spinSlots', result }),
      playBlackjack: (wager: number) => dispatch({ type: 'playBlackjack', wager }),
      playRoulette: (bet: RouletteBet, wager: number, result?: RouletteResult) =>
        dispatch({ type: 'playRoulette', bet, wager, result }),
      buyAsset: (assetId: string, shares: number) => dispatch({ type: 'buyAsset', assetId, shares }),
      sellAsset: (assetId: string, shares: number) => dispatch({ type: 'sellAsset', assetId, shares }),
      resetGame: async () => {
        await clearGameState();
        dispatch({ type: 'reset' });
      },
    }),
    [saveStatus, state],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame must be used inside GameProvider');
  }

  return context;
}
