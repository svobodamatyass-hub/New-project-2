import { CircleDollarSign, House, Landmark, SlidersHorizontal } from 'lucide-react-native';

export type TabKey = 'home' | 'casino' | 'wallet' | 'settings';

export const tabs = [
  { key: 'home', label: 'Home', Icon: House },
  { key: 'casino', label: 'Casino', Icon: CircleDollarSign },
  { key: 'wallet', label: 'Bank', Icon: Landmark },
  { key: 'settings', label: 'Settings', Icon: SlidersHorizontal },
] as const satisfies ReadonlyArray<{
  key: TabKey;
  label: string;
  Icon: typeof House;
}>;
