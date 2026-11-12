import AsyncStorage from '@react-native-async-storage/async-storage';
import { SpecialItem } from '../types/specials';

const SAVED_ITEMS_KEY = '@aussie_specials_saved_items_v1';

export async function loadSavedSpecials(): Promise<SpecialItem[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function persistSavedSpecials(items: SpecialItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage write errors
  }
}
