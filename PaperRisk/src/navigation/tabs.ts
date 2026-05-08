import { ChartCandlestick, CircleDollarSign, House, Landmark, SlidersHorizontal } from 'lucide-react-native';

export type TabKey = 'home' | 'market' | 'casino' | 'wallet' | 'settings';

export const tabs = [
  { key: 'home', label: 'Home', Icon: House },
  { key: 'market', label: 'Market', Icon: ChartCandlestick },
  { key: 'casino', label: 'Casino', Icon: CircleDollarSign },
  { key: 'wallet', label: 'Wallet', Icon: Landmark },
  { key: 'settings', label: 'Settings', Icon: SlidersHorizontal },
] as const satisfies ReadonlyArray<{
  key: TabKey;
  label: string;
  Icon: typeof House;
}>;
