import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

type CasinoResultBannerProps = {
  caption?: string;
  title: string;
  tone?: 'default' | 'positive' | 'negative' | 'warning' | 'accent';
  value?: string;
};

export function CasinoResultBanner({ caption, title, tone = 'default', value }: CasinoResultBannerProps) {
  const toneColor = tone === 'default' ? colors.text : colors[tone];
  const toneSoft =
    tone === 'default'
      ? colors.background
      : tone === 'positive'
        ? colors.positiveSoft
        : tone === 'negative'
          ? colors.negativeSoft
          : tone === 'warning'
            ? colors.warningSoft
            : colors.accentSoft;
  const toneMuted =
    tone === 'default'
      ? colors.border
      : tone === 'positive'
        ? colors.positiveMuted
        : tone === 'negative'
          ? colors.negativeMuted
          : tone === 'warning'
            ? colors.warningMuted
            : colors.accentMuted;

  return (
    <View style={[styles.banner, { backgroundColor: toneSoft, borderColor: toneMuted }]}>
      <View style={[styles.rail, { backgroundColor: toneColor }]} />
      <View style={styles.copy}>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {value ? <Text style={[styles.value, { color: toneColor }]}>{value}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 58,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rail: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 999,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  caption: {
    color: colors.textFaint,
    fontFamily: typography.family,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 15,
    fontWeight: '900',
  },
  value: {
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: '900',
  },
});
