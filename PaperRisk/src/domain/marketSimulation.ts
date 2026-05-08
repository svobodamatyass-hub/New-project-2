import type { Asset } from '../types/domain';

const maxHistoryPoints = 36;

function getVolatilityMove(asset: Asset) {
  switch (asset.volatility) {
    case 'high':
      return 0.055;
    case 'medium':
      return 0.028;
    case 'low':
    default:
      return 0.014;
  }
}

function getHistory(asset: Asset) {
  return asset.priceHistory?.length ? asset.priceHistory : [asset.price];
}

export function normalizeAssetHistory(asset: Asset): Asset {
  const history = getHistory(asset).slice(-maxHistoryPoints);
  const price = history.at(-1) ?? asset.price;
  const previous = history.at(-2) ?? price;
  const changePercent = previous === 0 ? 0 : ((price - previous) / previous) * 100;

  return {
    ...asset,
    price,
    priceHistory: history,
    changePercent,
  };
}

export function simulateAssetTick(asset: Asset): Asset {
  const history = getHistory(asset);
  const lastPrice = history.at(-1) ?? asset.price;
  const volatility = getVolatilityMove(asset);
  const drift = asset.volatility === 'low' ? 0.001 : asset.volatility === 'medium' ? 0.0005 : -0.0002;
  const randomMove = (Math.random() * 2 - 1) * volatility + drift;
  const nextPrice = Math.max(1, Number((lastPrice * (1 + randomMove)).toFixed(2)));
  const nextHistory = [...history, nextPrice].slice(-maxHistoryPoints);
  const changePercent = lastPrice === 0 ? 0 : ((nextPrice - lastPrice) / lastPrice) * 100;

  return {
    ...asset,
    price: nextPrice,
    priceHistory: nextHistory,
    changePercent,
  };
}

export function simulateAssetTickWithMultiplier(asset: Asset, volatilityMultiplier: number): Asset {
  const normalizedMultiplier = Math.max(0.4, Math.min(volatilityMultiplier, 2.2));
  const history = getHistory(asset);
  const lastPrice = history.at(-1) ?? asset.price;
  const volatility = getVolatilityMove(asset) * normalizedMultiplier;
  const drift = asset.volatility === 'low' ? 0.001 : asset.volatility === 'medium' ? 0.0005 : -0.0002;
  const randomMove = (Math.random() * 2 - 1) * volatility + drift;
  const nextPrice = Math.max(1, Number((lastPrice * (1 + randomMove)).toFixed(2)));
  const nextHistory = [...history, nextPrice].slice(-maxHistoryPoints);
  const changePercent = lastPrice === 0 ? 0 : ((nextPrice - lastPrice) / lastPrice) * 100;

  return {
    ...asset,
    price: nextPrice,
    priceHistory: nextHistory,
    changePercent,
  };
}
