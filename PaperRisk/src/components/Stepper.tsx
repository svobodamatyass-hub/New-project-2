import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography, webFocusReset } from '../theme';

type StepperProps = {
  label: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  value: number;
};

export function Stepper({ label, max = 999, min = 1, onChange, value }: StepperProps) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable
          accessibilityLabel="Decrease shares"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canDecrease }}
          disabled={!canDecrease}
          onPress={() => onChange(Math.max(min, value - 1))}
          style={({ pressed }) => [styles.button, webFocusReset, !canDecrease && styles.disabled, pressed && styles.pressed]}
        >
          <Minus color={colors.text} size={16} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable
          accessibilityLabel="Increase shares"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canIncrease }}
          disabled={!canIncrease}
          onPress={() => onChange(Math.min(max, value + 1))}
          style={({ pressed }) => [styles.button, webFocusReset, !canIncrease && styles.disabled, pressed && styles.pressed]}
        >
          <Plus color={colors.text} size={16} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '700',
  },
  controls: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  button: {
    width: 52,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    backgroundColor: colors.surfaceRaised,
  },
  value: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
});
