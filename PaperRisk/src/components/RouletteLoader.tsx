import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

const redPockets = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

function pocketColor(index: number): string {
  if (index === 0) {
    return '#2C8A4D';
  }
  return redPockets.has(index) ? '#BF2F2F' : '#1E232B';
}

export function RouletteLoader() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.wheel, { transform: [{ rotate: rotation }] }]}>
        {Array.from({ length: 37 }, (_, i) => (
          <View
            key={i}
            style={[
              styles.slice,
              {
                backgroundColor: pocketColor(i),
                transform: [{ rotate: `${i * (360 / 37)}deg` }],
              },
            ]}
          />
        ))}
        <View style={styles.center} />
      </Animated.View>
      <Text style={styles.label}>PaperRisk</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    zIndex: 20,
  },
  wheel: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#6D7480',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#12161A',
    marginBottom: 14,
  },
  slice: {
    position: 'absolute',
    width: 8,
    height: 72,
    top: -2,
    borderRadius: 4,
  },
  center: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#171B21',
    borderWidth: 2,
    borderColor: '#2A3038',
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
  },
});
