import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

type SectionHeaderProps = {
  title: string;
  caption?: string;
};

export function SectionHeader({ title, caption }: SectionHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  caption: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
    lineHeight: 18,
  },
});
