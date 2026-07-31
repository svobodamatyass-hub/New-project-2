import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../theme';
import { Skeleton } from './Skeleton';

function SkeletonScreen({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      {children}
    </ScrollView>
  );
}

function HeaderBlock() {
  return (
    <View style={styles.header}>
      <Skeleton height={22} width={118} />
      <Skeleton height={12} width={134} radius={999} />
    </View>
  );
}

function StatRow({ count = 2 }: { count?: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.statCard}>
          <Skeleton height={10} width={60} />
          <Skeleton height={22} width="72%" />
        </View>
      ))}
    </View>
  );
}

function PanelBlock({ children, height }: { children?: React.ReactNode; height?: number }) {
  return (
    <View style={styles.panel}>
      {children ?? <Skeleton height={height ?? 140} width="100%" />}
    </View>
  );
}

export function HomeScreenSkeleton() {
  return (
    <SkeletonScreen>
      <HeaderBlock />
      <View style={styles.hero}>
        <Skeleton height={11} width={72} />
        <Skeleton height={48} width="62%" />
        <Skeleton height={14} width="86%" />
      </View>
      <StatRow />
      <PanelBlock>
        <Skeleton height={16} width={96} />
        <View style={styles.row}>
          <Skeleton height={58} width="48%" />
          <Skeleton height={58} width="48%" />
        </View>
      </PanelBlock>
      <PanelBlock>
        <Skeleton height={16} width={70} />
        <StatRow />
      </PanelBlock>
    </SkeletonScreen>
  );
}

export function WalletScreenSkeleton() {
  return (
    <SkeletonScreen>
      <HeaderBlock />
      <Skeleton height={20} width={86} />
      <StatRow count={3} />
      <PanelBlock>
        <Skeleton height={12} width={76} />
        <Skeleton height={38} width="42%" />
        <Skeleton height={1} width="100%" radius={1} />
        <Skeleton height={18} width="100%" />
        <Skeleton height={18} width="100%" />
        <Skeleton height={18} width="100%" />
        <Skeleton height={92} width="100%" />
        <Skeleton height={42} width="100%" />
        <View style={styles.row}>
          <Skeleton height={48} width="48%" />
          <Skeleton height={48} width="48%" />
        </View>
      </PanelBlock>
      <PanelBlock>
        <Skeleton height={16} width={122} />
        <Skeleton height={18} width="100%" />
        <Skeleton height={18} width="100%" />
        <Skeleton height={18} width="100%" />
      </PanelBlock>
    </SkeletonScreen>
  );
}

export function SettingsScreenSkeleton() {
  return (
    <SkeletonScreen>
      <Skeleton height={20} width={92} />
      <PanelBlock>
        <Skeleton height={16} width={78} />
        <View style={styles.row}>
          <Skeleton height={60} width="31%" />
          <Skeleton height={60} width="31%" />
          <Skeleton height={60} width="31%" />
        </View>
        <View style={styles.row}>
          <Skeleton height={60} width="31%" />
          <Skeleton height={60} width="31%" />
          <Skeleton height={60} width="31%" />
        </View>
      </PanelBlock>
      <PanelBlock>
        <Skeleton height={16} width={136} />
        <Skeleton height={18} width="100%" />
        <Skeleton height={72} width="100%" />
        <Skeleton height={72} width="100%" />
        <Skeleton height={72} width="100%" />
      </PanelBlock>
      <PanelBlock height={86} />
    </SkeletonScreen>
  );
}

export function CasinoHubSkeleton() {
  return (
    <SkeletonScreen>
      <HeaderBlock />
      <Skeleton height={20} width={64} />
      <PanelBlock>
        <StatRow />
      </PanelBlock>
      {Array.from({ length: 5 }, (_, index) => (
        <View key={index} style={styles.gameCard}>
          <Skeleton height={46} width={46} />
          <View style={styles.gameCopy}>
            <Skeleton height={18} width="42%" />
            <Skeleton height={12} width="92%" />
          </View>
          <Skeleton height={26} width={56} radius={999} />
        </View>
      ))}
    </SkeletonScreen>
  );
}

export function CasinoGameSkeleton() {
  return (
    <SkeletonScreen>
      <HeaderBlock />
      <Skeleton height={38} width={98} />
      <Skeleton height={20} width={84} />
      <StatRow />
      <PanelBlock>
        <Skeleton height={220} width="100%" />
        <Skeleton height={56} width="100%" />
        <Skeleton height={80} width="100%" />
      </PanelBlock>
      <PanelBlock>
        <Skeleton height={18} width="34%" />
        <Skeleton height={46} width="100%" />
        <Skeleton height={46} width="100%" />
      </PanelBlock>
    </SkeletonScreen>
  );
}

export function CasinoGameSectionSkeleton() {
  return (
    <>
      <PanelBlock>
        <Skeleton height={220} width="100%" />
        <Skeleton height={56} width="100%" />
        <Skeleton height={80} width="100%" />
      </PanelBlock>
      <PanelBlock>
        <Skeleton height={18} width="34%" />
        <Skeleton height={46} width="100%" />
        <Skeleton height={46} width="100%" />
      </PanelBlock>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + spacing.xl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  hero: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minHeight: 84,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  panel: {
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  gameCard: {
    minHeight: 92,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  gameCopy: {
    flex: 1,
    gap: spacing.sm,
  },
});
