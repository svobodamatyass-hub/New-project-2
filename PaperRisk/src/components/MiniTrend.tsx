import { StyleSheet, View } from 'react-native';

import { colors } from '../theme';

type MiniTrendProps = {
  history: number[];
};

function getBars(history: number[]) {
  const points = history.length ? history.slice(-8) : [1];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 1);

  return points.map((point) => 8 + ((point - min) / range) * 26);
}

export function MiniTrend({ history }: MiniTrendProps) {
  const points = history.length ? history : [1];
  const tone = (points.at(-1) ?? 0) >= points[0] ? 'positive' : 'negative';
  const color = tone === 'positive' ? colors.positive : colors.negative;
  const bars = getBars(points);

  return (
    <View style={styles.chart} accessibilityLabel={`${tone} mini trend`}>
      {bars.map((height, index) => (
        <View key={`${height.toFixed(2)}-${index}`} style={[styles.bar, { height, backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    width: 64,
    height: 34,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bar: {
    width: 5,
    borderRadius: 4,
    opacity: 0.8,
  },
});
