import type { GameState } from '../types/domain';

export function getNetWorth(state: GameState) {
  return state.player.cash - state.player.loan.principal;
}

export function hydrateComputedPlayer(state: GameState): GameState {
  return {
    ...state,
    player: {
      ...state.player,
      netWorth: getNetWorth(state),
    },
  };
}
