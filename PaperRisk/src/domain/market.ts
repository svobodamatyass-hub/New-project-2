import type { Asset } from '../types/domain';

export function getAssetTone(asset: Asset) {
  return asset.changePercent >= 0 ? 'positive' : 'negative';
}

export function getVolatilityLabel(asset: Asset) {
  switch (asset.volatility) {
    case 'high':
      return 'High risk';
    case 'medium':
      return 'Balanced';
    case 'low':
    default:
      return 'Stable';
  }
}
