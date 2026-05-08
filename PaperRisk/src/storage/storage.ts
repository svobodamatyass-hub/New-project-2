import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVE_KEY = 'paperrisk.save.v1';

export async function saveGameState<TState>(state: TState) {
  await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export async function loadGameState<TState>() {
  const saved = await AsyncStorage.getItem(SAVE_KEY);
  return saved ? (JSON.parse(saved) as TState) : null;
}

export async function clearGameState() {
  await AsyncStorage.removeItem(SAVE_KEY);
}
