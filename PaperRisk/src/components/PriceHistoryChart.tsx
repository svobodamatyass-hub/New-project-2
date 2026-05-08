import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { formatMoney } from '../domain/finance';
import { colors, spacing, typography } from '../theme';

type PriceHistoryChartProps = {
  history: number[];
};

export function PriceHistoryChart({ history }: PriceHistoryChartProps) {
  const points = history.length > 1 ? history : [history[0] ?? 1, history[0] ?? 1];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 1);
  const width = 320;
  const height = 120;
  const padding = 10;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const tone = points.at(-1)! >= points[0] ? colors.positive : colors.negative;
  const polylinePoints = points
    .map((price, index) => {
      const x = padding + (index / Math.max(points.length - 1, 1)) * chartWidth;
      const y = padding + (1 - (price - min) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');
  const lastPoint = polylinePoints.split(' ').at(-1)?.split(',').map(Number) ?? [width - padding, height / 2];

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.label}>Price history</Text>
        <Text style={[styles.value, { color: tone }]}>
          {formatMoney(points[0])} {'->'} {formatMoney(points.at(-1) ?? points[0])}
        </Text>
      </View>
      <View style={styles.chartFrame}>
        <Svg height="120" viewBox={`0 0 ${width} ${height}`} width="100%">
          <Polyline fill="none" points={polylinePoints} stroke={tone} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          <Circle cx={lastPoint[0]} cy={lastPoint[1]} fill={colors.background} r="5" stroke={tone} strokeWidth="3" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '700',
  },
  value: {
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: '800',
  },
  chartFrame: {
    height: 126,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
