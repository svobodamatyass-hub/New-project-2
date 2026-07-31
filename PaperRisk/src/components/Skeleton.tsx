import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from '../theme';

type SkeletonProps = {
  width?: number | `${number}%` | '100%';
  height: number;
  radius?: number;
  style?: object;
};

export function Skeleton({ width = '100%', height, radius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.42)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.42,
          duration: 720,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return <Animated.View style={[styles.block, { width, height, borderRadius: radius, opacity }, style]} />;
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surfaceRaised,
  },
});
