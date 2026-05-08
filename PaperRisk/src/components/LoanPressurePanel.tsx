import { AlertTriangle, Gauge, ShieldCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { calculateDebtRisk, formatMoney } from '../domain/finance';
import { colors, spacing, typography } from '../theme';

type LoanPressurePanelProps = {
  interestCharge: number;
  netWorth: number;
  principal: number;
};

export function LoanPressurePanel({ interestCharge, netWorth, principal }: LoanPressurePanelProps) {
  const risk = calculateDebtRisk(principal, netWorth);
  const tone = risk === 'High' ? 'negative' : risk === 'Medium' ? 'warning' : 'positive';
  const Icon = risk === 'High' ? AlertTriangle : risk === 'Medium' ? Gauge : ShieldCheck;
  const title = principal <= 0 ? 'Credit is clear' : `${risk} credit risk`;

  return (
    <View style={[styles.panel, styles[`${tone}Panel`]]}>
      <Icon color={colors[tone]} size={18} strokeWidth={2.4} />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors[tone] }]}>{title}</Text>
        <Text style={styles.caption}>
          {principal > 0 ? `${formatMoney(interestCharge)} will be added on the next interest step.` : 'No interest is building right now.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    minHeight: 58,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  positivePanel: {
    backgroundColor: colors.positiveSoft,
    borderColor: colors.positiveMuted,
  },
  warningPanel: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningMuted,
  },
  negativePanel: {
    backgroundColor: colors.negativeSoft,
    borderColor: colors.negativeMuted,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: typography.family,
    fontSize: 14,
    fontWeight: '800',
  },
  caption: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 2,
  },
});
