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
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
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
  tabBar: {
    minHeight: 82,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  tabItem: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: colors.surface,
  },
  tabPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.82,
  },
  tabLabel: {
    color: colors.textFaint,
    fontFamily: typography.family,
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.text,
  },
});
