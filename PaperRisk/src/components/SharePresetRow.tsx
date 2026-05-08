import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography, webFocusReset } from '../theme';

type SharePresetRowProps = {
  maxSellShares: number;
  onSelect: (shares: number) => void;
};

const presets = [1, 5, 10];

export function SharePresetRow({ maxSellShares, onSelect }: SharePresetRowProps) {
  return (
    <View style={styles.row}>
      {presets.map((shares) => (
        <Pressable
          accessibilityLabel={`Set shares ${shares}`}
          accessibilityRole="button"
          key={shares}
          onPress={() => onSelect(shares)}
          style={({ pressed }) => [styles.preset, webFocusReset, pressed && styles.pressed]}
        >
          <Text style={styles.label}>{shares}</Text>
        </Pressable>
      ))}
      <Pressable
        accessibilityLabel="Set shares max"
        accessibilityRole="button"
        accessibilityState={{ disabled: maxSellShares <= 0 }}
        disabled={maxSellShares <= 0}
        onPress={() => onSelect(maxSellShares)}
        style={({ pressed }) => [
          styles.preset,
          webFocusReset,
          maxSellShares <= 0 && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.label}>Max</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  preset: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
  },
  pressed: {
    backgroundColor: colors.surfaceRaised,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '800',
  },
});
