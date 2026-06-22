import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatMoney } from '../domain/finance';
import { colors, spacing, typography, webFocusReset } from '../theme';

type WagerInputProps = {
  disabled?: boolean;
  max: number;
  min?: number;
  onChange: (value: number) => void;
  value: number;
};

const presetAmounts = [100, 250, 500, 1000];

function clampWager(value: number, min: number, max: number) {
  if (max < min) {
    return 0;
  }

  return Math.min(Math.max(Math.round(value), min), Math.round(max));
}

export function WagerInput({ disabled = false, max, min = 1, onChange, value }: WagerInputProps) {
  const [draft, setDraft] = useState(`${value}`);
  const roundedMax = Math.max(0, Math.round(max));
  const hasFunds = roundedMax >= min;

  useEffect(() => {
    setDraft(`${value}`);
  }, [value]);

  function commit(nextDraft: string) {
    const parsed = Number(nextDraft.replace(/[^\d]/g, ''));
    const nextValue = Number.isFinite(parsed) ? clampWager(parsed, min, roundedMax) : min;

    setDraft(`${nextValue}`);
    onChange(nextValue);
  }

  function handleDraftChange(nextDraft: string) {
    const cleanDraft = nextDraft.replace(/[^\d]/g, '');

    setDraft(cleanDraft);

    if (cleanDraft.length > 0) {
      const parsed = Number(cleanDraft);
      onChange(clampWager(parsed, min, roundedMax));
    }
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.inputFrame, disabled && styles.disabled]}>
        <Text style={styles.currency}>CZK</Text>
        <TextInput
          accessibilityLabel="Custom wager"
          editable={!disabled && hasFunds}
          inputMode="numeric"
          keyboardType="number-pad"
          onBlur={() => commit(draft)}
          onChangeText={handleDraftChange}
          placeholder="0"
          placeholderTextColor={colors.textFaint}
          selectTextOnFocus
          style={styles.input}
          value={draft}
        />
      </View>

      <View style={styles.quickRow}>
        {presetAmounts.map((amount) => {
          const isUnavailable = amount > roundedMax || amount < min;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: disabled || !hasFunds || isUnavailable }}
              disabled={disabled || !hasFunds || isUnavailable}
              key={amount}
              onPress={() => {
                setDraft(`${amount}`);
                onChange(amount);
              }}
              style={({ pressed }) => [
                styles.quickButton,
                webFocusReset,
                (disabled || !hasFunds || isUnavailable) && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.quickText}>{formatMoney(amount)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.limit}>Available {formatMoney(roundedMax)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  inputFrame: {
    minHeight: 54,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  currency: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 22,
    fontWeight: '900',
    padding: 0,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  quickButton: {
    minWidth: 72,
    minHeight: 40,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '900',
  },
  limit: {
    color: colors.textFaint,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    opacity: 0.72,
  },
});
