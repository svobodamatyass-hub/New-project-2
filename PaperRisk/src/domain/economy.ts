import type { GameState } from '../types/domain';

export type EconomyDifficultyFactors = {
  interestChargeMultiplier: number;
  rateStepUp: number;
  borrowRateStep: number;
  repayRateStep: number;
};

export function getEconomyDifficultyFactors(
  difficulty: GameState['settings']['economyDifficulty'],
): EconomyDifficultyFactors {
  switch (difficulty) {
    case 'easy':
      return {
        interestChargeMultiplier: 0.75,
        rateStepUp: 0.0075,
        borrowRateStep: 0.003,
        repayRateStep: 0.0035,
      };
    case 'hard':
      return {
        interestChargeMultiplier: 1.3,
        rateStepUp: 0.013,
        borrowRateStep: 0.0065,
        repayRateStep: 0.002,
      };
    case 'normal':
    default:
      return {
        interestChargeMultiplier: 1,
        rateStepUp: 0.01,
        borrowRateStep: 0.005,
        repayRateStep: 0.0025,
      };
  }
}

