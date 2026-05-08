import type { GameState } from '../types/domain';

export function getActiveProfileLabel(settings: GameState['settings']) {
  if (settings.marketSpeed === 'slow' && settings.marketVolatility === 'low' && settings.economyDifficulty === 'easy') {
    return 'Chill';
  }

  if (
    settings.marketSpeed === 'fast' &&
    settings.marketVolatility === 'high' &&
    settings.economyDifficulty === 'hard'
  ) {
    return 'Chaos';
  }

  if (
    settings.marketSpeed === 'normal' &&
    settings.marketVolatility === 'normal' &&
    settings.economyDifficulty === 'normal'
  ) {
    return 'Balanced';
  }

  return 'Custom';
}

