import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BanknoteArrowDown, BanknoteArrowUp, TimerReset } from 'lucide-react-native';

import { ActionButton } from '../components/ActionButton';
import { AmountSelector } from '../components/AmountSelector';
import { BrandHeader } from '../components/BrandHeader';
import { DebtMeter } from '../components/DebtMeter';
import { InfoRow } from '../components/InfoRow';
import { LoanPressurePanel } from '../components/LoanPressurePanel';
import { Panel } from '../components/Panel';
import { PortfolioList } from '../components/PortfolioList';
import { SaveStatusBadge } from '../components/SaveStatusBadge';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import { TransactionList } from '../components/TransactionList';
import {
  calculateDebtRisk,
  calculateInterestCharge,
  formatLoanDueLabel,
  formatMoney,
  formatPercent,
  getCreditLimit,
  getLoanPressureLabel,
  getRemainingCredit,
} from '../domain/finance';
import { getEconomyDifficultyFactors } from '../domain/economy';
import { getActiveProfileLabel } from '../domain/settingsProfile';
import { useGame } from '../game/GameProvider';
import { colors, spacing, typography } from '../theme';

export function WalletScreen() {
  const { applyInterest, borrow, repay, resetGame, saveStatus, state } = useGame();
  const [selectedAmount, setSelectedAmount] = useState(2500);
  const [isResetArmed, setIsResetArmed] = useState(false);
  const { player, transactions } = state;
  const debtRisk = calculateDebtRisk(player.loan.principal, player.netWorth);
  const baseInterestCharge = calculateInterestCharge(player.loan.principal, player.loan.interestRate);
  const projectedInterestCharge =
    baseInterestCharge <= 0
      ? 0
      : Math.max(
          1,
          Math.round(
            baseInterestCharge * getEconomyDifficultyFactors(state.settings.economyDifficulty).interestChargeMultiplier,
          ),
        );
  const canRepay = player.loan.principal > 0 && player.cash > 0;
  const repayAmount = Math.min(selectedAmount, player.cash, player.loan.principal);
  const loanPressure = player.loan.principal > 0 ? getLoanPressureLabel(player.loan.principal, player.netWorth) : 'Clear';
  const loanDueLabel = formatLoanDueLabel(player.loan.principal, player.loan.nextIncreaseAt);
  const creditLimit = getCreditLimit(player.netWorth);
  const remainingCredit = getRemainingCredit(player.loan.principal, player.netWorth);
  const canBorrow = remainingCredit > 0;
  const profileLabel = getActiveProfileLabel(state.settings);

  function handleResetPress() {
    if (!isResetArmed) {
      setIsResetArmed(true);
      return;
    }

    setIsResetArmed(false);
    resetGame();
  }

  return (
    <Screen>
      <BrandHeader
        screen="Wallet"
        status={profileLabel}
        statusTone={profileLabel === 'Chaos' ? 'negative' : profileLabel === 'Chill' ? 'positive' : 'warning'}
      />
      <SectionHeader title="Credit" />

      <View style={styles.statsRow}>
        <StatTile label="Cash" value={formatMoney(player.cash)} />
        <StatTile label="Debt risk" value={debtRisk} tone={debtRisk === 'Clear' ? 'positive' : 'warning'} />
      </View>

      <Panel>
        <Text style={styles.label}>Credit line</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.debt}>
          {formatMoney(player.loan.principal)}
        </Text>
        <View style={styles.divider} />
        <InfoRow label="Base interest" value={formatPercent(player.loan.interestRate * 100)} />
        <InfoRow label="Credit limit" value={formatMoney(creditLimit)} />
        <InfoRow label="Remaining credit" value={formatMoney(remainingCredit)} tone={remainingCredit > 0 ? 'positive' : 'warning'} />
        <InfoRow
          label="Pressure"
          value={loanPressure}
          tone={player.loan.principal > 0 ? 'warning' : 'positive'}
        />
        <InfoRow
          label="Next interest"
          value={loanDueLabel}
          tone={player.loan.principal > 0 ? 'warning' : 'positive'}
        />
        <InfoRow
          label="Projected charge"
          value={formatMoney(projectedInterestCharge)}
          tone={projectedInterestCharge > 0 ? 'warning' : 'positive'}
        />
        <LoanPressurePanel
          interestCharge={projectedInterestCharge}
          netWorth={player.netWorth}
          principal={player.loan.principal}
        />
        <DebtMeter debt={player.loan.principal} netWorth={player.netWorth} />
        <AmountSelector
          amounts={[1000, 2500, 5000]}
          onSelectAmount={setSelectedAmount}
          selectedAmount={selectedAmount}
        />
        <View style={styles.actions}>
          <ActionButton disabled={!canBorrow} Icon={BanknoteArrowUp} onPress={() => borrow(selectedAmount)}>Borrow</ActionButton>
          <ActionButton disabled={!canRepay} Icon={BanknoteArrowDown} onPress={() => repay(repayAmount)} tone="danger">
            Repay
          </ActionButton>
        </View>
        <ActionButton disabled={player.loan.principal <= 0} Icon={TimerReset} onPress={applyInterest} tone="casino">
          Advance interest
        </ActionButton>
      </Panel>

      <Panel>
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.label}>Recent activity</Text>
            <View style={styles.saveBadge}>
              <SaveStatusBadge status={saveStatus} />
            </View>
          </View>
          <View style={styles.resetButton}>
            <ActionButton onPress={handleResetPress} tone={isResetArmed ? 'danger' : 'neutral'}>
              {isResetArmed ? 'Confirm' : 'Reset'}
            </ActionButton>
          </View>
        </View>
        {isResetArmed ? <Text style={styles.resetHint}>Confirm reset</Text> : null}
        <TransactionList transactions={transactions.slice(0, 6)} />
      </Panel>

      <Panel>
        <Text style={styles.label}>Portfolio</Text>
        <PortfolioList assets={state.assets} positions={player.positions} />
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '700',
  },
  debt: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 34,
    fontWeight: '800',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  resetButton: {
    width: 104,
  },
  saveBadge: {
    marginTop: spacing.xs,
  },
  resetHint: {
    color: colors.negative,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
});
