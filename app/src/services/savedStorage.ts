import AsyncStorage from '@react-native-async-storage/async-storage';
import { SpecialItem, StoreId } from '../types/specials';

const LEGACY_SAVED_ITEMS_KEY = '@aussie_specials_saved_items_v1';
const SHOPPING_LIST_KEY = '@snag_shopping_list_v2';
const PREFS_KEY = '@snag_user_prefs_v1';

export interface ShoppingListEntry {
  item: SpecialItem;
  quantity: number;
  done: boolean;
}

export interface SnagUserPrefs {
  favStores: StoreId[];
  favItemIds: string[];
  recentSearches: string[];
}

const DEFAULT_PREFS: SnagUserPrefs = {
  favStores: ['woolworths'],
  favItemIds: [],
  recentSearches: ['chips', 'avocado', 'coffee', 'milk', 'tim tam'],
};

export async function loadShoppingList(): Promise<ShoppingListEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(SHOPPING_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (e): e is ShoppingListEntry =>
            Boolean(e && e.item && e.item.id && typeof e.quantity === 'number' && e.quantity > 0)
        );
      }
    }

    // Migrate legacy saved items seamlessly
    const legacyRaw = await AsyncStorage.getItem(LEGACY_SAVED_ITEMS_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      if (Array.isArray(legacy) && legacy.length > 0) {
        const migrated: ShoppingListEntry[] = legacy
          .filter((i): i is SpecialItem => Boolean(i && i.id))
          .map((item) => ({ item, quantity: 1, done: false }));
        await persistShoppingList(migrated);
        return migrated;
      }
    }
  } catch {
    // ignore storage read errors
  }
  return [];
}

export async function persistShoppingList(
  entries: ShoppingListEntry[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage write errors
  }
}

export async function loadUserPrefs(): Promise<SnagUserPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<SnagUserPrefs>;
    return {
      favStores: Array.isArray(parsed.favStores)
        ? parsed.favStores
        : DEFAULT_PREFS.favStores,
      favItemIds: Array.isArray(parsed.favItemIds) ? parsed.favItemIds : [],
      recentSearches: Array.isArray(parsed.recentSearches)
        ? parsed.recentSearches
        : DEFAULT_PREFS.recentSearches,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function persistUserPrefs(prefs: SnagUserPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage write errors
  }
}
