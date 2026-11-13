import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DealFilter,
  SortOption,
  SpecialItem,
  StoreFilter,
  StoreId,
  UserStoreLocation,
} from '../types/specials';

// Primary storage keys — NEVER rename these so in-place .ipa / app updates
// preserve 100% of existing user data from v1.0.0+.
const LEGACY_SAVED_ITEMS_KEY = '@aussie_specials_saved_items_v1';
const SHOPPING_LIST_KEY = '@snag_shopping_list_v2';
const PREFS_KEY = '@snag_user_prefs_v1';
const USER_LOCATION_STORAGE_KEY = '@aussie_specials_user_location_v1';
const CUSTOM_API_URL_KEY = '@aussie_specials_custom_api_url';

// Redundant self-healing snapshot key across updates
const UNIFIED_BACKUP_KEY = '@aussie_specials_backup_snapshot_v1';

export interface ShoppingListEntry {
  item: SpecialItem;
  quantity: number;
  done: boolean;
}

export interface SnagUserPrefs {
  favStores: StoreId[];
  favItemIds: string[];
  recentSearches: string[];
  selectedStore: StoreFilter;
  dealFilter: DealFilter;
  inStockOnly: boolean;
  sortBy: SortOption;
  browseDealFilter: DealFilter;
  browseInStockOnly: boolean;
  storesTabFilter: string;
  dismissedUpdateTag: string | null;
}

export interface AussieSpecialsBackupPayload {
  schemaVersion: 1;
  exportedAt: string;
  prefs: SnagUserPrefs;
  shoppingList: ShoppingListEntry[];
  userLocation: UserStoreLocation | null;
  customApiUrl: string | null;
}

export const DEFAULT_PREFS: SnagUserPrefs = {
  favStores: ['woolworths'],
  favItemIds: [],
  recentSearches: ['chips', 'avocado', 'coffee', 'milk', 'tim tam'],
  selectedStore: 'all',
  dealFilter: 'all',
  inStockOnly: false,
  sortBy: 'featured',
  browseDealFilter: 'all',
  browseInStockOnly: false,
  storesTabFilter: 'All',
  dismissedUpdateTag: null,
};

const VALID_STORES: StoreFilter[] = [
  'all',
  'woolworths',
  'coles',
  'aldi',
  'iga',
  'amazon',
];
const VALID_DEAL_FILTERS: DealFilter[] = ['all', 'sale', 'half_price'];
const VALID_SORTS: SortOption[] = [
  'featured',
  'savings',
  'discount',
  'price_asc',
];

function sanitizeShoppingList(parsed: unknown): ShoppingListEntry[] {
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(
      (e): e is ShoppingListEntry =>
        Boolean(
          e &&
            typeof e === 'object' &&
            e.item &&
            e.item.id &&
            typeof e.quantity === 'number' &&
            e.quantity > 0
        )
    )
    .map((e) => ({
      item: e.item,
      quantity: e.quantity,
      done: Boolean(e.done),
    }));
}

export function normalizeUserPrefs(raw: unknown): SnagUserPrefs {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PREFS };
  }
  const p = raw as Partial<SnagUserPrefs>;
  return {
    favStores: Array.isArray(p.favStores)
      ? p.favStores.filter((s): s is StoreId =>
          ['woolworths', 'coles', 'aldi', 'iga', 'amazon'].includes(String(s))
        )
      : DEFAULT_PREFS.favStores,
    favItemIds: Array.isArray(p.favItemIds)
      ? p.favItemIds.filter((id): id is string => typeof id === 'string')
      : [],
    recentSearches: Array.isArray(p.recentSearches)
      ? p.recentSearches.filter((s): s is string => typeof s === 'string')
      : DEFAULT_PREFS.recentSearches,
    selectedStore: VALID_STORES.includes(p.selectedStore as StoreFilter)
      ? (p.selectedStore as StoreFilter)
      : DEFAULT_PREFS.selectedStore,
    dealFilter: VALID_DEAL_FILTERS.includes(p.dealFilter as DealFilter)
      ? (p.dealFilter as DealFilter)
      : DEFAULT_PREFS.dealFilter,
    inStockOnly:
      typeof p.inStockOnly === 'boolean'
        ? p.inStockOnly
        : DEFAULT_PREFS.inStockOnly,
    sortBy: VALID_SORTS.includes(p.sortBy as SortOption)
      ? (p.sortBy as SortOption)
      : DEFAULT_PREFS.sortBy,
    browseDealFilter: VALID_DEAL_FILTERS.includes(
      p.browseDealFilter as DealFilter
    )
      ? (p.browseDealFilter as DealFilter)
      : DEFAULT_PREFS.browseDealFilter,
    browseInStockOnly:
      typeof p.browseInStockOnly === 'boolean'
        ? p.browseInStockOnly
        : DEFAULT_PREFS.browseInStockOnly,
    storesTabFilter:
      typeof p.storesTabFilter === 'string' && p.storesTabFilter.trim()
        ? p.storesTabFilter
        : DEFAULT_PREFS.storesTabFilter,
    dismissedUpdateTag:
      typeof p.dismissedUpdateTag === 'string' ? p.dismissedUpdateTag : null,
  };
}

