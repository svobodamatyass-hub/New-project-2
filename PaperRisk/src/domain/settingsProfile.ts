import type { GameState } from '../types/domain';

export function getActiveProfileLabel(settings: GameState['settings']) {
  if (settings.economyDifficulty === 'easy') {
    return 'Chill';
  }

  if (settings.economyDifficulty === 'hard') {
    return 'Chaos';
  }

  if (settings.economyDifficulty === 'normal') {
    return 'Balanced';
  }

  return 'Custom';
}
