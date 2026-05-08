import type { Asset, GameState, PortfolioPosition } from '../types/domain';

export function getPositionValue(position: PortfolioPosition, assets: Asset[]) {
  const asset = assets.find((item) => item.id === position.assetId);
  return asset ? asset.price * position.shares : 0;
}

export function getAssetById(state: GameState, assetId: string) {
  return state.assets.find((asset) => asset.id === assetId);
}

export function getPositionByAssetId(state: GameState, assetId: string) {
  return state.player.positions.find((position) => position.assetId === assetId);
}

export function getInvestedValue(state: GameState) {
  return state.player.positions.reduce(
    (total, position) => total + getPositionValue(position, state.assets),
    0,
  );
}

export function getNetWorth(state: GameState) {
  return state.player.cash + getInvestedValue(state) - state.player.loan.principal;
}

export function hydrateComputedPlayer(state: GameState): GameState {
  const invested = getInvestedValue(state);
  const netWorth = state.player.cash + invested - state.player.loan.principal;

  return {
    ...state,
    player: {
      ...state.player,
      invested,
      netWorth,
    },
  };
}
