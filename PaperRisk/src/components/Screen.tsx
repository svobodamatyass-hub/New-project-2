import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { colors, spacing } from '../theme';

type ScreenProps = {
  children: ReactNode;
};

export function Screen({ children }: ScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={[styles.screen, { opacity, transform: [{ translateY }] }]}
    >
      {children}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 40,
    gap: spacing.lg,
  },
});
