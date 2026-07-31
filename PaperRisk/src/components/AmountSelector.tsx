import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMoney } from '../domain/finance';
import { colors, spacing, typography, webFocusReset } from '../theme';

type AmountSelectorProps = {
  amounts: number[];
  selectedAmount: number;
  onSelectAmount: (amount: number) => void;
};

export function AmountSelector({ amounts, selectedAmount, onSelectAmount }: AmountSelectorProps) {
  return (
    <View style={styles.group}>
      {amounts.map((amount) => {
        const isActive = amount === selectedAmount;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={amount}
            onPress={() => onSelectAmount(amount)}
            style={({ pressed }) => [styles.option, webFocusReset, isActive && styles.optionActive, pressed && styles.pressed]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{formatMoney(amount)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
  },
  optionActive: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningMuted,
  },
  pressed: {
    opacity: 0.72,
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '800',
  },
  labelActive: {
    color: colors.warning,
  },
});