async function readBackupSnapshot(): Promise<Partial<AussieSpecialsBackupPayload> | null> {
  try {
    const raw = await AsyncStorage.getItem(UNIFIED_BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export async function syncUnifiedBackupSnapshot(
  partial: Partial<Omit<AussieSpecialsBackupPayload, 'schemaVersion' | 'exportedAt'>>
): Promise<void> {
  try {
    const existing = (await readBackupSnapshot()) || {};
    const merged: AussieSpecialsBackupPayload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      prefs: normalizeUserPrefs(partial.prefs ?? existing.prefs),
      shoppingList: sanitizeShoppingList(
        partial.shoppingList ?? existing.shoppingList ?? []
      ),
      userLocation:
        partial.userLocation !== undefined
          ? partial.userLocation
          : existing.userLocation ?? null,
      customApiUrl:
        partial.customApiUrl !== undefined
          ? partial.customApiUrl
          : existing.customApiUrl ?? null,
    };
    await AsyncStorage.setItem(UNIFIED_BACKUP_KEY, JSON.stringify(merged));
  } catch {
    // ignore backup mirror errors
  }
}

export async function loadShoppingList(): Promise<ShoppingListEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(SHOPPING_LIST_KEY);
    if (raw !== null) {
      const entries = sanitizeShoppingList(JSON.parse(raw));
      return entries;
    }

    // Migrate legacy v1 saved items seamlessly
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

    // Self-heal from unified backup snapshot if primary key was missing
    const backup = await readBackupSnapshot();
    if (backup?.shoppingList && Array.isArray(backup.shoppingList)) {
      const recovered = sanitizeShoppingList(backup.shoppingList);
      if (recovered.length > 0) {
        await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(recovered));
      }
      return recovered;
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
    const clean = sanitizeShoppingList(entries);
    await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(clean));
    await syncUnifiedBackupSnapshot({ shoppingList: clean });
  } catch {
    // ignore storage write errors
  }
}

export async function loadUserPrefs(): Promise<SnagUserPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (raw) {
      const normalized = normalizeUserPrefs(JSON.parse(raw));
      return normalized;
    }

    // Self-heal from unified backup snapshot if primary key was missing
    const backup = await readBackupSnapshot();
    if (backup?.prefs) {
      const recovered = normalizeUserPrefs(backup.prefs);
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(recovered));
      return recovered;
    }
  } catch {
    // ignore storage read errors
  }
  return { ...DEFAULT_PREFS };
}

export async function persistUserPrefs(prefs: SnagUserPrefs): Promise<void> {
  try {
    const clean = normalizeUserPrefs(prefs);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(clean));
    await syncUnifiedBackupSnapshot({ prefs: clean });
  } catch {
    // ignore storage write errors
  }
}

export async function exportAllUserSettingsJson(): Promise<string> {
  const [prefs, shoppingList, rawLoc, rawCustomUrl] = await Promise.all([
    loadUserPrefs(),
    loadShoppingList(),
    AsyncStorage.getItem(USER_LOCATION_STORAGE_KEY),
    AsyncStorage.getItem(CUSTOM_API_URL_KEY),
  ]);

  let userLocation: UserStoreLocation | null = null;
  if (rawLoc) {
    try {
      const parsed = JSON.parse(rawLoc) as UserStoreLocation;
      if (parsed && (parsed.postcode || parsed.suburb)) {
        userLocation = parsed;
      }
    } catch {
      // ignore invalid json
    }
  }

  const payload: AussieSpecialsBackupPayload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    prefs,
    shoppingList,
    userLocation,
    customApiUrl: rawCustomUrl ? rawCustomUrl.trim() : null,
  };

  await AsyncStorage.setItem(UNIFIED_BACKUP_KEY, JSON.stringify(payload));
  return JSON.stringify(payload, null, 2);
}

export async function importAllUserSettingsJson(
  rawJson: string
): Promise<AussieSpecialsBackupPayload> {
  const parsed = JSON.parse(rawJson.trim());
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid backup format');
  }
  if (
    !('prefs' in parsed) &&
    !('shoppingList' in parsed) &&
    !('userLocation' in parsed)
  ) {
    throw new Error('Backup JSON does not contain Aussie Specials settings');
  }

  const prefs = normalizeUserPrefs(parsed.prefs);
  const shoppingList = sanitizeShoppingList(parsed.shoppingList);
  const userLocation: UserStoreLocation | null =
    parsed.userLocation &&
    typeof parsed.userLocation === 'object' &&
    (parsed.userLocation.postcode || parsed.userLocation.suburb)
      ? (parsed.userLocation as UserStoreLocation)
      : null;
  const customApiUrl =
    typeof parsed.customApiUrl === 'string' && parsed.customApiUrl.trim()
      ? parsed.customApiUrl.trim().replace(/\/+$/, '')
      : null;

  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(shoppingList));
  if (userLocation) {
    await AsyncStorage.setItem(
      USER_LOCATION_STORAGE_KEY,
      JSON.stringify(userLocation)
    );
  } else {
    await AsyncStorage.removeItem(USER_LOCATION_STORAGE_KEY);
  }
  if (customApiUrl) {
    await AsyncStorage.setItem(CUSTOM_API_URL_KEY, customApiUrl);
  } else {
    await AsyncStorage.removeItem(CUSTOM_API_URL_KEY);
  }

  const restored: AussieSpecialsBackupPayload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    prefs,
    shoppingList,
    userLocation,
    customApiUrl,
  };
  await AsyncStorage.setItem(UNIFIED_BACKUP_KEY, JSON.stringify(restored));
  return restored;
}
