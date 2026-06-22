import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

import { createInitialGameState } from '../data/initialState';
import { clearGameState, loadGameState, saveGameState } from '../storage/storage';
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
} from '../types/domain';
import { gameReducer } from './reducer';

export type SaveStatus = 'loading' | 'saved' | 'saving' | 'error';

type GameContextValue = {
  state: GameState;
  saveStatus: SaveStatus;
  setEconomyDifficulty: (difficulty: GameState['settings']['economyDifficulty']) => void;
  setMasterMute: (enabled: boolean) => void;
  setHapticsIntensity: (intensity: number) => void;
  setBlackjackVolume: (volume: number) => void;
  setRouletteVolume: (volume: number) => void;
  setAdminSlotsWinChanceOffset: (offset: number) => void;
  setAdminSlotsPayoutMultiplier: (multiplier: number) => void;
  setAdminPlinkoPayoutMultiplier: (multiplier: number) => void;
  simulateSlots: (count: number) => void;
  setAdminPreset: (preset: 'safe' | 'boost' | 'chaos' | 'default') => void;
  borrow: (amount: number) => void;
  repay: (amount: number) => void;
  applyInterest: () => void;
  buyTokens: (packId: string) => void;
  spinSlots: (result?: SlotsResult) => void;
  spinFortuneWheel: (sectionCount: number, result?: FortuneWheelResult) => void;
  settleCrash: (wager: number, crashMultiplier: number, cashoutMultiplier: number | null, result?: CrashResult) => void;
  playPlinko: (wager: number, rows: number, risk: PlinkoRisk, result?: PlinkoResult) => void;
  settleMines: (wager: number, mineCount: number, safePicks: number, didHitMine: boolean, result?: MinesResult) => void;
  playBlackjack: (wager: number) => void;
  settleBlackjack: (result: BlackjackResult) => void;
  playRoulette: (bet: RouletteBet, wager: number, result?: RouletteResult) => void;
  resetGame: () => Promise<void>;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('loading');

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

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      saveStatus,
      setEconomyDifficulty: (difficulty: GameState['settings']['economyDifficulty']) =>
        dispatch({ type: 'setEconomyDifficulty', difficulty }),
      setMasterMute: (enabled: boolean) => dispatch({ type: 'setMasterMute', enabled }),
      setHapticsIntensity: (intensity: number) => dispatch({ type: 'setHapticsIntensity', intensity }),
      setBlackjackVolume: (volume: number) => dispatch({ type: 'setBlackjackVolume', volume }),
      setRouletteVolume: (volume: number) => dispatch({ type: 'setRouletteVolume', volume }),
      setAdminSlotsWinChanceOffset: (offset: number) => dispatch({ type: 'setAdminSlotsWinChanceOffset', offset }),
      setAdminSlotsPayoutMultiplier: (multiplier: number) => dispatch({ type: 'setAdminSlotsPayoutMultiplier', multiplier }),
      setAdminPlinkoPayoutMultiplier: (multiplier: number) =>
        dispatch({ type: 'setAdminPlinkoPayoutMultiplier', multiplier }),
      simulateSlots: (count: number) => dispatch({ type: 'simulateSlots', count }),
      setAdminPreset: (preset: 'safe' | 'boost' | 'chaos' | 'default') => dispatch({ type: 'setAdminPreset', preset }),
      borrow: (amount: number) => dispatch({ type: 'borrow', amount }),
      repay: (amount: number) => dispatch({ type: 'repay', amount }),
      applyInterest: () => dispatch({ type: 'applyInterest' }),
      buyTokens: (packId: string) => dispatch({ type: 'buyTokens', packId }),
      spinSlots: (result?: SlotsResult) => dispatch({ type: 'spinSlots', result }),
      spinFortuneWheel: (sectionCount: number, result?: FortuneWheelResult) =>
        dispatch({ type: 'spinFortuneWheel', sectionCount, result }),
      settleCrash: (wager: number, crashMultiplier: number, cashoutMultiplier: number | null, result?: CrashResult) =>
        dispatch({ type: 'settleCrash', wager, crashMultiplier, cashoutMultiplier, result }),
      playPlinko: (wager: number, rows: number, risk: PlinkoRisk, result?: PlinkoResult) =>
        dispatch({ type: 'playPlinko', wager, rows, risk, result }),
      settleMines: (wager: number, mineCount: number, safePicks: number, didHitMine: boolean, result?: MinesResult) =>
        dispatch({ type: 'settleMines', wager, mineCount, safePicks, didHitMine, result }),
      playBlackjack: (wager: number) => dispatch({ type: 'playBlackjack', wager }),
      settleBlackjack: (result: BlackjackResult) => dispatch({ type: 'settleBlackjack', result }),
      playRoulette: (bet: RouletteBet, wager: number, result?: RouletteResult) =>
        dispatch({ type: 'playRoulette', bet, wager, result }),
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
