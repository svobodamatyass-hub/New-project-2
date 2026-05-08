import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Activity } from 'lucide-react-native';

import { ActionButton } from '../components/ActionButton';
import { AssetListItem } from '../components/AssetListItem';
import { BrandHeader } from '../components/BrandHeader';
import { InfoRow } from '../components/InfoRow';
import { OrderStatus } from '../components/OrderStatus';
import { Panel } from '../components/Panel';
import { PortfolioList } from '../components/PortfolioList';
import { PriceHistoryChart } from '../components/PriceHistoryChart';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { SharePresetRow } from '../components/SharePresetRow';
import { StatTile } from '../components/StatTile';
import { Stepper } from '../components/Stepper';
import { formatMoney } from '../domain/finance';
import { getActiveProfileLabel } from '../domain/settingsProfile';
import { useGame } from '../game/GameProvider';
import { getPositionByAssetId } from '../game/selectors';
import { colors, spacing, typography } from '../theme';

export function MarketScreen() {
  const { buyAsset, sellAsset, state, tickMarket } = useGame();
  const [selectedAssetId, setSelectedAssetId] = useState(state.assets[0]?.id ?? '');
  const [shares, setShares] = useState(1);

  const selectedAsset = useMemo(
    () => state.assets.find((asset) => asset.id === selectedAssetId) ?? state.assets[0],
    [selectedAssetId, state.assets],
  );
  const selectedPosition = selectedAsset ? getPositionByAssetId(state, selectedAsset.id) : undefined;
  const orderValue = selectedAsset ? Math.round(selectedAsset.price * shares) : 0;
  const ownedShares = selectedPosition?.shares ?? 0;
  const sellShares = Math.min(shares, ownedShares);
  const sellValue = selectedAsset ? Math.round(selectedAsset.price * sellShares) : 0;
  const canBuy = Boolean(selectedAsset && orderValue > 0 && orderValue <= state.player.cash);
  const canSell = Boolean(selectedAsset && sellShares > 0);
  const orderMessage = canBuy
    ? 'Ready'
    : `${formatMoney(Math.max(orderValue - state.player.cash, 0))} short`;
  const profileLabel = getActiveProfileLabel(state.settings);

  useEffect(() => {
    if (!state.assets.some((asset) => asset.id === selectedAssetId)) {
      setSelectedAssetId(state.assets[0]?.id ?? '');
    }
  }, [selectedAssetId, state.assets]);

  return (
    <Screen>
      <BrandHeader
        screen="Market"
        status={profileLabel}
        statusTone={profileLabel === 'Chaos' ? 'negative' : profileLabel === 'Chill' ? 'positive' : 'warning'}
      />
      <SectionHeader title="Assets" />

      <View style={styles.statsRow}>
        <StatTile label="Cash" value={formatMoney(state.player.cash)} />
        <StatTile label="Invested" value={formatMoney(state.player.invested)} />
      </View>

      {selectedAsset ? (
        <Panel>
          <View style={styles.tradeHeader}>
            <View>
              <Text style={styles.symbol}>{selectedAsset.symbol}</Text>
              <Text style={styles.assetName}>{selectedAsset.name}</Text>
            </View>
            <Text style={styles.price}>{formatMoney(selectedAsset.price)}</Text>
          </View>

          <InfoRow label="Owned shares" value={`${ownedShares}`} />
          <InfoRow label="Average cost" value={selectedPosition ? formatMoney(selectedPosition.averagePrice) : '-'} />
          <InfoRow label="Order value" value={formatMoney(orderValue)} tone={canBuy ? 'default' : 'warning'} />
          <InfoRow label="Sell value" value={formatMoney(sellValue)} tone={canSell ? 'positive' : 'default'} />
          <PriceHistoryChart history={selectedAsset.priceHistory} />

          <OrderStatus message={orderMessage} tone={canBuy ? 'positive' : 'warning'} />

          <Stepper label="Shares" max={99} min={1} onChange={setShares} value={shares} />
          <SharePresetRow maxSellShares={ownedShares} onSelect={setShares} />

          <View style={styles.actions}>
            <ActionButton disabled={!canBuy} onPress={() => buyAsset(selectedAsset.id, shares)} tone="primary">
              Buy
            </ActionButton>
            <ActionButton disabled={!canSell} onPress={() => sellAsset(selectedAsset.id, sellShares)} tone="danger">
              Sell
            </ActionButton>
          </View>
        </Panel>
      ) : null}

      <Panel>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Portfolio</Text>
          <View style={styles.moveButton}>
            <ActionButton Icon={Activity} onPress={tickMarket}>
              Move market
            </ActionButton>
          </View>
        </View>
        <PortfolioList assets={state.assets} positions={state.player.positions} />
      </Panel>

      <SectionHeader title="Market list" />
      <View style={styles.list}>
        {state.assets.map((asset) => (
          <AssetListItem
            asset={asset}
            isSelected={asset.id === selectedAsset?.id}
            key={asset.id}
            onPress={() => setSelectedAssetId(asset.id)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tradeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  symbol: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 24,
    fontWeight: '800',
  },
  assetName: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  price: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  panelTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: '800',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  moveButton: {
    width: 148,
  },
  list: {
    gap: spacing.md,
  },
});
