import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, View } from 'react-native';

import { AppShell } from './src/components/AppShell';
import { RouletteLoader } from './src/components/RouletteLoader';
import { GameProvider } from './src/game/GameProvider';
import { tabs, type TabKey } from './src/navigation/tabs';
import { CasinoScreen } from './src/screens/CasinoScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { colors } from './src/theme/colors';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 1800);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.app}>
        <View style={styles.deviceFrame}>
          <GameProvider>
            <AppShell activeTab={activeTab} tabs={tabs} onTabPress={setActiveTab}>
              {screen}
            </AppShell>
            {isBooting ? <RouletteLoader /> : null}
          </GameProvider>
        </View>
      </View>
    </SafeAreaView>
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
      },
      default: {},
    }),
  },
});
