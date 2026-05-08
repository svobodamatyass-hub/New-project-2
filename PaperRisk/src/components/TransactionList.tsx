import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { formatMoney } from '../domain/finance';
import { colors, spacing, typography } from '../theme';
import type { Transaction, TransactionType } from '../types/domain';
import { Badge } from './Badge';

type TransactionListProps = {
  transactions: Transaction[];
};

const iconsByType = {
  borrow: ArrowDownLeft,
  repay: ArrowUpRight,
  interest: ArrowUpRight,
  buy: ArrowUpRight,
  sell: ArrowDownLeft,
  casino: CircleDollarSign,
  system: Sparkles,
} satisfies Record<TransactionType, typeof Sparkles>;

function getTransactionTone(transaction: Transaction) {
  if (transaction.type === 'repay' || transaction.amount < 0) {
    return 'negative';
  }

  if (transaction.type === 'system') {
    return 'warning';
  }

  return 'positive';
}

function formatTransactionTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return new Intl.DateTimeFormat('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No activity</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {transactions.map((transaction) => {
        const Icon = iconsByType[transaction.type];
        const tone = getTransactionTone(transaction);

        return (
          <View key={transaction.id} style={styles.transaction}>
            <View style={[styles.iconFrame, styles[`${tone}Frame`]]}>
              <Icon color={colors[tone]} size={17} strokeWidth={2.4} />
            </View>
            <View style={styles.transactionCopy}>
              <View style={styles.titleRow}>
                <Text numberOfLines={1} style={styles.transactionTitle}>
                  {transaction.title}
                </Text>
                <Badge label={formatTransactionTime(transaction.createdAt)} />
              </View>
            </View>
            <Text style={[styles.transactionAmount, styles[`${tone}Amount`]]}>
              {formatMoney(transaction.amount)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  empty: {
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 15,
    fontWeight: '800',
  },
  transaction: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconFrame: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  positiveFrame: {
    backgroundColor: colors.positiveSoft,
    borderColor: colors.positiveMuted,
  },
  negativeFrame: {
    backgroundColor: colors.negativeSoft,
    borderColor: colors.negativeMuted,
  },
  warningFrame: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningMuted,
  },
  transactionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  transactionTitle: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 14,
    fontWeight: '800',
  },
  transactionAmount: {
    minWidth: 72,
    textAlign: 'right',
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '800',
  },
  positiveAmount: {
    color: colors.positive,
  },
  negativeAmount: {
    color: colors.negative,
  },
  warningAmount: {
    color: colors.warning,
  },
});
