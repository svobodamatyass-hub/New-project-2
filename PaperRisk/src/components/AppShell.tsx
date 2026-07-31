import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import type { TabKey } from '../navigation/tabs';
import { colors, spacing, typography, webFocusReset } from '../theme';

type TabItem = {
  key: TabKey;
  label: string;
  Icon: LucideIcon;
};

type AppShellProps = {
  activeTab: TabKey;
  tabs: readonly TabItem[];
  children: ReactNode;
  onTabPress: (tab: TabKey) => void;
};

export function AppShell({ activeTab, tabs, children, onTabPress }: AppShellProps) {
  return (
    <View style={styles.shell}>
      <View style={styles.content}>{children}</View>
      <View style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          {tabs.map(({ key, label, Icon }) => {
            const isActive = activeTab === key;
            const tone = isActive ? colors.text : colors.textFaint;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                key={key}
                onPress={() => onTabPress(key)}
                style={({ pressed }) => [
                  styles.tabItem,
                  webFocusReset,
                  isActive && styles.tabItemActive,
                  pressed && styles.tabPressed,
                ]}
              >
                <Icon size={22} color={tone} strokeWidth={isActive ? 2.4 : 2} />
                <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  tabBarWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  tabBar: {
    minHeight: 72,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  tabItem: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
  },
  tabItemActive: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningMuted,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },
  tabLabel: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '800',
  },
  tabLabelActive: {
    color: colors.warning,
  },
  tabLabelInactive: {
    color: colors.textFaint,
  },
});
