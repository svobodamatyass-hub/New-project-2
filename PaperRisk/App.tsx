import { StatusBar } from 'expo-status-bar';
import { lazy, Suspense, useMemo, useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, View } from 'react-native';

import { AppShell } from './src/components/AppShell';
import {
  CasinoGameSkeleton,
  CasinoHubSkeleton,
  HomeScreenSkeleton,
  SettingsScreenSkeleton,
  WalletScreenSkeleton,
} from './src/components/ScreenSkeletons';
import { GameProvider } from './src/game/GameProvider';
import { useGame } from './src/game/GameProvider';
import { tabs, type TabKey } from './src/navigation/tabs';
import { HomeScreen } from './src/screens/HomeScreen';
import { colors } from './src/theme/colors';

const CasinoScreen = lazy(() => import('./src/screens/CasinoScreen').then((module) => ({ default: module.CasinoScreen })));
const WalletScreen = lazy(() => import('./src/screens/WalletScreen').then((module) => ({ default: module.WalletScreen })));
const SettingsScreen = lazy(() => import('./src/screens/SettingsScreen').then((module) => ({ default: module.SettingsScreen })));

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.app}>
        <View style={styles.deviceFrame}>
          <GameProvider>
            <AppContent />
          </GameProvider>
        </View>
      </View>
    </SafeAreaView>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const { hasHydrated } = useGame();

  const screen = useMemo(() => {
    switch (activeTab) {
      case 'casino':
        return <CasinoScreen />;
      case 'wallet':
        return <WalletScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'home':
      default:
        return <HomeScreen onNavigate={setActiveTab} />;
    }
  }, [activeTab]);

  const fallback = useMemo(() => {
    if (activeTab === 'casino') {
      return <CasinoHubSkeleton />;
    }

    if (activeTab === 'wallet') {
      return <WalletScreenSkeleton />;
    }

    if (activeTab === 'settings') {
      return <SettingsScreenSkeleton />;
    }

    return <HomeScreenSkeleton />;
  }, [activeTab]);

  return (
    <AppShell activeTab={activeTab} tabs={tabs} onTabPress={setActiveTab}>
      {hasHydrated ? <Suspense fallback={fallback}>{screen}</Suspense> : fallback}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  app: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 0 : 0,
  },
  deviceFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.background,
    ...Platform.select({
      web: {
        borderLeftColor: colors.border,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderRightColor: colors.border,
        borderRightWidth: StyleSheet.hairlineWidth,
        boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
      },
      default: {},
    }),
  },
});
